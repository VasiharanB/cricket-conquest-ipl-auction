import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../db/pool.js';
import { auctionWsManager } from '../websocket/auctionWs.js';
import { AuctionTimerManager } from './auctionTimerManager.js';

export interface AuctionPlayerDto {
  id: string; // e.g. "P001"
  dbId: number;
  name: string;
  role: string;
  nationality: string;
  playerCategory: string;
  basePrice: number;
  rating?: number | null;
  status: 'Available' | 'Sold' | 'Unsold';
}

export interface AuctionTeamDto {
  id: string;
  dbId: number;
  name: string;
  college: string;
  startingPurse: number;
  remainingPurse: number;
  playersBought: number;
}

export interface AuctionBidDto {
  id: number;
  teamId: string;
  teamDbId: number;
  teamName: string;
  amount: number;
  timestamp: string;
}

export interface LiveAuctionState {
  sessionId: number;
  sessionName: string;
  status: 'NOT_STARTED' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  stageState:
    | 'INITIAL'
    | 'PLAYER_READY'
    | 'BIDDING'
    | 'GOING_ONCE'
    | 'GOING_TWICE'
    | 'SOLD'
    | 'UNSOLD'
    | 'PAUSED'
    | 'NEXT_PLAYER';
  roundNumber: number;
  timerSeconds: number;
  currentPlayer: AuctionPlayerDto | null;
  currentBid: number;
  highestBidder: AuctionTeamDto | null;
  bidHistory: AuctionBidDto[];
  nextPlayer: AuctionPlayerDto | null;
  queueStats: {
    total: number;
    queued: number;
    sold: number;
    unsold: number;
  };
  teams: AuctionTeamDto[];
}

export class AuctionSessionService {
  private static cachedState: { [sessionId: number]: { state: LiveAuctionState; timestamp: number } } = {};
  private static CACHE_TTL_MS = 750;

  /**
   * Invalidate state cache
   */
  static invalidateCache(sessionId?: number): void {
    if (sessionId) {
      delete this.cachedState[sessionId];
    } else {
      this.cachedState = {};
    }
  }

  /**
   * Get or initialize the active auction session
   */
  static async getOrCreateActiveSession(): Promise<number> {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM auction_sessions WHERE status IN ('ACTIVE', 'PAUSED') ORDER BY id DESC LIMIT 1"
    );

    if (rows.length > 0) {
      return rows[0].id;
    }

