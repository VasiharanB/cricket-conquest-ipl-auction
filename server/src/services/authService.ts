import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { RowDataPacket } from 'mysql2';
import { pool } from '../db/pool.js';
import type { AuthUser } from '../middleware/auth.js';

export interface LoginResult {
  token: string;
  user: AuthUser;
}

export class AuthService {
  static async login(identifier: string, password: string): Promise<LoginResult> {
    const trimmed = (identifier || '').trim();
    if (!trimmed || !password) {
      const err: any = new Error('Username/email and password are required');
      err.statusCode = 400;
      throw err;
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, username, email, password_hash, role, is_active FROM organizers WHERE username = ? OR email = ? LIMIT 1',
      [trimmed, trimmed]
    );

    if (rows.length === 0) {
      const err: any = new Error('Invalid credentials');
      err.statusCode = 401;
      throw err;
    }

    const organizer = rows[0];

    if (!organizer.is_active) {
      const err: any = new Error('This account has been deactivated. Please contact an Administrator.');
      err.statusCode = 403;
      throw err;
    }

    const isMatch = await bcrypt.compare(password, organizer.password_hash);
    if (!isMatch) {
      const err: any = new Error('Invalid credentials');
      err.statusCode = 401;
      throw err;
    }

    // Update last login timestamp
    await pool.query('UPDATE organizers SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [organizer.id]);

    const rawRole = String(organizer.role || 'Volunteer');
    const normalizedRole = (rawRole.charAt(0).toUpperCase() + rawRole.slice(1).toLowerCase()) as AuthUser['role'];

    const user: AuthUser = {
      id: organizer.id,
      username: organizer.username,
      email: organizer.email,
      role: normalizedRole,
    };

    const secret = process.env.JWT_SECRET || 'zentrix26_cricket_conquest_super_secure_jwt_secret_key_2026';
    const expiresIn = process.env.JWT_EXPIRES_IN || '30d';

    const token = jwt.sign(user, secret, { expiresIn: expiresIn as any });

    return { token, user };
  }

  static async getMe(userId: number): Promise<AuthUser | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, username, email, role, is_active FROM organizers WHERE id = ? LIMIT 1',
      [userId]
    );

    if (rows.length === 0 || !rows[0].is_active) return null;

    return {
      id: rows[0].id,
      username: rows[0].username,
      email: rows[0].email,
      role: rows[0].role,
    };
  }
}
