import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Upload, Users, UserCheck, TrendingUp, UserX, AlertCircle, RefreshCw, Loader2, CheckCircle2, X, Pencil, Trash2 } from 'lucide-react';
import { Badge, Card, Button, StatCard, Modal, PlayerImportModal, PlayerDetailModal, PlayerEditModal } from '../../components';
import { playerService } from '../../services/playerService';
import type { PlayerRecord, PlayerStats, ImportResult } from '../../services/playerService';
import './PlayerDatabase.css';

export const PlayerDatabase: React.FC = () => {
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

  // Modals & Notifications
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerRecord | null>(null);
  const [playerToEdit, setPlayerToEdit] = useState<PlayerRecord | null>(null);
  const [playerToDelete, setPlayerToDelete] = useState<PlayerRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
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
        limit: 200, // retrieve full pool for client filtering/listing
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

  const handleDeleteConfirm = async () => {
    if (!playerToDelete) return;
    setIsDeleting(true);
    try {
      await playerService.deletePlayer(playerToDelete.id);
      setSuccessToast(`Player "${playerToDelete.name}" (${playerToDelete.id}) deleted successfully.`);
      setPlayerToDelete(null);
      loadPlayers();
    } catch (err: any) {
      alert(err.message || 'Failed to delete player');
    } finally {
      setIsDeleting(false);
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
          <Button
            variant="primary"
            icon={<Upload size={16} />}
            onClick={() => setIsImportModalOpen(true)}
          >
            IMPORT PLAYERS
          </Button>
        </div>
      </div>

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
                <th>Player ID</th>
                <th>Player Name</th>
                <th>Role</th>
                <th>Category</th>
                <th>Nationality</th>
                <th>Base Price</th>
                <th>Rating</th>
                <th>Status</th>
                <th>Sold For</th>
                <th className="player-db__th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && players.length === 0 ? (
                <tr>
                  <td colSpan={10} className="player-db__loading-cell">
                    <Loader2 className="animate-spin" size={24} />
                    <span>Loading players from MySQL...</span>
                  </td>
                </tr>
              ) : players.length > 0 ? (
                players.map((p) => (
                  <tr
                    key={p.id}
                    className="player-db__row"
                    onClick={() => setSelectedPlayer(p)}
                    title="Click to view player details"
                  >
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
                      <button
                        className="player-db__action-btn player-db__action-btn--edit"
                        title={`Edit ${p.name}`}
                        onClick={() => setPlayerToEdit(p)}
                        aria-label={`Edit ${p.name}`}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        className="player-db__action-btn player-db__action-btn--delete"
                        title={`Delete ${p.name}`}
                        onClick={() => setPlayerToDelete(p)}
                        aria-label={`Delete ${p.name}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="data-table__empty">
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

      {/* Delete Confirmation Modal */}
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
    </div>
  );
};
