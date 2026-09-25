import { RowDataPacket, ResultSetHeader } from 'mysql2';
import jwt from 'jsonwebtoken';
import { pool } from '../db/pool.js';
import { auctionWsManager } from '../websocket/auctionWs.js';

export interface ParticipantUser {
  id: number; // team db primary key
  teamId: string; // e.g. CC26-001
  teamName: string;
  collegeName: string;
  role: 'Participant';
}

export interface WatchdogTeamRecord {
  id: number;
  teamId: string;
  teamName: string;
  collegeName: string;
  captainName: string;
  captainPhone: string;
  registrationStatus: string;
  checkInStatus: string;
  startingPurse: number;
  remainingPurse: number;
  playersBought: number;
  isOnline: boolean;
  currentPage: string;
  lastPing: string | null;
  supportRequested: boolean;
  supportMessage: string | null;
  accessCode: string;
}

export class ParticipantService {
  /**
   * Contestant login using Team ID / Captain Email + Access Code
   */
  static async login(identifier: string, accessCode: string): Promise<{ token: string; team: ParticipantUser }> {
    const cleanId = (identifier || '').trim();
    const cleanCode = (accessCode || '').trim().toUpperCase();

    if (!cleanId || !cleanCode) {
      const err: any = new Error('Team ID / Email and Access Code are required');
      err.statusCode = 400;
      throw err;
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, team_id, team_name, college_name, access_code, registration_status 
       FROM teams 
       WHERE team_id = ? OR LOWER(captain_email) = LOWER(?) LIMIT 1`,
      [cleanId, cleanId]
    );

    if (rows.length === 0) {
      const err: any = new Error('Team not found. Please verify your Team ID or Captain Email.');
      err.statusCode = 401;
      throw err;
    }

    const team = rows[0];

    if (team.access_code.toUpperCase() !== cleanCode) {
      const err: any = new Error('Invalid Access Code for this team.');
      err.statusCode = 401;
      throw err;
    }

    // Update presence
    await pool.query(
      `UPDATE teams 
       SET is_online = TRUE, current_page = 'dashboard', last_ping = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [team.id]
    );

    // Record activity
    await pool.query(
      'INSERT INTO participant_activities (team_id, action_type, details) VALUES (?, ?, ?)',
      [team.id, 'LOGIN', `Logged in to dashboard`]
    );

    const participantUser: ParticipantUser = {
      id: team.id,
      teamId: team.team_id,
      teamName: team.team_name,
      collegeName: team.college_name,
      role: 'Participant',
    };

    const secret = process.env.JWT_SECRET || 'zentrix26_cricket_conquest_super_secure_jwt_secret_key_2026';
    const token = jwt.sign(participantUser, secret, { expiresIn: '24h' });

    auctionWsManager.broadcast({
      type: 'AUCTION_STATE_UPDATE',
      payload: { message: `Team ${team.team_name} logged in` },
    });

    return { token, team: participantUser };
  }

  /**
   * Get full contestant team profile
   */
  static async getProfile(teamDbId: number): Promise<any> {
    const [teamRows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM teams WHERE id = ? LIMIT 1',
      [teamDbId]
    );

    if (teamRows.length === 0) {
      const err: any = new Error('Team not found');
      err.statusCode = 404;
      throw err;
    }

    const team = teamRows[0];

    const [members] = await pool.query<RowDataPacket[]>(
      'SELECT id, member_number, full_name, email, phone, is_captain FROM team_members WHERE team_id = ? ORDER BY member_number ASC',
      [teamDbId]
    );

    const [playersBought] = await pool.query<RowDataPacket[]>(
      `SELECT p.id, p.player_id, p.player_name, p.role, p.player_category, p.rating, pp.purchase_price
       FROM player_purchases pp
       JOIN players p ON pp.player_id = p.id
       WHERE pp.team_id = ? AND pp.is_undone = FALSE`,
      [teamDbId]
    );

    return {
      id: team.id,
      teamId: team.team_id,
      teamName: team.team_name,
      collegeName: team.college_name,
      captainName: team.captain_name,
      captainEmail: team.captain_email,
      captainPhone: team.captain_phone,
      accessCode: team.access_code,
      registrationStatus: team.registration_status,
      checkInStatus: team.check_in_status,
      startingPurse: Number(team.starting_purse),
      remainingPurse: Number(team.remaining_purse),
      playersBoughtCount: Number(team.players_bought),
      members,
      squad: playersBought,
      supportRequested: Boolean(team.support_requested),
      supportMessage: team.support_message,
    };
  }

