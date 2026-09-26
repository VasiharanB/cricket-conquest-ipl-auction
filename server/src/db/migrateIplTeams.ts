import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from './pool.js';

export const iplTeamsData = [
  {
    id: 'CC26-001',
    name: 'Chennai Super Kings',
    shortName: 'CSK',
    owner: 'N. Srinivasan',
    email: 'srinivasan@csk.com',
    phone: '9876543001',
    code: 'CC26-CSK-2026',
    college: 'IPL Franchise - Chennai',
    color: '#FDB913',
    accentColor: '#0081E9'
  },
  {
    id: 'CC26-002',
    name: 'Mumbai Indians',
    shortName: 'MI',
    owner: 'Mukesh Ambani',
    email: 'ambani@mi.com',
    phone: '9876543002',
    code: 'CC26-MI-2026',
    college: 'IPL Franchise - Mumbai',
    color: '#004BA0',
    accentColor: '#D1AB3E'
  },
  {
    id: 'CC26-003',
    name: 'Royal Challengers Bengaluru',
    shortName: 'RCB',
    owner: 'Aryaman Birla',
    email: 'birla@rcb.com',
    phone: '9876543003',
    code: 'CC26-RCB-2026',
    college: 'IPL Franchise - Bengaluru',
    color: '#EC1C24',
    accentColor: '#000000'
  },
  {
    id: 'CC26-004',
    name: 'Kolkata Knight Riders',
    shortName: 'KKR',
    owner: 'Shah Rukh Khan',
    email: 'srk@kkr.com',
    phone: '9876543004',
    code: 'CC26-KKR-2026',
    college: 'IPL Franchise - Kolkata',
    color: '#3A225D',
    accentColor: '#D4AF37'
  },
  {
    id: 'CC26-005',
    name: 'Sunrisers Hyderabad',
    shortName: 'SRH',
    owner: 'Kalanithi Maran',
    email: 'maran@srh.com',
    phone: '9876543005',
    code: 'CC26-SRH-2026',
    college: 'IPL Franchise - Hyderabad',
    color: '#F26522',
    accentColor: '#000000'
  },
  {
    id: 'CC26-006',
    name: 'Rajasthan Royals',
    shortName: 'RR',
    owner: 'Lakshmi Mittal',
    email: 'mittal@rr.com',
    phone: '9876543006',
    code: 'CC26-RR-2026',
    college: 'IPL Franchise - Rajasthan',
    color: '#EA1B86',
    accentColor: '#254AA5'
  },
  {
    id: 'CC26-007',
    name: 'Delhi Capitals',
    shortName: 'DC',
    owner: 'Parth Jindal',
    email: 'jindal@dc.com',
    phone: '9876543007',
    code: 'CC26-DC-2026',
    college: 'IPL Franchise - Delhi',
    color: '#17479E',
    accentColor: '#D71920'
  },
  {
    id: 'CC26-008',
    name: 'Punjab Kings',
    shortName: 'PBKS',
    owner: 'Preity Zinta',
    email: 'preity@pbks.com',
    phone: '9876543008',
    code: 'CC26-PBKS-2026',
    college: 'IPL Franchise - Punjab',
    color: '#DD1F2D',
    accentColor: '#DDA835'
  },
  {
    id: 'CC26-009',
    name: 'Gujarat Titans',
    shortName: 'GT',
    owner: 'Torrent Group',
    email: 'torrent@gt.com',
    phone: '9876543009',
    code: 'CC26-GT-2026',
    college: 'IPL Franchise - Gujarat',
    color: '#1B2133',
    accentColor: '#C0A062'
  },
  {
    id: 'CC26-010',
    name: 'Lucknow Super Giants',
    shortName: 'LSG',
    owner: 'Sanjiv Goenka',
    email: 'goenka@lsg.com',
    phone: '9876543010',
    code: 'CC26-LSG-2026',
    college: 'IPL Franchise - Lucknow',
    color: '#0057E7',
    accentColor: '#F15C22'
  }
];

async function migrate() {
  console.log('[MIGRATE] Starting IPL teams migration...');
  const conn = await pool.getConnection();
  await conn.beginTransaction();

  try {
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');

    // 1. Reset auction artifact tables
    console.log('[MIGRATE] Clearing bids, purchases, queue, events...');
    await conn.query('TRUNCATE TABLE bids');
    await conn.query('TRUNCATE TABLE player_purchases');
    await conn.query('TRUNCATE TABLE auction_queue');
    await conn.query('TRUNCATE TABLE auction_events');
    await conn.query('TRUNCATE TABLE participant_activities');
    await conn.query('TRUNCATE TABLE auction_sessions');

    // 2. Clear old team members and teams
    console.log('[MIGRATE] Removing all old teams and team members...');
    await conn.query('TRUNCATE TABLE team_members');
    await conn.query('TRUNCATE TABLE teams');

    // 3. Reset player status
    console.log('[MIGRATE] Resetting player statuses to AVAILABLE...');
    await conn.query(
      `UPDATE players 
       SET status = 'AVAILABLE', sold_to_team_id = NULL, sold_price = NULL`
    );

    // 4. Insert all 10 Real IPL Teams
    console.log('[MIGRATE] Inserting 10 official IPL teams with single participant owner...');
    for (const t of iplTeamsData) {
      const [res] = await conn.query<ResultSetHeader>(
        `INSERT INTO teams 
         (team_id, team_name, college_name, captain_name, captain_email, captain_phone, access_code, registration_status, check_in_status, starting_purse, remaining_purse, players_bought) 
         VALUES (?, ?, ?, ?, ?, ?, ?, 'CONFIRMED', 'CHECKED_IN', 50.00, 50.00, 0)`,
        [t.id, t.name, t.college, t.owner, t.email, t.phone, t.code]
      );
      const insertedTeamPk = res.insertId;

      // Insert 1 participant owner into team_members
      await conn.query(
        `INSERT INTO team_members 
         (team_id, member_number, full_name, email, phone, is_captain) 
         VALUES (?, 1, ?, ?, ?, TRUE)`,
        [insertedTeamPk, t.owner, t.email, t.phone]
      );
    }

    // 5. Create authoritative fresh auction session
    console.log('[MIGRATE] Creating fresh authoritative auction session...');
    const [sessRes] = await conn.query<ResultSetHeader>(
      `INSERT INTO auction_sessions (session_name, status, is_results_published, timer_seconds, round_number) 
       VALUES ('ZenTriX 2026 Mega IPL Auction - Official Tournament', 'ACTIVE', FALSE, 15, 1)`
    );
    const newSessionId = sessRes.insertId;

    // 6. Populate auction queue with all players
    const [allPlayers] = await conn.query<RowDataPacket[]>('SELECT id FROM players ORDER BY id ASC');
    console.log(`[MIGRATE] Queuing ${allPlayers.length} players for session #${newSessionId}...`);
    let order = 1;
    for (const p of allPlayers) {
      await conn.query(
        `INSERT INTO auction_queue (session_id, player_id, queue_order, status, round_number) 
         VALUES (?, ?, ?, 'QUEUED', 1)`,
        [newSessionId, p.id, order++]
      );
    }

    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    await conn.commit();
    console.log('[MIGRATE] SUCCESS! 10 IPL teams migrated with owners, 50 Cr purse, and fresh auction session.');
  } catch (err) {
    await conn.rollback();
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    console.error('[MIGRATE ERROR] Migration failed:', err);
    throw err;
  } finally {
    conn.release();
    await pool.end();
  }
}

migrate().then(() => {
  console.log('[MIGRATE] Done.');
  process.exit(0);
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
