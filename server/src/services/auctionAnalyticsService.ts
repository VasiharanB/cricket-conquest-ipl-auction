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

export const TOURNAMENT_RULES = {
  REQUIRED_PLAYERS: 11,
  REQUIRED_BATSMEN: 5,        // Batsman + Wicketkeeper
  REQUIRED_BOWLERS: 3,
  REQUIRED_ALLROUNDERS: 3,
  REQUIRED_FOREIGN: 4,        // Overseas players (max 4 / exactly 4)
  MAX_FOREIGN: 4,
  STARTING_PURSE: 80.0,       // ₹80.00 Cr
};

export interface TeamResultSquadPlayer {
  id: string;
  name: string;
  role: string;
  nationality: string;
  category: string;
  price: number;
  rating: number;
  keyPoints: number;
}

export interface SquadRuleEvaluation {
  isValid: boolean;
  isEliminated: boolean;
  totalPlayers: { current: number; required: number; passed: boolean };
  batsmen: { current: number; required: number; passed: boolean };
  bowlers: { current: number; required: number; passed: boolean };
  allRounders: { current: number; required: number; passed: boolean };
  foreignPlayers: { current: number; required: number; passed: boolean };
  purse: { spent: number; limit: number; remaining: number; passed: boolean };
  violations: string[];
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
    batsman: number; // Batsman + Wicketkeeper
    pureBatsman: number;
    bowler: number;
    allRounder: number;
    wicketkeeper: number;
    foreign: number;
    indian: number;
  };
  ruleEvaluation: SquadRuleEvaluation;
  players: TeamResultSquadPlayer[];
}

