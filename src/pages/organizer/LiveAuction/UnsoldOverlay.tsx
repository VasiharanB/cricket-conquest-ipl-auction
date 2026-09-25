import React, { useEffect } from 'react';
import { XCircle } from 'lucide-react';
import { PlayerImage } from './PlayerImage';
import type { AuctionPlayer } from './types';
import { formatCrores } from './auctionCurrency';

interface UnsoldOverlayProps {
  player: AuctionPlayer | null;
  onAnimationComplete: () => void;
}

export const UnsoldOverlay: React.FC<UnsoldOverlayProps> = ({
  player,
  onAnimationComplete,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onAnimationComplete();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onAnimationComplete]);

  return (
    <div className="unsold-overlay">
      <div className="unsold-overlay__backdrop" />

      <div className="unsold-overlay__stage">
        {/* Unsold stamp */}
        <div className="unsold-overlay__stamp">
          <XCircle size={28} />
          <span>UNSOLD</span>
        </div>

        {/* Player image moves slightly backward with grayscale accent */}
        <div className="unsold-overlay__portrait-wrapper">
          <PlayerImage player={player} isHero={true} className="unsold-overlay__player-img" />
        </div>

        <div className="unsold-overlay__info">
          <h2 className="unsold-overlay__player-name">{player?.name}</h2>
          <p className="unsold-overlay__subtext">
            No bids recorded at Base Price {formatCrores(player?.basePrice)} • Moving to Re-Auction Pool
          </p>
        </div>
      </div>
    </div>
  );
};
