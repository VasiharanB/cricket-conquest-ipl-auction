import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../db/pool.js';
import { auctionWsManager } from '../websocket/auctionWs.js';

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
   * Get complete live auction state
   */
  static async getAuctionState(sessionId?: number): Promise<LiveAuctionState> {
    const activeId = sessionId || (await this.getOrCreateActiveSession());

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

    // 1. Current Player Details
    let currentPlayer: AuctionPlayerDto | null = null;
    if (session.current_player_id) {
      const [playerRows] = await pool.query<RowDataPacket[]>(
        'SELECT * FROM players WHERE id = ? LIMIT 1',
        [session.current_player_id]
      );
      if (playerRows.length > 0) {
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
    }

    // 2. Highest Bidder Details
    let highestBidder: AuctionTeamDto | null = null;
    if (session.highest_bidder_team_id) {
      const [teamRows] = await pool.query<RowDataPacket[]>(
        'SELECT * FROM teams WHERE id = ? LIMIT 1',
        [session.highest_bidder_team_id]
      );
      if (teamRows.length > 0) {
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
    }

    // 3. Current Player Bid History
    let bidHistory: AuctionBidDto[] = [];
    if (session.current_player_id) {
      const [bidRows] = await pool.query<RowDataPacket[]>(
        `SELECT b.id, b.bid_amount, b.created_at, t.id AS teamDbId, t.team_id, t.team_name
         FROM bids b
         JOIN teams t ON b.team_id = t.id
         WHERE b.session_id = ? AND b.player_id = ?
         ORDER BY b.id DESC
         LIMIT 20`,
        [activeId, session.current_player_id]
      );
      bidHistory = (bidRows as any[]).map((b) => ({
        id: b.id,
        teamId: b.team_id,
        teamDbId: b.teamDbId,
        teamName: b.team_name,
        amount: Number(b.bid_amount),
        timestamp: b.created_at,
      }));
    }

    // 4. Next Player Preview
    let nextPlayer: AuctionPlayerDto | null = null;
    const [nextRows] = await pool.query<RowDataPacket[]>(
      `SELECT p.* FROM auction_queue q
       JOIN players p ON q.player_id = p.id
       WHERE q.session_id = ? AND q.status = 'QUEUED'
       ORDER BY q.queue_order ASC
       LIMIT 1`,
      [activeId]
    );

    if (nextRows.length > 0) {
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
    const [queueStatsRows] = await pool.query<RowDataPacket[]>(
      `SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'QUEUED' THEN 1 ELSE 0 END) AS queued,
        SUM(CASE WHEN status = 'SOLD' THEN 1 ELSE 0 END) AS sold,
        SUM(CASE WHEN status = 'UNSOLD' THEN 1 ELSE 0 END) AS unsold
       FROM auction_queue WHERE session_id = ?`,
      [activeId]
    );
    const qs = queueStatsRows[0] || {};
    const queueStats = {
      total: Number(qs.total || 0),
      queued: Number(qs.queued || 0),
      sold: Number(qs.sold || 0),
      unsold: Number(qs.unsold || 0),
    };

    // 6. Active Teams
    const [teamList] = await pool.query<RowDataPacket[]>(
      'SELECT id, team_id, team_name, college_name, starting_purse, remaining_purse, players_bought FROM teams ORDER BY id ASC'
    );
    const teams: AuctionTeamDto[] = (teamList as any[]).map((t) => ({
      id: t.team_id,
      dbId: t.id,
      name: t.team_name,
      college: t.college_name,
      startingPurse: Number(t.starting_purse),
      remainingPurse: Number(t.remaining_purse),
      playersBought: Number(t.players_bought),
    }));

    return {
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
  }

  /**
   * Start or resume auction
   */
  static async startAuction(sessionId: number): Promise<LiveAuctionState> {
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
    } else {
      await pool.query(
        "UPDATE auction_sessions SET status = 'ACTIVE', state_stage = 'PLAYER_READY' WHERE id = ?",
        [sessionId]
      );
    }

    await pool.query(
      'INSERT INTO auction_events (session_id, event_type) VALUES (?, ?)',
      [sessionId, 'AUCTION_STARTED']
    );

    const state = await this.getAuctionState(sessionId);
    auctionWsManager.broadcast({ type: 'AUCTION_STATE_UPDATE', payload: state });
    return state;
  }

  /**
   * Pause auction
   */
  static async pauseAuction(sessionId: number): Promise<LiveAuctionState> {
    await pool.query(
      "UPDATE auction_sessions SET status = 'PAUSED', state_stage = 'PAUSED' WHERE id = ?",
      [sessionId]
    );

    await pool.query(
      'INSERT INTO auction_events (session_id, event_type) VALUES (?, ?)',
      [sessionId, 'AUCTION_PAUSED']
    );

    const state = await this.getAuctionState(sessionId);
    auctionWsManager.broadcast({ type: 'STAGE_CHANGE', payload: { stage: 'PAUSED', state } });
    return state;
  }

  /**
   * Resume auction
   */
  static async resumeAuction(sessionId: number): Promise<LiveAuctionState> {
    await pool.query(
      "UPDATE auction_sessions SET status = 'ACTIVE', state_stage = 'BIDDING' WHERE id = ?",
      [sessionId]
    );

    await pool.query(
      'INSERT INTO auction_events (session_id, event_type) VALUES (?, ?)',
      [sessionId, 'AUCTION_RESUMED']
    );

    const state = await this.getAuctionState(sessionId);
    auctionWsManager.broadcast({ type: 'STAGE_CHANGE', payload: { stage: 'BIDDING', state } });
    return state;
  }

  /**
   * Set stage state (e.g. GOING_ONCE, GOING_TWICE, BIDDING)
   */
  static async setStageState(sessionId: number, stage: string): Promise<LiveAuctionState> {
    await pool.query('UPDATE auction_sessions SET state_stage = ? WHERE id = ?', [stage, sessionId]);

    if (stage === 'GOING_ONCE' || stage === 'GOING_TWICE') {
      await pool.query(
        'INSERT INTO auction_events (session_id, event_type) VALUES (?, ?)',
        [sessionId, stage]
      );
    }

    const state = await this.getAuctionState(sessionId);
    auctionWsManager.broadcast({ type: 'STAGE_CHANGE', payload: { stage, state } });
    return state;
  }

  /**
   * Advance to the next player in the queue
   */
  static async nextPlayer(sessionId: number): Promise<LiveAuctionState> {
    // Find next queued player
    const [nextRows] = await pool.query<RowDataPacket[]>(
      `SELECT q.id AS queueId, q.player_id, p.base_price
       FROM auction_queue q
       JOIN players p ON q.player_id = p.id
       WHERE q.session_id = ? AND q.status = 'QUEUED'
       ORDER BY q.queue_order ASC
       LIMIT 1`,
      [sessionId]
    );

    if (nextRows.length === 0) {
      // All players processed
      await pool.query(
        "UPDATE auction_sessions SET current_player_id = NULL, current_bid = 0, highest_bidder_team_id = NULL, state_stage = 'INITIAL', status = 'COMPLETED' WHERE id = ?",
        [sessionId]
      );
      const state = await this.getAuctionState(sessionId);
      auctionWsManager.broadcast({ type: 'AUCTION_STATE_UPDATE', payload: state });
      return state;
    }

    const next = nextRows[0];
    const initialBid = Number(next.base_price);

    // Update queue status
    await pool.query("UPDATE auction_queue SET status = 'CURRENT' WHERE id = ?", [next.queueId]);

    // Update session
    await pool.query(
      `UPDATE auction_sessions 
       SET current_player_id = ?,
           current_bid = ?,
           highest_bidder_team_id = NULL,
           status = 'ACTIVE',
           state_stage = 'PLAYER_READY',
           timer_seconds = 15
       WHERE id = ?`,
      [next.player_id, initialBid, sessionId]
    );

    // Log event
    await pool.query(
      'INSERT INTO auction_events (session_id, event_type, player_id, amount) VALUES (?, ?, ?, ?)',
      [sessionId, 'PLAYER_STARTED', next.player_id, initialBid]
    );

    const state = await this.getAuctionState(sessionId);
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
