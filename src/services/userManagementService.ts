// ============================================
// Cricket Conquest – User Management Service (Admin only)
// ============================================

import { authService } from './authService';

export interface OrganizerUser {
  id: number;
  username: string;
  email: string;
  role: 'Admin' | 'Auctioneer' | 'Volunteer';
  is_active: boolean;
  last_login: string | null;
  created_at: string;
}

export interface CreateUserInput {
  username: string;
  email: string;
  password: string;
  role: 'Admin' | 'Auctioneer' | 'Volunteer';
}

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api/auth${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authService.getAuthHeaders(),
      ...((options.headers as Record<string, string>) || {}),
    },
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Request failed');
  }
  return json;
}

export const userManagementService = {
  async listUsers(): Promise<OrganizerUser[]> {
    const json = await apiRequest<{ data: OrganizerUser[] }>('/users');
    return json.data;
  },

  async createUser(input: CreateUserInput): Promise<OrganizerUser> {
    const json = await apiRequest<{ data: OrganizerUser }>('/users', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return json.data;
  },

  async updateRole(userId: number, role: string): Promise<OrganizerUser> {
    const json = await apiRequest<{ data: OrganizerUser }>(`/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
    return json.data;
  },

  async toggleStatus(userId: number): Promise<OrganizerUser> {
    const json = await apiRequest<{ data: OrganizerUser }>(`/users/${userId}/status`, {
      method: 'PATCH',
    });
    return json.data;
  },

  async resetPassword(userId: number, newPassword: string): Promise<void> {
    await apiRequest(`/users/${userId}/reset-password`, {
      method: 'PATCH',
      body: JSON.stringify({ newPassword }),
    });
  },

  async deleteUser(userId: number): Promise<void> {
    await apiRequest(`/users/${userId}`, { method: 'DELETE' });
  },
};
