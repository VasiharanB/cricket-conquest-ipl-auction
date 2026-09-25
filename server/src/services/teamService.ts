import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../db/pool.js';

export interface DbTeamMember {
  id: number;
  team_id: number;
  member_number: number;
  full_name: string;
  email: string | null;
  phone: string | null;
  is_captain: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbTeam {
  id: number;
  team_id: string;
  team_name: string;
  college_name: string;
  captain_name: string;
  captain_email: string;
  captain_phone: string;
  access_code?: string;
  registration_status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'WAITLISTED';
  check_in_status: 'NOT_CHECKED_IN' | 'CHECKED_IN';
  starting_purse: number;
  remaining_purse: number;
  players_bought: number;
  is_online?: boolean;
  current_page?: string;
  last_ping?: string | null;
  support_requested?: boolean;
  support_message?: string | null;
  created_at: string;
  updated_at: string;
  members: DbTeamMember[];
  member_count: number;
}

export interface CreateTeamInput {
  teamName: string;
  collegeName: string;
  captain: {
    fullName: string;
    email: string;
    phone: string;
  };
  members?: {
    fullName: string;
    email?: string;
    phone?: string;
  }[];
}

export interface TeamStats {
  registeredTeams: number;
  confirmedTeams: number;
  checkedIn: number;
  totalParticipants: number;
  maxTeams: number;
}

export interface TeamQueryParams {
  search?: string;
  status?: string;
  checkIn?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class TeamService {
  /**
   * Fetch current team statistics
   */
  static async getTeamStats(): Promise<TeamStats> {
    const maxTeams = process.env.MAX_TEAMS ? Number(process.env.MAX_TEAMS) : 16;

    const [teamStatRows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        COUNT(*) AS registeredTeams,
        SUM(CASE WHEN registration_status = 'CONFIRMED' THEN 1 ELSE 0 END) AS confirmedTeams,
        SUM(CASE WHEN check_in_status = 'CHECKED_IN' THEN 1 ELSE 0 END) AS checkedIn
      FROM teams
    `);

    const [memberRows] = await pool.query<RowDataPacket[]>(`
      SELECT COUNT(*) AS totalParticipants FROM team_members
    `);

    const teamStats = teamStatRows[0] || {};
    const memberStats = memberRows[0] || {};

    return {
      registeredTeams: Number(teamStats.registeredTeams || 0),
      confirmedTeams: Number(teamStats.confirmedTeams || 0),
      checkedIn: Number(teamStats.checkedIn || 0),
      totalParticipants: Number(memberStats.totalParticipants || 0),
      maxTeams,
    };
  }

  /**
   * Fetch teams with search and status filtering
   */
  static async getTeams(params: TeamQueryParams = {}): Promise<{ teams: DbTeam[]; stats: TeamStats }> {
    const conditions: string[] = [];
    const values: any[] = [];

    if (params.search && params.search.trim() !== '') {
      const term = `%${params.search.trim()}%`;
      conditions.push('(team_name LIKE ? OR team_id LIKE ? OR captain_name LIKE ? OR college_name LIKE ?)');
      values.push(term, term, term, term);
    }

    if (params.status && params.status !== 'all') {
      conditions.push('registration_status = ?');
      values.push(params.status.trim().toUpperCase());
    }

    if (params.checkIn && params.checkIn !== 'all') {
      conditions.push('check_in_status = ?');
      values.push(params.checkIn.trim().toUpperCase());
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [teams] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM teams ${whereClause} ORDER BY id ASC`,
      values
    );

    if (teams.length === 0) {
      const stats = await this.getTeamStats();
      return { teams: [], stats };
    }

    // Retrieve members for these teams
    const teamDbIds = teams.map((t) => t.id);
    const placeholders = teamDbIds.map(() => '?').join(',');

    const [members] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM team_members WHERE team_id IN (${placeholders}) ORDER BY team_id ASC, member_number ASC`,
      teamDbIds
    );

    const membersByTeamId: Record<number, DbTeamMember[]> = {};
    for (const m of members as DbTeamMember[]) {
      if (!membersByTeamId[m.team_id]) {
        membersByTeamId[m.team_id] = [];
      }
      membersByTeamId[m.team_id].push(m);
    }

    const enrichedTeams: DbTeam[] = (teams as any[]).map((t) => {
      const teamMembers = membersByTeamId[t.id] || [];
      return {
        ...t,
        starting_purse: Number(t.starting_purse),
        remaining_purse: Number(t.remaining_purse),
        players_bought: Number(t.players_bought),
        members: teamMembers,
        member_count: teamMembers.length,
      };
    });

    const stats = await this.getTeamStats();
    return { teams: enrichedTeams, stats };
  }

  /**
   * Fetch single team by team_id (e.g. CC26-001) or primary key id
   */
  static async getTeamById(idOrTeamId: string): Promise<DbTeam | null> {
    const isNumeric = /^\d+$/.test(idOrTeamId);
    const query = isNumeric
      ? 'SELECT * FROM teams WHERE id = ? OR team_id = ? LIMIT 1'
      : 'SELECT * FROM teams WHERE team_id = ? LIMIT 1';
    const params = isNumeric ? [Number(idOrTeamId), idOrTeamId] : [idOrTeamId];

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    if (!rows.length) return null;

    const team = rows[0] as any;
    const [members] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM team_members WHERE team_id = ? ORDER BY member_number ASC',
      [team.id]
    );

    return {
      ...team,
      starting_purse: Number(team.starting_purse),
      remaining_purse: Number(team.remaining_purse),
      players_bought: Number(team.players_bought),
      members: members as DbTeamMember[],
      member_count: members.length,
    };
  }

  /**
   * Fetch members of a team
   */
  static async getTeamMembers(teamId: string): Promise<DbTeamMember[]> {
    const team = await this.getTeamById(teamId);
    if (!team) {
      const err: any = new Error(`Team '${teamId}' not found`);
      err.statusCode = 404;
      throw err;
    }
    return team.members;
  }

  /**
   * Fetch purchased squad players for a team (Admin use only)
   */
  static async getTeamSquad(teamId: string): Promise<any[]> {
    const team = await this.getTeamById(teamId);
    if (!team) {
      const err: any = new Error(`Team '${teamId}' not found`);
      err.statusCode = 404;
      throw err;
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT p.player_id, p.player_name, p.role, p.nationality, p.player_category,
              p.base_price, p.rating, p.key_points, pp.purchase_price
       FROM player_purchases pp
       JOIN players p ON pp.player_id = p.id
       WHERE pp.team_id = ? AND pp.is_undone = FALSE
       ORDER BY pp.id ASC`,
      [team.id]
    );

    return (rows as any[]).map((p) => ({
      playerId: p.player_id,
      playerName: p.player_name,
      role: p.role,
      nationality: p.nationality,
      category: p.player_category,
      basePrice: Number(p.base_price),
      rating: p.rating ? Number(p.rating) : null,
      keyPoints: Number(p.key_points || 0),
      purchasePrice: Number(p.purchase_price),
    }));
  }

