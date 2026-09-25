import { RowDataPacket, ResultSetHeader, PoolConnection } from 'mysql2/promise';
import { pool } from '../db/pool.js';
import { AuctionSessionService, LiveAuctionState } from './auctionSessionService.js';
import { AuctionTimerManager } from './auctionTimerManager.js';
import { auctionWsManager } from '../websocket/auctionWs.js';

export class AuctionTransactionService {
  /**
   * ACID Transaction: Finalize sale of currently staged player to the highest bidder
   */
  static async sellCurrentPlayer(sessionId: number): Promise<LiveAuctionState> {
    const connection: PoolConnection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // 1. Lock and fetch current session
      const [sessionRows] = await connection.query<RowDataPacket[]>(
        'SELECT * FROM auction_sessions WHERE id = ? FOR UPDATE',
        [sessionId]
      );

      if (sessionRows.length === 0) {
        throw new Error('Auction session not found');
      }

      const session = sessionRows[0];
      const playerId = session.current_player_id;
      const winningTeamId = session.highest_bidder_team_id;
      const finalPrice = Number(session.current_bid || 0);

      if (!playerId) {
        throw new Error('No active player staged for sale');
      }

      if (!winningTeamId) {
        throw new Error('Cannot sell player without a valid winning bid');
      }

      // 2. Lock and fetch player
      const [playerRows] = await connection.query<RowDataPacket[]>(
        'SELECT * FROM players WHERE id = ? FOR UPDATE',
        [playerId]
      );

      if (playerRows.length === 0) {
        throw new Error('Staged player record not found');
      }

      const player = playerRows[0];
      if (player.status !== 'AVAILABLE') {
        throw new Error(`Player is not available for sale (Current status: ${player.status})`);
      }

      // 3. Lock and fetch winning team
      const [teamRows] = await connection.query<RowDataPacket[]>(
        'SELECT * FROM teams WHERE id = ? FOR UPDATE',
        [winningTeamId]
      );

      if (teamRows.length === 0) {
        throw new Error('Winning team record not found');
      }

      const team = teamRows[0];
      const remainingPurse = Number(team.remaining_purse);

      if (finalPrice > remainingPurse) {
        throw new Error(
          `Transaction Aborted: Team '${team.team_name}' does not have sufficient purse (Needs ₹${finalPrice.toFixed(2)} Cr, has ₹${remainingPurse.toFixed(2)} Cr)`
        );
      }

      // 4. Fetch the winning bid record ID
      const [bidRows] = await connection.query<RowDataPacket[]>(
        'SELECT id FROM bids WHERE session_id = ? AND player_id = ? AND team_id = ? ORDER BY id DESC LIMIT 1',
        [sessionId, playerId, winningTeamId]
      );
      const winningBidId = bidRows.length > 0 ? bidRows[0].id : null;

      // 5. Insert purchase record
      const [purchaseResult] = await connection.query<ResultSetHeader>(
        `INSERT INTO player_purchases 
         (session_id, player_id, team_id, purchase_price, winning_bid_id, is_undone) 
         VALUES (?, ?, ?, ?, ?, FALSE)`,
        [sessionId, playerId, winningTeamId, finalPrice, winningBidId]
      );

      // 6. Update player record: status = SOLD
      await connection.query(
        "UPDATE players SET status = 'SOLD', sold_to_team_id = ?, sold_price = ? WHERE id = ?",
        [winningTeamId, finalPrice, playerId]
      );

      // 7. Update team purse and players_bought count
      const newRemainingPurse = remainingPurse - finalPrice;
      const newPlayersBought = Number(team.players_bought) + 1;

      await connection.query(
        'UPDATE teams SET remaining_purse = ?, players_bought = ? WHERE id = ?',
        [newRemainingPurse, newPlayersBought, winningTeamId]
      );

      // 8. Update queue record
      await connection.query(
        "UPDATE auction_queue SET status = 'SOLD' WHERE session_id = ? AND player_id = ?",
        [sessionId, playerId]
      );

      // 9. Record in auction audit log
      await connection.query(
        `INSERT INTO auction_events 
         (session_id, event_type, player_id, team_id, amount, payload_json) 
         VALUES (?, 'PLAYER_SOLD', ?, ?, ?, ?)`,
        [
          sessionId,
          playerId,
          winningTeamId,
          finalPrice,
          JSON.stringify({
            purchaseId: purchaseResult.insertId,
            playerName: player.player_name,
            teamName: team.team_name,
            price: finalPrice,
          }),
        ]
      );

      // 10. Update session stage state to SOLD
      await connection.query(
        "UPDATE auction_sessions SET state_stage = 'SOLD' WHERE id = ?",
        [sessionId]
      );

      await connection.commit();
      console.log(`[SOLD TRANSACTION SUCCESS] Player '${player.player_name}' sold to '${team.team_name}' for ₹${finalPrice} Cr`);
    } catch (error) {
      await connection.rollback();
      console.error('[SOLD TRANSACTION ROLLBACK] Error selling player:', error);
      throw error;
    } finally {
      connection.release();
    }

