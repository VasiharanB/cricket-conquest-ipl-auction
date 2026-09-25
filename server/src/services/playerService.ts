import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../db/pool.js';

export interface DbPlayer {
  id: number;
  player_id: string;
  player_name: string;
  role: string;
  nationality: string;
  player_category: string;
  base_price: number;
  rating: number | null;
  key_points?: number;
  notes?: string | null;
  status: 'AVAILABLE' | 'SOLD' | 'UNSOLD';
  sold_to_team_id: number | null;
  sold_price: number | null;
  created_at: string;
  updated_at: string;
}

export interface PlayerQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  nationality?: string;
  status?: string;
  includeKeyPoints?: boolean;
}

export interface PlayerStats {
  total: number;
  available: number;
  sold: number;
  unsold: number;
}

export interface PlayerListResult {
  players: DbPlayer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: PlayerStats;
}

export interface ImportPlayerRow {
  player_id: string;
  player_name: string;
  role: string;
  nationality: string;
  player_category?: string;
  base_price: number;
  rating?: number | null;
  key_points?: number;
  notes?: string;
}

export interface ImportResult {
  total: number;
  inserted: number;
  skipped: number;
  failed: number;
  errors: { row?: number; playerId?: string; reason: string }[];
}

const ALLOWED_ROLES = ['Batter', 'Bowler', 'All-rounder', 'Wicketkeeper'];

export function normalizeRole(role: string): string {
  const trimmed = (role || '').trim();
  if (trimmed.toLowerCase() === 'batsman') return 'Batter';
  const found = ALLOWED_ROLES.find((r) => r.toLowerCase() === trimmed.toLowerCase());
  return found || trimmed;
}