  /**
   * Register a new team with participants in an atomic MySQL transaction
   */
  static async createTeam(input: CreateTeamInput): Promise<DbTeam> {
    const maxTeams = process.env.MAX_TEAMS ? Number(process.env.MAX_TEAMS) : 16;
    const defaultPurse = process.env.DEFAULT_PURSE ? Number(process.env.DEFAULT_PURSE) : 0;

    // 1. Validation: Team & College Name
    const teamName = (input.teamName || '').trim();
    const collegeName = (input.collegeName || '').trim();

    if (!teamName || teamName.length < 2) {
      const err: any = new Error('Team Name must be at least 2 characters');
      err.statusCode = 400;
      throw err;
    }
    if (!collegeName || collegeName.length < 2) {
      const err: any = new Error('College Name must be at least 2 characters');
      err.statusCode = 400;
      throw err;
    }

    // 2. Validation: Captain Details
    const captainName = (input.captain?.fullName || '').trim();
    const captainEmail = (input.captain?.email || '').trim().toLowerCase();
    const captainPhone = (input.captain?.phone || '').trim();

    if (!captainName || captainName.length < 2) {
      const err: any = new Error('Captain Name is required');
      err.statusCode = 400;
      throw err;
    }
    if (!captainEmail || !EMAIL_REGEX.test(captainEmail)) {
      const err: any = new Error('A valid Captain Email address is required');
      err.statusCode = 400;
      throw err;
    }
    if (!captainPhone || captainPhone.replace(/\D/g, '').length < 7) {
      const err: any = new Error('A valid Captain Phone number is required');
      err.statusCode = 400;
      throw err;
    }

    // 3. Validation: Additional Members (filter empty slots)
    const validAdditionalMembers = (input.members || [])
      .map((m) => ({
        fullName: (m.fullName || '').trim(),
        email: m.email ? m.email.trim().toLowerCase() : null,
        phone: m.phone ? m.phone.trim() : null,
      }))
      .filter((m) => m.fullName.length > 0);

    const totalParticipants = 1 + validAdditionalMembers.length;

    if (totalParticipants < 2) {
      const err: any = new Error('A team must contain at least 2 participants (captain + at least 1 member)');
      err.statusCode = 400;
      throw err;
    }
    if (totalParticipants > 4) {
      const err: any = new Error('A team cannot contain more than 4 participants');
      err.statusCode = 400;
      throw err;
    }

    // 4. Begin MySQL Transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Check duplicate team name (case-insensitive)
      const [existingNameRows] = await connection.query<RowDataPacket[]>(
        'SELECT id FROM teams WHERE LOWER(TRIM(team_name)) = LOWER(TRIM(?)) LIMIT 1',
        [teamName]
      );
      if (existingNameRows.length > 0) {
        const err: any = new Error(`Team name '${teamName}' is already registered. Please choose a different team name.`);
        err.statusCode = 400;
        throw err;
      }

      // Check event capacity limit
      const [countRows] = await connection.query<RowDataPacket[]>(
        'SELECT COUNT(*) AS total FROM teams'
      );
      const currentTeamCount = Number(countRows[0]?.total || 0);
      if (currentTeamCount >= maxTeams) {
        const err: any = new Error(`Team registration limit reached (${maxTeams} teams maximum).`);
        err.statusCode = 400;
        throw err;
      }

      // Generate atomic, sequential team_id (CC26-001, CC26-002, ...)
      const [maxIdRows] = await connection.query<RowDataPacket[]>(
        'SELECT MAX(CAST(SUBSTRING(team_id, 6) AS UNSIGNED)) AS max_num FROM teams FOR UPDATE'
      );
      const maxNum = maxIdRows[0]?.max_num ? Number(maxIdRows[0].max_num) : 0;
      const nextNum = maxNum + 1;
      const generatedTeamId = `CC26-${String(nextNum).padStart(3, '0')}`;

      // Generate access code for participant login (e.g. CC26-MUMB-4821)
      const cleanPrefix = teamName.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 4).padEnd(4, 'X');
      const randomDigits = Math.floor(1000 + Math.random() * 9000);
      const generatedAccessCode = `CC26-${cleanPrefix}-${randomDigits}`;

