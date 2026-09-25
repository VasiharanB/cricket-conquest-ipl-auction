import type { Player } from '../types';

export const players: Player[] = [
  // === BATSMEN ===
  { id: 'P001', name: 'Virat Kohli', role: 'Batsman', specialization: 'Right-hand Bat', nationality: 'Indian', basePrice: 10, status: 'Sold', soldTo: 'CC26-001', soldFor: 15 },
  { id: 'P005', name: 'Rohit Sharma', role: 'Batsman', specialization: 'Right-hand Bat', nationality: 'Indian', basePrice: 10, status: 'Sold', soldTo: 'CC26-002', soldFor: 14 },
  { id: 'P009', name: 'David Warner', role: 'Batsman', specialization: 'Left-hand Bat', nationality: 'Overseas', basePrice: 9, status: 'Sold', soldTo: 'CC26-004', soldFor: 13 },
  { id: 'P011', name: 'Ruturaj Gaikwad', role: 'Batsman', specialization: 'Right-hand Bat', nationality: 'Indian', basePrice: 8, status: 'Sold', soldTo: 'CC26-003', soldFor: 11 },
  { id: 'P022', name: 'Shubman Gill', role: 'Batsman', specialization: 'Right-hand Bat', nationality: 'Indian', basePrice: 8, status: 'Sold', soldTo: 'CC26-002', soldFor: 9 },
  { id: 'P023', name: 'Prithvi Shaw', role: 'Batsman', specialization: 'Right-hand Bat', nationality: 'Indian', basePrice: 4, status: 'Sold', soldTo: 'CC26-004', soldFor: 5 },
  { id: 'P025', name: 'Shreyas Iyer', role: 'Batsman', specialization: 'Right-hand Bat', nationality: 'Indian', basePrice: 7, status: 'Sold', soldTo: 'CC26-001', soldFor: 7 },
  { id: 'P026', name: 'Devon Conway', role: 'Batsman', specialization: 'Left-hand Bat', nationality: 'Overseas', basePrice: 7, status: 'Sold', soldTo: 'CC26-003', soldFor: 15 },
  { id: 'P036', name: 'Faf du Plessis', role: 'Batsman', specialization: 'Right-hand Bat', nationality: 'Overseas', basePrice: 7, status: 'Available' },
  { id: 'P037', name: 'Kane Williamson', role: 'Batsman', specialization: 'Right-hand Bat', nationality: 'Overseas', basePrice: 8, status: 'Available' },
  { id: 'P038', name: 'Sanju Samson', role: 'Batsman', specialization: 'Right-hand Bat', nationality: 'Indian', basePrice: 8, status: 'Available' },
  { id: 'P039', name: 'Devdutt Padikkal', role: 'Batsman', specialization: 'Left-hand Bat', nationality: 'Indian', basePrice: 4, status: 'Available' },
  { id: 'P040', name: 'Tilak Varma', role: 'Batsman', specialization: 'Left-hand Bat', nationality: 'Indian', basePrice: 5, status: 'Available' },
  { id: 'P041', name: 'Yashasvi Jaiswal', role: 'Batsman', specialization: 'Left-hand Bat', nationality: 'Indian', basePrice: 8, status: 'Available' },
  { id: 'P058', name: 'Travis Head', role: 'Batsman', specialization: 'Left-hand Bat', nationality: 'Overseas', basePrice: 7, status: 'Unsold' },

  // === BOWLERS ===
  { id: 'P002', name: 'Jasprit Bumrah', role: 'Bowler', specialization: 'Fast Bowler', nationality: 'Indian', basePrice: 8, status: 'Sold', soldTo: 'CC26-002', soldFor: 16.5 },
  { id: 'P007', name: 'Ravichandran Ashwin', role: 'Bowler', specialization: 'Off Spinner', nationality: 'Indian', basePrice: 7, status: 'Sold', soldTo: 'CC26-003', soldFor: 9 },
  { id: 'P014', name: 'Kuldeep Yadav', role: 'Bowler', specialization: 'Left-arm Chinaman', nationality: 'Indian', basePrice: 6, status: 'Sold', soldTo: 'CC26-004', soldFor: 8 },
  { id: 'P017', name: 'Mitchell Starc', role: 'Bowler', specialization: 'Fast Bowler', nationality: 'Overseas', basePrice: 9, status: 'Sold', soldTo: 'CC26-004', soldFor: 11 },
  { id: 'P018', name: 'Bhuvneshwar Kumar', role: 'Bowler', specialization: 'Medium Fast', nationality: 'Indian', basePrice: 6, status: 'Sold', soldTo: 'CC26-002', soldFor: 7 },
  { id: 'P020', name: 'Mohammed Shami', role: 'Bowler', specialization: 'Fast Bowler', nationality: 'Indian', basePrice: 7, status: 'Sold', soldTo: 'CC26-001', soldFor: 8 },
  { id: 'P021', name: 'Shardul Thakur', role: 'Bowler', specialization: 'Medium Fast', nationality: 'Indian', basePrice: 5, status: 'Sold', soldTo: 'CC26-003', soldFor: 7 },
  { id: 'P030', name: 'Yuzvendra Chahal', role: 'Bowler', specialization: 'Leg Spinner', nationality: 'Indian', basePrice: 5, status: 'Sold', soldTo: 'CC26-001', soldFor: 5 },
  { id: 'P033', name: 'Arshdeep Singh', role: 'Bowler', specialization: 'Left-arm Fast', nationality: 'Indian', basePrice: 5, status: 'Sold', soldTo: 'CC26-002', soldFor: 5.5 },
  { id: 'P034', name: 'Navdeep Saini', role: 'Bowler', specialization: 'Fast Bowler', nationality: 'Indian', basePrice: 4, status: 'Sold', soldTo: 'CC26-004', soldFor: 9 },
  { id: 'P035', name: 'Deepak Chahar', role: 'Bowler', specialization: 'Medium Fast', nationality: 'Indian', basePrice: 4, status: 'Sold', soldTo: 'CC26-001', soldFor: 4 },
  { id: 'P042', name: 'Rashid Khan', role: 'Bowler', specialization: 'Leg Spinner', nationality: 'Overseas', basePrice: 7, status: 'Available' },
  { id: 'P043', name: 'Trent Boult', role: 'Bowler', specialization: 'Left-arm Fast', nationality: 'Overseas', basePrice: 7, status: 'Available' },
  { id: 'P044', name: 'Mohammed Siraj', role: 'Bowler', specialization: 'Fast Bowler', nationality: 'Indian', basePrice: 6, status: 'Available' },
  { id: 'P045', name: 'Umran Malik', role: 'Bowler', specialization: 'Fast Bowler', nationality: 'Indian', basePrice: 4, status: 'Available' },
  { id: 'P046', name: 'Kagiso Rabada', role: 'Bowler', specialization: 'Fast Bowler', nationality: 'Overseas', basePrice: 8, status: 'Available' },
  { id: 'P047', name: 'Pat Cummins', role: 'Bowler', specialization: 'Fast Bowler', nationality: 'Overseas', basePrice: 9, status: 'Available' },
  { id: 'P059', name: 'Anrich Nortje', role: 'Bowler', specialization: 'Fast Bowler', nationality: 'Overseas', basePrice: 6, status: 'Unsold' },
  { id: 'P060', name: 'Prasidh Krishna', role: 'Bowler', specialization: 'Fast Bowler', nationality: 'Indian', basePrice: 4, status: 'Unsold' },

  // === ALL-ROUNDERS ===
  { id: 'P008', name: 'Hardik Pandya', role: 'All-rounder', specialization: 'Batting All-rounder', nationality: 'Indian', basePrice: 7, status: 'Sold', soldTo: 'CC26-002', soldFor: 12 },
  { id: 'P015', name: 'Ravindra Jadeja', role: 'All-rounder', specialization: 'Bowling All-rounder', nationality: 'Indian', basePrice: 8, status: 'Sold', soldTo: 'CC26-001', soldFor: 9 },
  { id: 'P016', name: 'Deepak Hooda', role: 'All-rounder', specialization: 'Batting All-rounder', nationality: 'Indian', basePrice: 4, status: 'Sold', soldTo: 'CC26-003', soldFor: 6 },
  { id: 'P028', name: 'Axar Patel', role: 'All-rounder', specialization: 'Bowling All-rounder', nationality: 'Indian', basePrice: 5, status: 'Sold', soldTo: 'CC26-002', soldFor: 6 },
  { id: 'P029', name: 'Washington Sundar', role: 'All-rounder', specialization: 'Bowling All-rounder', nationality: 'Indian', basePrice: 5, status: 'Sold', soldTo: 'CC26-004', soldFor: 7 },
  { id: 'P048', name: 'Ben Stokes', role: 'All-rounder', specialization: 'Batting All-rounder', nationality: 'Overseas', basePrice: 9, status: 'Available' },
  { id: 'P049', name: 'Cameron Green', role: 'All-rounder', specialization: 'Batting All-rounder', nationality: 'Overseas', basePrice: 7, status: 'Available' },
  { id: 'P050', name: 'Venkatesh Iyer', role: 'All-rounder', specialization: 'Batting All-rounder', nationality: 'Indian', basePrice: 5, status: 'Available' },
  { id: 'P051', name: 'Moeen Ali', role: 'All-rounder', specialization: 'Batting All-rounder', nationality: 'Overseas', basePrice: 6, status: 'Available' },
  { id: 'P052', name: 'Krunal Pandya', role: 'All-rounder', specialization: 'Bowling All-rounder', nationality: 'Indian', basePrice: 4, status: 'Available' },

  // === WICKETKEEPERS ===
  { id: 'P003', name: 'MS Dhoni', role: 'Wicketkeeper', specialization: 'WK-Batsman', nationality: 'Indian', basePrice: 10, status: 'Sold', soldTo: 'CC26-003', soldFor: 14 },
  { id: 'P004', name: 'Rishabh Pant', role: 'Wicketkeeper', specialization: 'WK-Batsman', nationality: 'Indian', basePrice: 9, status: 'Sold', soldTo: 'CC26-004', soldFor: 12 },
  { id: 'P010', name: 'KL Rahul', role: 'Wicketkeeper', specialization: 'WK-Batsman', nationality: 'Indian', basePrice: 9, status: 'Sold', soldTo: 'CC26-001', soldFor: 10 },
  { id: 'P012', name: 'Ishan Kishan', role: 'Wicketkeeper', specialization: 'WK-Batsman', nationality: 'Indian', basePrice: 7, status: 'Sold', soldTo: 'CC26-002', soldFor: 8 },
  { id: 'P053', name: 'Quinton de Kock', role: 'Wicketkeeper', specialization: 'WK-Batsman', nationality: 'Overseas', basePrice: 7, status: 'Available' },
  { id: 'P054', name: 'Jos Buttler', role: 'Wicketkeeper', specialization: 'WK-Batsman', nationality: 'Overseas', basePrice: 8, status: 'Available' },
  { id: 'P055', name: 'Dinesh Karthik', role: 'Wicketkeeper', specialization: 'WK-Batsman', nationality: 'Indian', basePrice: 4, status: 'Available' },
  { id: 'P056', name: 'Nicholas Pooran', role: 'Wicketkeeper', specialization: 'WK-Batsman', nationality: 'Overseas', basePrice: 6, status: 'Available' },
  { id: 'P057', name: 'Wriddhiman Saha', role: 'Wicketkeeper', specialization: 'WK-Batsman', nationality: 'Indian', basePrice: 2, status: 'Unsold' },
];

export const getPlayerById = (id: string): Player | undefined => players.find(p => p.id === id);

export const getPlayersByStatus = (status: Player['status']): Player[] => players.filter(p => p.status === status);

export const getPlayersByRole = (role: Player['role']): Player[] => players.filter(p => p.role === role);
