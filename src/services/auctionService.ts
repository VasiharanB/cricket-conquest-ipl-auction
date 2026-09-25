// ============================================
// Cricket Conquest – Live Auction API Service
// ============================================

import { authService } from './authService';

export interface AuctionPlayerDto {
  id: string; // e.g. "P001"
  dbId: number;
  name: string;
  role: string;
  nationality: string;
  playerCategory: string;
  basePrice: number;
  rating?: number | null;
  status: 'Available' | 'Sold' | 'Unsold';
}

export interface AuctionTeamDto {
  id: string;
  dbId: number;
  name: string;
  college: string;
  startingPurse: number;
  remainingPurse: number;
  playersBought: number;
}

export interface AuctionBidDto {
  id: number;
  teamId: string;
  teamDbId: number;
  teamName: string;
  amount: number;
  timestamp: string;
}

export interface LiveAuctionState {
  sessionId: number;
  sessionName: string;
  status: 'NOT_STARTED' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  stageState:
    | 'INITIAL'
    | 'PLAYER_READY'
    | 'BIDDING'
    | 'GOING_ONCE'
    | 'GOING_TWICE'
    | 'SOLD'
    | 'UNSOLD'
    | 'PAUSED'
    | 'NEXT_PLAYER';
  roundNumber: number;
  timerSeconds: number;
  currentPlayer: AuctionPlayerDto | null;
  currentBid: number;
  highestBidder: AuctionTeamDto | null;
  bidHistory: AuctionBidDto[];
  nextPlayer: AuctionPlayerDto | null;
  queueStats: {
    total: number;
    queued: number;
    sold: number;
    unsold: number;
  };
  teams: AuctionTeamDto[];
}

export interface HistoryItem {
  id: number;
  eventType: string;
  timestamp: string;
  round: number;
  playerId?: string;
  playerName?: string;
  playerRole?: string;
  teamId?: string;
  teamName?: string;
  amount?: number;
  status: 'Sold' | 'Unsold' | 'Bid' | 'Undo' | 'Event';
}

export interface TeamResultSquadPlayer {
  id: string;
  name: string;
  role: string;
  category: string;
  price: number;
  rating: number;
  keyPoints?: number;
}

export interface TeamResultItem {
  teamId: string;
  teamName: string;
  collegeName: string;
  startingPurse: number;
  remainingPurse: number;
  totalSpent: number;
  playerCount: number;
  squadRating: number;
  totalKeyPoints?: number;
  totalScore?: number;
  roleCounts: {
    batsman: number;
    bowler: number;
    allRounder: number;
    wicketkeeper: number;
  };
  players: TeamResultSquadPlayer[];
}

export interface AuctionResultsPayload {
  isPublished: boolean;
  publishedAt: string | null;
  standings: TeamResultItem[];
}

const API_BASE = '/api/auction';

export const auctionService = {
  async getState(sessionId?: number): Promise<LiveAuctionState> {
    const url = sessionId ? `${API_BASE}/state?sessionId=${sessionId}` : `${API_BASE}/state`;
    const res = await fetch(url);
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message || 'Failed to fetch auction state');
    return json.data;
  },

  async startAuction(sessionId?: number): Promise<LiveAuctionState> {
    const res = await fetch(`${API_BASE}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeaders(),
      },
      body: JSON.stringify({ sessionId }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message || 'Failed to start auction');
    return json.data;
  },

  async pauseAuction(sessionId?: number): Promise<LiveAuctionState> {
    const res = await fetch(`${API_BASE}/pause`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeaders(),
      },
      body: JSON.stringify({ sessionId }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message || 'Failed to pause auction');
    return json.data;
  },

  async resumeAuction(sessionId?: number): Promise<LiveAuctionState> {
    const res = await fetch(`${API_BASE}/resume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeaders(),
      },
      body: JSON.stringify({ sessionId }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message || 'Failed to resume auction');
    return json.data;
  },

  async setStage(stage: string, sessionId?: number): Promise<LiveAuctionState> {
    const res = await fetch(`${API_BASE}/stage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeaders(),
      },
      body: JSON.stringify({ stage, sessionId }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message || 'Failed to update stage');
    return json.data;
  },

  async nextPlayer(sessionId?: number): Promise<LiveAuctionState> {
    const res = await fetch(`${API_BASE}/next-player`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeaders(),
      },
      body: JSON.stringify({ sessionId }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message || 'Failed to advance to next player');
    return json.data;
  },

  async placeBid(teamId: string | number, bidAmount: number, sessionId?: number): Promise<LiveAuctionState> {
    const res = await fetch(`${API_BASE}/bid`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeaders(),
      },
      body: JSON.stringify({ teamId, bidAmount, sessionId }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message || 'Bid rejected by server');
    return json.data;
  },

  async sellPlayer(sessionId?: number): Promise<LiveAuctionState> {
    const res = await fetch(`${API_BASE}/sold`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeaders(),
      },
      body: JSON.stringify({ sessionId }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message || 'Failed to finalize player sale');
    return json.data;
  },

  async markUnsold(sessionId?: number): Promise<LiveAuctionState> {
    const res = await fetch(`${API_BASE}/unsold`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeaders(),
      },
      body: JSON.stringify({ sessionId }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message || 'Failed to mark player unsold');
    return json.data;
  },

  async undoLastSale(sessionId?: number): Promise<LiveAuctionState> {
    const res = await fetch(`${API_BASE}/undo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeaders(),
      },
      body: JSON.stringify({ sessionId }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message || 'Failed to undo sale');
    return json.data;
  },

  async setTimer(seconds: number, sessionId?: number): Promise<void> {
    await fetch(`${API_BASE}/timer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeaders(),
      },
      body: JSON.stringify({ seconds, sessionId }),
    });
  },

  async getHistory(params: { search?: string; status?: string } = {}): Promise<HistoryItem[]> {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.status && params.status !== 'all') query.set('status', params.status);

    const res = await fetch(`${API_BASE}/history?${query.toString()}`);
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message || 'Failed to load auction history');
    return json.data;
  },

  async getResults(): Promise<AuctionResultsPayload> {
    const res = await fetch(`${API_BASE}/results`);
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message || 'Failed to load auction results');
    return json.data;
  },

  async publishResults(): Promise<AuctionResultsPayload> {
    const res = await fetch(`${API_BASE}/publish-results`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeaders(),
      },
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message || 'Failed to publish results');
    return json.data;
  },
};
