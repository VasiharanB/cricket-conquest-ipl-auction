import { pool } from './pool.js';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

export const players50List = [
  { id: 'P001', name: 'Virat Kohli', role: 'Batter', nationality: 'Indian', category: 'Marquee', basePrice: 2.0, rating: 98.0, keyPoints: 98, notes: 'Anchor, high strike-rate chaser' },
  { id: 'P002', name: 'Rohit Sharma', role: 'Batter', nationality: 'Indian', category: 'Marquee', basePrice: 2.0, rating: 96.5, keyPoints: 96, notes: 'Explosive opener & tactical captain' },
  { id: 'P003', name: 'Jasprit Bumrah', role: 'Bowler', nationality: 'Indian', category: 'Marquee', basePrice: 2.0, rating: 99.0, keyPoints: 99, notes: 'World premier death bowler' },
  { id: 'P004', name: 'MS Dhoni', role: 'Wicketkeeper', nationality: 'Indian', category: 'Marquee', basePrice: 2.0, rating: 95.0, keyPoints: 95, notes: 'Legendary finisher & master strategist' },
  { id: 'P005', name: 'Hardik Pandya', role: 'All-rounder', nationality: 'Indian', category: 'Marquee', basePrice: 2.0, rating: 94.0, keyPoints: 94, notes: 'Fast-bowling power hitter' },
  { id: 'P006', name: 'Ravindra Jadeja', role: 'All-rounder', nationality: 'Indian', category: 'Marquee', basePrice: 2.0, rating: 95.5, keyPoints: 95, notes: 'Elite spin, 3D gun fielder' },
  { id: 'P007', name: 'Rishabh Pant', role: 'Wicketkeeper', nationality: 'Indian', category: 'Marquee', basePrice: 2.0, rating: 94.5, keyPoints: 94, notes: 'Fearless left-handed game changer' },
  { id: 'P008', name: 'Suryakumar Yadav', role: 'Batter', nationality: 'Indian', category: 'Marquee', basePrice: 2.0, rating: 97.5, keyPoints: 97, notes: 'World #1 T20 360-degree stroke maker' },
  { id: 'P009', name: 'Shubman Gill', role: 'Batter', nationality: 'Indian', category: 'Marquee', basePrice: 2.0, rating: 93.0, keyPoints: 93, notes: 'Classy elegant top-order run machine' },
  { id: 'P010', name: 'KL Rahul', role: 'Wicketkeeper', nationality: 'Indian', category: 'Capped', basePrice: 1.5, rating: 92.0, keyPoints: 92, notes: 'Versatile top-order wicketkeeper' },
  { id: 'P011', name: 'Travis Head', role: 'Batter', nationality: 'Overseas', category: 'Marquee', basePrice: 2.0, rating: 96.0, keyPoints: 96, notes: 'Brutal powerplay enforcer' },
  { id: 'P012', name: 'Heinrich Klaasen', role: 'Wicketkeeper', nationality: 'Overseas', category: 'Marquee', basePrice: 2.0, rating: 95.0, keyPoints: 95, notes: 'Deadliest spin crusher in middle overs' },
  { id: 'P013', name: 'Pat Cummins', role: 'Bowler', nationality: 'Overseas', category: 'Marquee', basePrice: 2.0, rating: 94.0, keyPoints: 94, notes: 'Clutch fast bowler & World Cup champion' },
  { id: 'P014', name: 'Mitchell Starc', role: 'Bowler', nationality: 'Overseas', category: 'Marquee', basePrice: 2.0, rating: 95.0, keyPoints: 95, notes: 'Lethal left-arm yorker specialist' },
  { id: 'P015', name: 'Rashid Khan', role: 'Bowler', nationality: 'Overseas', category: 'Marquee', basePrice: 2.0, rating: 97.0, keyPoints: 97, notes: 'Magical wrist spinner & explosive pinch hitter' },
  { id: 'P016', name: 'Nicholas Pooran', role: 'Wicketkeeper', nationality: 'Overseas', category: 'Capped', basePrice: 1.5, rating: 93.5, keyPoints: 93, notes: 'Devastating left-handed striker' },
  { id: 'P017', name: 'Jos Buttler', role: 'Wicketkeeper', nationality: 'Overseas', category: 'Marquee', basePrice: 2.0, rating: 96.0, keyPoints: 96, notes: 'Elite opener & ramp shot master' },
  { id: 'P018', name: 'Glenn Maxwell', role: 'All-rounder', nationality: 'Overseas', category: 'Capped', basePrice: 1.5, rating: 91.5, keyPoints: 91, notes: 'The Big Show, match winner on his day' },
  { id: 'P019', name: 'Andre Russell', role: 'All-rounder', nationality: 'Overseas', category: 'Capped', basePrice: 1.5, rating: 94.0, keyPoints: 94, notes: 'Unmatched raw muscle & death overs bowling' },
  { id: 'P020', name: 'Sunil Narine', role: 'All-rounder', nationality: 'Overseas', category: 'Capped', basePrice: 1.5, rating: 93.0, keyPoints: 93, notes: 'Pinch-hitting mystery spinner' },
  { id: 'P021', name: 'Yashasvi Jaiswal', role: 'Batter', nationality: 'Indian', category: 'Capped', basePrice: 1.5, rating: 94.0, keyPoints: 94, notes: 'Dynamic young attacking opener' },
  { id: 'P022', name: 'Rinku Singh', role: 'Batter', nationality: 'Indian', category: 'Capped', basePrice: 1.0, rating: 91.0, keyPoints: 91, notes: 'Clutch ice-cold finisher' },
  { id: 'P023', name: 'Ruturaj Gaikwad', role: 'Batter', nationality: 'Indian', category: 'Capped', basePrice: 1.5, rating: 92.5, keyPoints: 92, notes: 'Composed stroke-maker & opener' },
  { id: 'P024', name: 'Shreyas Iyer', role: 'Batter', nationality: 'Indian', category: 'Capped', basePrice: 1.5, rating: 92.0, keyPoints: 92, notes: 'Dominant spin player & IPL title captain' },
  { id: 'P025', name: 'Sanju Samson', role: 'Wicketkeeper', nationality: 'Indian', category: 'Capped', basePrice: 1.5, rating: 91.5, keyPoints: 91, notes: 'Clean six-hitter & captain' },
  { id: 'P026', name: 'Mohammed Shami', role: 'Bowler', nationality: 'Indian', category: 'Capped', basePrice: 1.5, rating: 93.0, keyPoints: 93, notes: 'Upright seam presentation, wicket-taker' },
  { id: 'P027', name: 'Mohammed Siraj', role: 'Bowler', nationality: 'Indian', category: 'Capped', basePrice: 1.5, rating: 90.5, keyPoints: 90, notes: 'Relentless aggression & outswinger' },
  { id: 'P028', name: 'Arshdeep Singh', role: 'Bowler', nationality: 'Indian', category: 'Capped', basePrice: 1.5, rating: 91.0, keyPoints: 91, notes: 'T20 World Cup leading death bowler' },
  { id: 'P029', name: 'Kuldeep Yadav', role: 'Bowler', nationality: 'Indian', category: 'Capped', basePrice: 1.5, rating: 93.5, keyPoints: 93, notes: 'Left-arm wrist spin magician' },
  { id: 'P030', name: 'Yuzvendra Chahal', role: 'Bowler', nationality: 'Indian', category: 'Capped', basePrice: 1.5, rating: 91.5, keyPoints: 91, notes: 'All-time highest IPL wicket taker' },
  { id: 'P031', name: 'Axar Patel', role: 'All-rounder', nationality: 'Indian', category: 'Capped', basePrice: 1.5, rating: 92.5, keyPoints: 92, notes: 'Economical left-arm orthodox & power bat' },
  { id: 'P032', name: 'Trent Boult', role: 'Bowler', nationality: 'Overseas', category: 'Capped', basePrice: 1.5, rating: 92.0, keyPoints: 92, notes: 'First over swinging nightmare' },
  { id: 'P033', name: 'Kagiso Rabada', role: 'Bowler', nationality: 'Overseas', category: 'Capped', basePrice: 1.5, rating: 92.5, keyPoints: 92, notes: 'Express 145kph+ tearaway quick' },
  { id: 'P034', name: 'Matheesha Pathirana', role: 'Bowler', nationality: 'Overseas', category: 'Capped', basePrice: 1.5, rating: 93.0, keyPoints: 93, notes: 'Sling-arm 150kph yorker machine' },
  { id: 'P035', name: 'Marcus Stoinis', role: 'All-rounder', nationality: 'Overseas', category: 'Capped', basePrice: 1.5, rating: 90.0, keyPoints: 90, notes: 'Destructive middle-order hitter & medium pace' },
  { id: 'P036', name: 'Mitchell Marsh', role: 'All-rounder', nationality: 'Overseas', category: 'Capped', basePrice: 1.5, rating: 90.5, keyPoints: 90, notes: 'Brutal top-order hitting & seam bowling' },
  { id: 'P037', name: 'Sam Curran', role: 'All-rounder', nationality: 'Overseas', category: 'Capped', basePrice: 1.5, rating: 89.5, keyPoints: 89, notes: 'Left-arm cutters & lower order fight' },
  { id: 'P038', name: 'Liam Livingstone', role: 'All-rounder', nationality: 'Overseas', category: 'Capped', basePrice: 1.5, rating: 90.0, keyPoints: 90, notes: '115m monster sixes & dual spin' },
  { id: 'P039', name: 'Wanindu Hasaranga', role: 'All-rounder', nationality: 'Overseas', category: 'Capped', basePrice: 1.5, rating: 91.0, keyPoints: 91, notes: 'Sharp leg breaks, googlies & lower order' },
  { id: 'P040', name: 'Anrich Nortje', role: 'Bowler', nationality: 'Overseas', category: 'Capped', basePrice: 1.0, rating: 89.0, keyPoints: 89, notes: '150kph thunderbolts' },
  { id: 'P041', name: 'Shivam Dube', role: 'All-rounder', nationality: 'Indian', category: 'Capped', basePrice: 1.0, rating: 90.5, keyPoints: 90, notes: 'Towering straight six hitter against spin' },
  { id: 'P042', name: 'Tilak Varma', role: 'Batter', nationality: 'Indian', category: 'Capped', basePrice: 1.0, rating: 90.0, keyPoints: 90, notes: 'Young stylish left-handed match winner' },
  { id: 'P043', name: 'Ishan Kishan', role: 'Wicketkeeper', nationality: 'Indian', category: 'Capped', basePrice: 1.5, rating: 89.0, keyPoints: 89, notes: 'Pocket dynamo top order wicketkeeper' },
  { id: 'P044', name: 'Washington Sundar', role: 'All-rounder', nationality: 'Indian', category: 'Capped', basePrice: 1.0, rating: 88.0, keyPoints: 88, notes: 'Powerplay off-spinner & crisp bat' },
  { id: 'P045', name: 'Varun Chakravarthy', role: 'Bowler', nationality: 'Indian', category: 'Capped', basePrice: 1.0, rating: 90.0, keyPoints: 90, notes: 'Unreadable carrom ball wizard' },
  { id: 'P046', name: 'Harshit Rana', role: 'Bowler', nationality: 'Indian', category: 'Uncapped', basePrice: 0.5, rating: 86.0, keyPoints: 86, notes: 'Heavy ball fast bowler & clever slower balls' },
  { id: 'P047', name: 'Mayank Yadav', role: 'Bowler', nationality: 'Indian', category: 'Uncapped', basePrice: 0.5, rating: 88.0, keyPoints: 88, notes: '156.7kph sensational express speed' },
  { id: 'P048', name: 'Abhishek Sharma', role: 'All-rounder', nationality: 'Indian', category: 'Capped', basePrice: 1.0, rating: 91.0, keyPoints: 91, notes: '200+ strike rate powerplay demolition' },
  { id: 'P049', name: 'Nitish Kumar Reddy', role: 'All-rounder', nationality: 'Indian', category: 'Capped', basePrice: 0.5, rating: 87.5, keyPoints: 87, notes: 'Emerging seam bowling all-rounder' },
  { id: 'P050', name: 'Shahrukh Khan', role: 'Batter', nationality: 'Indian', category: 'Uncapped', basePrice: 0.5, rating: 85.0, keyPoints: 85, notes: 'Death overs boundary blaster' },
];

