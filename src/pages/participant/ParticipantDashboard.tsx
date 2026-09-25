import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Radio,
  AlertCircle,
  HelpCircle,
  LogOut,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { participantService, type ParticipantProfile } from '../../services/participantService';
import { auctionService, type LiveAuctionState } from '../../services/auctionService';
import { useAuctionSocket } from '../../hooks/useAuctionSocket';
import './ParticipantDashboard.css';

export const ParticipantDashboard: React.FC = () => {
  const [profile, setProfile] = useState<ParticipantProfile | null>(null);
  const [auctionState, setAuctionState] = useState<LiveAuctionState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);
  const [helpMessage, setHelpMessage] = useState<string>('');
  const [helpStatus, setHelpStatus] = useState<string | null>(null);
  const [squadOrder, setSquadOrder] = useState<string[]>([]);

  const navigate = useNavigate();

  useEffect(() => {
    if (!profile) return;
    const key = `zentrix26_squad_order_${profile.teamId}`;
    const saved = localStorage.getItem(key);
    let order: string[] = [];
    if (saved) {
      try {
        order = JSON.parse(saved);
      } catch {
        order = [];
      }
    }
    const currentIds = (profile.squad || []).map((p) => p.player_id);
    const combined = [
      ...order.filter((id) => currentIds.includes(id)),
      ...currentIds.filter((id) => !order.includes(id)),
    ];
    setSquadOrder(combined);
  }, [profile?.teamId, profile?.squad]);

  const handleMove = (fromIndex: number, toIndex: number) => {
    if (!profile || toIndex < 0 || toIndex >= squadOrder.length) return;
    const next = [...squadOrder];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setSquadOrder(next);
    localStorage.setItem(`zentrix26_squad_order_${profile.teamId}`, JSON.stringify(next));
  };

  const sortedSquad = React.useMemo(() => {
    if (!profile) return [];
    if (squadOrder.length === 0) return profile.squad;
    const map = new Map(profile.squad.map((p) => [p.player_id, p]));
    const result: typeof profile.squad = [];
    for (const id of squadOrder) {
      const p = map.get(id);
      if (p) result.push(p);
    }
    for (const p of profile.squad) {
      if (!squadOrder.includes(p.player_id)) result.push(p);
    }
    return result;
  }, [profile, squadOrder]);

  // Load team profile
  const loadProfile = useCallback(async () => {
    try {
      const data = await participantService.getProfile();
      setProfile(data);
    } catch {
      navigate('/participant/login');
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  // Load auction state
  const loadAuctionState = useCallback(async () => {
    try {
      const state = await auctionService.getState();
      setAuctionState(state);
    } catch {
      // ignore
    }
  }, []);

  // Heartbeat ping loop
  useEffect(() => {
    loadProfile();
    loadAuctionState();

    const pingTimer = setInterval(() => {
      participantService.ping('dashboard');
    }, 15000);

    const refreshTimer = setInterval(() => {
      loadProfile();
      loadAuctionState();
    }, 20000);

    return () => {
      clearInterval(pingTimer);
      clearInterval(refreshTimer);
    };
  }, [loadProfile, loadAuctionState]);

  // WebSocket sync
  useAuctionSocket({
    onStateUpdate: (st) => {
      setAuctionState(st);
      loadProfile();
    },
  });

  const handleLogout = () => {
    participantService.clearSession();
    navigate('/participant/login');
  };

  const handleSendHelp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!helpMessage.trim()) return;
    try {
      await participantService.requestHelp(helpMessage.trim());
      setHelpStatus('Support requested! A tournament helper is on the way to assist your table.');
      setHelpMessage('');
      setTimeout(() => {
        setIsHelpModalOpen(false);
        setHelpStatus(null);
      }, 3000);
      loadProfile();
    } catch (err: any) {
      alert(err.message || 'Failed to send help request');
    }
  };

  if (isLoading || !profile) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#050814', color: '#00F59B' }}>
        <Loader2 size={36} className="spin-animation" />
        <span style={{ marginLeft: 14, fontSize: 16 }}>Loading Contestant Dashboard...</span>
      </div>
    );
  }

  const isAuctionLive = auctionState?.status === 'ACTIVE';

  return (
    <div className="part-dash">
      <div className="part-dash-container">
        {/* Top Header Bar */}
        <header className="part-header">
          <div className="part-header-left">
            <div className="part-team-crest">
              {profile.teamName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>{profile.teamName}</h1>
                <span
                  style={{
                    background: profile.checkInStatus === 'CHECKED_IN' ? 'rgba(0, 245, 155, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: profile.checkInStatus === 'CHECKED_IN' ? '#00F59B' : '#FCA5A5',
                    border: `1px solid ${profile.checkInStatus === 'CHECKED_IN' ? 'rgba(0, 245, 155, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    padding: '2px 10px',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {profile.checkInStatus === 'CHECKED_IN' ? '✓ CHECKED IN' : 'WAITING CHECK-IN'}
                </span>
              </div>
              <p style={{ margin: '4px 0 0', color: '#94A3B8', fontSize: 13 }}>
                {profile.collegeName} · Team ID: <strong style={{ color: '#00F59B' }}>{profile.teamId}</strong>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => setIsHelpModalOpen(true)}
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#FCA5A5',
                padding: '8px 16px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
              }}
            >
              <HelpCircle size={15} />
              <span>Call Helper</span>
            </button>

            <button
              onClick={handleLogout}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#94A3B8',
                padding: '8px 14px',
                borderRadius: 10,
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
              }}
            >
              <LogOut size={15} />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Support Alert if Active */}
        {profile.supportRequested && (
          <div style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #EF4444', borderRadius: 14, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <AlertCircle size={20} color="#F87171" />
            <span style={{ fontSize: 14, color: '#FCA5A5' }}>
              <strong>Support Request Active:</strong> "{profile.supportMessage}". A volunteer helper has been alerted and is heading to your team.
            </span>
          </div>
        )}

        {/* LIVE AUCTION NOTIFICATION BANNER */}
        {isAuctionLive ? (
          <div className="part-live-banner">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#050814', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, fontSize: 12 }}>
                <Radio size={16} className="spin-animation" />
                <span>AUCTION IS LIVE NOW</span>
              </div>
              <h2 style={{ margin: '6px 0', fontSize: 24, fontWeight: 900, color: '#FFFFFF' }}>
                Stage is open: {auctionState?.currentPlayer?.name || 'Player on Stage'}
              </h2>
              <p style={{ margin: 0, color: '#E2E8F0', fontSize: 14 }}>
                Current Bid: ₹{auctionState?.currentBid.toFixed(2)} Cr · Highest Bidder: {auctionState?.highestBidder?.name || 'Awaiting Opening Bid'}
              </p>
            </div>

            <Link to="/participant/auction" className="part-enter-btn">
              <span>ENTER AUCTION ROOM</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        ) : (
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 16, padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Radio size={18} color="#94A3B8" />
              <span style={{ color: '#94A3B8', fontSize: 14 }}>
                Auction is currently paused or waiting to begin. Stay on this screen; you will be notified the instant bidding starts.
              </span>
            </div>
            <Link to="/participant/auction" style={{ color: '#00F59B', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>
              Preview Auction Stage →
            </Link>
          </div>
        )}

        {/* Stats Row */}
        <div className="part-stats-grid">
          <div className="part-stat-card">
            <span className="part-stat-label">Remaining Purse</span>
            <span className="part-stat-value" style={{ color: '#00F59B' }}>
              ₹{profile.remainingPurse.toFixed(2)} Cr
            </span>
            <span style={{ fontSize: 12, color: '#64748B' }}>
              Starting: ₹{profile.startingPurse.toFixed(2)} Cr
            </span>
          </div>

          <div className="part-stat-card">
            <span className="part-stat-label">Players Acquired</span>
            <span className="part-stat-value">
              {profile.squad.length} <span style={{ fontSize: 16, color: '#64748B' }}>/ 15</span>
            </span>
            <span style={{ fontSize: 12, color: '#64748B' }}>
              Min Required: 5 Players
            </span>
          </div>

          <div className="part-stat-card">
            <span className="part-stat-label">Total Spend</span>
            <span className="part-stat-value" style={{ color: '#38BDF8' }}>
              ₹{(profile.startingPurse - profile.remainingPurse).toFixed(2)} Cr
            </span>
            <span style={{ fontSize: 12, color: '#64748B' }}>
              Verified by MySQL Engine
            </span>
          </div>

          <div className="part-stat-card">
            <span className="part-stat-label">Team Access Code</span>
            <span className="part-stat-value" style={{ fontSize: 20, color: '#F59E0B', letterSpacing: 1 }}>
              {profile.accessCode}
            </span>
            <span style={{ fontSize: 12, color: '#64748B' }}>
              Keep secret for team login
            </span>
          </div>
        </div>

        {/* Squad Bought in Auction & Lineup Positioning */}
        <div style={{ background: 'rgba(13, 23, 42, 0.7)', borderRadius: 20, border: '1px solid rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Your Acquired Squad & Playing Order</h2>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94A3B8' }}>
                Position your players in the exact batting and playing XI order you want using the ▲ Up and ▼ Down buttons.
              </p>
            </div>
            <span style={{ fontSize: 13, color: '#00F59B', fontWeight: 700, background: 'rgba(0, 245, 155, 0.1)', padding: '4px 12px', borderRadius: 999 }}>
              {profile.squad.length} Players
            </span>
          </div>

          <table className="part-squad-table">
            <thead>
              <tr>
                <th style={{ width: 120 }}>Lineup #</th>
                <th>Player ID</th>
                <th>Name</th>
                <th>Role</th>
                <th>Category</th>
                <th>Price Paid</th>
                <th style={{ textAlign: 'center', width: 150 }}>Position Order</th>
              </tr>
            </thead>
            <tbody>
              {sortedSquad.map((p, idx) => {
                const isPlayingXI = idx < 11;
                return (
                  <tr key={p.id}>
                    <td>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 800,
                          background: isPlayingXI ? 'rgba(0, 245, 155, 0.15)' : 'rgba(148, 163, 184, 0.12)',
                          color: isPlayingXI ? '#00F59B' : '#94A3B8',
                          border: isPlayingXI ? '1px solid rgba(0, 245, 155, 0.3)' : '1px solid rgba(148, 163, 184, 0.2)',
                        }}
                      >
                        #{idx + 1} {isPlayingXI ? '(Playing XI)' : '(Bench)'}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace', color: '#00F59B' }}>{p.player_id}</td>
                    <td style={{ fontWeight: 700 }}>{p.player_name}</td>
                    <td>{p.role}</td>
                    <td>{p.player_category}</td>
                    <td style={{ fontWeight: 800, color: '#38BDF8' }}>₹{Number(p.purchase_price).toFixed(2)} Cr</td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => handleMove(idx, idx - 1)}
                          disabled={idx === 0}
                          title="Move up in batting / playing order"
                          style={{
                            background: idx === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(56, 189, 248, 0.15)',
                            border: idx === 0 ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(56, 189, 248, 0.3)',
                            color: idx === 0 ? '#475569' : '#38BDF8',
                            borderRadius: 6,
                            padding: '4px 10px',
                            cursor: idx === 0 ? 'not-allowed' : 'pointer',
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          ▲ Up
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMove(idx, idx + 1)}
                          disabled={idx === sortedSquad.length - 1}
                          title="Move down in batting / playing order"
                          style={{
                            background: idx === sortedSquad.length - 1 ? 'rgba(255,255,255,0.03)' : 'rgba(56, 189, 248, 0.15)',
                            border: idx === sortedSquad.length - 1 ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(56, 189, 248, 0.3)',
                            color: idx === sortedSquad.length - 1 ? '#475569' : '#38BDF8',
                            borderRadius: 6,
                            padding: '4px 10px',
                            cursor: idx === sortedSquad.length - 1 ? 'not-allowed' : 'pointer',
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          ▼ Down
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {sortedSquad.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: '#64748B' }}>
                    You haven't bought any players yet. When the auction starts, enter the auction room to place bids!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Team Members List */}
        <div style={{ background: 'rgba(13, 23, 42, 0.7)', borderRadius: 20, border: '1px solid rgba(255, 255, 255, 0.08)', padding: '24px' }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800 }}>Registered Participants</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            {profile.members.map((m) => (
              <div
                key={m.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: 12,
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: m.is_captain ? '#00F59B' : '#1E293B', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#050814', fontWeight: 800 }}>
                  {m.member_number}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{m.full_name}</div>
                  <div style={{ fontSize: 12, color: m.is_captain ? '#00F59B' : '#94A3B8' }}>
                    {m.is_captain ? 'Team Captain' : 'Team Member'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Help Modal */}
      {isHelpModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 20, padding: 32, maxWidth: 480, width: '100%' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 800 }}>Request Helper Assistance</h3>
            <p style={{ margin: '0 0 20px', color: '#94A3B8', fontSize: 13 }}>
              Describe any technical difficulty, check-in question, or bidding issue. Tournament volunteers are actively monitoring requests.
            </p>

            {helpStatus && (
              <div style={{ background: 'rgba(0, 245, 155, 0.15)', border: '1px solid #00F59B', color: '#00F59B', padding: 12, borderRadius: 10, marginBottom: 16, fontSize: 13 }}>
                {helpStatus}
              </div>
            )}

            <form onSubmit={handleSendHelp}>
              <textarea
                rows={4}
                placeholder="Explain the error or issue you are experiencing..."
                value={helpMessage}
                onChange={(e) => setHelpMessage(e.target.value)}
                required
                style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: 12, color: '#FFFFFF', fontSize: 14, outline: 'none', marginBottom: 20 }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setIsHelpModalOpen(false)}
                  style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#94A3B8', padding: '10px 20px', borderRadius: 10, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ background: '#00F59B', color: '#050814', border: 'none', fontWeight: 800, padding: '10px 24px', borderRadius: 10, cursor: 'pointer' }}
                >
                  Alert Helpers
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
