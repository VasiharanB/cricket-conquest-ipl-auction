import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../db/pool.js';
import { AuctionSessionService, LiveAuctionState } from './auctionSessionService.js';
import { AuctionTimerManager } from './auctionTimerManager.js';
import { auctionWsManager } from '../websocket/auctionWs.js';

export interface PlaceBidInput {
  sessionId: number;
  teamId: string | number; // Can be team_id (CC26-001) or primary key id
  bidAmount: number;
}

export class BiddingService {
  /**
   * Validate and record a real auction bid
   */
  static async placeBid(input: PlaceBidInput): Promise<LiveAuctionState> {
    const { sessionId, bidAmount } = input;

    if (!bidAmount || bidAmount <= 0) {
      const err: any = new Error('Bid amount must be a positive number');
      err.statusCode = 400;
      throw err;
    }

    // 1. Fetch Session
    const [sessionRows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM auction_sessions WHERE id = ? LIMIT 1',
      [sessionId]
    );

    if (sessionRows.length === 0) {
      const err: any = new Error('Auction session not found');
      err.statusCode = 404;
      throw err;
    }

    const session = sessionRows[0];

    if (session.status !== 'ACTIVE') {
      const err: any = new Error(`Auction is not currently active (Current status: ${session.status})`);
      err.statusCode = 400;
      throw err;
    }

    if (!session.current_player_id) {
      const err: any = new Error('No player is currently on stage for bidding');
      err.statusCode = 400;
      throw err;
    }

    // 2. Fetch Player
    const [playerRows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM players WHERE id = ? LIMIT 1',
      [session.current_player_id]
    );

    if (playerRows.length === 0) {
      const err: any = new Error('Current player record not found');
      err.statusCode = 404;
      throw err;
    }

    const player = playerRows[0];
    if (player.status !== 'AVAILABLE') {
      const err: any = new Error(`Player '${player.player_name}' is not available (Status: ${player.status})`);
      err.statusCode = 400;
      throw err;
    }

    // 3. Fetch Bidding Team
    const isNumeric = typeof input.teamId === 'number' || /^\d+$/.test(String(input.teamId));
    const teamQuery = isNumeric
      ? 'SELECT * FROM teams WHERE id = ? OR team_id = ? LIMIT 1'
      : 'SELECT * FROM teams WHERE team_id = ? LIMIT 1';
    const teamParam = isNumeric ? [Number(input.teamId), String(input.teamId)] : [String(input.teamId)];

    const [teamRows] = await pool.query<RowDataPacket[]>(teamQuery, teamParam);
    if (teamRows.length === 0) {
      const err: any = new Error(`Team '${input.teamId}' not found`);
      err.statusCode = 404;
      throw err;
    }

    const team = teamRows[0];
    const teamId = team.id;
    const remainingPurse = Number(team.remaining_purse);
    const playersBought = Number(team.players_bought);

    // 4. Validate registration status
    if (team.registration_status !== 'CONFIRMED') {
      const err: any = new Error(`Team '${team.team_name}' is not confirmed for auction (Status: ${team.registration_status})`);
      err.statusCode = 400;
      throw err;
    }

    // 5. Squad composition limits
    const maxSquadSize = process.env.MAX_SQUAD_SIZE ? Number(process.env.MAX_SQUAD_SIZE) : 15;
    if (playersBought >= maxSquadSize) {
      const err: any = new Error(`Team '${team.team_name}' has already reached the maximum squad limit of ${maxSquadSize} players`);
      err.statusCode = 400;
      throw err;
    }

    // 6. Purse Sufficiency
    if (bidAmount > remainingPurse) {
      const err: any = new Error(
        `Insufficient purse for team '${team.team_name}'. Bid amount (₹${bidAmount.toFixed(2)} Cr) exceeds remaining purse (₹${remainingPurse.toFixed(2)} Cr)`
      );
      err.statusCode = 400;
      throw err;
    }

    // 7. Bid Amount and Increment Validation
    const currentBid = Number(session.current_bid || 0);
    const basePrice = Number(player.base_price);

    // If first bid, must be at least base price
    if (!session.highest_bidder_team_id) {
      if (bidAmount < basePrice) {
        const err: any = new Error(`Opening bid must be at least the base price of ₹${basePrice.toFixed(2)} Cr`);
        err.statusCode = 400;
        throw err;
      }
    } else {
      if (bidAmount <= currentBid) {
        const err: any = new Error(`Bid amount must be strictly greater than current bid (₹${currentBid.toFixed(2)} Cr)`);
        err.statusCode = 400;
        throw err;
      }
      if (session.highest_bidder_team_id === teamId) {
        const err: any = new Error(`Team '${team.team_name}' already holds the highest bid`);
        err.statusCode = 400;
        throw err;
      }
    }

    // 8. Squad Feasibility Check
    const minSquadSize = process.env.MIN_SQUAD_SIZE ? Number(process.env.MIN_SQUAD_SIZE) : 15;
    const minBasePrice = 0.20; // 20 Lakhs min base price
    const slotsNeededAfterThis = Math.max(0, minSquadSize - (playersBought + 1));
    const minReserveNeeded = slotsNeededAfterThis * minBasePrice;

    if (remainingPurse - bidAmount < minReserveNeeded) {
      const err: any = new Error(
        `Purse Feasibility Violation: Bidding ₹${bidAmount.toFixed(2)} Cr leaves team '${team.team_name}' with ₹${(remainingPurse - bidAmount).toFixed(2)} Cr, which is below the ₹${minReserveNeeded.toFixed(2)} Cr needed to complete the minimum squad of ${minSquadSize} players.`
      );
      err.statusCode = 400;
      throw err;
    }

    // 9. Atomic Bid Update
    // Count bids for this player
    const [bidCountRows] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) AS count FROM bids WHERE session_id = ? AND player_id = ?',
      [sessionId, player.id]
    );
    const bidOrder = Number(bidCountRows[0]?.count || 0) + 1;

    // Insert bid
    const [bidResult] = await pool.query<ResultSetHeader>(
      'INSERT INTO bids (session_id, player_id, team_id, bid_amount, bid_order) VALUES (?, ?, ?, ?, ?)',
      [sessionId, player.id, teamId, bidAmount, bidOrder]
    );

    // Update session state
    await pool.query(
      `UPDATE auction_sessions 
       SET current_bid = ?,
           highest_bidder_team_id = ?,
           state_stage = 'BIDDING',
           timer_seconds = 15
       WHERE id = ?`,
      [bidAmount, teamId, sessionId]
    );

    // Record event in audit log
    await pool.query(
      'INSERT INTO auction_events (session_id, event_type, player_id, team_id, amount) VALUES (?, ?, ?, ?, ?)',
      [sessionId, 'BID_PLACED', player.id, teamId, bidAmount]
    );

    // Stop any active countdown timer and reset state to BIDDING
    AuctionTimerManager.stopTimer(sessionId);
    AuctionSessionService.invalidateCache(sessionId);

    // 10. Broadcast Real-Time Update
    const updatedState = await AuctionSessionService.getAuctionState(sessionId, true);
    auctionWsManager.broadcast({
      type: 'NEW_BID',
      payload: {
        bid: {
          id: bidResult.insertId,
          teamId: team.team_id,
          teamName: team.team_name,
          amount: bidAmount,
          timestamp: new Date().toISOString(),
        },
        state: updatedState,
      },
    });

    return updatedState;
  }
}