      // Insert Team Record
      const [teamInsertResult] = await connection.query<ResultSetHeader>(
        `INSERT INTO teams (
          team_id, team_name, college_name, captain_name, captain_email, captain_phone,
          access_code, registration_status, check_in_status, starting_purse, remaining_purse, players_bought
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'CONFIRMED', 'NOT_CHECKED_IN', ?, ?, 0)`,
        [
          generatedTeamId,
          teamName,
          collegeName,
          captainName,
          captainEmail,
          captainPhone,
          generatedAccessCode,
          defaultPurse,
          defaultPurse,
        ]
      );

      const dbTeamId = teamInsertResult.insertId;

      // Insert Member 1 (Captain)
      await connection.query(
        `INSERT INTO team_members (
          team_id, member_number, full_name, email, phone, is_captain
        ) VALUES (?, 1, ?, ?, ?, TRUE)`,
        [dbTeamId, captainName, captainEmail, captainPhone]
      );

      // Insert Members 2, 3, 4
      for (let i = 0; i < validAdditionalMembers.length; i++) {
        const memberNum = i + 2;
        const mem = validAdditionalMembers[i];
        await connection.query(
          `INSERT INTO team_members (
            team_id, member_number, full_name, email, phone, is_captain
          ) VALUES (?, ?, ?, ?, ?, FALSE)`,
          [dbTeamId, memberNum, mem.fullName, mem.email, mem.phone]
        );
      }

      await connection.commit();

