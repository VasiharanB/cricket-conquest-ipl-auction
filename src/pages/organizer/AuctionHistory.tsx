import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Loader2, RotateCcw } from 'lucide-react';
import { Badge, Card } from '../../components';
import { auctionService, type HistoryItem } from '../../services/auctionService';
import './AuctionHistory.css';

export const AuctionHistory: React.FC = () => {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await auctionService.getHistory({ search, status: statusFilter });
      setHistoryItems(data);
    } catch (err) {
      console.warn('Failed to load auction history:', err);
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Sold':
        return <Badge variant="sold" dot>Sold</Badge>;
      case 'Unsold':
        return <Badge variant="unsold" dot>Unsold</Badge>;
      case 'Undo':
        return <Badge variant="waitlisted" dot>Undone</Badge>;
      case 'Bid':
        return <Badge variant="confirmed" dot>Bid</Badge>;
      default:
        return <Badge variant="info">{status}</Badge>;
    }
  };

  return (
    <div className="auction-history">
      <div className="auction-history__header">
        <div>
          <h1 className="dashboard__title">Auction History & Audit Log</h1>
          <p className="dashboard__desc">{historyItems.length} recorded events from MySQL database</p>
        </div>
        <button
          onClick={loadHistory}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            color: '#F8FAFC',
            padding: '8px 14px',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          <RotateCcw size={14} />
          <span>Refresh</span>
        </button>
      </div>

      <Card padding="none">
        <div className="dashboard__table-header">
          <div className="search-input" style={{ minWidth: 260 }}>
            <Search size={16} />
            <input
              placeholder="Search by player or team..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="dashboard__table-controls">
            <div className="filter-select">
              <Filter size={14} />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Events</option>
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
                <th>Event Type</th>
                <th>Player</th>
                <th>Role</th>
                <th>Team</th>
                <th>Amount</th>
                <th>Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: '#94A3B8' }}>
                    <Loader2 size={24} className="spin-animation" style={{ display: 'inline-block', marginRight: 8 }} />
                    Loading auction audit log...
                  </td>
                </tr>
              ) : (
                historyItems.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <span style={{ fontSize: 11, fontFamily: 'monospace', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 4 }}>
                        {r.eventType}
                      </span>
                    </td>
                    <td className="data-table__bold">{r.playerName || '—'}</td>
                    <td className="auction-history__role">{r.playerRole || '—'}</td>
                    <td>{r.teamName || '—'}</td>
                    <td className="data-table__bold">
                      {r.amount !== undefined ? `₹${r.amount.toFixed(2)} Cr` : '—'}
                    </td>
                    <td style={{ fontSize: 12, color: '#94A3B8' }}>
                      {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td>{getStatusBadge(r.status)}</td>
                  </tr>
                ))
              )}
              {!isLoading && historyItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="data-table__empty">
                    No auction history events recorded yet.
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