    // Check for NOT_STARTED session
    const [notStarted] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM auction_sessions WHERE status = 'NOT_STARTED' ORDER BY id DESC LIMIT 1"
    );

    if (notStarted.length > 0) {
      return notStarted[0].id;
    }

    // Create a new session
    const [result] = await pool.query<ResultSetHeader>(
      "INSERT INTO auction_sessions (session_name, status, state_stage, timer_seconds, round_number) VALUES ('ZenTriX 26 IPL Auction', 'NOT_STARTED', 'INITIAL', 15, 1)"
    );

    const sessionId = result.insertId;
    await this.initializeQueue(sessionId);
    return sessionId;
  }

  /**
   * Populate auction queue from players table
   */
  static async initializeQueue(sessionId: number): Promise<void> {
    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) AS count FROM auction_queue WHERE session_id = ?',
      [sessionId]
    );

    if (Number(existing[0]?.count || 0) === 0) {
      const [players] = await pool.query<RowDataPacket[]>(
        "SELECT id FROM players WHERE status = 'AVAILABLE' ORDER BY id ASC"
      );

      let order = 1;
      for (const p of players) {
        await pool.query(
          'INSERT INTO auction_queue (session_id, player_id, queue_order, status, round_number) VALUES (?, ?, ?, ?, 1)',
          [sessionId, p.id, order++, 'QUEUED']
        );
      }
    }
  }

  /**
   * Get complete live auction state with in-memory caching and parallelized database queries
   */
  static async getAuctionState(sessionId?: number, bypassCache: boolean = false): Promise<LiveAuctionState> {
    const activeId = sessionId || (await this.getOrCreateActiveSession());

    // Check high-speed memory cache (cuts 20-team concurrent latency from 1.5s to 0ms)
    if (!bypassCache && this.cachedState[activeId] && (Date.now() - this.cachedState[activeId].timestamp < this.CACHE_TTL_MS)) {
      return this.cachedState[activeId].state;
    }

    const [sessionRows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM auction_sessions WHERE id = ? LIMIT 1',
      [activeId]
    );

    if (sessionRows.length === 0) {
      const err: any = new Error('Auction session not found');
      err.statusCode = 404;
      throw err;
    }

    const session = sessionRows[0];

    // Execute all child queries in parallel with Promise.all
    const [
      [playerRows],
      [teamRows],
      [bidRows],
      [nextRows],
      [queueStatsRows],
      [teamList],
    ] = await Promise.all([
      session.current_player_id
        ? pool.query<RowDataPacket[]>('SELECT * FROM players WHERE id = ? LIMIT 1', [session.current_player_id])
        : Promise.resolve([[]] as any),
      session.highest_bidder_team_id
        ? pool.query<RowDataPacket[]>('SELECT * FROM teams WHERE id = ? LIMIT 1', [session.highest_bidder_team_id])
        : Promise.resolve([[]] as any),
      session.current_player_id
        ? pool.query<RowDataPacket[]>(
            `SELECT b.id, b.bid_amount, b.created_at, t.id AS teamDbId, t.team_id, t.team_name
             FROM bids b
             JOIN teams t ON b.team_id = t.id
             WHERE b.session_id = ? AND b.player_id = ?
             ORDER BY b.id DESC
             LIMIT 20`,
            [activeId, session.current_player_id]
          )
        : Promise.resolve([[]] as any),
      pool.query<RowDataPacket[]>(
        `SELECT p.* FROM auction_queue q
         JOIN players p ON q.player_id = p.id
         WHERE q.session_id = ? AND q.status = 'QUEUED'
         ORDER BY q.queue_order ASC
         LIMIT 1`,
        [activeId]
      ),
      pool.query<RowDataPacket[]>(
        `SELECT
          COUNT(*) AS total,
          SUM(CASE WHEN status = 'QUEUED' THEN 1 ELSE 0 END) AS queued,
          SUM(CASE WHEN status = 'SOLD' THEN 1 ELSE 0 END) AS sold,
          SUM(CASE WHEN status = 'UNSOLD' THEN 1 ELSE 0 END) AS unsold
         FROM auction_queue WHERE session_id = ?`,
        [activeId]
      ),
      pool.query<RowDataPacket[]>(
        'SELECT id, team_id, team_name, college_name, starting_purse, remaining_purse, players_bought FROM teams ORDER BY id ASC'
      ),
    ]);

    // 1. Current Player Details
    let currentPlayer: AuctionPlayerDto | null = null;
    if (playerRows && playerRows.length > 0) {
      const p = playerRows[0];
      currentPlayer = {
        id: p.player_id,
        dbId: p.id,
        name: p.player_name,
        role: p.role,
        nationality: p.nationality,
        playerCategory: p.player_category,
        basePrice: Number(p.base_price),
        rating: p.rating ? Number(p.rating) : null,
        status: p.status === 'AVAILABLE' ? 'Available' : p.status === 'SOLD' ? 'Sold' : 'Unsold',
      };
    }

    // 2. Highest Bidder Details
    let highestBidder: AuctionTeamDto | null = null;
    if (teamRows && teamRows.length > 0) {
      const t = teamRows[0];
      highestBidder = {
        id: t.team_id,
        dbId: t.id,
        name: t.team_name,
        college: t.college_name,
        startingPurse: Number(t.starting_purse),
        remainingPurse: Number(t.remaining_purse),
        playersBought: Number(t.players_bought),
      };
    }

    // 3. Current Player Bid History
    const bidHistory: AuctionBidDto[] = ((bidRows as any[]) || []).map((b) => ({
      id: b.id,
      teamId: b.team_id,
      teamDbId: b.teamDbId,
      teamName: b.team_name,
      amount: Number(b.bid_amount),
      timestamp: b.created_at,
    }));

    // 4. Next Player Preview
    let nextPlayer: AuctionPlayerDto | null = null;
    if (nextRows && nextRows.length > 0) {
      const np = nextRows[0];
      nextPlayer = {
        id: np.player_id,
        dbId: np.id,
        name: np.player_name,
        role: np.role,
        nationality: np.nationality,
        playerCategory: np.player_category,
        basePrice: Number(np.base_price),
        rating: np.rating ? Number(np.rating) : null,
        status: np.status === 'AVAILABLE' ? 'Available' : np.status === 'SOLD' ? 'Sold' : 'Unsold',
      };
    }

    // 5. Queue Stats
    const qs = queueStatsRows[0] || {};
    const queueStats = {
      total: Number(qs.total || 0),
      queued: Number(qs.queued || 0),
      sold: Number(qs.sold || 0),
      unsold: Number(qs.unsold || 0),
    };

    // 6. Active Teams
    const teams: AuctionTeamDto[] = ((teamList as any[]) || []).map((t) => ({
      id: t.team_id,
      dbId: t.id,
      name: t.team_name,
      college: t.college_name,
      startingPurse: Number(t.starting_purse),
      remainingPurse: Number(t.remaining_purse),
      playersBought: Number(t.players_bought),
    }));

    const result: LiveAuctionState = {
      sessionId: activeId,
      sessionName: session.session_name,
      status: session.status,
      stageState: session.state_stage,
      roundNumber: session.round_number,
      timerSeconds: session.timer_seconds,
      currentPlayer,
      currentBid: Number(session.current_bid || 0),
      highestBidder,
      bidHistory,
      nextPlayer,
      queueStats,
      teams,
    };

    // Store in cache
    this.cachedState[activeId] = {
      state: result,
      timestamp: Date.now(),
    };

    return result;
  }

  /**
   * Start or resume auction
   */
  static async startAuction(sessionId: number): Promise<LiveAuctionState> {
    this.invalidateCache(sessionId);
    AuctionTimerManager.stopTimer(sessionId);

    const [session] = await pool.query<RowDataPacket[]>(
      'SELECT current_player_id FROM auction_sessions WHERE id = ?',
      [sessionId]
    );

    if (!session.length) {
      const err: any = new Error('Session not found');
      err.statusCode = 404;
      throw err;
    }

    // If no player is currently selected, pick the first queued player
    if (!session[0].current_player_id) {
      await this.nextPlayer(sessionId);
    }

    // Transition session to ACTIVE and BIDDING
    await pool.query(
      "UPDATE auction_sessions SET status = 'ACTIVE', state_stage = 'BIDDING' WHERE id = ?",
      [sessionId]
    );

    await pool.query(
      'INSERT INTO auction_events (session_id, event_type) VALUES (?, ?)',
      [sessionId, 'AUCTION_STARTED']
    );

    const state = await this.getAuctionState(sessionId, true);
    auctionWsManager.broadcast({ type: 'AUCTION_STATE_UPDATE', payload: state });
    return state;
  }

  /**
   * Pause auction
   */
  static async pauseAuction(sessionId: number): Promise<LiveAuctionState> {
    this.invalidateCache(sessionId);
    AuctionTimerManager.stopTimer(sessionId);

    await pool.query(
      "UPDATE auction_sessions SET status = 'PAUSED', state_stage = 'PAUSED' WHERE id = ?",
      [sessionId]
    );

    await pool.query(
      'INSERT INTO auction_events (session_id, event_type) VALUES (?, ?)',
      [sessionId, 'AUCTION_PAUSED']
    );

    const state = await this.getAuctionState(sessionId, true);
    auctionWsManager.broadcast({ type: 'STAGE_CHANGE', payload: { stage: 'PAUSED', state } });
    return state;
  }

  /**
   * Resume auction
   */
  static async resumeAuction(sessionId: number): Promise<LiveAuctionState> {
    this.invalidateCache(sessionId);
    AuctionTimerManager.stopTimer(sessionId);

    await pool.query(
      "UPDATE auction_sessions SET status = 'ACTIVE', state_stage = 'BIDDING' WHERE id = ?",
      [sessionId]
    );

    await pool.query(
      'INSERT INTO auction_events (session_id, event_type) VALUES (?, ?)',
      [sessionId, 'AUCTION_RESUMED']
    );

    const state = await this.getAuctionState(sessionId, true);
    auctionWsManager.broadcast({ type: 'STAGE_CHANGE', payload: { stage: 'BIDDING', state } });
    return state;
  }

  /**
   * Set stage state (e.g. GOING_ONCE, GOING_TWICE, BIDDING)
   */
  static async setStageState(sessionId: number, stage: string): Promise<LiveAuctionState> {
    this.invalidateCache(sessionId);

    if (stage === 'GOING_ONCE') {
      await pool.query('UPDATE auction_sessions SET state_stage = ?, timer_seconds = 15 WHERE id = ?', [stage, sessionId]);
      await pool.query(
        'INSERT INTO auction_events (session_id, event_type) VALUES (?, ?)',
        [sessionId, stage]
      );
      // Start authoritative 15-second countdown for GOING_ONCE
      AuctionTimerManager.startTimer(sessionId, 'GOING_ONCE', 15);
    } else if (stage === 'GOING_TWICE') {
      await pool.query('UPDATE auction_sessions SET state_stage = ?, timer_seconds = 15 WHERE id = ?', [stage, sessionId]);
      await pool.query(
        'INSERT INTO auction_events (session_id, event_type) VALUES (?, ?)',
        [sessionId, stage]
      );
      // Start authoritative 15-second countdown for GOING_TWICE
      AuctionTimerManager.startTimer(sessionId, 'GOING_TWICE', 15);
    } else {
      AuctionTimerManager.stopTimer(sessionId);
      await pool.query('UPDATE auction_sessions SET state_stage = ? WHERE id = ?', [stage, sessionId]);
    }

    const state = await this.getAuctionState(sessionId, true);
    auctionWsManager.broadcast({ type: 'STAGE_CHANGE', payload: { stage, state } });
    return state;
  }

  /**
   * Advance to the next player in the queue - ONLY called when manually triggered by Admin / Auctioneer
   */
  static async nextPlayer(sessionId: number): Promise<LiveAuctionState> {
    this.invalidateCache(sessionId);
    AuctionTimerManager.stopTimer(sessionId);

    // Find next queued player
    let [nextRows] = await pool.query<RowDataPacket[]>(
      `SELECT q.id AS queueId, q.player_id, p.base_price
       FROM auction_queue q
       JOIN players p ON q.player_id = p.id
       WHERE q.session_id = ? AND q.status = 'QUEUED'
       ORDER BY q.queue_order ASC
       LIMIT 1`,
      [sessionId]
    );

    if (nextRows.length === 0) {
      // Check if queue was empty because it was never initialized
      const [qCount] = await pool.query<RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM auction_queue WHERE session_id = ?',
        [sessionId]
      );
      if (Number(qCount[0]?.count || 0) === 0) {
        await this.initializeQueue(sessionId);
        const [reloaded] = await pool.query<RowDataPacket[]>(
          `SELECT q.id AS queueId, q.player_id, p.base_price
           FROM auction_queue q
           JOIN players p ON q.player_id = p.id
           WHERE q.session_id = ? AND q.status = 'QUEUED'
           ORDER BY q.queue_order ASC
           LIMIT 1`,
          [sessionId]
        );
        nextRows = reloaded;
      }
    }

    if (nextRows.length === 0) {
      // All players processed
      await pool.query(
        "UPDATE auction_sessions SET current_player_id = NULL, current_bid = 0, highest_bidder_team_id = NULL, state_stage = 'INITIAL', status = 'COMPLETED' WHERE id = ?",
        [sessionId]
      );
      const state = await this.getAuctionState(sessionId, true);
      auctionWsManager.broadcast({ type: 'AUCTION_STATE_UPDATE', payload: state });
      return state;
    }

    const next = nextRows[0];
    const initialBid = Number(next.base_price);

    // Mark previous CURRENT queue items as QUEUED so we can set the new one
    await pool.query("UPDATE auction_queue SET status = 'QUEUED' WHERE session_id = ? AND status = 'CURRENT'", [sessionId]);

    // Update queue status for the next player
    await pool.query("UPDATE auction_queue SET status = 'CURRENT' WHERE id = ?", [next.queueId]);

    // Update session — auto-advance to BIDDING with base price ready
    await pool.query(
      `UPDATE auction_sessions 
       SET current_player_id = ?,
           current_bid = ?,
           highest_bidder_team_id = NULL,
           status = 'ACTIVE',
           state_stage = 'BIDDING',
           timer_seconds = 15
       WHERE id = ?`,
      [next.player_id, initialBid, sessionId]
    );

    // Log event
    await pool.query(
      'INSERT INTO auction_events (session_id, event_type, player_id, amount) VALUES (?, ?, ?, ?)',
      [sessionId, 'PLAYER_STARTED', next.player_id, initialBid]
    );

    const state = await this.getAuctionState(sessionId, true);
    auctionWsManager.broadcast({ type: 'AUCTION_STATE_UPDATE', payload: state });
    return state;
  }

  /**
   * Directly select ANY specific player from the pool and bring them to the auction stage
   * Can be invoked by Admin or Auctioneer
   */
  static async selectPlayer(sessionId: number, playerId: string | number): Promise<LiveAuctionState> {
    this.invalidateCache(sessionId);
    AuctionTimerManager.stopTimer(sessionId);

    // 1. Fetch player by ID or player_id (e.g. 'P001' or 1)
    const isNum = typeof playerId === 'number' || /^\d+$/.test(String(playerId));
    const [players] = await pool.query<RowDataPacket[]>(
      isNum
        ? 'SELECT id, player_id, player_name, base_price, status FROM players WHERE id = ? OR player_id = ? LIMIT 1'
        : 'SELECT id, player_id, player_name, base_price, status FROM players WHERE player_id = ? LIMIT 1',
      isNum ? [Number(playerId), String(playerId)] : [String(playerId)]
    );

    if (players.length === 0) {
      const err: any = new Error(`Player with ID '${playerId}' not found`);
      err.statusCode = 404;
      throw err;
    }

    const player = players[0];

    if (player.status !== 'AVAILABLE') {
      const err: any = new Error(`Player '${player.player_name}' is not available (Status: ${player.status})`);
      err.statusCode = 400;
      throw err;
    }

    const initialBid = Number(player.base_price);

    // 2. Mark previous CURRENT queue items as QUEUED
    await pool.query(
      "UPDATE auction_queue SET status = 'QUEUED' WHERE session_id = ? AND status = 'CURRENT'",
      [sessionId]
    );

    // 3. Check if player exists in queue, if not insert, else set status = CURRENT
    const [existingQ] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM auction_queue WHERE session_id = ? AND player_id = ? LIMIT 1',
      [sessionId, player.id]
    );

    if (existingQ.length > 0) {
      await pool.query(
        "UPDATE auction_queue SET status = 'CURRENT' WHERE id = ?",
        [existingQ[0].id]
      );
    } else {
      await pool.query(
        "INSERT INTO auction_queue (session_id, player_id, queue_order, status, round_number) VALUES (?, ?, 0, 'CURRENT', 1)",
        [sessionId, player.id]
      );
    }

    // 4. Update session state
    await pool.query(
      `UPDATE auction_sessions 
       SET current_player_id = ?,
           current_bid = ?,
           highest_bidder_team_id = NULL,
           status = 'ACTIVE',
           state_stage = 'BIDDING',
           timer_seconds = 15
       WHERE id = ?`,
      [player.id, initialBid, sessionId]
    );

    // 5. Log event
    await pool.query(
      'INSERT INTO auction_events (session_id, event_type, player_id, amount) VALUES (?, ?, ?, ?)',
      [sessionId, 'PLAYER_STARTED', player.id, initialBid]
    );

    const state = await this.getAuctionState(sessionId, true);
    auctionWsManager.broadcast({ type: 'AUCTION_STATE_UPDATE', payload: state });
    return state;
  }

  /**
   * Update timer seconds
   */
  static async setTimer(sessionId: number, seconds: number): Promise<void> {
    await pool.query('UPDATE auction_sessions SET timer_seconds = ? WHERE id = ?', [seconds, sessionId]);
    auctionWsManager.broadcast({ type: 'TIMER_TICK', payload: { timerSeconds: seconds } });
  }
}
