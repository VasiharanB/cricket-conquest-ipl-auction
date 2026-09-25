import bcrypt from 'bcryptjs';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../db/pool.js';

type OrganizerRole = 'Admin' | 'Auctioneer' | 'Volunteer';

export interface OrganizerUser {
  id: number;
  username: string;
  email: string;
  role: OrganizerRole;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
}

const VALID_ROLES: OrganizerRole[] = ['Admin', 'Auctioneer', 'Volunteer'];

function validateRole(role: string): OrganizerRole {
  if (!VALID_ROLES.includes(role as OrganizerRole)) {
    const err: any = new Error(`Invalid role '${role}'. Must be one of: ${VALID_ROLES.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }
  return role as OrganizerRole;
}

export class UserManagementService {
  /** Return all organizer accounts (password hash is never exposed) */
  static async listUsers(): Promise<OrganizerUser[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, username, email, role, is_active, last_login, created_at FROM organizers ORDER BY created_at ASC'
    );
    return rows as OrganizerUser[];
  }

  /** Create a new organizer account */
  static async createUser(input: {
    username: string;
    email: string;
    password: string;
    role: string;
  }): Promise<OrganizerUser> {
    const { username, email, password } = input;
    const role = validateRole(input.role);

    if (!username?.trim() || !email?.trim() || !password) {
      const err: any = new Error('username, email, and password are all required.');
      err.statusCode = 400;
      throw err;
    }

    if (password.length < 8) {
      const err: any = new Error('Password must be at least 8 characters long.');
      err.statusCode = 400;
      throw err;
    }

    // Uniqueness check
    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM organizers WHERE username = ? OR email = ? LIMIT 1',
      [username.trim(), email.trim()]
    );
    if (existing.length > 0) {
      const err: any = new Error('An organizer with that username or email already exists.');
      err.statusCode = 409;
      throw err;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO organizers (username, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, TRUE)',
      [username.trim(), email.trim(), passwordHash, role]
    );

    const [newUser] = await pool.query<RowDataPacket[]>(
      'SELECT id, username, email, role, is_active, last_login, created_at FROM organizers WHERE id = ?',
      [result.insertId]
    );

    return newUser[0] as OrganizerUser;
  }

  /** Update the role of an existing organizer */
  static async updateRole(userId: number, newRole: string): Promise<OrganizerUser> {
    const role = validateRole(newRole);

    const [rows] = await pool.query<RowDataPacket[]>('SELECT id FROM organizers WHERE id = ? LIMIT 1', [userId]);
    if (rows.length === 0) {
      const err: any = new Error('Organizer not found.');
      err.statusCode = 404;
      throw err;
    }

    await pool.query('UPDATE organizers SET role = ? WHERE id = ?', [role, userId]);

    const [updated] = await pool.query<RowDataPacket[]>(
      'SELECT id, username, email, role, is_active, last_login, created_at FROM organizers WHERE id = ?',
      [userId]
    );
    return updated[0] as OrganizerUser;
  }

  /** Toggle the active/inactive status of an organizer account */
  static async toggleStatus(userId: number): Promise<OrganizerUser> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, is_active FROM organizers WHERE id = ? LIMIT 1',
      [userId]
    );
    if (rows.length === 0) {
      const err: any = new Error('Organizer not found.');
      err.statusCode = 404;
      throw err;
    }

    const newStatus = !rows[0].is_active;
    await pool.query('UPDATE organizers SET is_active = ? WHERE id = ?', [newStatus, userId]);

    const [updated] = await pool.query<RowDataPacket[]>(
      'SELECT id, username, email, role, is_active, last_login, created_at FROM organizers WHERE id = ?',
      [userId]
    );
    return updated[0] as OrganizerUser;
  }

  /** Admin resets password for any organizer */
  static async resetPassword(userId: number, newPassword: string): Promise<void> {
    if (!newPassword || newPassword.length < 8) {
      const err: any = new Error('New password must be at least 8 characters long.');
      err.statusCode = 400;
      throw err;
    }

    const [rows] = await pool.query<RowDataPacket[]>('SELECT id FROM organizers WHERE id = ? LIMIT 1', [userId]);
    if (rows.length === 0) {
      const err: any = new Error('Organizer not found.');
      err.statusCode = 404;
      throw err;
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE organizers SET password_hash = ? WHERE id = ?', [passwordHash, userId]);
  }

  /** Permanently delete an organizer account */
  static async deleteUser(userId: number): Promise<void> {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT id FROM organizers WHERE id = ? LIMIT 1', [userId]);
    if (rows.length === 0) {
      const err: any = new Error('Organizer not found.');
      err.statusCode = 404;
      throw err;
    }
    await pool.query('DELETE FROM organizers WHERE id = ?', [userId]);
  }
}
