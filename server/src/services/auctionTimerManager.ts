import { pool } from '../db/pool.js';
import { auctionWsManager } from '../websocket/auctionWs.js';
import { AuctionTransactionService } from './auctionTransactionService.js';
import { AuctionSessionService } from './auctionSessionService.js';
import { RowDataPacket } from 'mysql2';

export class AuctionTimerManager {
  private static activeTimers: Map<number, NodeJS.Timeout> = new Map();

  /**
   * Stop and clear any active countdown timer for a session
   */
  static stopTimer(sessionId: number): void {
    const existing = this.activeTimers.get(sessionId);
    if (existing) {
      clearInterval(existing);
      this.activeTimers.delete(sessionId);
    }
  }

  /**
   * Start authoritative countdown timer for GOING_ONCE or GOING_TWICE
   */
  static startTimer(sessionId: number, stage: 'GOING_ONCE' | 'GOING_TWICE', durationSeconds: number = 15): void {
    // Clear any previous timer
    this.stopTimer(sessionId);

    let remainingSeconds = durationSeconds;

    // Broadcast initial tick
    auctionWsManager.broadcast({
      type: 'TIMER_TICK',
      payload: { timerSeconds: remainingSeconds },
    });

    const interval = setInterval(async () => {
      remainingSeconds -= 1;

      if (remainingSeconds > 0) {
        // Broadcast tick every second
        auctionWsManager.broadcast({
          type: 'TIMER_TICK',
          payload: { timerSeconds: remainingSeconds },
        });
      } else {
        // Time expired! Stop current interval
        AuctionTimerManager.stopTimer(sessionId);

        try {
          if (stage === 'GOING_ONCE') {
            console.log(`[TIMER] Going Once expired for session ${sessionId}. Advancing to GOING_TWICE.`);
            
            // Advance to GOING_TWICE
            await pool.query(
              "UPDATE auction_sessions SET state_stage = 'GOING_TWICE', timer_seconds = 15 WHERE id = ?",
              [sessionId]
            );
            await pool.query(
              'INSERT INTO auction_events (session_id, event_type) VALUES (?, ?)',
              [sessionId, 'GOING_TWICE']
            );

            AuctionSessionService.invalidateCache();
            const state = await AuctionSessionService.getAuctionState(sessionId);
            auctionWsManager.broadcast({
              type: 'STAGE_CHANGE',
              payload: { stage: 'GOING_TWICE', state },
            });

            // Automatically start countdown for GOING_TWICE!
            AuctionTimerManager.startTimer(sessionId, 'GOING_TWICE', 15);
          } else if (stage === 'GOING_TWICE') {
            console.log(`[TIMER] Going Twice expired for session ${sessionId}. Resolving hammer down.`);

            // Verify current session state
            const [sessionRows] = await pool.query<RowDataPacket[]>(
              'SELECT current_player_id, highest_bidder_team_id, current_bid FROM auction_sessions WHERE id = ? LIMIT 1',
              [sessionId]
            );

            if (sessionRows.length > 0) {
              const session = sessionRows[0];
              if (session.current_player_id) {
                if (session.highest_bidder_team_id) {
                  // Player had bids -> Mark as SOLD!
                  console.log(`[TIMER AUTO-SOLD] Player ${session.current_player_id} automatically sold to team ${session.highest_bidder_team_id}`);
                  await AuctionTransactionService.sellCurrentPlayer(sessionId);
                } else {
                  // No bids placed -> Mark as UNSOLD!
                  console.log(`[TIMER AUTO-UNSOLD] Player ${session.current_player_id} automatically marked unsold`);
                  await AuctionTransactionService.markCurrentPlayerUnsold(sessionId);
                }
              }
            }
          }
        } catch (error) {
          console.error('[TIMER ERROR] Error executing timer transition:', error);
        }
      }
    }, 1000);

    this.activeTimers.set(sessionId, interval);
  }
}