export class PlayerService {
  /**
   * Fetch database-wide player statistics
   */
  static async getPlayerStats(): Promise<PlayerStats> {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'AVAILABLE' THEN 1 ELSE 0 END) AS available,
        SUM(CASE WHEN status = 'SOLD' THEN 1 ELSE 0 END) AS sold,
        SUM(CASE WHEN status = 'UNSOLD' THEN 1 ELSE 0 END) AS unsold
      FROM players
    `);

    const row = rows[0] || {};
    return {
      total: Number(row.total || 0),
      available: Number(row.available || 0),
      sold: Number(row.sold || 0),
      unsold: Number(row.unsold || 0),
    };
  }

  /**
   * Fetch paginated and filtered players
   */
  static async getPlayers(params: PlayerQueryParams): Promise<PlayerListResult> {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = params.limit !== undefined ? Math.max(1, Number(params.limit)) : 20;
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: any[] = [];

    if (params.search && params.search.trim() !== '') {
      const searchTerm = `%${params.search.trim()}%`;
      conditions.push('(player_name LIKE ? OR player_id LIKE ?)');
      values.push(searchTerm, searchTerm);
    }

    if (params.role && params.role !== 'all') {
      const normalized = normalizeRole(params.role);
      // Support matching either Batter or Batsman if role is Batter
      if (normalized === 'Batter') {
        conditions.push('(role = ? OR role = ?)');
        values.push('Batter', 'Batsman');
      } else {
        conditions.push('role = ?');
        values.push(normalized);
      }
    }

    if (params.nationality && params.nationality !== 'all') {
      conditions.push('nationality = ?');
      values.push(params.nationality.trim());
    }

    if (params.status && params.status !== 'all') {
      conditions.push('status = ?');
      values.push(params.status.trim().toUpperCase());
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Query matching total count
    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS count FROM players ${whereClause}`,
      values
    );
    const totalMatching = Number(countRows[0]?.count || 0);

    const selectFields = params.includeKeyPoints
      ? 'id, player_id, player_name, role, nationality, player_category, base_price, rating, key_points, notes, status, sold_to_team_id, sold_price, created_at, updated_at'
      : 'id, player_id, player_name, role, nationality, player_category, base_price, rating, status, sold_to_team_id, sold_price, created_at, updated_at';

    // Query paginated player records
    const [players] = await pool.query<RowDataPacket[]>(
      `SELECT ${selectFields} FROM players ${whereClause} ORDER BY id ASC LIMIT ? OFFSET ?`,
      [...values, limit, offset]
    );

    const stats = await this.getPlayerStats();
    const totalPages = limit > 0 ? Math.ceil(totalMatching / limit) : 1;

    return {
      players: players as DbPlayer[],
      pagination: {
        page,
        limit,
        total: totalMatching,
        totalPages,
      },
      stats,
    };
  }

  /**
   * Fetch single player by player_id or numeric id
   */
  static async getPlayerById(idOrPlayerId: string): Promise<DbPlayer | null> {
    const isNumeric = /^\d+$/.test(idOrPlayerId);
    const query = isNumeric
      ? 'SELECT * FROM players WHERE id = ? OR player_id = ? LIMIT 1'
      : 'SELECT * FROM players WHERE player_id = ? LIMIT 1';
    const params = isNumeric ? [Number(idOrPlayerId), idOrPlayerId] : [idOrPlayerId];

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    if (!rows.length) return null;
    return rows[0] as DbPlayer;
  }

  /**
   * Import players with validation and transactional integrity
   */
  static async importPlayers(
    playersToImport: ImportPlayerRow[],
    onDuplicate: 'skip' | 'update' = 'skip'
  ): Promise<ImportResult> {
    const result: ImportResult = {
      total: playersToImport.length,
      inserted: 0,
      skipped: 0,
      failed: 0,
      errors: [],
    };

    if (!playersToImport || playersToImport.length === 0) {
      return result;
    }

    // Backend validation of each row
    const validRows: ImportPlayerRow[] = [];
    const seenPlayerIds = new Set<string>();

    playersToImport.forEach((p, index) => {
      const rowNum = index + 1;
      const playerId = (p.player_id || '').trim();
      const playerName = (p.player_name || '').trim();
      const role = normalizeRole(p.role || '');
      const nationality = (p.nationality || '').trim();
      const category = (p.player_category || 'General').trim();
      const basePrice = Number(p.base_price);
      const rating = p.rating !== undefined && p.rating !== null && String(p.rating).trim() !== ''
        ? Number(p.rating)
        : null;

      if (!playerId) {
        result.failed++;
        result.errors.push({ row: rowNum, reason: 'Missing Player ID' });
        return;
      }

      if (seenPlayerIds.has(playerId.toUpperCase())) {
        result.failed++;
        result.errors.push({ row: rowNum, playerId, reason: `Duplicate Player ID '${playerId}' in file` });
        return;
      }
      seenPlayerIds.add(playerId.toUpperCase());

      if (!playerName) {
        result.failed++;
        result.errors.push({ row: rowNum, playerId, reason: 'Missing Player Name' });
        return;
      }

      if (!ALLOWED_ROLES.includes(role)) {
        result.failed++;
        result.errors.push({
          row: rowNum,
          playerId,
          reason: `Invalid role '${p.role}'. Allowed: ${ALLOWED_ROLES.join(', ')}`,
        });
        return;
      }

      if (!nationality) {
        result.failed++;
        result.errors.push({ row: rowNum, playerId, reason: 'Missing Nationality' });
        return;
      }

      if (isNaN(basePrice) || basePrice <= 0) {
        result.failed++;
        result.errors.push({ row: rowNum, playerId, reason: 'Base price must be greater than 0' });
        return;
      }

      if (rating !== null && (isNaN(rating) || rating < 0 || rating > 100)) {
        result.failed++;
        result.errors.push({ row: rowNum, playerId, reason: 'Rating must be between 0 and 100' });
        return;
      }

      const keyPoints = p.key_points !== undefined && p.key_points !== null && String(p.key_points).trim() !== ''
        ? Number(p.key_points)
        : (rating !== null ? rating : 80.0);
      const notes = p.notes ? String(p.notes).trim() : null;

      validRows.push({
        player_id: playerId,
        player_name: playerName,
        role,
        nationality,
        player_category: category,
        base_price: basePrice,
        rating,
        key_points: keyPoints,
        notes: notes || undefined,
      });
    });

    if (validRows.length === 0) {
      return result;
    }

    // Connect and execute atomic transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Find which player_ids already exist in MySQL
      const playerIds = validRows.map((r) => r.player_id);
      const placeholders = playerIds.map(() => '?').join(',');

      const [existingRows] = await connection.query<RowDataPacket[]>(
        `SELECT player_id FROM players WHERE player_id IN (${placeholders})`,
        playerIds
      );

      const existingSet = new Set(existingRows.map((r) => String(r.player_id).toUpperCase()));

      const rowsToInsert: ImportPlayerRow[] = [];
      for (const row of validRows) {
        if (existingSet.has(row.player_id.toUpperCase())) {
          result.skipped++;
        } else {
          rowsToInsert.push(row);
        }
      }

      if (rowsToInsert.length > 0) {
        const insertSql = `
          INSERT INTO players (
            player_id, player_name, role, nationality, player_category,
            base_price, rating, key_points, notes, status, sold_to_team_id, sold_price
          ) VALUES ?
        `;

        const values = rowsToInsert.map((r) => [
          r.player_id,
          r.player_name,
          r.role,
          r.nationality,
          r.player_category,
          r.base_price,
          r.rating,
          r.key_points || 0,
          r.notes || null,
          'AVAILABLE',
          null,
          null,
        ]);

        const [insertResult] = await connection.query<ResultSetHeader>(insertSql, [values]);
        result.inserted = insertResult.affectedRows;
      }

      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Update an existing player
   */
  static async updatePlayer(
    idOrPlayerId: string,
    input: {
      player_name?: string;
      role?: string;
      nationality?: string;
      player_category?: string;
      base_price?: number;
      rating?: number | null;
      status?: 'AVAILABLE' | 'SOLD' | 'UNSOLD';
    }
  ): Promise<DbPlayer> {
    const existing = await this.getPlayerById(idOrPlayerId);
    if (!existing) {
      const err: any = new Error(`Player '${idOrPlayerId}' not found`);
      err.statusCode = 404;
      throw err;
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (input.player_name !== undefined) {
      const trimmedName = input.player_name.trim();
      if (!trimmedName) {
        const err: any = new Error('Player Name cannot be empty');
        err.statusCode = 400;
        throw err;
      }
      updates.push('player_name = ?');
      values.push(trimmedName);
    }

    if (input.role !== undefined) {
      const normRole = normalizeRole(input.role);
      if (!ALLOWED_ROLES.includes(normRole)) {
        const err: any = new Error(`Invalid role '${input.role}'. Allowed: ${ALLOWED_ROLES.join(', ')}`);
        err.statusCode = 400;
        throw err;
      }
      updates.push('role = ?');
      values.push(normRole);
    }

    if (input.nationality !== undefined) {
      const trimmedNat = input.nationality.trim();
      if (!trimmedNat) {
        const err: any = new Error('Nationality cannot be empty');
        err.statusCode = 400;
        throw err;
      }
      updates.push('nationality = ?');
      values.push(trimmedNat);
    }

    if (input.player_category !== undefined) {
      updates.push('player_category = ?');
      values.push(input.player_category.trim() || 'General');
    }

    if (input.base_price !== undefined) {
      const price = Number(input.base_price);
      if (isNaN(price) || price <= 0) {
        const err: any = new Error('Base price must be greater than 0');
        err.statusCode = 400;
        throw err;
      }
      updates.push('base_price = ?');
      values.push(price);
    }

    if (input.rating !== undefined) {
      if (input.rating === null || String(input.rating).trim() === '') {
        updates.push('rating = NULL');
      } else {
        const ratingNum = Number(input.rating);
        if (isNaN(ratingNum) || ratingNum < 0 || ratingNum > 100) {
          const err: any = new Error('Rating must be between 0 and 100');
          err.statusCode = 400;
          throw err;
        }
        updates.push('rating = ?');
        values.push(ratingNum);
      }
    }

    if (input.status !== undefined) {
      const upperStatus = input.status.toUpperCase() as 'AVAILABLE' | 'SOLD' | 'UNSOLD';
      if (!['AVAILABLE', 'SOLD', 'UNSOLD'].includes(upperStatus)) {
        const err: any = new Error(`Invalid status '${input.status}'. Allowed: AVAILABLE, SOLD, UNSOLD`);
        err.statusCode = 400;
        throw err;
      }
      updates.push('status = ?');
      values.push(upperStatus);
    }

    if (updates.length > 0) {
      values.push(existing.id);
      await pool.query(`UPDATE players SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    const updated = await this.getPlayerById(String(existing.id));
    return updated!;
  }

  /**
   * Delete a player
   */
  static async deletePlayer(idOrPlayerId: string): Promise<boolean> {
    const existing = await this.getPlayerById(idOrPlayerId);
    if (!existing) {
      const err: any = new Error(`Player '${idOrPlayerId}' not found`);
      err.statusCode = 404;
      throw err;
    }

    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM players WHERE id = ?',
      [existing.id]
    );

    return result.affectedRows > 0;
  }
}