export interface AuctionResultsPayload {
  isPublished: boolean;
  publishedAt: string | null;
  rules: typeof TOURNAMENT_RULES;
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
   * Calculate live tournament results, secret key points, squad rule validations, and official standings
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
        `SELECT p.id, p.player_id, p.player_name, p.role, p.nationality, p.player_category, p.rating, p.key_points, pp.purchase_price
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
        nationality: p.nationality || 'Indian',
        category: p.player_category,
        price: Number(p.purchase_price),
        rating: p.rating ? Number(p.rating) : 7.5,
        keyPoints: Number(p.key_points || 0),
      }));

      const totalSpent = players.reduce((sum, p) => sum + p.price, 0);
      const startingPurse = Number(t.starting_purse) || TOURNAMENT_RULES.STARTING_PURSE;
      const calculatedRemaining = startingPurse - totalSpent;
      const totalKeyPoints = players.reduce((sum, p) => sum + p.keyPoints, 0);

      // Score = Total Key Points (pure merit)
      const totalScore = totalKeyPoints;

      // Role and category counts
      const pureBatsmanCount = players.filter((p) => p.role.toLowerCase().includes('bat')).length;
      const wicketkeeperCount = players.filter((p) => p.role.toLowerCase().includes('keeper') || p.role.toLowerCase().includes('wk')).length;
      // In cricket combinations, Batsmen + Wicketkeepers form the batting department (5 required)
      const batsmanTotalCount = pureBatsmanCount + wicketkeeperCount;
      const bowlerCount = players.filter((p) => p.role.toLowerCase().includes('bowl')).length;
      const allRounderCount = players.filter((p) => p.role.toLowerCase().includes('all') || p.role.toLowerCase().includes('round')).length;
      
      const foreignCount = players.filter((p) => (p.nationality || '').trim().toLowerCase() !== 'indian').length;
      const indianCount = players.length - foreignCount;

      const roleCounts = {
        batsman: batsmanTotalCount,
        pureBatsman: pureBatsmanCount,
        bowler: bowlerCount,
        allRounder: allRounderCount,
        wicketkeeper: wicketkeeperCount,
        foreign: foreignCount,
        indian: indianCount,
      };

      // ── Official Rule Book Compliance Check ──
      const violations: string[] = [];

      // 1. Total players: exactly 11
      const totalPlayersPassed = players.length === TOURNAMENT_RULES.REQUIRED_PLAYERS;
      if (players.length < TOURNAMENT_RULES.REQUIRED_PLAYERS) {
        violations.push(`Incomplete Squad: 11 players required (currently has ${players.length})`);
      } else if (players.length > TOURNAMENT_RULES.REQUIRED_PLAYERS) {
        violations.push(`Squad Limit Exceeded: Exactly 11 players allowed (currently has ${players.length})`);
      }

      // 2. Batsmen: exactly 5 (Batsmen + Wicketkeepers)
      const batsmenPassed = batsmanTotalCount === TOURNAMENT_RULES.REQUIRED_BATSMEN;
      if (batsmanTotalCount !== TOURNAMENT_RULES.REQUIRED_BATSMEN) {
        violations.push(`Batsmen / WK Mismatch: Exactly 5 required (currently has ${batsmanTotalCount})`);
      }

      // 3. Bowlers: exactly 3
      const bowlersPassed = bowlerCount === TOURNAMENT_RULES.REQUIRED_BOWLERS;
      if (bowlerCount !== TOURNAMENT_RULES.REQUIRED_BOWLERS) {
        violations.push(`Bowlers Mismatch: Exactly 3 required (currently has ${bowlerCount})`);
      }

      // 4. All-rounders: exactly 3
      const allRoundersPassed = allRounderCount === TOURNAMENT_RULES.REQUIRED_ALLROUNDERS;
      if (allRounderCount !== TOURNAMENT_RULES.REQUIRED_ALLROUNDERS) {
        violations.push(`All-rounders Mismatch: Exactly 3 required (currently has ${allRounderCount})`);
      }

      // 5. Foreign players: max 4, exact 4 for completed 11-player squad
      const foreignPassed = foreignCount <= TOURNAMENT_RULES.MAX_FOREIGN && (players.length === 11 ? foreignCount === TOURNAMENT_RULES.REQUIRED_FOREIGN : true);
      if (foreignCount > TOURNAMENT_RULES.MAX_FOREIGN) {
        violations.push(`Overseas Limit Exceeded: Maximum 4 allowed (currently has ${foreignCount})`);
      } else if (players.length === 11 && foreignCount !== TOURNAMENT_RULES.REQUIRED_FOREIGN) {
        violations.push(`Overseas Quota Mismatch: Exactly 4 foreign players required (currently has ${foreignCount})`);
      }

      // 6. Purse Limit: 80 Cr (cannot exceed starting purse)
      const pursePassed = calculatedRemaining >= 0 && totalSpent <= startingPurse;
      if (!pursePassed) {
        violations.push(`Purse Exceeded: ₹${startingPurse.toFixed(2)} Cr limit (spent ₹${totalSpent.toFixed(2)} Cr)`);
      }

      const isValid = totalPlayersPassed && batsmenPassed && bowlersPassed && allRoundersPassed && foreignPassed && pursePassed;
      const isEliminated = !isValid;

      const ruleEvaluation: SquadRuleEvaluation = {
        isValid,
        isEliminated,
        totalPlayers: { current: players.length, required: TOURNAMENT_RULES.REQUIRED_PLAYERS, passed: totalPlayersPassed },
        batsmen: { current: batsmanTotalCount, required: TOURNAMENT_RULES.REQUIRED_BATSMEN, passed: batsmenPassed },
        bowlers: { current: bowlerCount, required: TOURNAMENT_RULES.REQUIRED_BOWLERS, passed: bowlersPassed },
        allRounders: { current: allRounderCount, required: TOURNAMENT_RULES.REQUIRED_ALLROUNDERS, passed: allRoundersPassed },
        foreignPlayers: { current: foreignCount, required: TOURNAMENT_RULES.REQUIRED_FOREIGN, passed: foreignPassed },
        purse: { spent: totalSpent, limit: startingPurse, remaining: calculatedRemaining, passed: pursePassed },
        violations,
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
        ruleEvaluation,
        players,
      });
    }

    // ── Official Standings Ranking ──
    // 1) Participating teams with acquired players rank above empty squads
    // 2) RULE BOOK COMPLIANCE: Valid (non-eliminated) teams rank above eliminated teams
    // 3) Secret Key Points (highest first)
    // 4) Lower purse spent (tiebreaker for efficiency)
    // 5) Higher squad rating
    standings.sort((a, b) => {
      if (a.playerCount > 0 && b.playerCount === 0) return -1;
      if (a.playerCount === 0 && b.playerCount > 0) return 1;

      // VALID SQUAD MUST OUTRANK ELIMINATED TEAMS TO WIN
      if (a.ruleEvaluation.isValid && !b.ruleEvaluation.isValid) return -1;
      if (!a.ruleEvaluation.isValid && b.ruleEvaluation.isValid) return 1;

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
      rules: TOURNAMENT_RULES,
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
