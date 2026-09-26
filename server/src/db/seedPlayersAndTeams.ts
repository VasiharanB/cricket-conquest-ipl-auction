import { RowDataPacket } from 'mysql2';
import { pool } from './pool.js';

export async function seedPlayersAndTeams(): Promise<void> {
  // 1. Seed Players if empty
  const [playerCount] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) AS count FROM players');
  if (Number(playerCount[0]?.count || 0) === 0) {
    const seedPlayers = [
      { id: 'P001', name: 'Virat Kohli', role: 'Batsman', nationality: 'Indian', category: 'Marquee', basePrice: 2.0, rating: 9.8 },
      { id: 'P002', name: 'Jasprit Bumrah', role: 'Bowler', nationality: 'Indian', category: 'Marquee', basePrice: 2.0, rating: 9.7 },
      { id: 'P003', name: 'MS Dhoni', role: 'Wicketkeeper', nationality: 'Indian', category: 'Marquee', basePrice: 2.0, rating: 9.5 },
      { id: 'P004', name: 'Rishabh Pant', role: 'Wicketkeeper', nationality: 'Indian', category: 'Marquee', basePrice: 2.0, rating: 9.2 },
      { id: 'P005', name: 'Rohit Sharma', role: 'Batsman', nationality: 'Indian', category: 'Marquee', basePrice: 2.0, rating: 9.6 },
      { id: 'P006', name: 'Hardik Pandya', role: 'All-rounder', nationality: 'Indian', category: 'Marquee', basePrice: 2.0, rating: 9.3 },
      { id: 'P007', name: 'Ravindra Jadeja', role: 'All-rounder', nationality: 'Indian', category: 'Marquee', basePrice: 2.0, rating: 9.4 },
      { id: 'P008', name: 'David Warner', role: 'Batsman', nationality: 'Overseas', category: 'Platinum', basePrice: 1.5, rating: 9.1 },
      { id: 'P009', name: 'KL Rahul', role: 'Wicketkeeper', nationality: 'Indian', category: 'Platinum', basePrice: 1.5, rating: 9.0 },
      { id: 'P010', name: 'Ruturaj Gaikwad', role: 'Batsman', nationality: 'Indian', category: 'Gold', basePrice: 1.0, rating: 8.8 },
      { id: 'P011', name: 'Shubman Gill', role: 'Batsman', nationality: 'Indian', category: 'Gold', basePrice: 1.0, rating: 9.0 },
      { id: 'P012', name: 'Mitchell Starc', role: 'Bowler', nationality: 'Overseas', category: 'Platinum', basePrice: 1.5, rating: 9.2 },
      { id: 'P013', name: 'Rashid Khan', role: 'Bowler', nationality: 'Overseas', category: 'Platinum', basePrice: 1.5, rating: 9.5 },
      { id: 'P014', name: 'Mohammed Shami', role: 'Bowler', nationality: 'Indian', category: 'Gold', basePrice: 1.0, rating: 8.9 },
      { id: 'P015', name: 'Trent Boult', role: 'Bowler', nationality: 'Overseas', category: 'Gold', basePrice: 1.0, rating: 8.8 },
      { id: 'P016', name: 'Ben Stokes', role: 'All-rounder', nationality: 'Overseas', category: 'Platinum', basePrice: 1.5, rating: 9.2 },
      { id: 'P017', name: 'Glenn Maxwell', role: 'All-rounder', nationality: 'Overseas', category: 'Gold', basePrice: 1.0, rating: 8.7 },
      { id: 'P018', name: 'Suryakumar Yadav', role: 'Batsman', nationality: 'Indian', category: 'Marquee', basePrice: 2.0, rating: 9.5 },
      { id: 'P019', name: 'Yuzvendra Chahal', role: 'Bowler', nationality: 'Indian', category: 'Silver', basePrice: 0.5, rating: 8.5 },
      { id: 'P020', name: 'Kuldeep Yadav', role: 'Bowler', nationality: 'Indian', category: 'Silver', basePrice: 0.5, rating: 8.6 },
    ];

    for (const p of seedPlayers) {
      await pool.query(
        `INSERT INTO players 
         (player_id, player_name, role, nationality, player_category, base_price, rating, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, 'AVAILABLE')`,
        [p.id, p.name, p.role, p.nationality, p.category, p.basePrice, p.rating]
      );
    }
    console.log(`[SEED] Inserted ${seedPlayers.length} starter players into database.`);
  }

  // 2. Seed Teams if fewer than 4 teams
  const [teamCount] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) AS count FROM teams');
  if (Number(teamCount[0]?.count || 0) < 4) {
    const starterTeams = [
      { id: 'CC26-001', name: 'Chennai Super Kings', college: 'IPL Franchise - Chennai', captain: 'N. Srinivasan', email: 'srinivasan@csk.com', phone: '9876543001', code: 'CC26-CSK-2026' },
      { id: 'CC26-002', name: 'Mumbai Indians', college: 'IPL Franchise - Mumbai', captain: 'Mukesh Ambani', email: 'ambani@mi.com', phone: '9876543002', code: 'CC26-MI-2026' },
      { id: 'CC26-003', name: 'Royal Challengers Bengaluru', college: 'IPL Franchise - Bengaluru', captain: 'Aryaman Birla', email: 'birla@rcb.com', phone: '9876543003', code: 'CC26-RCB-2026' },
      { id: 'CC26-004', name: 'Kolkata Knight Riders', college: 'IPL Franchise - Kolkata', captain: 'Shah Rukh Khan', email: 'srk@kkr.com', phone: '9876543004', code: 'CC26-KKR-2026' },
      { id: 'CC26-005', name: 'Sunrisers Hyderabad', college: 'IPL Franchise - Hyderabad', captain: 'Kalanithi Maran', email: 'maran@srh.com', phone: '9876543005', code: 'CC26-SRH-2026' },
      { id: 'CC26-006', name: 'Rajasthan Royals', college: 'IPL Franchise - Rajasthan', captain: 'Lakshmi Mittal', email: 'mittal@rr.com', phone: '9876543006', code: 'CC26-RR-2026' },
      { id: 'CC26-007', name: 'Delhi Capitals', college: 'IPL Franchise - Delhi', captain: 'Parth Jindal', email: 'jindal@dc.com', phone: '9876543007', code: 'CC26-DC-2026' },
      { id: 'CC26-008', name: 'Punjab Kings', college: 'IPL Franchise - Punjab', captain: 'Preity Zinta', email: 'preity@pbks.com', phone: '9876543008', code: 'CC26-PBKS-2026' },
      { id: 'CC26-009', name: 'Gujarat Titans', college: 'IPL Franchise - Gujarat', captain: 'Torrent Group', email: 'torrent@gt.com', phone: '9876543009', code: 'CC26-GT-2026' },
      { id: 'CC26-010', name: 'Lucknow Super Giants', college: 'IPL Franchise - Lucknow', captain: 'Sanjiv Goenka', email: 'goenka@lsg.com', phone: '9876543010', code: 'CC26-LSG-2026' },
    ];

    for (const t of starterTeams) {
      const [existing] = await pool.query<RowDataPacket[]>('SELECT id FROM teams WHERE team_id = ?', [t.id]);
      if (existing.length === 0) {
        const [insertRes]: any = await pool.query(
          `INSERT INTO teams 
           (team_id, team_name, college_name, captain_name, captain_email, captain_phone, access_code, registration_status, check_in_status, starting_purse, remaining_purse, players_bought) 
           VALUES (?, ?, ?, ?, ?, ?, ?, 'CONFIRMED', 'CHECKED_IN', 50.00, 50.00, 0)`,
          [t.id, t.name, t.college, t.captain, t.email, t.phone, t.code]
        );
        const teamPk = insertRes.insertId;
        await pool.query(
          `INSERT INTO team_members 
           (team_id, member_number, full_name, email, phone, is_captain) 
           VALUES (?, 1, ?, ?, ?, TRUE)`,
          [teamPk, t.captain, t.email, t.phone]
        );
      }
    }
    console.log('[SEED] Ensured 10 official IPL teams exist in database.');
  }
}
