import React from 'react';
import { Globe, Award, Zap } from 'lucide-react';
import type { AuctionPlayer } from './types';
import { formatCroreNumber } from './auctionCurrency';

interface PlayerInfoProps {
  player: AuctionPlayer | null;
}

export const PlayerInfo: React.FC<PlayerInfoProps> = ({ player }) => {
  if (!player) {
    return (
      <div className="player-info player-info--empty">
        <h2 className="player-info__name">No Player Selected</h2>
        <p className="player-info__desc">Load next player from queue to start bidding</p>
      </div>
    );
  }

  // Split name for potential dramatic typography
  const nameParts = player.name.trim().split(/\s+/);
  const firstName = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : '';
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : player.name;

  const isOverseas = player.nationality.toLowerCase().includes('overseas');

  return (
    <div className="player-info">
      {/* Top Meta Chips */}
      <div className="player-info__tags">
        <span className={`player-info__role-pill player-info__role-pill--${player.role.toLowerCase().replace(/\s+/g, '-')}`}>
          <Zap size={13} />
          <span>{player.specialization || player.role}</span>
        </span>

        <span className={`player-info__nat-pill ${isOverseas ? 'player-info__nat-pill--overseas' : 'player-info__nat-pill--indian'}`}>
          <Globe size={13} />
          <span>{player.nationality}</span>
        </span>

        {player.playerCategory && (
          <span className="player-info__cat-pill">
            <Award size={13} />
            <span>{player.playerCategory}</span>
          </span>
        )}

        {player.rating && (
          <span className="player-info__rating-pill">
            <span>Rating: {player.rating}</span>
          </span>
        )}
      </div>

      {/* Large Player Name */}
      <div className="player-info__name-block">
        {firstName && <span className="player-info__first-name">{firstName}</span>}
        <h1 className="player-info__last-name">{lastName}</h1>
      </div>

      {/* Base Price Card */}
      <div className="player-info__base-card">
        <div className="player-info__base-header">
          <span className="player-info__base-dot" />
          <span className="player-info__base-label">BASE PRICE</span>
        </div>
        <div className="player-info__base-value">
          <span className="player-info__base-currency">₹</span>
          <span className="player-info__base-amount">{formatCroreNumber(player.basePrice)}</span>
          <span className="player-info__base-unit">Cr</span>
        </div>
      </div>
    </div>
  );
};