      // Retrieve full created team to return
      const createdTeam = await this.getTeamById(generatedTeamId);
      return createdTeam!;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Update team registration status
   */
  static async updateRegistrationStatus(
    teamId: string,
    status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'WAITLISTED'
  ): Promise<DbTeam> {
    const validStatuses = ['PENDING', 'CONFIRMED', 'CANCELLED', 'WAITLISTED'];
    const upper = (status || '').toUpperCase() as any;
    if (!validStatuses.includes(upper)) {
      const err: any = new Error(`Invalid status '${status}'. Allowed: ${validStatuses.join(', ')}`);
      err.statusCode = 400;
      throw err;
    }

    const team = await this.getTeamById(teamId);
    if (!team) {
      const err: any = new Error(`Team '${teamId}' not found`);
      err.statusCode = 404;
      throw err;
    }

    await pool.query('UPDATE teams SET registration_status = ? WHERE id = ?', [upper, team.id]);
    return (await this.getTeamById(teamId))!;
  }

  /**
   * Update team check-in status
   */
  static async updateCheckInStatus(
    teamId: string,
    checkInStatus: 'NOT_CHECKED_IN' | 'CHECKED_IN'
  ): Promise<DbTeam> {
    const validStatuses = ['NOT_CHECKED_IN', 'CHECKED_IN'];
    const upper = (checkInStatus || '').toUpperCase() as any;
    if (!validStatuses.includes(upper)) {
      const err: any = new Error(`Invalid check-in status '${checkInStatus}'. Allowed: ${validStatuses.join(', ')}`);
      err.statusCode = 400;
      throw err;
    }

    const team = await this.getTeamById(teamId);
    if (!team) {
      const err: any = new Error(`Team '${teamId}' not found`);
      err.statusCode = 404;
      throw err;
    }

    await pool.query('UPDATE teams SET check_in_status = ? WHERE id = ?', [upper, team.id]);
    return (await this.getTeamById(teamId))!;
  }

