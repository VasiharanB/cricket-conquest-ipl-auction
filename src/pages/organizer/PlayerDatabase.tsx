import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  Upload,
  Users,
  UserCheck,
  TrendingUp,
  UserX,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Loader2,
  CheckCircle2,
  X,
  Pencil,
  Trash2,
  ShieldCheck,
  Eye,
} from 'lucide-react';
import { Badge, Card, Button, StatCard, Modal, PlayerImportModal, PlayerDetailModal, PlayerEditModal } from '../../components';
import { useAuth } from '../../contexts/AuthContext';
import { playerService } from '../../services/playerService';
import type { PlayerRecord, PlayerStats, ImportResult } from '../../services/playerService';
import './PlayerDatabase.css';

export const PlayerDatabase: React.FC = () => {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('Admin');
  const isAuctioneer = hasRole('Auctioneer');
  const isVolunteer = hasRole('Volunteer') || (!isAdmin && !isAuctioneer);
  const canEdit = isAdmin || isAuctioneer;

  const [players, setPlayers] = useState<PlayerRecord[]>([]);
  const [stats, setStats] = useState<PlayerStats>({ total: 0, available: 0, sold: 0, unsold: 0 });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter State
  const [search, setSearch] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [natFilter, setNatFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Selection State (Selective Deletion)
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(new Set());

  // Modals & Notifications
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerRecord | null>(null);
  const [playerToEdit, setPlayerToEdit] = useState<PlayerRecord | null>(null);

  // Single player delete modal
  const [playerToDelete, setPlayerToDelete] = useState<PlayerRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Bulk selective delete modal
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState<boolean>(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState<boolean>(false);

  // Entire list delete modal
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState<boolean>(false);
  const [deleteAllConfirmInput, setDeleteAllConfirmInput] = useState<string>('');
  const [isDeletingAll, setIsDeletingAll] = useState<boolean>(false);

  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Load players from MySQL API
  const loadPlayers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await playerService.getPlayers({
        limit: 500, // retrieve full pool for client filtering/listing
        search: debouncedSearch,
        role: roleFilter,
        nationality: natFilter,
        status: statusFilter,
      });

      setPlayers(response.players);
      setStats(response.stats);
    } catch (err: any) {
      console.error('Failed to load players:', err);
      setError(err.message || 'Unable to load players. Please ensure the backend server and MySQL are running.');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, roleFilter, natFilter, statusFilter]);

  useEffect(() => {
    loadPlayers();
  }, [loadPlayers]);

  // Auto-dismiss toast after 6 seconds
  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => setSuccessToast(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  const handleImportSuccess = (result: ImportResult) => {
    let msg = `${result.inserted} player${result.inserted === 1 ? '' : 's'} imported successfully.`;
    if (result.skipped > 0) {
      msg += ` (${result.skipped} skipped as duplicate${result.skipped === 1 ? '' : 's'})`;
    }
    setSuccessToast(msg);
    loadPlayers();
  };

  const handleEditSuccess = (updated: PlayerRecord) => {
    setSuccessToast(`Player "${updated.name}" (${updated.id}) updated successfully.`);
    loadPlayers();
  };

  // 1. Single Player Delete
  const handleDeleteConfirm = async () => {
    if (!playerToDelete) return;
    setIsDeleting(true);
    try {
      await playerService.deletePlayer(playerToDelete.id);
      setSuccessToast(`Player "${playerToDelete.name}" (${playerToDelete.id}) deleted successfully.`);
      setSelectedPlayerIds((prev) => {
        const next = new Set(prev);
        next.delete(playerToDelete.id);
        return next;
      });
      setPlayerToDelete(null);
      loadPlayers();
    } catch (err: any) {
      alert(err.message || 'Failed to delete player');
    } finally {
      setIsDeleting(false);
    }
  };

  // 2. Selection Toggle Handlers
  const handleToggleSelectAll = () => {
    const visibleIds = players.map((p) => p.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedPlayerIds.has(id));
    if (allSelected) {
      setSelectedPlayerIds(new Set());
    } else {
      setSelectedPlayerIds(new Set(visibleIds));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedPlayerIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // 3. Bulk Selective Delete
  const handleBulkDeleteConfirm = async () => {
    if (selectedPlayerIds.size === 0) return;
    setIsBulkDeleting(true);
    try {
      const result = await playerService.bulkDeletePlayers(Array.from(selectedPlayerIds));
      setSuccessToast(`Successfully deleted ${result.deletedCount} selected players.`);
      setSelectedPlayerIds(new Set());
      setIsBulkDeleteModalOpen(false);
      loadPlayers();
    } catch (err: any) {
      alert(err.message || 'Failed to delete selected players');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // 4. Delete Entire Player List
  const handleDeleteAllConfirm = async () => {
    if (deleteAllConfirmInput.trim() !== 'DELETE ALL') return;
    setIsDeletingAll(true);
    try {
      const result = await playerService.deleteAllPlayers();
      setSuccessToast(`Entire player list cleared successfully (${result.deletedCount} players deleted).`);
      setSelectedPlayerIds(new Set());
      setIsDeleteAllModalOpen(false);
      setDeleteAllConfirmInput('');
      loadPlayers();
    } catch (err: any) {
      alert(err.message || 'Failed to delete all players');
    } finally {
      setIsDeletingAll(false);
    }
  };

  const statusBadge = (status: 'Available' | 'Sold' | 'Unsold') => {
    const map: Record<string, 'sold' | 'unsold' | 'available'> = {
      Sold: 'sold',
      Unsold: 'unsold',
      Available: 'available',
    };
    return <Badge variant={map[status] || 'available'} dot>{status}</Badge>;
  };

  const roleBadge = (role: string) => {
    const colors: Record<string, string> = {
      Batter: '#3B5BDB',
      Batsman: '#3B5BDB',
      Bowler: '#16A34A',
      'All-rounder': '#7C3AED',
      Wicketkeeper: '#F59E0B',
    };
    return (
      <span
        className="role-tag"
        style={{ '--role-color': colors[role] || '#3B5BDB' } as React.CSSProperties}
      >
        {role}
      </span>
    );
  };

  // Distinct nationalities from loaded players for dynamic filter options
  const uniqueNationalities = Array.from(
    new Set(players.map((p) => p.nationality).filter(Boolean))
  );

  return (
    <div className="player-db">
      {/* Top Header */}
      <div className="player-db__header-row">
        <div>
          <h1 className="dashboard__title">Player Database</h1>
          <p className="dashboard__desc">
            {stats.total} {stats.total === 1 ? 'player' : 'players'} in the auction pool
          </p>
        </div>
        <div className="player-db__actions">
          {isAdmin && (
            <Button
              variant="outline"
              className="player-db__btn-danger-outline"
              icon={<Trash2 size={16} />}
              disabled={stats.total === 0 || isLoading}
              onClick={() => {
                setDeleteAllConfirmInput('');
                setIsDeleteAllModalOpen(true);
              }}
              title="Delete all players from the database"
            >
              DELETE ENTIRE LIST
            </Button>
          )}
          {canEdit && (
            <Button
              variant="primary"
              icon={<Upload size={16} />}
              onClick={() => setIsImportModalOpen(true)}
            >
              IMPORT PLAYERS
            </Button>
          )}
        </div>
      </div>

      {/* Volunteer Mode Informational Banner */}
      {isVolunteer && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 18px',
          background: 'rgba(56, 189, 248, 0.1)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: 10,
          color: '#38BDF8',
          fontSize: 13,
          fontWeight: 500,
          marginBottom: 18,
        }}>
          <ShieldCheck size={18} style={{ flexShrink: 0 }} />
          <span>Volunteer Monitoring Mode: Read-only access to player pool. Import, edit, and deletion features are restricted.</span>
        </div>
      )}

      {/* Success Notification Banner */}
      {successToast && (
        <div className="player-db__toast animate-slide-down">
          <div className="player-db__toast-content">
            <CheckCircle2 size={18} className="player-db__toast-icon" />
            <span>{successToast}</span>
          </div>
          <button
            className="player-db__toast-close"
            onClick={() => setSuccessToast(null)}
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="dashboard__stats player-db__stats-grid">
        <StatCard
          label="Total Players"
          value={stats.total}
          icon={<Users size={20} />}
          accent="blue"
        />
        <StatCard
          label="Available"
          value={stats.available}
          icon={<UserCheck size={20} />}
          accent="green"
        />
        <StatCard
          label="Sold"
          value={stats.sold}
          icon={<TrendingUp size={20} />}
          accent="purple"
        />
        <StatCard
          label="Unsold"
          value={stats.unsold}
          icon={<UserX size={20} />}
          accent="orange"
        />
      </div>

      {/* Error Banner */}
      {error && !isLoading && (
        <div className="player-db__error-card">
          <div className="player-db__error-content">
            <AlertCircle size={24} className="player-db__error-icon" />
            <div>
              <h3 className="player-db__error-title">Unable to load players</h3>
              <p className="player-db__error-desc">{error}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw size={14} />}
            onClick={() => loadPlayers()}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Selective Actions Floating Bar */}
      {isAdmin && selectedPlayerIds.size > 0 && (
        <div className="player-db__selection-banner animate-fade-in">
          <div className="player-db__selection-info">
            <CheckCircle2 size={18} className="player-db__selection-check-icon" />
            <span className="player-db__selection-count">
              <strong>{selectedPlayerIds.size}</strong> {selectedPlayerIds.size === 1 ? 'player' : 'players'} selected
            </span>
            <button
              className="player-db__btn-link"
              onClick={() => setSelectedPlayerIds(new Set())}
            >
              Deselect All
            </button>
          </div>
          <div className="player-db__selection-actions">
            <Button
              variant="danger"
              size="sm"
              icon={<Trash2 size={15} />}
              onClick={() => setIsBulkDeleteModalOpen(true)}
            >
              Delete Selected ({selectedPlayerIds.size})
            </Button>
          </div>
        </div>
      )}

      {/* Table Card */}
      <Card padding="none">
        <div className="dashboard__table-header">
          <div className="search-input" style={{ minWidth: 240 }}>
            <Search size={16} />
            <input
              placeholder="Search by name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="dashboard__table-controls">
            <div className="filter-select">
              <Filter size={14} />
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                <option value="all">All Roles</option>
                <option value="Batter">Batter</option>
                <option value="Bowler">Bowler</option>
                <option value="All-rounder">All-rounder</option>
                <option value="Wicketkeeper">Wicketkeeper</option>
              </select>
            </div>
            <div className="filter-select">
              <select value={natFilter} onChange={(e) => setNatFilter(e.target.value)}>
                <option value="all">All Nationalities</option>
                <option value="Indian">Indian</option>
                <option value="Overseas">Overseas</option>
                {uniqueNationalities
                  .filter((n) => n !== 'Indian' && n !== 'Overseas')
                  .map((nat) => (
                    <option key={nat} value={nat}>
                      {nat}
                    </option>
                  ))}
              </select>
            </div>
            <div className="filter-select">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Status</option>
                <option value="Available">Available</option>
                <option value="Sold">Sold</option>
                <option value="Unsold">Unsold</option>
              </select>
            </div>
          </div>
        </div>

        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                {isAdmin && (
                  <th className="player-db__th-check" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      className="player-db__checkbox"
                      checked={players.length > 0 && players.every((p) => selectedPlayerIds.has(p.id))}
                      ref={(el) => {
                        if (el) {
                          const someSelected = players.some((p) => selectedPlayerIds.has(p.id));
                          const allSelected = players.length > 0 && players.every((p) => selectedPlayerIds.has(p.id));
                          el.indeterminate = someSelected && !allSelected;
                        }
                      }}
                      onChange={handleToggleSelectAll}
                      title="Select or deselect all visible players"
                      aria-label="Select or deselect all visible players"
                    />
                  </th>
                )}
                <th>Player ID</th>
                <th>Player Name</th>
                <th>Role</th>
                <th>Category</th>
                <th>Nationality</th>
                <th>Base Price</th>
                <th>Rating</th>
                <th>Status</th>
                <th>Sold For</th>
                <th className="player-db__th-actions">{isVolunteer ? 'Details' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && players.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 11 : 10} className="player-db__loading-cell">
                    <Loader2 className="animate-spin" size={24} />
                    <span>Loading players from MySQL...</span>
                  </td>
                </tr>
              ) : players.length > 0 ? (
                players.map((p) => (
                  <tr
                    key={p.id}
                    className={`player-db__row ${selectedPlayerIds.has(p.id) ? 'player-db__row--selected' : ''}`}
                    onClick={() => setSelectedPlayer(p)}
                    title="Click to view player details"
                  >
                    {isAdmin && (
                      <td
                        className="player-db__td-check"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          className="player-db__checkbox"
                          checked={selectedPlayerIds.has(p.id)}
                          onChange={() => handleToggleSelectOne(p.id)}
                          aria-label={`Select ${p.name}`}
                        />
                      </td>
                    )}
                    <td className="data-table__mono">{p.id}</td>
                    <td className="data-table__bold">{p.name}</td>
                    <td>{roleBadge(p.role)}</td>
                    <td className="player-db__spec">{p.playerCategory || '—'}</td>
                    <td>
                      <span className={`nat-tag nat-tag--${p.nationality.toLowerCase()}`}>
                        {p.nationality}
                      </span>
                    </td>
                    <td>₹{p.basePrice} Cr</td>
                    <td>{p.rating !== null && p.rating !== undefined ? p.rating : '—'}</td>
                    <td>{statusBadge(p.status)}</td>
                    <td>{p.soldFor ? `₹${p.soldFor} Cr` : '—'}</td>
                    <td
                      className="player-db__actions-cell"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {canEdit && (
                        <button
                          className="player-db__action-btn player-db__action-btn--edit"
                          title={`Edit ${p.name}`}
                          onClick={() => setPlayerToEdit(p)}
                          aria-label={`Edit ${p.name}`}
                        >
                          <Pencil size={15} />
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          className="player-db__action-btn player-db__action-btn--delete"
                          title={`Delete ${p.name}`}
                          onClick={() => setPlayerToDelete(p)}
                          aria-label={`Delete ${p.name}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                      {isVolunteer && (
                        <button
                          className="player-db__action-btn"
                          style={{ color: '#38BDF8', borderColor: 'rgba(56, 189, 248, 0.3)' }}
                          title={`View details for ${p.name}`}
                          onClick={() => setSelectedPlayer(p)}
                          aria-label={`View ${p.name}`}
                        >
                          <Eye size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isAdmin ? 11 : 10} className="data-table__empty">
                    {debouncedSearch || roleFilter !== 'all' || natFilter !== 'all' || statusFilter !== 'all'
                      ? 'No players found matching your search or filters.'
                      : 'No players in the database yet. Click "IMPORT PLAYERS" above to load an Excel master file.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Import Modal */}
      <PlayerImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={handleImportSuccess}
      />

      {/* Player Detail View Modal */}
      <PlayerDetailModal
        player={selectedPlayer}
        isOpen={Boolean(selectedPlayer)}
        onClose={() => setSelectedPlayer(null)}
      />

      {/* Player Edit Modal */}
      <PlayerEditModal
        player={playerToEdit}
        isOpen={Boolean(playerToEdit)}
        onClose={() => setPlayerToEdit(null)}
        onSuccess={handleEditSuccess}
      />

      {/* 1. Single Player Delete Confirmation Modal */}
      {playerToDelete && (
        <Modal
          isOpen={Boolean(playerToDelete)}
          onClose={() => !isDeleting && setPlayerToDelete(null)}
          title="Delete Player"
          size="sm"
        >
          <div className="player-db__delete-modal">
            <p className="player-db__delete-message">
              Are you sure you want to remove <strong>{playerToDelete.name}</strong> (<code>{playerToDelete.id}</code>) from the player pool?
            </p>
            <p className="player-db__delete-warning">
              This will permanently delete the player from the database.
            </p>
            <div className="player-db__delete-actions">
              <Button
                variant="outline"
                onClick={() => setPlayerToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                icon={isDeleting ? <Loader2 className="animate-spin" size={15} /> : <Trash2 size={15} />}
              >
                {isDeleting ? 'Deleting...' : 'Delete Player'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 2. Selective / Bulk Delete Confirmation Modal */}
      {isBulkDeleteModalOpen && (
        <Modal
          isOpen={isBulkDeleteModalOpen}
          onClose={() => !isBulkDeleting && setIsBulkDeleteModalOpen(false)}
          title="Delete Selected Players"
          size="md"
        >
          <div className="player-db__delete-modal">
            <div className="player-db__delete-modal-warning">
              <AlertTriangle size={24} className="player-db__warning-icon" />
              <div>
                <h4 className="player-db__warning-title">Confirm Selective Deletion</h4>
                <p className="player-db__warning-text">
                  You are about to permanently delete <strong>{selectedPlayerIds.size}</strong> selected {selectedPlayerIds.size === 1 ? 'player' : 'players'} from the database.
                </p>
              </div>
            </div>

            <div className="player-db__selected-preview">
              <div className="player-db__selected-preview-label">Players to be removed:</div>
              <div className="player-db__selected-chips">
                {players
                  .filter((p) => selectedPlayerIds.has(p.id))
                  .slice(0, 10)
                  .map((p) => (
                    <span key={p.id} className="player-db__selected-chip">
                      {p.name} <small>({p.id})</small>
                    </span>
                  ))}
                {selectedPlayerIds.size > 10 && (
                  <span className="player-db__selected-chip player-db__selected-chip--more">
                    +{selectedPlayerIds.size - 10} more
                  </span>
                )}
              </div>
            </div>

            <p className="player-db__delete-warning">
              This action cannot be undone. Auction queues, bids, and purchases linked to these players will be removed.
            </p>

            <div className="player-db__delete-actions">
              <Button
                variant="outline"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                disabled={isBulkDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleBulkDeleteConfirm}
                disabled={isBulkDeleting}
                icon={isBulkDeleting ? <Loader2 className="animate-spin" size={15} /> : <Trash2 size={15} />}
              >
                {isBulkDeleting ? 'Deleting Selected...' : `Delete ${selectedPlayerIds.size} Players`}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 3. Delete Entire List Confirmation Modal */}
      {isDeleteAllModalOpen && (
        <Modal
          isOpen={isDeleteAllModalOpen}
          onClose={() => !isDeletingAll && setIsDeleteAllModalOpen(false)}
          title="Delete Entire Player Pool"
          size="md"
        >
          <div className="player-db__delete-modal">
            <div className="player-db__delete-modal-danger">
              <AlertTriangle size={28} className="player-db__danger-icon" />
              <div>
                <h4 className="player-db__danger-title">CRITICAL: Clear All Players</h4>
                <p className="player-db__danger-text">
                  This will permanently delete <strong>ALL {stats.total} players</strong> from the database, reset the auction queue, and wipe all unsold/sold records.
                </p>
              </div>
            </div>

            <div className="player-db__confirm-input-group">
              <label htmlFor="confirm-delete-all" className="player-db__confirm-label">
                To confirm wiping the entire player pool, please type <strong>DELETE ALL</strong> below:
              </label>
              <input
                id="confirm-delete-all"
                type="text"
                className="player-db__confirm-input"
                placeholder="Type DELETE ALL"
                value={deleteAllConfirmInput}
                onChange={(e) => setDeleteAllConfirmInput(e.target.value)}
                autoComplete="off"
                disabled={isDeletingAll}
              />
            </div>

            <div className="player-db__delete-actions">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteAllModalOpen(false);
                  setDeleteAllConfirmInput('');
                }}
                disabled={isDeletingAll}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteAllConfirm}
                disabled={deleteAllConfirmInput.trim() !== 'DELETE ALL' || isDeletingAll}
                icon={isDeletingAll ? <Loader2 className="animate-spin" size={15} /> : <Trash2 size={15} />}
              >
                {isDeletingAll ? 'Deleting Entire List...' : 'Permanently Delete All Players'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