export const starterTeams = [
  { teamId: 'CC26-001', name: 'Mumbai Indians', college: 'PSVPEC', captain: 'Mohammed Shameem', email: 'shameem@psvpec.edu', phone: '9876543210', code: 'CC26-MUMB-5692' },
  { teamId: 'CC26-002', name: 'Mumbai Warriors', college: 'CIT', captain: 'Rahul Menon', email: 'rahul@cit.edu', phone: '9876543211', code: 'CC26-MUMB-5995' },
  { teamId: 'CC26-003', name: 'Chennai Kings', college: 'SKCET', captain: 'Karthik Raja', email: 'karthik@skcet.edu', phone: '9876543212', code: 'CC26-CHEN-2897' },
  { teamId: 'CC26-004', name: 'Delhi Titans', college: 'KCT', captain: 'Siddharth Iyer', email: 'siddharth@kct.edu', phone: '9876543213', code: 'CC26-DELH-4502' },
  { teamId: 'CC26-005', name: 'Royal Challengers', college: 'Anna Univ', captain: 'Vikram Seth', email: 'vikram@annauniv.edu', phone: '9876543214', code: 'CC26-ROYA-3310' },
  { teamId: 'CC26-006', name: 'Kolkata Riders', college: 'IIT Madras', captain: 'Aravind Swamy', email: 'aravind@iitm.edu', phone: '9876543215', code: 'CC26-KOLK-7721' },
];

