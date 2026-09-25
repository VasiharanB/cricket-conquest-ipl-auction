// ============================================
// Cricket Conquest – Organizer Auth Service
// ============================================

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: 'Admin' | 'Auctioneer' | 'Volunteer';
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  user: AuthUser;
}

const TOKEN_KEY = 'zentrix26_auth_token';
const USER_KEY = 'zentrix26_auth_user';

export const authService = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  getUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  setSession(token: string, user: AuthUser): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },

  async login(username: string, password: string): Promise<LoginResponse> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Login failed. Please check your credentials.');
    }

    this.setSession(json.token, json.user);
    return json;
  },

  async getMe(): Promise<AuthUser | null> {
    const token = this.getToken();
    if (!token) return null;

    try {
      const res = await fetch('/api/auth/me', {
        headers: this.getAuthHeaders(),
      });

      if (!res.ok) {
        this.clearSession();
        return null;
      }

      const json = await res.json();
      if (json.success && json.user) {
        localStorage.setItem(USER_KEY, JSON.stringify(json.user));
        return json.user;
      }
      return null;
    } catch {
      return null;
    }
  },
};
