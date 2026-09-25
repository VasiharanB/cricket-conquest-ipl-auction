import React from 'react';
import { SkipForward, Zap, Coins, Users } from 'lucide-react';
import { PlayerImage } from './PlayerImage';
import type { AuctionPlayer } from './types';
import { formatCrores } from './auctionCurrency';

interface NextPlayerPreviewProps {
  player: AuctionPlayer | null;
  onSkipToNext?: () => void;
  onOpenPlayerSelector?: () => void;
}

export const NextPlayerPreview: React.FC<NextPlayerPreviewProps> = ({
  player,
  onSkipToNext,
  onOpenPlayerSelector,
}) => {
  if (!player) {
    return (
      <div className="next-player-card next-player-card--empty">
        <span className="next-player-card__badge">NEXT UP</span>
        <span className="next-player-card__empty-text">End of auction queue</span>
        {onOpenPlayerSelector && (
          <button
            type="button"
            onClick={onOpenPlayerSelector}
            style={{
              marginTop: 10,
              background: 'rgba(59, 130, 246, 0.2)',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              color: '#60A5FA',
              borderRadius: 8,
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Users size={13} />
            <span>Select Any Player</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="next-player-card" title="Upcoming player in auction queue">
      <div className="next-player-card__header">
        <div className="next-player-card__badge">
          <SkipForward size={12} />
          <span>NEXT UP</span>
        </div>
        <span className="next-player-card__lot">LOT {player.id}</span>
      </div>

      <div className="next-player-card__body">
        {/* Small player photo */}
        <div className="next-player-card__thumb">
          <PlayerImage player={player} isHero={false} />
        </div>

        {/* Player mini metadata */}
        <div className="next-player-card__info">
          <h4 className="next-player-card__name">{player.name}</h4>
          <div className="next-player-card__meta">
            <span className="next-player-card__role">
              <Zap size={11} />
              {player.specialization || player.role}
            </span>
            <span className="next-player-card__base">
              <Coins size={11} />
              Base {formatCrores(player.basePrice)}
            </span>
          </div>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {onSkipToNext && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSkipToNext();
              }}
              style={{
                background: 'rgba(59, 130, 246, 0.2)',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                color: '#60A5FA',
                borderRadius: 6,
                padding: '5px 10px',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                whiteSpace: 'nowrap',
              }}
              title="Bring this queued player to the stage"
            >
              <SkipForward size={12} />
              <span>Bring to Stage</span>
            </button>
          )}

          {onOpenPlayerSelector && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenPlayerSelector();
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#94A3B8',
                borderRadius: 6,
                padding: '4px 8px',
                fontSize: 10,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                whiteSpace: 'nowrap',
              }}
              title="Choose a different player from the database"
            >
              <Users size={11} />
              <span>Choose Any</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
