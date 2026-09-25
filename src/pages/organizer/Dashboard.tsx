import React, { useState, useEffect, useCallback } from 'react';
import { Users, UserCheck, Radio, Search, Filter, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { StatCard, Badge, Card, Button } from '../../components';
import { teamService } from '../../services/teamService';
import type { TeamRecord, TeamStats } from '../../services/teamService';
import './Dashboard.css';

export const Dashboard: React.FC = () => {
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

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await teamService.getTeams({
        search: debouncedSearch,
        status: statusFilter,
      });
      setTeams(response.teams);
      setStats(response.stats);
    } catch (err: any) {
      console.error('Dashboard load error:', err);
      setError(err.message || 'Unable to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const statusBadge = (status: string) => {
    const map: Record<string, 'confirmed' | 'pending' | 'checked-in' | 'waitlisted'> = {
      CONFIRMED: 'confirmed',
      PENDING: 'pending',
      WAITLISTED: 'waitlisted',
      CANCELLED: 'waitlisted',
    };
    return <Badge variant={map[status] || 'info'} dot>{status.toLowerCase()}</Badge>;
  };

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <div>
          <h1 className="dashboard__title">Dashboard</h1>
          <p className="dashboard__desc">Cricket Conquest — Organizer Control Center</p>
        </div>
      </div>

      {error && !isLoading && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--space-3) var(--space-4)',
            background: 'var(--color-danger-soft)',
            color: 'var(--color-danger)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-6)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" icon={<RefreshCw size={14} />} onClick={loadDashboardData}>
            Retry
          </Button>
        </div>
      )}

      {/* Stats from MySQL */}
      <div className="dashboard__stats">
        <StatCard
          label="Registered Teams"
          value={`${stats.registeredTeams} / ${stats.maxTeams}`}
          icon={<Users size={20} />}
          accent="blue"
        />
        <StatCard
          label="Total Participants"
          value={stats.totalParticipants}
          icon={<Users size={20} />}
          accent="purple"
        />
        <StatCard
          label="Checked In"
          value={stats.checkedIn}
          icon={<UserCheck size={20} />}
          accent="green"
        />
        <StatCard
          label="Confirmed Teams"
          value={stats.confirmedTeams}
          icon={<Radio size={20} />}
          accent="orange"
        />
      </div>

      {/* Registration Table from MySQL */}
      <Card padding="none" className="dashboard__table-card">
        <div className="dashboard__table-header">
          <h2 className="dashboard__table-title">Registration Overview ({stats.registeredTeams})</h2>
          <div className="dashboard__table-controls">
            <div className="search-input">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search teams..."
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
          </div>
        </div>

        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Team ID</th>
                <th>Team Name</th>
                <th>College</th>
                <th>Captain</th>
                <th>Members</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && teams.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                    <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto 8px auto' }} />
                    <span style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
                      Loading overview from MySQL...
                    </span>
                  </td>
                </tr>
              ) : teams.length > 0 ? (
                teams.map((t) => (
                  <tr key={t.teamId}>
                    <td className="data-table__mono">{t.teamId}</td>
                    <td className="data-table__bold">{t.teamName}</td>
                    <td>{t.collegeName}</td>
                    <td>{t.captainName}</td>
                    <td>{t.memberCount}</td>
                    <td>{statusBadge(t.registrationStatus)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="data-table__empty">
                    {debouncedSearch || statusFilter !== 'all'
                      ? 'No teams found matching search or filter criteria.'
                      : 'No teams registered yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
