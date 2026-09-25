import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Loader2, RotateCcw, Lock, Unlock, Sparkles, AlertTriangle } from 'lucide-react';
import { Card, Badge } from '../../components';
import { auctionService, type TeamResultItem } from '../../services/auctionService';
import { useAuth } from '../../contexts/AuthContext';
import './Results.css';

export const Results: React.FC = () => {
  const { user } = useAuth();
  const [results, setResults] = useState<TeamResultItem[]>([]);
  const [isPublished, setIsPublished] = useState<boolean>(false);
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [publishSuccess, setPublishSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isAdmin = user?.role === 'Admin';

  const loadResults = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await auctionService.getResults();
      setResults(data.standings || []);
      setIsPublished(Boolean(data.isPublished));
      setPublishedAt(data.publishedAt);
    } catch (err: any) {
      console.warn('Failed to load auction results:', err);
      setErrorMsg(err.message || 'Failed to load tournament results');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadResults();
  }, []);

  const handlePublishResults = async () => {
    if (!isAdmin) return;
    const confirmed = window.confirm(
      'Are you sure you want to GRANT ACCESS and publish official results? This will reveal all hidden player key points and announce the tournament champion!'
    );
    if (!confirmed) return;

    setIsPublishing(true);
    setErrorMsg(null);
    try {
      const res = await auctionService.publishResults();
      setIsPublished(true);
      setPublishedAt(res.publishedAt || new Date().toISOString());
      setResults(res.standings || []);
      setPublishSuccess(true);
      setTimeout(() => setPublishSuccess(false), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to publish results. Please ensure you are logged in as Admin.');
    } finally {
      setIsPublishing(false);
    }
  };

  const winner = results[0];
  const runnerUp = results[1];
  const third = results[2];

  const roleIcon = (role: string) => {
    const colors: Record<string, string> = {
      Batsman: '#38BDF8',
      Batter: '#38BDF8',
      Bowler: '#00F59B',
      'All-rounder': '#A855F7',
      Wicketkeeper: '#FFB800',
    };
    return colors[role] || '#8B90A0';
  };

  if (isLoading) {
    return (
      <div className="results-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader2 size={36} className="spin-animation" style={{ color: '#00F59B', marginBottom: 16 }} />
        <span style={{ color: '#94A3B8', fontSize: 16 }}>Calculating live tournament standings & squad points...</span>
      </div>
    );
  }

  return (
    <div className="results-page">
      <div className="results-page__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 className="dashboard__title">Tournament Results & Final Squads</h1>
            {isPublished ? (
              <span style={{ background: 'rgba(0, 245, 155, 0.15)', border: '1px solid #00F59B', color: '#00F59B', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                🏆 OFFICIALLY PUBLISHED
              </span>
            ) : (
              <span style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #EF4444', color: '#F87171', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                <Lock size={12} /> RESULTS LOCKED
              </span>
            )}
          </div>
          <p className="dashboard__desc">
            {isPublished
              ? `Winner announced and secret points unlocked on ${publishedAt ? new Date(publishedAt).toLocaleString() : 'today'}`
              : 'Standings and secret player points remain sealed until granted by Admin.'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isAdmin && !isPublished && (
            <button
              onClick={handlePublishResults}
              disabled={isPublishing}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'linear-gradient(135deg, #00F59B, #0284C7)',
                color: '#050814',
                border: 'none',
                borderRadius: 8,
                padding: '10px 18px',
                fontSize: 14,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 0 20px rgba(0, 245, 155, 0.4)',
              }}
            >
              {isPublishing ? <Loader2 size={16} className="spin-animation" /> : <Unlock size={16} />}
              <span>Grant Access & Publish Winner</span>
            </button>
          )}

          <button
            onClick={loadResults}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              color: '#F8FAFC',
              padding: '10px 14px',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={14} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {publishSuccess && (
        <div style={{ background: 'rgba(0, 245, 155, 0.15)', border: '1px solid #00F59B', borderRadius: 8, padding: '14px 20px', color: '#00F59B', display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
          <Sparkles size={20} />
          <strong>Success! Access granted. All secret player key points are revealed and the winner is officially crowned!</strong>
        </div>
      )}

      {errorMsg && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #EF4444', borderRadius: 8, padding: '14px 20px', color: '#F87171', display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
          <AlertTriangle size={20} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Locked Gate Banner if Not Published */}
      {!isPublished && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(27, 42, 74, 0.8), rgba(5, 8, 20, 0.9))',
          border: '1px dashed rgba(255, 184, 0, 0.5)',
          borderRadius: 12,
          padding: '24px',
          margin: '20px 0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 12
        }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255, 184, 0, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFB800' }}>
            <Lock size={28} />
          </div>
          <h2 style={{ color: '#F8FAFC', fontSize: 20, margin: 0 }}>Tournament Results Gate Locked</h2>
          <p style={{ color: '#94A3B8', maxWidth: 640, margin: 0, fontSize: 14 }}>
            In accordance with ZenTriX rules, player <strong>Secret Key Points</strong> and the official <strong>Winner Announcement</strong> remain strictly hidden until the Admin unlocks them.
            {isAdmin ? ' As the tournament administrator, you can grant access using the button above.' : ' Please wait for the event administrator to finalize and publish the results.'}
          </p>
        </div>
      )}

      {/* Podium - only display full glory if published */}
      {isPublished && results.length >= 3 && winner && runnerUp && third && (
        <div className="podium">
          {/* Runner Up */}
          <div className="podium__card podium__card--2">
            <div className="podium__rank">
              <Medal size={28} />
              <span>2nd</span>
            </div>
            <h3 className="podium__name">{runnerUp.teamName}</h3>
            <div className="podium__stat">
              <span className="podium__stat-label">Total Score</span>
              <span className="podium__stat-value" style={{ color: '#00F59B', fontWeight: 800 }}>{runnerUp.totalScore ?? '—'}</span>
            </div>
            <div className="podium__stat">
              <span className="podium__stat-label">Key Points 🔑</span>
              <span className="podium__stat-value">{runnerUp.totalKeyPoints ?? '—'}</span>
            </div>
            <div className="podium__stat">
              <span className="podium__stat-label">Remaining Purse</span>
              <span className="podium__stat-value">₹{runnerUp.remainingPurse.toFixed(2)} Cr</span>
            </div>
            <div className="podium__stat">
              <span className="podium__stat-label">Players</span>
              <span className="podium__stat-value">{runnerUp.players.length}</span>
            </div>
          </div>

          {/* Winner */}
          <div className="podium__card podium__card--1">
            <div className="podium__crown">👑</div>
            <div className="podium__rank podium__rank--winner">
              <Trophy size={32} />
              <span>CHAMPION</span>
            </div>
            <h3 className="podium__name podium__name--winner">{winner.teamName}</h3>
            <div className="podium__stat">
              <span className="podium__stat-label">Total Tournament Score</span>
              <span className="podium__stat-value podium__stat-value--big" style={{ color: '#00F59B' }}>{winner.totalScore ?? '—'}</span>
            </div>
            <div className="podium__stat">
              <span className="podium__stat-label">Secret Key Points 🔑</span>
              <span className="podium__stat-value" style={{ color: '#FFB800', fontWeight: 800 }}>{winner.totalKeyPoints ?? '—'}</span>
            </div>
            <div className="podium__stat">
              <span className="podium__stat-label">Remaining Purse</span>
              <span className="podium__stat-value">₹{winner.remainingPurse.toFixed(2)} Cr</span>
            </div>
            <div className="podium__stat">
              <span className="podium__stat-label">Squad Strength</span>
              <span className="podium__stat-value">{winner.players.length} Players</span>
            </div>
          </div>

          {/* Third */}
          <div className="podium__card podium__card--3">
            <div className="podium__rank">
              <Award size={24} />
              <span>3rd</span>
            </div>
            <h3 className="podium__name">{third.teamName}</h3>
            <div className="podium__stat">
              <span className="podium__stat-label">Total Score</span>
              <span className="podium__stat-value" style={{ color: '#00F59B', fontWeight: 800 }}>{third.totalScore ?? '—'}</span>
            </div>
            <div className="podium__stat">
              <span className="podium__stat-label">Key Points 🔑</span>
              <span className="podium__stat-value">{third.totalKeyPoints ?? '—'}</span>
            </div>
            <div className="podium__stat">
              <span className="podium__stat-label">Remaining Purse</span>
              <span className="podium__stat-value">₹{third.remainingPurse.toFixed(2)} Cr</span>
            </div>
            <div className="podium__stat">
              <span className="podium__stat-label">Players</span>
              <span className="podium__stat-value">{third.players.length}</span>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      <div style={{ marginTop: 24 }}>
        <Card padding="none" className="results-leaderboard">
        <div className="dashboard__table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="dashboard__table-title">
            {isPublished ? '🏆 Official Tournament Standings' : 'Live Team Auction Status (Points Sealed)'}
          </h2>
          <span style={{ fontSize: 12, color: '#94A3B8' }}>
            Score Formula: Total Key Points + (Purse × 0.5)
          </span>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Team</th>
                <th>College</th>
                <th>Players</th>
                <th>Spent</th>
                <th>Purse Left</th>
                <th>Key Points 🔑</th>
                <th>Final Score</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, idx) => (
                <tr key={r.teamId}>
                  <td>
                    <span className={`rank-badge rank-badge--${idx + 1}`}>
                      #{idx + 1}
                    </span>
                  </td>
                  <td className="data-table__bold">
                    {r.teamName}
                    {idx === 0 && isPublished && ' 👑'}
                  </td>
                  <td style={{ color: '#94A3B8' }}>{r.collegeName}</td>
                  <td>{r.players.length}</td>
                  <td>₹{r.totalSpent.toFixed(2)} Cr</td>
                  <td>₹{r.remainingPurse.toFixed(2)} Cr</td>
                  <td>
                    {isPublished ? (
                      <span style={{ color: '#FFB800', fontWeight: 800, fontSize: 14 }}>
                        {r.totalKeyPoints ?? 0} pts
                      </span>
                    ) : (
                      <span style={{ color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Lock size={12} /> Hidden
                      </span>
                    )}
                  </td>
                  <td className="data-table__bold">
                    {isPublished ? (
                      <span style={{ color: '#00F59B', fontSize: 16 }}>
                        {r.totalScore ?? '—'}
                      </span>
                    ) : (
                      <span style={{ color: '#64748B' }}>Locked</span>
                    )}
                  </td>
                </tr>
              ))}
              {results.length === 0 && (
                <tr><td colSpan={8} className="data-table__empty">No team records found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      </div>

      {/* All Squads */}
      <div className="results-squads" style={{ marginTop: 32 }}>
        <h2 className="results-squads__title">Live Team Squads</h2>
        <div className="results-squads__grid">
          {results.map((r, idx) => (
            <Card key={r.teamId} className="squad-card">
              <div className="squad-card__header">
                <div>
                  <h3 className="squad-card__name">
                    {r.teamName}
                    {idx === 0 && isPublished && ' 👑'}
                  </h3>
                  <span className="squad-card__meta">
                    Spent ₹{r.totalSpent.toFixed(2)} Cr · Remaining ₹{r.remainingPurse.toFixed(2)} Cr
                  </span>
                </div>
                <Badge variant={idx === 0 && isPublished ? 'sold' : 'info'} size="md">
                  #{idx + 1}
                </Badge>
              </div>
              <div className="squad-card__players">
                {r.players.map((p) => (
                  <div key={p.id} className="squad-player" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="squad-player__dot" style={{ background: roleIcon(p.role) }} />
                      <span className="squad-player__name">{p.name}</span>
                      <span className="squad-player__role">({p.role})</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {isPublished && p.keyPoints !== undefined && (
                        <span style={{ color: '#FFB800', fontWeight: 700, fontSize: 12 }}>
                          {p.keyPoints} pts
                        </span>
                      )}
                      <span className="squad-player__price">₹{p.price.toFixed(2)} Cr</span>
                    </div>
                  </div>
                ))}
                {r.players.length === 0 && (
                  <div style={{ color: '#64748B', fontSize: 13, fontStyle: 'italic', padding: '12px 0' }}>
                    No players acquired in auction yet.
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
