import bcrypt from 'bcryptjs';
import { pool } from './pool.js';
import { RowDataPacket } from 'mysql2';

export async function seedOrganizers(): Promise<void> {
  const defaultUsers = [
    {
      username: 'admin',
      email: 'admin@zentrix26.com',
      password: 'Admin@ZenTriX26',
      role: 'Admin',
    },
    {
      username: 'auctioneer',
      email: 'auctioneer@zentrix26.com',
      password: 'Auction@ZenTriX26',
      role: 'Auctioneer',
    },
    {
      username: 'volunteer',
      email: 'volunteer@zentrix26.com',
      password: 'Volunteer@ZenTriX26',
      role: 'Volunteer',
    },
  ];

  for (const user of defaultUsers) {
    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM organizers WHERE username = ? OR email = ? LIMIT 1',
      [user.username, user.email]
    );

    if (existing.length === 0) {
      const passwordHash = await bcrypt.hash(user.password, 10);
      await pool.query(
        'INSERT INTO organizers (username, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, true)',
        [user.username, user.email, passwordHash, user.role]
      );
      console.log(`[SEED] Created default organizer user: ${user.username} (${user.role})`);
    }
  }
}
