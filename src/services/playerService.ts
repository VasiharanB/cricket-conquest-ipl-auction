// ============================================
// Cricket Conquest – Player API Service
// ============================================

export interface ApiPlayerRow {
  id: number;
  player_id: string;
  player_name: string;
  role: string;
  nationality: string;
  player_category: string;
  base_price: number | string;
  rating: number | null;
  status: 'AVAILABLE' | 'SOLD' | 'UNSOLD';
  sold_to_team_id: number | null;
  sold_price: number | string | null;
  created_at: string;
  updated_at: string;
}

export interface PlayerRecord {
  id: string; // Player ID (e.g. P001)
  dbId: number; // MySQL primary key
  name: string;
  role: string;
  nationality: string;
  playerCategory: string;
  basePrice: number;
  rating: number | null;
  status: 'Available' | 'Sold' | 'Unsold';
  soldToTeamId?: number | null;
  soldFor?: number | null;
  specialization?: string;
}

export interface PlayerStats {
  total: number;
  available: number;
  sold: number;
  unsold: number;
}

export interface GetPlayersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  nationality?: string;
  status?: string;
}

export interface GetPlayersResponse {
  players: PlayerRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: PlayerStats;
}

export interface ImportPlayerPayload {
  player_id: string;
  player_name: string;
  role: string;
  nationality: string;
  player_category?: string;
  base_price: number;
  rating?: number | null;
  notes?: string;
  key_points?: number;
}

export interface ImportResult {
  success: boolean;
  total: number;
  inserted: number;
  skipped: number;
  failed: number;
  errors: { row?: number; playerId?: string; reason: string }[];
}

function normalizeStatus(dbStatus: string): 'Available' | 'Sold' | 'Unsold' {
  const upper = (dbStatus || '').toUpperCase();
  if (upper === 'SOLD') return 'Sold';
  if (upper === 'UNSOLD') return 'Unsold';
  return 'Available';
}

function mapApiPlayerToRecord(raw: ApiPlayerRow): PlayerRecord {
  return {
    id: raw.player_id,
    dbId: raw.id,
    name: raw.player_name,
    role: raw.role,
    nationality: raw.nationality,
    playerCategory: raw.player_category,
    basePrice: Number(raw.base_price) || 0,
    rating: raw.rating !== null ? Number(raw.rating) : null,
    status: normalizeStatus(raw.status),
    soldToTeamId: raw.sold_to_team_id,
    soldFor: raw.sold_price !== null ? Number(raw.sold_price) : null,
  };
}

const API_BASE = '/api/players';

/** Returns the Bearer token header if one is stored in localStorage */
function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('zentrix26_auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const playerService = {
  /**
   * Fetch paginated and filtered players
   */
  async getPlayers(params: GetPlayersParams = {}): Promise<GetPlayersResponse> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit !== undefined) query.set('limit', String(params.limit));
    if (params.search) query.set('search', params.search);
    if (params.role && params.role !== 'all') query.set('role', params.role);
    if (params.nationality && params.nationality !== 'all') query.set('nationality', params.nationality);
    if (params.status && params.status !== 'all') query.set('status', params.status);

    const res = await fetch(`${API_BASE}?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.message || `Failed to fetch players (status ${res.status})`);
    }

    const json = await res.json();
    return {
      players: (json.data || []).map(mapApiPlayerToRecord),
      pagination: json.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 },
      stats: json.stats || { total: 0, available: 0, sold: 0, unsold: 0 },
    };
  },

  /**
   * Fetch single player by player ID
   */
  async getPlayer(playerId: string): Promise<PlayerRecord> {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(playerId)}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.message || `Failed to fetch player (status ${res.status})`);
    }
    const json = await res.json();
    return mapApiPlayerToRecord(json.data);
  },

  /**
   * Import player records via batch POST
   */
  async importPlayers(
    players: ImportPlayerPayload[],
    onDuplicate: 'skip' | 'update' = 'skip'
  ): Promise<ImportResult> {
    const res = await fetch(`${API_BASE}/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ players, onDuplicate }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.message || `Import request failed (status ${res.status})`);
    }

    return await res.json();
  },

  /**
   * Update an existing player
   */
  async updatePlayer(
    playerId: string,
    payload: {
      player_name?: string;
      role?: string;
      nationality?: string;
      player_category?: string;
      base_price?: number;
      rating?: number | null;
      status?: 'Available' | 'Sold' | 'Unsold';
    }
  ): Promise<PlayerRecord> {
    const apiPayload: any = { ...payload };
    if (payload.status) {
      apiPayload.status = payload.status.toUpperCase();
    }

    const res = await fetch(`${API_BASE}/${encodeURIComponent(playerId)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(apiPayload),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.message || `Failed to update player (status ${res.status})`);
    }

    const json = await res.json();
    return mapApiPlayerToRecord(json.data);
  },

  /**
   * Delete a player by player ID
   */
  async deletePlayer(playerId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(playerId)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.message || `Failed to delete player (status ${res.status})`);
    }
  },
};
