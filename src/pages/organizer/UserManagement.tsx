// ============================================
// Cricket Conquest – User Management Page
// Role: Admin only  |  Manages Organizer RBAC
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Trash2,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Eye,
  EyeOff,
  AlertTriangle,
} from 'lucide-react';
import { userManagementService, type OrganizerUser, type CreateUserInput } from '../../services/userManagementService';
import './UserManagement.css';

// ─── Toast helper ────────────────────────────────────────────────────
type ToastType = 'success' | 'error';

interface Toast {
  msg: string;
  type: ToastType;
}

// ─── Role colours ────────────────────────────────────────────────────
const ROLE_PERMISSIONS: Record<string, string[]> = {
  Admin:      ['All access', 'User management', 'Team CRUD', 'Player CRUD', 'Auction control', 'Publish results'],
  Auctioneer: ['Auction control', 'Team check-in', 'Player edit', 'View all data'],
  Volunteer:  ['View-only access', 'Dashboard', 'Teams read', 'Players read', 'History read'],
};

// ─── Component ───────────────────────────────────────────────────────
export const UserManagement: React.FC = () => {
  const [users, setUsers]         = useState<OrganizerUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast]         = useState<Toast | null>(null);

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<CreateUserInput>({ username: '', email: '', password: '', role: 'Volunteer' });
  const [showPwd, setShowPwd]       = useState(false);
  const [isSaving, setIsSaving]     = useState(false);

  // Reset password modal
  const [resetTarget, setResetTarget] = useState<OrganizerUser | null>(null);
  const [newPwd, setNewPwd]           = useState('');
  const [showNewPwd, setShowNewPwd]   = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<OrganizerUser | null>(null);
  const [isDeleting, setIsDeleting]     = useState(false);

  const showToast = (msg: string, type: ToastType = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await userManagementService.listUsers();
      setUsers(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load users.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  // ── Stats ─────────────────────────────────────────────────────────
  const stats = {
    total:     users.length,
    admin:     users.filter(u => u.role === 'Admin').length,
    auctioneer:users.filter(u => u.role === 'Auctioneer').length,
    volunteer: users.filter(u => u.role === 'Volunteer').length,
    active:    users.filter(u => u.is_active).length,
  };

  // ── Create User ───────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!createForm.username.trim() || !createForm.email.trim() || !createForm.password) {
      showToast('All fields are required.', 'error');
      return;
    }
    setIsSaving(true);
    try {
      const created = await userManagementService.createUser(createForm);
      setUsers(prev => [...prev, created]);
      setShowCreate(false);
      setCreateForm({ username: '', email: '', password: '', role: 'Volunteer' });
      showToast(`Organizer '${created.username}' created successfully.`);
    } catch (err: any) {
      showToast(err.message || 'Failed to create user.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Toggle Active ─────────────────────────────────────────────────
  const handleToggleStatus = async (user: OrganizerUser) => {
    try {
      const updated = await userManagementService.toggleStatus(user.id);
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
      showToast(`'${updated.username}' is now ${updated.is_active ? 'Active' : 'Inactive'}.`);
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle status.', 'error');
    }
  };

  // ── Role Change ───────────────────────────────────────────────────
  const handleRoleChange = async (user: OrganizerUser, role: string) => {
    try {
      const updated = await userManagementService.updateRole(user.id, role);
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
      showToast(`Role updated to '${updated.role}' for '${updated.username}'.`);
    } catch (err: any) {
      showToast(err.message || 'Failed to update role.', 'error');
    }
  };

  // ── Reset Password ────────────────────────────────────────────────
  const handleResetPassword = async () => {
    if (!resetTarget || newPwd.length < 8) {
      showToast('Password must be at least 8 characters.', 'error');
      return;
    }
    setIsResetting(true);
    try {
      await userManagementService.resetPassword(resetTarget.id, newPwd);
      showToast(`Password reset for '${resetTarget.username}'.`);
      setResetTarget(null);
      setNewPwd('');
    } catch (err: any) {
      showToast(err.message || 'Failed to reset password.', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await userManagementService.deleteUser(deleteTarget.id);
      setUsers(prev => prev.filter(u => u.id !== deleteTarget.id));
      showToast(`'${deleteTarget.username}' deleted.`);
      setDeleteTarget(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete user.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Avatar initial ────────────────────────────────────────────────
  const getAvatarClass = (role: string) => {
    if (role === 'Admin') return 'um-avatar--admin';
    if (role === 'Auctioneer') return 'um-avatar--auctioneer';
    return 'um-avatar--volunteer';
  };

  const formatDate = (dt: string | null) =>
    dt ? new Date(dt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <div className="um-page">
      {/* Toast */}
      {toast && (
        <div className={`um-toast um-toast--${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="um-header">
        <div className="um-header__left">
          <div className="um-admin-badge">
            <ShieldCheck size={12} />
            Admin Only
          </div>
          <h1>User Management</h1>
          <p>Manage organizer accounts, roles & access control for Cricket Conquest</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button className="um-btn um-btn--ghost" onClick={loadUsers} disabled={isLoading}>
            <RefreshCw size={14} className={isLoading ? 'spin-animation' : ''} />
            Refresh
          </button>
          <button className="um-btn um-btn--primary" onClick={() => setShowCreate(true)}>
            <UserPlus size={14} />
            New Organizer
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="um-stats">
        <div className="um-stat-card um-stat-card--total">
          <div className="um-stat-card__label">Total Organizers</div>
          <div className="um-stat-card__value">{stats.total}</div>
        </div>
        <div className="um-stat-card um-stat-card--admin">
          <div className="um-stat-card__label">Admins</div>
          <div className="um-stat-card__value">{stats.admin}</div>
        </div>
        <div className="um-stat-card um-stat-card--auctioneer">
          <div className="um-stat-card__label">Auctioneers</div>
          <div className="um-stat-card__value">{stats.auctioneer}</div>
        </div>
        <div className="um-stat-card um-stat-card--volunteer">
          <div className="um-stat-card__label">Volunteers</div>
          <div className="um-stat-card__value">{stats.volunteer}</div>
        </div>
      </div>

      {/* RBAC permissions cheatsheet */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        {Object.entries(ROLE_PERMISSIONS).map(([role, perms]) => (
          <div key={role} style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14,
            padding: '14px 16px',
          }}>
            <div className={`um-role-badge um-role-badge--${role}`} style={{ marginBottom: 10 }}>
              {role}
            </div>
            <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: '0.78rem', color: 'var(--color-text-secondary)', lineHeight: 1.8 }}>
              {perms.map(p => <li key={p}>{p}</li>)}
            </ul>
          </div>
        ))}
      </div>

      {/* Users Table */}
      <div className="um-table-card">
        <div className="um-table-header">
          <h2>Organizer Accounts ({stats.total})</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
            {stats.active} active &nbsp;·&nbsp; {stats.total - stats.active} inactive
          </span>
        </div>
        <div className="um-table-scroll">
          <table className="um-table">
            <thead>
              <tr>
                <th>Organizer</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Created</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="um-empty">
                  <Loader2 size={22} className="spin-animation" style={{ margin: '0 auto 8px', display: 'block' }} />
                  Loading organizers...
                </td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="um-empty">No organizer accounts found.</td></tr>
              ) : users.map(user => (
                <tr key={user.id}>
                  <td>
                    <div className="um-user-cell">
                      <div className={`um-avatar ${getAvatarClass(user.role)}`}>
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="um-user-name">{user.username}</div>
                        <div className="um-user-email">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <select
                      className="um-role-select"
                      value={user.role}
                      onChange={e => handleRoleChange(user, e.target.value)}
                    >
                      <option value="Admin">Admin</option>
                      <option value="Auctioneer">Auctioneer</option>
                      <option value="Volunteer">Volunteer</option>
                    </select>
                  </td>
                  <td>
                    <span className={`um-status-badge um-status-badge--${user.is_active ? 'active' : 'inactive'}`}>
                      {user.is_active ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="muted">{formatDate(user.last_login)}</td>
                  <td className="muted">{formatDate(user.created_at)}</td>
                  <td>
                    <div className="um-actions" style={{ justifyContent: 'flex-end' }}>
                      {/* Toggle active */}
                      <button
                        className={`um-icon-btn ${user.is_active ? 'um-icon-btn--danger' : 'um-icon-btn--green'}`}
                        title={user.is_active ? 'Deactivate account' : 'Activate account'}
                        onClick={() => handleToggleStatus(user)}
                      >
                        {user.is_active ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
                      </button>
                      {/* Reset password */}
                      <button
                        className="um-icon-btn um-icon-btn--blue"
                        title="Reset Password"
                        onClick={() => { setResetTarget(user); setNewPwd(''); }}
                      >
                        <RotateCcw size={14} />
                      </button>
                      {/* Delete */}
                      <button
                        className="um-icon-btn um-icon-btn--danger"
                        title="Delete organizer"
                        onClick={() => setDeleteTarget(user)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Create User Modal ─────────────────────────────────────── */}
      {showCreate && (
        <div className="um-modal-backdrop" onClick={() => setShowCreate(false)}>
          <div className="um-modal" onClick={e => e.stopPropagation()}>
            <h3><UserPlus size={18} /> Create New Organizer</h3>
            <div className="um-form-row">
              <div className="um-form-group">
                <label>Username</label>
                <input
                  type="text"
                  placeholder="e.g. john_doe"
                  value={createForm.username}
                  onChange={e => setCreateForm(f => ({ ...f, username: e.target.value }))}
                />
              </div>
              <div className="um-form-group">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="e.g. john@zentrix26.com"
                  value={createForm.email}
                  onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div className="um-form-group">
                <label>Password (min 8 chars)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    placeholder="Secure password"
                    value={createForm.password}
                    onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
                    style={{ paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(p => !p)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
                  >
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="um-form-group">
                <label>Role</label>
                <select
                  value={createForm.role}
                  onChange={e => setCreateForm(f => ({ ...f, role: e.target.value as any }))}
                >
                  <option value="Volunteer">Volunteer — View-only access</option>
                  <option value="Auctioneer">Auctioneer — Auction control + data edit</option>
                  <option value="Admin">Admin — Full system access</option>
                </select>
              </div>
            </div>
            <div className="um-modal-footer">
              <button className="um-btn um-btn--ghost" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="um-btn um-btn--primary" onClick={handleCreate} disabled={isSaving}>
                {isSaving ? <Loader2 size={14} className="spin-animation" /> : <UserPlus size={14} />}
                {isSaving ? 'Creating...' : 'Create Organizer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reset Password Modal ──────────────────────────────────── */}
      {resetTarget && (
        <div className="um-modal-backdrop" onClick={() => setResetTarget(null)}>
          <div className="um-modal" onClick={e => e.stopPropagation()}>
            <h3><RotateCcw size={18} /> Reset Password — {resetTarget.username}</h3>
            <div className="um-form-row">
              <div className="um-form-group">
                <label>New Password (min 8 chars)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNewPwd ? 'text' : 'password'}
                    placeholder="New secure password"
                    value={newPwd}
                    onChange={e => setNewPwd(e.target.value)}
                    style={{ paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPwd(p => !p)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
                  >
                    {showNewPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>
            <div className="um-modal-footer">
              <button className="um-btn um-btn--ghost" onClick={() => setResetTarget(null)}>Cancel</button>
              <button className="um-btn um-btn--primary" onClick={handleResetPassword} disabled={isResetting || newPwd.length < 8}>
                {isResetting ? <Loader2 size={14} className="spin-animation" /> : <RotateCcw size={14} />}
                {isResetting ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ──────────────────────────────────── */}
      {deleteTarget && (
        <div className="um-modal-backdrop" onClick={() => setDeleteTarget(null)}>
          <div className="um-modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ color: '#F87171' }}><AlertTriangle size={18} /> Delete Organizer</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: '0 0 20px' }}>
              Are you sure you want to permanently delete <strong style={{ color: 'var(--color-text-primary)' }}>'{deleteTarget.username}'</strong>? This action cannot be undone.
            </p>
            <div className="um-modal-footer">
              <button className="um-btn um-btn--ghost" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="um-btn um-btn--danger" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? <Loader2 size={14} className="spin-animation" /> : <Trash2 size={14} />}
                {isDeleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
