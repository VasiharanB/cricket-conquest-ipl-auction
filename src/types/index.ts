// ============================================
// Cricket Conquest – IPL Auction Types
// ============================================

export interface TeamMember {
  name: string;
  email?: string;
  phone?: string;
  role: 'captain' | 'member';
}

export interface Team {
  id: string;
  name: string;
  college: string;
  captain: TeamMember;
  members: TeamMember[];
  memberCount: number;
  status: 'confirmed' | 'pending' | 'checked-in' | 'waitlisted';
  startingPurse: number;
  remainingPurse: number;
  playersBought: number;
  squad: PlayerSquadEntry[];
  registeredAt: string;
}

export interface PlayerSquadEntry {
  playerId: string;
  playerName: string;
  role: PlayerRole;
  boughtFor: number;
}

export type PlayerRole = 'Batsman' | 'Bowler' | 'All-rounder' | 'Wicketkeeper';
export type PlayerNationality = 'Indian' | 'Overseas';
export type PlayerStatus = 'Available' | 'Sold' | 'Unsold';

export interface Player {
  id: string;
  name: string;
  role: PlayerRole;
  specialization?: string;
  nationality: PlayerNationality;
  basePrice: number;
  status: PlayerStatus;
  soldTo?: string;
  soldFor?: number;
  imageUrl?: string;
}

export interface AuctionRecord {
  id: string;
  playerId: string;
  playerName: string;
  playerRole: PlayerRole;
  winningTeamId?: string;
  winningTeamName?: string;
  finalBid?: number;
  basePrice: number;
  round: number;
  status: 'Sold' | 'Unsold';
  timestamp: string;
}

export type AuctionState = 'not-started' | 'bidding' | 'going-once' | 'going-twice' | 'sold' | 'unsold' | 'paused';

export interface BidActivity {
  id: string;
  teamName: string;
  amount: number;
  timestamp: string;
}

export interface RegistrationFormData {
  teamName: string;
  college: string;
  captain: {
    name: string;
    email: string;
    phone: string;
  };
  members: {
    name: string;
  }[];
}

export interface RegistrationConfirmation {
  teamName: string;
  teamId: string;
  captain: string;
  memberCount: number;
  status: 'CONFIRMED';
}

export interface TeamResult {
  rank: number;
  teamId: string;
  teamName: string;
  squadRating: number;
  totalSpent: number;
  remainingPurse: number;
  players: PlayerSquadEntry[];
}