    AuctionTimerManager.stopTimer(sessionId);
    AuctionSessionService.invalidateCache(sessionId);

    const updatedState = await AuctionSessionService.getAuctionState(sessionId, true);
    auctionWsManager.broadcast({
      type: 'PLAYER_SOLD',
      payload: { state: updatedState },
    });

    return updatedState;
  }

  /**
   * ACID Transaction: Mark staged player as UNSOLD
   */
  static async markCurrentPlayerUnsold(sessionId: number): Promise<LiveAuctionState> {
    const connection: PoolConnection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // 1. Lock and fetch current session
      const [sessionRows] = await connection.query<RowDataPacket[]>(
        'SELECT * FROM auction_sessions WHERE id = ? FOR UPDATE',
        [sessionId]
      );

      if (sessionRows.length === 0) {
        throw new Error('Auction session not found');
      }

      const session = sessionRows[0];
      const playerId = session.current_player_id;

      if (!playerId) {
        throw new Error('No active player staged');
      }

      // 2. Lock player
      const [playerRows] = await connection.query<RowDataPacket[]>(
        'SELECT * FROM players WHERE id = ? FOR UPDATE',
        [playerId]
      );

      if (playerRows.length === 0) {
        throw new Error('Player record not found');
      }

      const player = playerRows[0];

      // 3. Update player status
      await connection.query(
        "UPDATE players SET status = 'UNSOLD', sold_to_team_id = NULL, sold_price = NULL WHERE id = ?",
        [playerId]
      );

      // 4. Update queue status
      await connection.query(
        "UPDATE auction_queue SET status = 'UNSOLD' WHERE session_id = ? AND player_id = ?",
        [sessionId, playerId]
      );

      // 5. Audit event
      await connection.query(
        'INSERT INTO auction_events (session_id, event_type, player_id) VALUES (?, ?, ?)',
        [sessionId, 'PLAYER_UNSOLD', playerId]
      );

      // 6. Update session stage state to UNSOLD
      await connection.query(
        "UPDATE auction_sessions SET state_stage = 'UNSOLD' WHERE id = ?",
        [sessionId]
      );

      await connection.commit();
      console.log(`[UNSOLD TRANSACTION SUCCESS] Player '${player.player_name}' marked as UNSOLD`);
    } catch (error) {
      await connection.rollback();
      console.error('[UNSOLD TRANSACTION ROLLBACK] Error marking unsold:', error);
      throw error;
    } finally {
      connection.release();
    }

    AuctionTimerManager.stopTimer(sessionId);
    AuctionSessionService.invalidateCache(sessionId);

    const updatedState = await AuctionSessionService.getAuctionState(sessionId, true);
    auctionWsManager.broadcast({
      type: 'PLAYER_UNSOLD',
      payload: { state: updatedState },
    });

    return updatedState;
  }

  /**
   * ACID Transaction: Undo the last sale and restore player and team state completely
   */
  static async undoLastSale(sessionId: number): Promise<LiveAuctionState> {
    const connection: PoolConnection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // 1. Fetch latest active purchase for this session
      const [purchaseRows] = await connection.query<RowDataPacket[]>(
        `SELECT pp.*, p.player_name, p.base_price, t.team_name, t.starting_purse
         FROM player_purchases pp
         JOIN players p ON pp.player_id = p.id
         JOIN teams t ON pp.team_id = t.id
         WHERE pp.session_id = ? AND pp.is_undone = FALSE
         ORDER BY pp.id DESC
         LIMIT 1
         FOR UPDATE`,
        [sessionId]
      );

      if (purchaseRows.length === 0) {
        throw new Error('No recent player sale found to undo');
      }

      const purchase = purchaseRows[0];
      const purchaseId = purchase.id;
      const playerId = purchase.player_id;
      const teamId = purchase.team_id;
      const purchasePrice = Number(purchase.purchase_price);

      // 2. Mark purchase record as undone
      await connection.query(
        'UPDATE player_purchases SET is_undone = TRUE WHERE id = ?',
        [purchaseId]
      );

      // 3. Revert player status to AVAILABLE
      await connection.query(
        "UPDATE players SET status = 'AVAILABLE', sold_to_team_id = NULL, sold_price = NULL WHERE id = ?",
        [playerId]
      );

      // 4. Revert queue record status to CURRENT
      await connection.query(
        "UPDATE auction_queue SET status = 'CURRENT' WHERE session_id = ? AND player_id = ?",
        [sessionId, playerId]
      );

      // 5. Restore team purse: starting_purse - sum(active purchases)
      const [sumRows] = await connection.query<RowDataPacket[]>(
        'SELECT COALESCE(SUM(purchase_price), 0) AS totalSpent, COUNT(*) AS boughtCount FROM player_purchases WHERE team_id = ? AND is_undone = FALSE',
        [teamId]
      );

      const totalSpent = Number(sumRows[0]?.totalSpent || 0);
      const totalBought = Number(sumRows[0]?.boughtCount || 0);
      const restoredPurse = Number(purchase.starting_purse) - totalSpent;

      await connection.query(
        'UPDATE teams SET remaining_purse = ?, players_bought = ? WHERE id = ?',
        [restoredPurse, totalBought, teamId]
      );

      // 6. Restore session state to put the player back on stage
      await connection.query(
        `UPDATE auction_sessions 
         SET current_player_id = ?,
             current_bid = ?,
             highest_bidder_team_id = NULL,
             state_stage = 'PLAYER_READY',
             status = 'ACTIVE',
             timer_seconds = 15
         WHERE id = ?`,
        [playerId, Number(purchase.base_price), sessionId]
      );

      // 7. Record undo event in audit log
      await connection.query(
        `INSERT INTO auction_events 
         (session_id, event_type, player_id, team_id, amount, payload_json) 
         VALUES (?, 'SALE_UNDONE', ?, ?, ?, ?)`,
        [
          sessionId,
          playerId,
          teamId,
          purchasePrice,
          JSON.stringify({
            undonePurchaseId: purchaseId,
            playerName: purchase.player_name,
            teamName: purchase.team_name,
            refundedAmount: purchasePrice,
          }),
        ]
      );

      await connection.commit();
      console.log(`[UNDO SALE TRANSACTION SUCCESS] Undid sale of '${purchase.player_name}' to '${purchase.team_name}' for ₹${purchasePrice} Cr`);
    } catch (error) {
      await connection.rollback();
      console.error('[UNDO SALE TRANSACTION ROLLBACK] Error undoing sale:', error);
      throw error;
    } finally {
      connection.release();
    }

    AuctionTimerManager.stopTimer(sessionId);
    AuctionSessionService.invalidateCache(sessionId);

    const updatedState = await AuctionSessionService.getAuctionState(sessionId, true);
    auctionWsManager.broadcast({
      type: 'SALE_UNDONE',
      payload: { state: updatedState },
    });

    return updatedState;
  }
}
