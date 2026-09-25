// ============================================
// Cricket Conquest – Participant & Watchdog Client API Service
// ============================================

export interface ParticipantTeam {
  id: number;
  teamId: string;
  teamName: string;
  collegeName: string;
  role: 'Participant';
}

export interface ParticipantProfile {
  id: number;
  teamId: string;
  teamName: string;
  collegeName: string;
  captainName: string;
  captainEmail: string;
  captainPhone: string;
  accessCode: string;
  registrationStatus: string;
  checkInStatus: string;
  startingPurse: number;
  remainingPurse: number;
  playersBoughtCount: number;
  members: {
    id: number;
    member_number: number;
    full_name: string;
    email: string | null;
    phone: string | null;
    is_captain: boolean;
  }[];
  squad: {
    id: number;
    player_id: string;
    player_name: string;
    role: string;
    nationality?: string;
    player_category: string;
    rating: number;
    purchase_price: number;
  }[];
  supportRequested: boolean;
  supportMessage: string | null;
}

export interface WatchdogTeam {
  id: number;
  teamId: string;
  teamName: string;
  collegeName: string;
  captainName: string;
  captainPhone: string;
  accessCode: string;
  registrationStatus: string;
  checkInStatus: string;
  startingPurse: number;
  remainingPurse: number;
  playersBought: number;
  isOnline: boolean;
  currentPage: string;
  lastPing: string | null;
  supportRequested: boolean;
  supportMessage: string | null;
}

const PARTICIPANT_TOKEN_KEY = 'zentrix26_participant_token';
const PARTICIPANT_USER_KEY = 'zentrix26_participant_user';

export const participantService = {
  getToken(): string | null {
    return localStorage.getItem(PARTICIPANT_TOKEN_KEY);
  },

  getTeam(): ParticipantTeam | null {
    const raw = localStorage.getItem(PARTICIPANT_USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  setSession(token: string, team: ParticipantTeam): void {
    localStorage.setItem(PARTICIPANT_TOKEN_KEY, token);
    localStorage.setItem(PARTICIPANT_USER_KEY, JSON.stringify(team));
  },

  clearSession(): void {
    localStorage.removeItem(PARTICIPANT_TOKEN_KEY);
    localStorage.removeItem(PARTICIPANT_USER_KEY);
  },

  getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },

  async login(identifier: string, accessCode: string): Promise<ParticipantTeam> {
    const res = await fetch('/api/participant/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, accessCode }),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Login failed. Please verify your Team ID and Access Code.');
    }

    this.setSession(json.token, json.team);
    return json.team;
  },

  async getProfile(): Promise<ParticipantProfile> {
    const res = await fetch('/api/participant/me', {
      headers: this.getAuthHeaders(),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to fetch team profile');
    }
    return json.data;
  },

  async ping(page: string): Promise<void> {
    try {
      await fetch('/api/participant/ping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
        body: JSON.stringify({ page }),
      });
    } catch {
      // ignore background heartbeat errors
    }
  },

  async requestHelp(message: string): Promise<void> {
    const res = await fetch('/api/participant/request-help', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify({ message }),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to request helper support');
    }
  },

  async placeBid(bidAmount: number): Promise<any> {
    const res = await fetch('/api/participant/bid', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify({ bidAmount }),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Bid rejected');
    }
    return json.data;
  },

  // Helper Watchdog API (requires organizer token)
  async getWatchdogData(organizerToken: string): Promise<{ teams: WatchdogTeam[]; activities: any[] }> {
    const res = await fetch('/api/participant/watchdog', {
      headers: { Authorization: `Bearer ${organizerToken}` },
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to fetch watchdog monitoring data');
    }
    return json.data;
  },

  async resolveHelp(teamId: number, organizerToken: string): Promise<void> {
    const res = await fetch(`/api/participant/resolve-help/${teamId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${organizerToken}` },
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to resolve support request');
    }
  },
};
