import { RowDataPacket } from 'mysql2';
import { pool } from '../db/pool.js';
import { auctionWsManager } from '../websocket/auctionWs.js';

export interface HistoryItem {
  id: number;
  eventType: string;
  timestamp: string;
  round: number;
  playerId?: string;
  playerName?: string;
  playerRole?: string;
  teamId?: string;
  teamName?: string;
  amount?: number;
  status: 'Sold' | 'Unsold' | 'Bid' | 'Undo' | 'Event';
}

export interface TeamResultSquadPlayer {
  id: string;
  name: string;
  role: string;
  category: string;
  price: number;
  rating: number;
  keyPoints: number;
}

export interface TeamResultItem {
  teamId: string;
  teamName: string;
  collegeName: string;
  startingPurse: number;
  remainingPurse: number;
  totalSpent: number;
  playerCount: number;
  squadRating: number;
  totalKeyPoints: number;
  totalScore: number;
  roleCounts: {
    batsman: number;
    bowler: number;
    allRounder: number;
    wicketkeeper: number;
  };
  players: TeamResultSquadPlayer[];
}

export interface AuctionResultsPayload {
  isPublished: boolean;
  publishedAt: string | null;
  standings: TeamResultItem[];
}

export class AuctionAnalyticsService {
  /**
   * Fetch live auction event history from database
   */
  static async getHistory(params: { search?: string; status?: string; limit?: number }): Promise<HistoryItem[]> {
    const limit = params.limit ? Number(params.limit) : 100;

    let query = `
      SELECT 
        e.id,
        e.event_type,
        e.amount,
        e.created_at,
        p.player_id,
        p.player_name,
        p.role AS player_role,
        t.team_id,
        t.team_name,
        s.round_number
      FROM auction_events e
      LEFT JOIN players p ON e.player_id = p.id
      LEFT JOIN teams t ON e.team_id = t.id
      LEFT JOIN auction_sessions s ON e.session_id = s.id
      WHERE 1=1
    `;
    const queryParams: any[] = [];

    if (params.search) {
      query += ' AND (p.player_name LIKE ? OR t.team_name LIKE ?)';
      queryParams.push(`%${params.search}%`, `%${params.search}%`);
    }

    if (params.status && params.status !== 'all') {
      if (params.status.toLowerCase() === 'sold') {
        query += " AND e.event_type = 'PLAYER_SOLD'";
      } else if (params.status.toLowerCase() === 'unsold') {
        query += " AND e.event_type = 'PLAYER_UNSOLD'";
      }
    }

    query += ' ORDER BY e.id DESC LIMIT ?';
    queryParams.push(limit);

    const [rows] = await pool.query<RowDataPacket[]>(query, queryParams);

    return (rows as any[]).map((r) => {
      let status: 'Sold' | 'Unsold' | 'Bid' | 'Undo' | 'Event' = 'Event';
      if (r.event_type === 'PLAYER_SOLD') status = 'Sold';
      else if (r.event_type === 'PLAYER_UNSOLD') status = 'Unsold';
      else if (r.event_type === 'BID_PLACED') status = 'Bid';
      else if (r.event_type === 'SALE_UNDONE') status = 'Undo';

      return {
        id: r.id,
        eventType: r.event_type,
        timestamp: r.created_at,
        round: r.round_number || 1,
        playerId: r.player_id,
        playerName: r.player_name,
        playerRole: r.player_role,
        teamId: r.team_id,
        teamName: r.team_name,
        amount: r.amount ? Number(r.amount) : undefined,
        status,
      };
    });
  }