  /**
   * Heartbeat ping from contestant client
   */
  static async ping(teamDbId: number, page: string): Promise<void> {
    await pool.query(
      `UPDATE teams 
       SET is_online = TRUE, current_page = ?, last_ping = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [page || 'dashboard', teamDbId]
    );
  }

  /**
   * Contestant requests helper assistance
   */
  static async requestHelp(teamDbId: number, message: string): Promise<void> {
    await pool.query(
      'UPDATE teams SET support_requested = TRUE, support_message = ? WHERE id = ?',
      [message || 'Contestant requested helper assistance', teamDbId]
    );

    await pool.query(
      'INSERT INTO participant_activities (team_id, action_type, details) VALUES (?, ?, ?)',
      [teamDbId, 'REQUEST_HELP', message || 'Help requested']
    );

    auctionWsManager.broadcast({
      type: 'AUCTION_STATE_UPDATE',
      payload: { watchdogAlert: true },
    });
  }

  /**
   * Helper / Volunteer resolves help request
   */
  static async resolveHelp(teamDbId: number): Promise<void> {
    await pool.query(
      'UPDATE teams SET support_requested = FALSE, support_message = NULL WHERE id = ?',
      [teamDbId]
    );

    await pool.query(
      'INSERT INTO participant_activities (team_id, action_type, details) VALUES (?, ?, ?)',
      [teamDbId, 'RESOLVE_HELP', 'Helper marked issue resolved']
    );

    auctionWsManager.broadcast({
      type: 'AUCTION_STATE_UPDATE',
      payload: { watchdogAlert: false },
    });
  }

  /**
   * Helper Watchdog: Get all teams presence and malpractice tracking
   */
  static async getWatchdogData(): Promise<{ teams: WatchdogTeamRecord[]; activities: any[] }> {
    const [teamRows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        id, team_id, team_name, college_name, captain_name, captain_phone,
        access_code, registration_status, check_in_status,
        starting_purse, remaining_purse, players_bought,
        current_page, last_ping, support_requested, support_message,
        CASE 
          WHEN last_ping >= NOW() - INTERVAL 90 SECOND THEN TRUE 
          ELSE FALSE 
        END AS is_online_calculated
      FROM teams
      ORDER BY support_requested DESC, is_online_calculated DESC, id ASC
    `);

    const teams: WatchdogTeamRecord[] = (teamRows as any[]).map((t) => ({
      id: t.id,
      teamId: t.team_id,
      teamName: t.team_name,
      collegeName: t.college_name,
      captainName: t.captain_name,
      captainPhone: t.captain_phone,
      accessCode: t.access_code,
      registrationStatus: t.registration_status,
      checkInStatus: t.check_in_status,
      startingPurse: Number(t.starting_purse),
      remainingPurse: Number(t.remaining_purse),
      playersBought: Number(t.players_bought),
      isOnline: Boolean(t.is_online_calculated),
      currentPage: t.current_page || 'offline',
      lastPing: t.last_ping,
      supportRequested: Boolean(t.support_requested),
      supportMessage: t.support_message,
    }));

    const [activities] = await pool.query<RowDataPacket[]>(`
      SELECT a.*, t.team_id, t.team_name 
      FROM participant_activities a
      JOIN teams t ON a.team_id = t.id
      ORDER BY a.id DESC 
      LIMIT 30
    `);

    return { teams, activities: activities as any[] };
  }
}
