// ============================================
// Live Auction Internal Types & Interfaces
// Compatible with PlayerRecord from playerService
// ============================================

export type AuctionUIState =
  | 'INITIAL'
  | 'PLAYER_READY'
  | 'BIDDING'
  | 'GOING_ONCE'
  | 'GOING_TWICE'
  | 'SOLD'
  | 'UNSOLD'
  | 'PAUSED'
  | 'NEXT_PLAYER';

export interface AuctionPlayer {
  id: string; // e.g. "P002"
  dbId?: number;
  name: string;
  role: string;
  specialization?: string;
  nationality: string;
  playerCategory?: string;
  basePrice: number;
  status: 'Available' | 'Sold' | 'Unsold';
  rating?: number | null;
  imageUrl?: string;
  soldTo?: string;
  soldFor?: number;
}

export interface AuctionTeam {
  id: string;
  name: string;
  college?: string;
  remainingPurse: number;
  startingPurse: number;
  playersBought: number;
  color: string;
  accentColor: string;
}

export interface LiveBid {
  id: string;
  teamName: string;
  teamId?: string;
  amount: number;
  timestamp: string;
}
