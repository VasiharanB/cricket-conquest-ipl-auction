import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runCloudMigration() {
  console.log('====================================================');
  console.log('🚀 ZenTriX\'26 Cloud MySQL Initializer & Seeder');
  console.log('====================================================');

  const connectionUri = process.env.DATABASE_URL || process.env.MYSQL_URL;
  const config = connectionUri
    ? {
        uri: connectionUri,
        multipleStatements: true,
        ssl: process.env.DB_SSL === 'false' ? undefined : { rejectUnauthorized: false },
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'cricket_conquest',
        multipleStatements: true,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
      };

  console.log(`Connecting to: ${connectionUri ? 'URI string' : `${config.host}:${config.port}/${config.database}`}...`);
  const connection = await mysql.createConnection(config as any);
  console.log('✅ Connected to Cloud MySQL successfully!');

  // 1. Read and execute FULL_SETUP.sql
  const sqlPath = path.resolve(__dirname, '../../database/FULL_SETUP.sql');
  if (!fs.existsSync(sqlPath)) {
    throw new Error(`FULL_SETUP.sql not found at ${sqlPath}`);
  }

  console.log('📄 Executing database/FULL_SETUP.sql...');
  let sqlContent = fs.readFileSync(sqlPath, 'utf8');

  // Strip database creation if connected to an existing managed cloud DB
  if (config.database && config.database !== 'cricket_conquest') {
    sqlContent = sqlContent
      .replace(/CREATE DATABASE IF NOT EXISTS cricket_conquest[^;]*;/gi, '')
      .replace(/USE cricket_conquest;/gi, '');
  }

  await connection.query(sqlContent);
  console.log('✅ All 11 tables & constraints created successfully in Cloud MySQL!');

  // 2. Seed Default Organizers
  console.log('🔐 Seeding default organizer accounts (Admin, Auctioneer, Volunteer)...');
  const defaultUsers = [
    { username: 'admin', email: 'admin@zentrix26.com', password: 'Admin@ZenTriX26', role: 'Admin' },
    { username: 'auctioneer', email: 'auctioneer@zentrix26.com', password: 'Auction@ZenTriX26', role: 'Auctioneer' },
    { username: 'volunteer', email: 'volunteer@zentrix26.com', password: 'Volunteer@ZenTriX26', role: 'Volunteer' },
  ];

  for (const user of defaultUsers) {
    const [existing]: any = await connection.query(
      'SELECT id FROM organizers WHERE username = ? OR email = ? LIMIT 1',
      [user.username, user.email]
    );

    if (existing.length === 0) {
      const passwordHash = await bcrypt.hash(user.password, 10);
      await connection.query(
        'INSERT INTO organizers (username, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, true)',
        [user.username, user.email, passwordHash, user.role]
      );
      console.log(`   + Created: ${user.username} (${user.role})`);
    } else {
      console.log(`   ✓ Already exists: ${user.username} (${user.role})`);
    }
  }

  // 3. Import 50 Players and 6 Teams using seed50
  console.log('🏏 Seeding 50 Players & 6 Franchise Teams with ₹100 Cr starting purse...');
  const { players50List, starterTeams } = await import('./src/db/seed50Players.js');

  await connection.query('SET FOREIGN_KEY_CHECKS = 0');
  await connection.query('TRUNCATE TABLE bids');
  await connection.query('TRUNCATE TABLE player_purchases');
  await connection.query('TRUNCATE TABLE auction_queue');
  await connection.query('TRUNCATE TABLE auction_events');
  await connection.query('TRUNCATE TABLE participant_activities');
  await connection.query('TRUNCATE TABLE players');
  await connection.query('TRUNCATE TABLE auction_sessions');

  for (const p of players50List) {
    await connection.query(
      `INSERT INTO players 
       (player_id, player_name, role, nationality, player_category, base_price, rating, key_points, notes, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'AVAILABLE')`,
      [p.id, p.name, p.role, p.nationality, p.category, p.basePrice, p.rating, p.keyPoints, p.notes]
    );
  }

  for (const t of starterTeams) {
    const [existing]: any = await connection.query('SELECT id FROM teams WHERE team_id = ?', [t.teamId]);
    if (existing.length === 0) {
      await connection.query(
        `INSERT INTO teams 
         (team_id, team_name, college_name, captain_name, captain_email, captain_phone, access_code, registration_status, check_in_status, starting_purse, remaining_purse, players_bought) 
         VALUES (?, ?, ?, ?, ?, ?, ?, 'CONFIRMED', 'CHECKED_IN', 100.00, 100.00, 0)`,
        [t.teamId, t.name, t.college, t.captain, t.email, t.phone, t.code]
      );
    }
  }

  // Create auction session
  const [sessionRes]: any = await connection.query(
    `INSERT INTO auction_sessions (session_name, status, is_results_published) 
     VALUES ('ZenTriX 2026 Mega IPL Auction - Cloud Production', 'ACTIVE', FALSE)`
  );
  const sessionId = sessionRes.insertId;

  const [dbPlayers]: any = await connection.query('SELECT id FROM players ORDER BY id ASC');
  let order = 1;
  for (const player of dbPlayers) {
    await connection.query(
      `INSERT INTO auction_queue (session_id, player_id, queue_order, status) 
       VALUES (?, ?, ?, 'QUEUED')`,
      [sessionId, player.id, order++]
    );
  }

  // Set first player on stage
  await connection.query(
    `UPDATE auction_sessions 
     SET current_player_id = ?, stage_state = 'PLAYER_READY', current_bid = 2.00, timer_seconds = 15, round_number = 1 
     WHERE id = ?`,
    [dbPlayers[0].id, sessionId]
  );

  await connection.query('SET FOREIGN_KEY_CHECKS = 1');

  console.log(`✅ Seeded ${players50List.length} players into Cloud MySQL!`);
  console.log(`✅ Seeded ${starterTeams.length} confirmed teams with ₹100 Cr purse!`);
  console.log(`✅ Session #${sessionId} active on stage with player #${dbPlayers[0].id}!`);
  console.log('====================================================');
  console.log('🎉 Cloud MySQL is 100% INITIALIZED & PRODUCTION READY!');
  console.log('====================================================');

  await connection.end();
  process.exit(0);
}

runCloudMigration().catch((err) => {
  console.error('❌ Cloud DB migration failed:', err);
  process.exit(1);
});