  /**
   * Calculate live tournament results, secret key points, and official standings
   */
  static async getResults(): Promise<AuctionResultsPayload> {
    const [sessionRows] = await pool.query<RowDataPacket[]>(
      'SELECT is_results_published, results_published_at FROM auction_sessions ORDER BY id DESC LIMIT 1'
    );

    const isPublished = Boolean(sessionRows[0]?.is_results_published);
    const publishedAt = sessionRows[0]?.results_published_at || null;

    const [teamRows] = await pool.query<RowDataPacket[]>(
      `SELECT t.id, t.team_id, t.team_name, t.college_name, t.starting_purse, t.remaining_purse 
       FROM teams t
       WHERE (SELECT COUNT(*) FROM team_members m WHERE m.team_id = t.id) >= 1
       ORDER BY t.id ASC`
    );

    const standings: TeamResultItem[] = [];

    for (const t of teamRows) {
      const [playerRows] = await pool.query<RowDataPacket[]>(
        `SELECT p.id, p.player_id, p.player_name, p.role, p.player_category, p.rating, p.key_points, pp.purchase_price
         FROM player_purchases pp
         JOIN players p ON pp.player_id = p.id
         WHERE pp.team_id = ? AND pp.is_undone = FALSE
         ORDER BY pp.id ASC`,
        [t.id]
      );

      const players: TeamResultSquadPlayer[] = (playerRows as any[]).map((p) => ({
        id: p.player_id,
        name: p.player_name,
        role: p.role,
        category: p.player_category,
        price: Number(p.purchase_price),
        rating: p.rating ? Number(p.rating) : 7.5,
        keyPoints: Number(p.key_points || 0),
      }));

      const totalSpent = players.reduce((sum, p) => sum + p.price, 0);
      const startingPurse = Number(t.starting_purse);
      const calculatedRemaining = startingPurse - totalSpent;
      const totalKeyPoints = players.reduce((sum, p) => sum + p.keyPoints, 0);

      // Score = Total Key Points only (pure merit)
      // Tiebreaker 1: lower totalSpent (spent less = more efficient)
      // Tiebreaker 2: higher average rating
      const totalScore = totalKeyPoints;

      const roleCounts = {
        batsman: players.filter((p) => p.role.toLowerCase().includes('bat')).length,
        bowler: players.filter((p) => p.role.toLowerCase().includes('bowl')).length,
        allRounder: players.filter((p) => p.role.toLowerCase().includes('all') || p.role.toLowerCase().includes('round')).length,
        wicketkeeper: players.filter((p) => p.role.toLowerCase().includes('keeper') || p.role.toLowerCase().includes('wk')).length,
      };

      const avgRating = players.length > 0
        ? Number((players.reduce((sum, p) => sum + p.rating, 0) / players.length).toFixed(1))
        : 0;

      standings.push({
        teamId: t.team_id,
        teamName: t.team_name,
        collegeName: t.college_name,
        startingPurse,
        remainingPurse: calculatedRemaining,
        totalSpent,
        playerCount: players.length,
        squadRating: avgRating,
        totalKeyPoints,
        totalScore,
        roleCounts,
        players,
      });
    }

    // Sort:
    // 1) Participating teams with acquired players rank above teams with 0 players
    // 2) Most Key Points (sum of secret key points)
    // 3) Lower purse spent (tie-break if Key Points sum is equal)
    // 4) Higher squad rating
    standings.sort((a, b) => {
      if (a.playerCount > 0 && b.playerCount === 0) return -1;
      if (a.playerCount === 0 && b.playerCount > 0) return 1;

      if (b.totalKeyPoints !== a.totalKeyPoints) {
        return b.totalKeyPoints - a.totalKeyPoints;
      }
      if (a.totalSpent !== b.totalSpent) {
        return a.totalSpent - b.totalSpent; // lower spent = winner on tie
      }
      return b.squadRating - a.squadRating;
    });

    return {
      isPublished,
      publishedAt,
      standings,
    };
  }

  /**
   * Admin Grants Access & Publishes Official Results
   */
  static async publishResults(sessionId: number): Promise<AuctionResultsPayload> {
    await pool.query(
      'UPDATE auction_sessions SET is_results_published = TRUE, results_published_at = CURRENT_TIMESTAMP WHERE id = ?',
      [sessionId]
    );

    await pool.query(
      'INSERT INTO auction_events (session_id, event_type) VALUES (?, ?)',
      [sessionId, 'RESULTS_PUBLISHED' as any]
    );

    const results = await this.getResults();

    auctionWsManager.broadcast({
      type: 'AUCTION_STATE_UPDATE',
      payload: { resultsPublished: true, results },
    });

    return results;
  }
}