  /**
   * Update full team information and member roster
   */
  static async updateTeam(
    teamId: string,
    input: {
      teamName?: string;
      collegeName?: string;
      captainName?: string;
      captainEmail?: string;
      captainPhone?: string;
      registrationStatus?: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'WAITLISTED';
      checkInStatus?: 'NOT_CHECKED_IN' | 'CHECKED_IN';
      startingPurse?: number;
      remainingPurse?: number;
      members?: {
        fullName: string;
        email?: string | null;
        phone?: string | null;
      }[];
    }
  ): Promise<DbTeam> {
    const existing = await this.getTeamById(teamId);
    if (!existing) {
      const err: any = new Error(`Team '${teamId}' not found`);
      err.statusCode = 404;
      throw err;
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const updates: string[] = [];
      const values: any[] = [];

      if (input.teamName !== undefined) {
        const trimmedName = input.teamName.trim();
        if (!trimmedName || trimmedName.length < 2) {
          const err: any = new Error('Team Name must be at least 2 characters');
          err.statusCode = 400;
          throw err;
        }

        // Check if name taken by another team
        const [dupRows] = await connection.query<RowDataPacket[]>(
          'SELECT id FROM teams WHERE LOWER(TRIM(team_name)) = LOWER(TRIM(?)) AND id != ? LIMIT 1',
          [trimmedName, existing.id]
        );
        if (dupRows.length > 0) {
          const err: any = new Error(`Team name '${trimmedName}' is already in use by another team`);
          err.statusCode = 400;
          throw err;
        }

        updates.push('team_name = ?');
        values.push(trimmedName);
      }

      if (input.collegeName !== undefined) {
        const trimmedCollege = input.collegeName.trim();
        if (!trimmedCollege || trimmedCollege.length < 2) {
          const err: any = new Error('College Name must be at least 2 characters');
          err.statusCode = 400;
          throw err;
        }
        updates.push('college_name = ?');
        values.push(trimmedCollege);
      }

      let capName = existing.captain_name;
      if (input.captainName !== undefined) {
        const trimmedCap = input.captainName.trim();
        if (!trimmedCap || trimmedCap.length < 2) {
          const err: any = new Error('Captain Name is required');
          err.statusCode = 400;
          throw err;
        }
        capName = trimmedCap;
        updates.push('captain_name = ?');
        values.push(trimmedCap);
      }

      let capEmail = existing.captain_email;
      if (input.captainEmail !== undefined) {
        const trimmedEmail = input.captainEmail.trim().toLowerCase();
        if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
          const err: any = new Error('Valid Captain Email is required');
          err.statusCode = 400;
          throw err;
        }
        capEmail = trimmedEmail;
        updates.push('captain_email = ?');
        values.push(trimmedEmail);
      }

      let capPhone = existing.captain_phone;
      if (input.captainPhone !== undefined) {
        const trimmedPhone = input.captainPhone.trim();
        if (!trimmedPhone) {
          const err: any = new Error('Captain Phone is required');
          err.statusCode = 400;
          throw err;
        }
        capPhone = trimmedPhone;
        updates.push('captain_phone = ?');
        values.push(trimmedPhone);
      }

      if (input.registrationStatus !== undefined) {
        const upper = input.registrationStatus.toUpperCase() as any;
        const validStatuses = ['PENDING', 'CONFIRMED', 'CANCELLED', 'WAITLISTED'];
        if (!validStatuses.includes(upper)) {
          const err: any = new Error(`Invalid status '${input.registrationStatus}'`);
          err.statusCode = 400;
          throw err;
        }
        updates.push('registration_status = ?');
        values.push(upper);
      }

      if (input.checkInStatus !== undefined) {
        const upper = input.checkInStatus.toUpperCase() as any;
        const validStatuses = ['NOT_CHECKED_IN', 'CHECKED_IN'];
        if (!validStatuses.includes(upper)) {
          const err: any = new Error(`Invalid check-in status '${input.checkInStatus}'`);
          err.statusCode = 400;
          throw err;
        }
        updates.push('check_in_status = ?');
        values.push(upper);
      }

      if (input.startingPurse !== undefined) {
        updates.push('starting_purse = ?');
        values.push(Number(input.startingPurse) || 0);
      }

      if (input.remainingPurse !== undefined) {
        updates.push('remaining_purse = ?');
        values.push(Number(input.remainingPurse) || 0);
      }

      if (updates.length > 0) {
        values.push(existing.id);
        await connection.query(`UPDATE teams SET ${updates.join(', ')} WHERE id = ?`, values);
      }

      // If members are updated, replace member list
      if (input.members !== undefined) {
        const validAdditionalMembers = (input.members || [])
          .map((m) => ({
            fullName: (m.fullName || '').trim(),
            email: m.email ? m.email.trim().toLowerCase() : null,
            phone: m.phone ? m.phone.trim() : null,
          }))
          .filter((m) => m.fullName.length > 0);

        const totalParticipants = 1 + validAdditionalMembers.length;
        if (totalParticipants < 2 || totalParticipants > 4) {
          const err: any = new Error('Team must contain between 2 and 4 participants total (including captain)');
          err.statusCode = 400;
          throw err;
        }

        // Delete old members and insert new
        await connection.query('DELETE FROM team_members WHERE team_id = ?', [existing.id]);

        // Insert Member 1 (Captain)
        await connection.query(
          `INSERT INTO team_members (
            team_id, member_number, full_name, email, phone, is_captain
          ) VALUES (?, 1, ?, ?, ?, TRUE)`,
          [existing.id, capName, capEmail, capPhone]
        );

        // Insert additional members
        for (let i = 0; i < validAdditionalMembers.length; i++) {
          const m = validAdditionalMembers[i];
          await connection.query(
            `INSERT INTO team_members (
              team_id, member_number, full_name, email, phone, is_captain
            ) VALUES (?, ?, ?, ?, ?, FALSE)`,
            [existing.id, i + 2, m.fullName, m.email, m.phone]
          );
        }
      } else if (input.captainName !== undefined || input.captainEmail !== undefined || input.captainPhone !== undefined) {
        // Just update captain details in member #1
        await connection.query(
          'UPDATE team_members SET full_name = ?, email = ?, phone = ? WHERE team_id = ? AND member_number = 1',
          [capName, capEmail, capPhone, existing.id]
        );
      }

      await connection.commit();
      return (await this.getTeamById(teamId))!;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Delete a team and its members
   */
  static async deleteTeam(teamId: string): Promise<boolean> {
    const existing = await this.getTeamById(teamId);
    if (!existing) {
      const err: any = new Error(`Team '${teamId}' not found`);
      err.statusCode = 404;
      throw err;
    }

    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM teams WHERE id = ?',
      [existing.id]
    );

    return result.affectedRows > 0;
  }
}
