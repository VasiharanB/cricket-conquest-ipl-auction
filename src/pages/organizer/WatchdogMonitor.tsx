import React, { useState, useEffect, useCallback } from 'react';
import { RotateCcw, Search } from 'lucide-react';
import { Card } from '../../components';
import { participantService, type WatchdogTeam } from '../../services/participantService';
import { authService } from '../../services/authService';
import { useAuctionSocket } from '../../hooks/useAuctionSocket';

export const WatchdogMonitor: React.FC = () => {
  const [teams, setTeams] = useState<WatchdogTeam[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [search, setSearch] = useState<string>('');
  const [filter, setFilter] = useState<'all' | 'alerts' | 'online'>('all');

  const token = authService.getToken() || '';

  const loadData = useCallback(async () => {
    if (!token) return;
    try {
      const data = await participantService.getWatchdogData(token);
      setTeams(data.teams);
      setActivities(data.activities);
    } catch (err) {
      console.warn('Watchdog load error:', err);
    }
  }, [token]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // 5s live polling
    return () => clearInterval(interval);
  }, [loadData]);

  // WebSocket instant sync
  useAuctionSocket({
    onStateUpdate: () => loadData(),
  });

  const handleResolve = async (teamId: number) => {
    try {
      await participantService.resolveHelp(teamId, token);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to resolve help');
    }
  };

  const filteredTeams = teams.filter((t) => {
    const matchSearch =
      t.teamName.toLowerCase().includes(search.toLowerCase()) ||
      t.teamId.toLowerCase().includes(search.toLowerCase()) ||
      t.collegeName.toLowerCase().includes(search.toLowerCase());

    if (!matchSearch) return false;
    if (filter === 'alerts') return t.supportRequested;
    if (filter === 'online') return t.isOnline;
    return true;
  });

  const alertCount = teams.filter((t) => t.supportRequested).length;
  const onlineCount = teams.filter((t) => t.isOnline).length;

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1400, margin: '0 auto', color: '#F8FAFC' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 className="dashboard__title" style={{ margin: 0 }}>Helper & Watchdog Console</h1>
            <span style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38BDF8', border: '1px solid rgba(56, 189, 248, 0.4)', padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
              ANTI-MALPRACTICE WATCHDOG
            </span>
          </div>
          <p className="dashboard__desc" style={{ marginTop: 4 }}>
            Monitor live contestant presence, auction room attendance, and provide rapid assistance for technical issues.
          </p>
        </div>

        <button
          onClick={loadData}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 8,
            color: '#F8FAFC',
            padding: '8px 14px',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          <RotateCcw size={14} />
          <span>Sync Now</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18, marginBottom: 24 }}>
        <div style={{ background: 'rgba(13, 23, 42, 0.7)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 20 }}>
          <div style={{ fontSize: 12, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>Active Contestants</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#00F59B', marginTop: 6 }}>
            {onlineCount} <span style={{ fontSize: 14, color: '#64748B' }}>/ {teams.length} Teams Online</span>
          </div>
        </div>

        <div style={{ background: alertCount > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(13, 23, 42, 0.7)', border: alertCount > 0 ? '1px solid #EF4444' : '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 20 }}>
          <div style={{ fontSize: 12, color: alertCount > 0 ? '#F87171' : '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>Pending Help Requests</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: alertCount > 0 ? '#EF4444' : '#FFFFFF', marginTop: 6 }}>
            {alertCount} <span style={{ fontSize: 14, color: '#94A3B8' }}>Require Assistance</span>
          </div>
        </div>

        <div style={{ background: 'rgba(13, 23, 42, 0.7)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 20 }}>
          <div style={{ fontSize: 12, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>Checked-In Teams</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#38BDF8', marginTop: 6 }}>
            {teams.filter((t) => t.checkInStatus === 'CHECKED_IN').length} <span style={{ fontSize: 14, color: '#64748B' }}>Verified</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setFilter('all')}
            style={{
              padding: '6px 16px',
              borderRadius: 8,
              border: 'none',
              background: filter === 'all' ? '#38BDF8' : 'rgba(255,255,255,0.06)',
              color: filter === 'all' ? '#050814' : '#F8FAFC',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            All Teams ({teams.length})
          </button>
          <button
            onClick={() => setFilter('alerts')}
            style={{
              padding: '6px 16px',
              borderRadius: 8,
              border: 'none',
              background: filter === 'alerts' ? '#EF4444' : 'rgba(255,255,255,0.06)',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            ⚠️ Help Requests ({alertCount})
          </button>
          <button
            onClick={() => setFilter('online')}
            style={{
              padding: '6px 16px',
              borderRadius: 8,
              border: 'none',
              background: filter === 'online' ? '#00F59B' : 'rgba(255,255,255,0.06)',
              color: filter === 'online' ? '#050814' : '#F8FAFC',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            🟢 Online Now ({onlineCount})
          </button>
        </div>

        <div style={{ position: 'relative', width: 280 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
          <input
            type="text"
            placeholder="Search teams or colleges..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 8,
              padding: '8px 14px 8px 36px',
              color: '#FFFFFF',
              fontSize: 13,
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Main Watchdog Table */}
      <Card padding="none">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Team ID</th>
                <th>Team & College</th>
                <th>Presence</th>
                <th>Current Page</th>
                <th>Captain & Phone</th>
                <th>Access Code</th>
                <th>Purse / Squad</th>
                <th>Support Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeams.map((t) => (
                <tr key={t.id} style={{ background: t.supportRequested ? 'rgba(239, 68, 68, 0.08)' : undefined }}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#38BDF8' }}>{t.teamId}</td>
                  <td>
                    <div style={{ fontWeight: 800 }}>{t.teamName}</div>
                    <div style={{ fontSize: 12, color: '#94A3B8' }}>{t.collegeName}</div>
                  </td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: t.isOnline ? '#00F59B' : '#64748B' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.isOnline ? '#00F59B' : '#64748B' }} />
                      {t.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 4, background: t.currentPage === 'auction' ? 'rgba(0, 245, 155, 0.15)' : 'rgba(255,255,255,0.05)', color: t.currentPage === 'auction' ? '#00F59B' : '#CBD5E1', fontWeight: 600 }}>
                      {t.currentPage === 'auction' ? '⚡ IN AUCTION ROOM' : t.currentPage.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{t.captainName}</div>
                    <div style={{ fontSize: 12, color: '#38BDF8' }}>{t.captainPhone}</div>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'monospace', background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', padding: '2px 6px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                      {t.accessCode}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700 }}>₹{t.remainingPurse.toFixed(2)} Cr</div>
                    <div style={{ fontSize: 11, color: '#94A3B8' }}>{t.playersBought} Players</div>
                  </td>
                  <td>
                    {t.supportRequested ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ fontSize: 11, color: '#FCA5A5', background: 'rgba(239, 68, 68, 0.2)', padding: '4px 8px', borderRadius: 6 }}>
                          "{t.supportMessage}"
                        </div>
                        <button
                          onClick={() => handleResolve(t.id)}
                          style={{
                            background: '#10B981',
                            color: '#050814',
                            border: 'none',
                            borderRadius: 6,
                            padding: '4px 10px',
                            fontSize: 11,
                            fontWeight: 800,
                            cursor: 'pointer',
                          }}
                        >
                          Resolve Issue
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: '#64748B', fontSize: 12 }}>All Clear</span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredTeams.length === 0 && (
                <tr>
                  <td colSpan={8} className="data-table__empty">
                    No teams match your filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Live Activity Log */}
      <div style={{ marginTop: 28 }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>Live Contestant Activity Stream</h3>
        <Card padding="none">
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 220, overflowY: 'auto' }}>
            {activities.map((a) => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 6 }}>
                <div>
                  <strong style={{ color: '#38BDF8' }}>{a.team_name}</strong> ({a.team_id}):{' '}
                  <span style={{ color: a.action_type === 'REQUEST_HELP' ? '#F87171' : '#E2E8F0' }}>{a.details}</span>
                </div>
                <span style={{ fontSize: 11, color: '#64748B' }}>
                  {new Date(a.created_at).toLocaleTimeString()}
                </span>
              </div>
            ))}
            {activities.length === 0 && (
              <div style={{ color: '#64748B', fontSize: 13 }}>No contestant activities logged yet.</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
