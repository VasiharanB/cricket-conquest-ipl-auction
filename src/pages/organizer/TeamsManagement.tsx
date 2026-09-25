import React, { useState, useEffect, useCallback } from 'react';
import { Search, X, Loader2, AlertCircle, RefreshCw, CheckCircle2, Filter, Pencil, Trash2 } from 'lucide-react';
import { Badge, Card, Button, ProgressBar, Modal, TeamEditModal } from '../../components';
import { teamService } from '../../services/teamService';
import type { TeamRecord, TeamStats } from '../../services/teamService';
import './TeamsManagement.css';

export const TeamsManagement: React.FC = () => {
  const [teams, setTeams] = useState<TeamRecord[]>([]);
  const [stats, setStats] = useState<TeamStats>({
    registeredTeams: 0,
    confirmedTeams: 0,
    checkedIn: 0,
    totalParticipants: 0,
    maxTeams: 16,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters
  const [search, setSearch] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [checkInFilter, setCheckInFilter] = useState<string>('all');

  // Detail & Action State
  const [selectedTeam, setSelectedTeam] = useState<TeamRecord | null>(null);
  const [isUpdatingCheckIn, setIsUpdatingCheckIn] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Edit & Delete Modals
  const [editingTeam, setEditingTeam] = useState<TeamRecord | null>(null);
  const [deletingTeam, setDeletingTeam] = useState<TeamRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Load teams from MySQL API
  const loadTeams = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await teamService.getTeams({
        search: debouncedSearch,
        status: statusFilter,
        checkIn: checkInFilter,
      });

      setTeams(response.teams);
      setStats(response.stats);

      // Keep selected team in sync with refreshed data
      if (selectedTeam) {
        const updated = response.teams.find((t) => t.teamId === selectedTeam.teamId);
        if (updated) setSelectedTeam(updated);
      }
    } catch (err: any) {
      console.error('Failed to load teams:', err);
      setError(err.message || 'Unable to load teams. Please ensure MySQL and backend server are running.');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, statusFilter, checkInFilter, selectedTeam?.teamId]);

  useEffect(() => {
    loadTeams();
  }, [debouncedSearch, statusFilter, checkInFilter]);

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleToggleCheckIn = async (team: TeamRecord) => {
    setIsUpdatingCheckIn(true);
    const nextStatus = team.checkInStatus === 'CHECKED_IN' ? 'NOT_CHECKED_IN' : 'CHECKED_IN';
    try {
      const updated = await teamService.updateCheckInStatus(team.teamId, nextStatus);
      setSelectedTeam(updated);
      setToastMessage(
        nextStatus === 'CHECKED_IN'
          ? `Team '${team.teamName}' checked in successfully!`
          : `Team '${team.teamName}' check-in removed.`
      );
      loadTeams();
    } catch (err: any) {
      alert(err.message || 'Failed to update check-in status');
    } finally {
      setIsUpdatingCheckIn(false);
    }
  };

  const handleStatusChange = async (team: TeamRecord, newStatus: any) => {
    try {
      const updated = await teamService.updateTeamStatus(team.teamId, newStatus);
      setSelectedTeam(updated);
      setToastMessage(`Team '${team.teamName}' status updated to ${newStatus}.`);
      loadTeams();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingTeam) return;

    setIsDeleting(true);
    try {
      await teamService.deleteTeam(deletingTeam.teamId);
      if (selectedTeam?.teamId === deletingTeam.teamId) {
        setSelectedTeam(null);
      }
      setToastMessage(`Team '${deletingTeam.teamName}' (${deletingTeam.teamId}) deleted successfully.`);
      setDeletingTeam(null);
      loadTeams();
    } catch (err: any) {
      console.error('Delete team error:', err);
      alert(err.message || 'Failed to delete team');
    } finally {
      setIsDeleting(false);
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, 'confirmed' | 'pending' | 'checked-in' | 'waitlisted'> = {
      CONFIRMED: 'confirmed',
      PENDING: 'pending',
      WAITLISTED: 'waitlisted',
      CANCELLED: 'waitlisted',
    };
    return <Badge variant={map[status] || 'info'} dot>{status.toLowerCase()}</Badge>;
  };

  const checkInBadge = (checkInStatus: string) => {
    if (checkInStatus === 'CHECKED_IN') {
      return <Badge variant="checked-in" dot>Checked In</Badge>;
    }
    return <span className="text-secondary text-xs font-medium">Not Checked In</span>;
  };

  return (
    <div className="teams-mgmt">
      <div className="teams-mgmt__header">
        <div>
          <h1 className="dashboard__title">Teams Management</h1>
          <p className="dashboard__desc">Manage registered teams, participant rosters, and event check-in</p>
        </div>
      </div>

      {toastMessage && (
        <div className="teams-mgmt__toast animate-slide-down">
          <CheckCircle2 size={18} />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="teams-mgmt__toast-close">
            <X size={14} />
          </button>
        </div>
      )}

      {error && !isLoading && (
        <div className="teams-mgmt__error-card">
          <div className="teams-mgmt__error-content">
            <AlertCircle size={24} className="text-danger" />
            <div>
              <h3 className="teams-mgmt__error-title">Unable to load teams</h3>
              <p className="teams-mgmt__error-desc">{error}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" icon={<RefreshCw size={14} />} onClick={() => loadTeams()}>
            Retry
          </Button>
        </div>
      )}

      <div className="teams-mgmt__layout">
        <div className="teams-mgmt__main">
          <Card padding="none">
            <div className="dashboard__table-header">
              <h2 className="dashboard__table-title">All Teams ({stats.registeredTeams})</h2>
              <div className="dashboard__table-controls">
                <div className="search-input" style={{ minWidth: 220 }}>
                  <Search size={16} />
                  <input
                    placeholder="Search ID, name, captain, college..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="filter-select">
                  <Filter size={14} />
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="all">All Status</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="PENDING">Pending</option>
                    <option value="WAITLISTED">Waitlisted</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
                <div className="filter-select">
                  <select value={checkInFilter} onChange={(e) => setCheckInFilter(e.target.value)}>
                    <option value="all">All Check-In</option>
                    <option value="CHECKED_IN">Checked In</option>
                    <option value="NOT_CHECKED_IN">Not Checked In</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Team ID</th>
                    <th>Team Name</th>
                    <th>Captain</th>
                    <th>Members</th>
                    <th>College</th>
                    <th>Status</th>
                    <th>Check-In</th>
                    <th>Purse</th>
                    <th>Players</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading && teams.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="player-db__loading-cell">
                        <Loader2 className="animate-spin" size={24} />
                        <span>Loading teams from MySQL...</span>
                      </td>
                    </tr>
                  ) : teams.length > 0 ? (
                    teams.map((t) => (
                      <tr
                        key={t.teamId}
                        className={`${selectedTeam?.teamId === t.teamId ? 'data-table__row--selected' : ''}`}
                        onClick={() => setSelectedTeam(t)}
                        style={{ cursor: 'pointer' }}
                        title="Click to view team details & roster"
                      >
                        <td className="data-table__mono">{t.teamId}</td>
                        <td className="data-table__bold">{t.teamName}</td>
                        <td>{t.captainName}</td>
                        <td>{t.memberCount}</td>
                        <td className="teams-mgmt__college-cell" title={t.collegeName}>
                          {t.collegeName}
                        </td>
                        <td>{statusBadge(t.registrationStatus)}</td>
                        <td>{checkInBadge(t.checkInStatus)}</td>
                        <td>₹{t.remainingPurse} Cr</td>
                        <td>{t.playersBought}</td>
                        <td
                          className="teams-mgmt__actions-cell"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            className="teams-mgmt__action-btn teams-mgmt__action-btn--edit"
                            title={`Edit ${t.teamName}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTeam(t);
                            }}
                            aria-label={`Edit ${t.teamName}`}
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            className="teams-mgmt__action-btn teams-mgmt__action-btn--delete"
                            title={`Delete ${t.teamName}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingTeam(t);
                            }}
                            aria-label={`Delete ${t.teamName}`}
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} className="data-table__empty">
                        {debouncedSearch || statusFilter !== 'all' || checkInFilter !== 'all'
                          ? 'No teams match your search or filter criteria.'
                          : 'No teams registered yet. Participant registrations will appear here in real time.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Detail Panel */}
        {selectedTeam && (
          <div className="team-detail animate-slide-up">
            <Card padding="none">
              <div className="team-detail__header">
                <div>
                  <h3 className="team-detail__name">{selectedTeam.teamName}</h3>
                  <span className="data-table__mono text-xs text-secondary">{selectedTeam.teamId}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button
                    className="team-detail__close"
                    title="Edit Team"
                    onClick={() => setEditingTeam(selectedTeam)}
                    aria-label="Edit Team"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    className="team-detail__close"
                    title="Delete Team"
                    style={{ color: 'var(--color-danger)' }}
                    onClick={() => setDeletingTeam(selectedTeam)}
                    aria-label="Delete Team"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button className="team-detail__close" onClick={() => setSelectedTeam(null)} aria-label="Close detail panel">
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="team-detail__body">
                <div className="team-detail__row">
                  <span className="team-detail__label">College</span>
                  <span className="team-detail__value text-right" style={{ maxWidth: 200, fontSize: 13 }}>
                    {selectedTeam.collegeName}
                  </span>
                </div>

                <div className="team-detail__row">
                  <span className="team-detail__label">Captain</span>
                  <span className="team-detail__value">{selectedTeam.captainName}</span>
                </div>

                {selectedTeam.accessCode && (
                  <div className="team-detail__row" style={{ background: 'rgba(0, 245, 155, 0.08)', padding: '6px 10px', borderRadius: 6, margin: '4px 0' }}>
                    <span className="team-detail__label" style={{ color: '#00F59B', fontWeight: 600 }}>Access Code</span>
                    <span className="team-detail__value" style={{ color: '#00F59B', fontFamily: 'monospace', fontWeight: 700 }}>
                      {selectedTeam.accessCode}
                    </span>
                  </div>
                )}

                <div className="team-detail__row">
                  <span className="team-detail__label">Contact</span>
                  <span className="team-detail__value text-right text-xs">
                    {selectedTeam.captainEmail}<br />
                    {selectedTeam.captainPhone}
                  </span>
                </div>

                <div className="team-detail__row">
                  <span className="team-detail__label">Registration</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {statusBadge(selectedTeam.registrationStatus)}
                    <select
                      value={selectedTeam.registrationStatus}
                      onChange={(e) => handleStatusChange(selectedTeam, e.target.value)}
                      className="teams-mgmt__status-select"
                    >
                      <option value="CONFIRMED">CONFIRMED</option>
                      <option value="PENDING">PENDING</option>
                      <option value="WAITLISTED">WAITLISTED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </div>
                </div>

                <div className="team-detail__row">
                  <span className="team-detail__label">Event Check-In</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {checkInBadge(selectedTeam.checkInStatus)}
                    <Button
                      size="sm"
                      variant={selectedTeam.checkInStatus === 'CHECKED_IN' ? 'outline' : 'primary'}
                      onClick={() => handleToggleCheckIn(selectedTeam)}
                      disabled={isUpdatingCheckIn}
                      icon={isUpdatingCheckIn ? <Loader2 className="animate-spin" size={12} /> : undefined}
                    >
                      {selectedTeam.checkInStatus === 'CHECKED_IN' ? 'Undo' : 'Check In'}
                    </Button>
                  </div>
                </div>

                <div className="team-detail__row">
                  <span className="team-detail__label">Starting Purse</span>
                  <span className="team-detail__value">₹{selectedTeam.startingPurse} Cr</span>
                </div>

                <div className="team-detail__row">
                  <span className="team-detail__label">Remaining Purse</span>
                  <span className="team-detail__value team-detail__value--highlight">
                    ₹{selectedTeam.remainingPurse} Cr
                  </span>
                </div>

                {/* Team Roster (Only existing real members) */}
                <div className="team-detail__section">
                  <span className="team-detail__section-title">
                    Team Members ({selectedTeam.members.length})
                  </span>
                  <div className="team-detail__members-list">
                    {selectedTeam.members.map((m) => (
                      <div key={m.memberNumber} className="team-detail__member-item">
                        <div className="team-detail__member-info">
                          <span className="team-detail__member-name">
                            {m.fullName} {m.isCaptain ? '👑 (Captain)' : ''}
                          </span>
                          {m.phone && <span className="team-detail__member-contact">{m.phone}</span>}
                        </div>
                        <span className="data-table__mono text-xs text-secondary">
                          #{m.memberNumber}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Squad Progress */}
                <div className="team-detail__section">
                  <ProgressBar
                    label="Squad Progress"
                    value={selectedTeam.playersBought}
                    max={11}
                    color="blue"
                  />
                </div>

                {/* Panel Actions */}
                <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Pencil size={14} />}
                    fullWidth
                    onClick={() => setEditingTeam(selectedTeam)}
                  >
                    Edit Team
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Trash2 size={14} />}
                    style={{ color: 'var(--color-danger)' }}
                    onClick={() => setDeletingTeam(selectedTeam)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Edit Team Modal */}
      {editingTeam && (
        <TeamEditModal
          team={editingTeam}
          isOpen={!!editingTeam}
          onClose={() => setEditingTeam(null)}
          onSuccess={(updated) => {
            loadTeams();
            setToastMessage(`Team '${updated.teamName}' (${updated.teamId}) updated successfully.`);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingTeam && (
        <Modal
          isOpen={!!deletingTeam}
          onClose={() => setDeletingTeam(null)}
          title="Delete Team Confirmation"
          size="sm"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
              Are you sure you want to delete <strong>{deletingTeam.teamName}</strong> ({deletingTeam.teamId}) from <strong>{deletingTeam.collegeName}</strong>?
            </p>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: 'var(--space-3)',
                background: 'var(--color-danger-soft)',
                color: 'var(--color-danger)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-size-xs)',
                border: '1px solid color-mix(in srgb, var(--color-danger) 25%, transparent)',
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>
                This will permanently delete this team and all its {deletingTeam.memberCount} registered member records from MySQL. This action cannot be undone.
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
              <Button variant="outline" onClick={() => setDeletingTeam(null)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button
                variant="primary"
                style={{ background: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="animate-spin" size={14} />
                    Deleting...
                  </>
                ) : (
                  'Delete Team'
                )}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
