import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, Users, Play, Zap, Loader2 } from 'lucide-react';
import { playerService, type PlayerRecord } from '../../../services/playerService';
import { PlayerImage } from './PlayerImage';
import { formatCrores } from './auctionCurrency';

interface PlayerSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlayer: (player: PlayerRecord) => Promise<void>;
  currentPlayerId?: string;
}

export const PlayerSelectorModal: React.FC<PlayerSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectPlayer,
  currentPlayerId,
}) => {
  const [players, setPlayers] = useState<PlayerRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [isSubmittingId, setIsSubmittingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoading(true);

    playerService
      .getPlayers({ status: 'AVAILABLE', limit: 300 })
      .then((res) => {
        if (isMounted) {
          setPlayers(res.players || []);
        }
      })
      .catch((err) => {
        console.error('Failed to load available players:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Instant filter by search and role
  const filteredPlayers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return players.filter((p) => {
      // Exclude player currently on stage
      if (currentPlayerId && p.id === currentPlayerId) return false;

      // Role filter
      if (selectedRole !== 'ALL') {
        const role = (p.role || '').toLowerCase();
        if (selectedRole === 'BATSMAN' && !role.includes('bat')) return false;
        if (selectedRole === 'BOWLER' && !role.includes('bowl')) return false;
        if (selectedRole === 'ALL-ROUNDER' && !role.includes('all') && !role.includes('round')) return false;
        if (selectedRole === 'WICKETKEEPER' && !role.includes('keeper') && !role.includes('wk')) return false;
      }

      // Search query
      if (!q) return true;
      const name = (p.name || '').toLowerCase();
      const id = (p.id || '').toLowerCase();
      const nat = (p.nationality || '').toLowerCase();
      const cat = (p.playerCategory || '').toLowerCase();
      const roleStr = (p.role || '').toLowerCase();
      return name.includes(q) || id.includes(q) || nat.includes(q) || cat.includes(q) || roleStr.includes(q);
    });
  }, [players, searchQuery, selectedRole, currentPlayerId]);

  if (!isOpen) return null;

  const handleChoose = async (player: PlayerRecord) => {
    setIsSubmittingId(player.id);
    try {
      await onSelectPlayer(player);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to bring player to auction');
    } finally {
      setIsSubmittingId(null);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'rgba(5, 8, 20, 0.85)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 960,
          maxHeight: '90vh',
          background: 'linear-gradient(145deg, #0F172A 0%, #0A0F1D 100%)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: 20,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 40px rgba(59, 130, 246, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: 'rgba(59, 130, 246, 0.15)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#60A5FA',
              }}
            >
              <Users size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#F8FAFC', letterSpacing: '0.3px' }}>
                Select Player for Live Auction
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94A3B8' }}>
                Choose any available player to bring directly onto the auction stage
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 10,
              padding: 8,
              color: '#94A3B8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            background: 'rgba(15, 23, 42, 0.5)',
          }}
        >
          <div style={{ position: 'relative', width: '100%' }}>
            <Search
              size={18}
              style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }}
            />
            <input
              type="text"
              placeholder="Search by player name, LOT ID (e.g. P001), role, country..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              style={{
                width: '100%',
                padding: '12px 16px 12px 42px',
                background: '#1E293B',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 12,
                color: '#FFFFFF',
                fontSize: 14,
                outline: 'none',
              }}
            />
          </div>

          {/* Role Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
            {[
              { id: 'ALL', label: 'All Roles' },
              { id: 'BATSMAN', label: 'Batsmen' },
              { id: 'BOWLER', label: 'Bowlers' },
              { id: 'ALL-ROUNDER', label: 'All-Rounders' },
              { id: 'WICKETKEEPER', label: 'Wicketkeepers' },
            ].map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => setSelectedRole(role.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: '1px solid',
                  background: selectedRole === role.id ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                  borderColor: selectedRole === role.id ? '#3B82F6' : 'rgba(255, 255, 255, 0.1)',
                  color: selectedRole === role.id ? '#60A5FA' : '#94A3B8',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                {role.label}
              </button>
            ))}
            <span style={{ marginLeft: 'auto', fontSize: 12, color: '#64748B', whiteSpace: 'nowrap' }}>
              {filteredPlayers.length} available players
            </span>
          </div>
        </div>

        {/* Players Grid / List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 24,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}
        >
          {isLoading ? (
            <div style={{ gridColumn: '1 / -1', padding: 60, textAlign: 'center', color: '#60A5FA' }}>
              <Loader2 size={36} className="spin-animation" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: 14, color: '#94A3B8' }}>Loading available player database...</p>
            </div>
          ) : filteredPlayers.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: 60, textAlign: 'center', color: '#94A3B8' }}>
              <Users size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p style={{ fontSize: 15, fontWeight: 600 }}>No available players match your filter</p>
              <p style={{ fontSize: 13, color: '#64748B' }}>Try clearing the search query or selecting a different role</p>
            </div>
          ) : (
            filteredPlayers.map((player) => {
              const isSubmitting = isSubmittingId === player.id;
              return (
                <div
                  key={player.id}
                  style={{
                    background: 'rgba(30, 41, 59, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 14,
                    padding: 14,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    transition: 'transform 0.15s ease, border-color 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ width: 52, height: 52, borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
                      <PlayerImage
                        player={{
                          id: player.id,
                          name: player.name,
                          role: player.role,
                          nationality: player.nationality,
                          playerCategory: player.playerCategory,
                          basePrice: player.basePrice,
                          status: 'Available',
                        }}
                        isHero={false}
                      />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#38BDF8', letterSpacing: 0.5 }}>
                          LOT {player.id}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            padding: '2px 6px',
                            borderRadius: 4,
                            background: player.nationality?.toLowerCase() === 'indian' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                            color: player.nationality?.toLowerCase() === 'indian' ? '#4ADE80' : '#C084FC',
                            fontWeight: 700,
                          }}
                        >
                          {player.nationality}
                        </span>
                      </div>
                      <h4
                        style={{
                          margin: '2px 0 0',
                          fontSize: 14,
                          fontWeight: 700,
                          color: '#F8FAFC',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {player.name}
                      </h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, fontSize: 11, color: '#94A3B8' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Zap size={11} color="#FFB800" />
                          {player.specialization || player.role}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: 8,
                      borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: 10, color: '#64748B', display: 'block', textTransform: 'uppercase' }}>
                        Base Price
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#00F59B' }}>
                        {formatCrores(player.basePrice)}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleChoose(player)}
                      style={{
                        background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                        border: '1px solid #60A5FA',
                        borderRadius: 8,
                        padding: '7px 14px',
                        color: '#FFFFFF',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        boxShadow: '0 0 14px rgba(37, 99, 235, 0.35)',
                      }}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={13} className="spin-animation" />
                          <span>Staging...</span>
                        </>
                      ) : (
                        <>
                          <Play size={13} fill="currentColor" />
                          <span>Bring to Stage</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
