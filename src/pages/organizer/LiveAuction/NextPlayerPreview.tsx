import React from 'react';
import { SkipForward, Zap, Coins } from 'lucide-react';
import { PlayerImage } from './PlayerImage';
import type { AuctionPlayer } from './types';
import { formatCrores } from './auctionCurrency';

interface NextPlayerPreviewProps {
  player: AuctionPlayer | null;
  onSkipToNext?: () => void;
}

export const NextPlayerPreview: React.FC<NextPlayerPreviewProps> = ({
  player,
  onSkipToNext,
}) => {
  if (!player) {
    return (
      <div className="next-player-card next-player-card--empty">
        <span className="next-player-card__badge">NEXT UP</span>
        <span className="next-player-card__empty-text">End of auction queue</span>
      </div>
    );
  }

  return (
    <div className="next-player-card" onClick={onSkipToNext} title="Upcoming player in auction queue">
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
      </div>
    </div>
  );
};