export async function seed50PlayersAndResetAuction(): Promise<{ playersCount: number; teamsCount: number; sessionId: number }> {
  console.log('[SEED-50] Resetting and seeding 50 tournament players & teams...');
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    // 1. Clear existing live session artifacts
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('TRUNCATE TABLE bids');
    await connection.query('TRUNCATE TABLE player_purchases');
    await connection.query('TRUNCATE TABLE auction_queue');
    await connection.query('TRUNCATE TABLE auction_events');
    await connection.query('TRUNCATE TABLE participant_activities');
    await connection.query('TRUNCATE TABLE players');
    await connection.query('TRUNCATE TABLE auction_sessions');

    // 2. Insert all 50 Players
    for (const p of players50List) {
      await connection.query(
        `INSERT INTO players 
         (player_id, player_name, role, nationality, player_category, base_price, rating, key_points, notes, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'AVAILABLE')`,
        [p.id, p.name, p.role, p.nationality, p.category, p.basePrice, p.rating, p.keyPoints, p.notes]
      );
    }
    console.log(`[SEED-50] Inserted ${players50List.length} players into MySQL.`);

    // 3. Upsert starter teams with exact access codes and ₹100 Cr starting purse
    for (const t of starterTeams) {
      const [existing] = await connection.query<RowDataPacket[]>('SELECT id FROM teams WHERE team_id = ?', [t.teamId]);
      if (existing.length === 0) {
        await connection.query(
          `INSERT INTO teams 
           (team_id, team_name, college_name, captain_name, captain_email, captain_phone, access_code, registration_status, check_in_status, starting_purse, remaining_purse, players_bought) 
           VALUES (?, ?, ?, ?, ?, ?, ?, 'CONFIRMED', 'CHECKED_IN', 100.00, 100.00, 0)`,
          [t.teamId, t.name, t.college, t.captain, t.email, t.phone, t.code]
        );
      } else {
        await connection.query(
          `UPDATE teams 
           SET team_name = ?, college_name = ?, captain_name = ?, access_code = ?, registration_status = 'CONFIRMED', check_in_status = 'CHECKED_IN', starting_purse = 100.00, remaining_purse = 100.00, players_bought = 0, is_online = FALSE, support_requested = FALSE 
           WHERE team_id = ?`,
          [t.name, t.college, t.captain, t.code, t.teamId]
        );
      }
    }
    console.log(`[SEED-50] Ensured ${starterTeams.length} confirmed teams with ₹100 Cr purse.`);

    // 4. Create authoritative active auction session
    const [sessionResult] = await connection.query<ResultSetHeader>(
      `INSERT INTO auction_sessions (session_name, status, is_results_published) 
       VALUES ('ZenTriX 2026 Mega IPL Auction - 50 Players', 'ACTIVE', FALSE)`
    );
    const newSessionId = sessionResult.insertId;

    // 5. Populate auction queue with all 50 players in lot order
    const [dbPlayers] = await connection.query<RowDataPacket[]>('SELECT id, player_id FROM players ORDER BY id ASC');
    let lotOrder = 1;
    for (const dbP of dbPlayers) {
      await connection.query(
        `INSERT INTO auction_queue (session_id, player_id, queue_order, status) 
         VALUES (?, ?, ?, 'QUEUED')`,
        [newSessionId, dbP.id, lotOrder++]
      );
    }
    console.log(`[SEED-50] Queued all ${dbPlayers.length} players for Auction Session #${newSessionId}.`);

    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    await connection.commit();

    return {
      playersCount: players50List.length,
      teamsCount: starterTeams.length,
      sessionId: newSessionId,
    };
  } catch (error) {
    await connection.rollback();
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    throw error;
  } finally {
    connection.release();
  }
}
