// ============================================
// Cricket Conquest – Team & Participant API Service
// ============================================

export interface ApiTeamMemberRow {
  id: number;
  team_id: number;
  member_number: number;
  full_name: string;
  email: string | null;
  phone: string | null;
  is_captain: number | boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiTeamRow {
  id: number;
  team_id: string;
  team_name: string;
  college_name: string;
  captain_name: string;
  captain_email: string;
  captain_phone: string;
  access_code?: string;
  registration_status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'WAITLISTED';
  check_in_status: 'NOT_CHECKED_IN' | 'CHECKED_IN';
  starting_purse: number | string;
  remaining_purse: number | string;
  players_bought: number;
  created_at: string;
  updated_at: string;
  members?: ApiTeamMemberRow[];
  member_count?: number;
}

export interface TeamMember {
  id?: number;
  memberNumber: number;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  isCaptain: boolean;
}

export interface TeamRecord {
  id: number;
  teamId: string;
  teamName: string;
  collegeName: string;
  captainName: string;
  captainEmail: string;
  captainPhone: string;
  accessCode?: string;
  registrationStatus: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'WAITLISTED';
  checkInStatus: 'NOT_CHECKED_IN' | 'CHECKED_IN';
  startingPurse: number;
  remainingPurse: number;
  playersBought: number;
  createdAt: string;
  updatedAt: string;
  members: TeamMember[];
  memberCount: number;
}

export interface TeamStats {
  registeredTeams: number;
  confirmedTeams: number;
  checkedIn: number;
  totalParticipants: number;
  maxTeams: number;
}

export interface GetTeamsParams {
  search?: string;
  status?: string;
  checkIn?: string;
}

export interface GetTeamsResponse {
  teams: TeamRecord[];
  stats: TeamStats;
}

export interface CreateTeamPayload {
  teamName: string;
  collegeName: string;
  captain: {
    fullName: string;
    email: string;
    phone: string;
  };
  members?: {
    fullName: string;
    email?: string;
    phone?: string;
  }[];
}

function mapApiMember(raw: ApiTeamMemberRow): TeamMember {
  return {
    id: raw.id,
    memberNumber: raw.member_number,
    fullName: raw.full_name,
    email: raw.email,
    phone: raw.phone,
    isCaptain: Boolean(raw.is_captain),
  };
}

function mapApiTeamToRecord(raw: ApiTeamRow): TeamRecord {
  const members = (raw.members || []).map(mapApiMember);
  return {
    id: raw.id,
    teamId: raw.team_id,
    teamName: raw.team_name,
    collegeName: raw.college_name,
    captainName: raw.captain_name,
    captainEmail: raw.captain_email,
    captainPhone: raw.captain_phone,
    accessCode: raw.access_code,
    registrationStatus: raw.registration_status,
    checkInStatus: raw.check_in_status,
    startingPurse: Number(raw.starting_purse) || 0,
    remainingPurse: Number(raw.remaining_purse) || 0,
    playersBought: Number(raw.players_bought) || 0,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    members,
    memberCount: members.length || Number(raw.member_count) || 0,
  };
}

const API_BASE = '/api/teams';

/** Returns the Bearer token header if one is stored in localStorage */
function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('zentrix26_auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const teamService = {
  /**
   * Fetch registered teams with optional search and status filters
   */
  async getTeams(params: GetTeamsParams = {}): Promise<GetTeamsResponse> {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.status && params.status !== 'all') query.set('status', params.status);
    if (params.checkIn && params.checkIn !== 'all') query.set('checkIn', params.checkIn);

    const res = await fetch(`${API_BASE}?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.message || `Failed to fetch teams (status ${res.status})`);
    }

    const json = await res.json();
    return {
      teams: (json.data || []).map(mapApiTeamToRecord),
      stats: json.stats || {
        registeredTeams: 0,
        confirmedTeams: 0,
        checkedIn: 0,
        totalParticipants: 0,
        maxTeams: 16,
      },
    };
  },

  /**
   * Fetch single team by team ID (e.g. CC26-001)
   */
  async getTeam(teamId: string): Promise<TeamRecord> {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(teamId)}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.message || `Failed to fetch team (status ${res.status})`);
    }

    const json = await res.json();
    return mapApiTeamToRecord(json.data);
  },

  /**
   * Fetch members of a team
   */
  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(teamId)}/members`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.message || `Failed to fetch team members (status ${res.status})`);
    }

    const json = await res.json();
    return (json.data || []).map(mapApiMember);
  },

  /**
   * Create a new team with participants
   */
  async createTeam(payload: CreateTeamPayload): Promise<TeamRecord> {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.message || `Registration failed (status ${res.status})`);
    }

    const json = await res.json();
    return mapApiTeamToRecord(json.data);
  },

  /**
   * Update team registration status
   */
  async updateTeamStatus(
    teamId: string,
    status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'WAITLISTED'
  ): Promise<TeamRecord> {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(teamId)}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ status }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.message || `Failed to update status (status ${res.status})`);
    }

    const json = await res.json();
    return mapApiTeamToRecord(json.data);
  },

  /**
   * Update team check-in status
   */
  async updateCheckInStatus(
    teamId: string,
    checkInStatus: 'NOT_CHECKED_IN' | 'CHECKED_IN'
  ): Promise<TeamRecord> {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(teamId)}/check-in`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ checkInStatus }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.message || `Failed to update check-in (status ${res.status})`);
    }

    const json = await res.json();
    return mapApiTeamToRecord(json.data);
  },

  /**
   * Update full team information and member roster
   */
  async updateTeam(
    teamId: string,
    payload: {
      teamName?: string;
      collegeName?: string;
      captainName?: string;
      captainEmail?: string;
      captainPhone?: string;
      registrationStatus?: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'WAITLISTED';
      checkInStatus?: 'NOT_CHECKED_IN' | 'CHECKED_IN';
      startingPurse?: number;
      remainingPurse?: number;
      members?: {
        fullName: string;
        email?: string | null;
        phone?: string | null;
      }[];
    }
  ): Promise<TeamRecord> {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(teamId)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.message || `Failed to update team (status ${res.status})`);
    }

    const json = await res.json();
    return mapApiTeamToRecord(json.data);
  },

  /**
   * Delete a team from MySQL
   */
  async deleteTeam(teamId: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(teamId)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.message || `Failed to delete team (status ${res.status})`);
    }

    return true;
  },
};
