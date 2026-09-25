import React, { useState } from 'react';
import { resolvePlayerImage } from './playerImageResolver';
import type { AuctionPlayer } from './types';
import { Shield, Sparkles } from 'lucide-react';

interface PlayerImageProps {
  player: AuctionPlayer | null;
  className?: string;
  isHero?: boolean;
}

export const PlayerImage: React.FC<PlayerImageProps> = ({
  player,
  className = '',
  isHero = true,
}) => {
  const [imageError, setImageError] = useState(false);

  // If player changes, reset error state
  const resolvedUrl = React.useMemo(() => {
    setImageError(false);
    return resolvePlayerImage(player || undefined);
  }, [player?.id, player?.name, player?.imageUrl]);

  const hasValidImage = Boolean(resolvedUrl) && !imageError;

  // Generate initials for fallback
  const initials = React.useMemo(() => {
    if (!player?.name) return 'CC';
    const parts = player.name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [player?.name]);

  const getRoleAccent = () => {
    const role = (player?.role || '').toLowerCase();
    if (role.includes('bat')) return 'batting';
    if (role.includes('bowl')) return 'bowling';
    if (role.includes('all')) return 'allrounder';
    if (role.includes('keep') || role.includes('wk')) return 'wicketkeeper';
    return 'default';
  };

  return (
    <div
      className={`player-image-stage ${isHero ? 'player-image-stage--hero' : 'player-image-stage--compact'} player-image-stage--${getRoleAccent()} ${className}`}
    >
      {/* Dynamic ambient backdrop glow with role accent */}
      <div className="player-image-stage__aura" />
      <div className="player-image-stage__blur-orb" />
      <div className="player-image-stage__stage-light" />

      {/* Layered decorative frame with broadcast glass depth */}
      <div className="player-image-stage__frame">
        {hasValidImage ? (
          <div className="player-image-stage__img-wrapper">
            <img
              key={resolvedUrl}
              src={resolvedUrl!}
              alt={player?.name || 'Auction Player'}
              className="player-image-stage__img"
              loading="eager"
              referrerPolicy="no-referrer"
              crossOrigin="anonymous"
              onError={() => setImageError(true)}
            />
            {/* Subtle bottom gradient scrim so stage contrasts gracefully */}
            <div className="player-image-stage__scrim" />
            <div className="player-image-stage__depth-vignette" />
          </div>
        ) : (
          /* Elegant sports card fallback */
          <div className="player-image-stage__fallback">
            <div className="player-image-stage__fallback-card">
              <div className="player-image-stage__fallback-pattern" />
              <div className="player-image-stage__fallback-shield">
                <Shield size={isHero ? 56 : 28} className="player-image-stage__shield-icon" />
                <span className="player-image-stage__fallback-initials">{initials}</span>
              </div>
              <span className="player-image-stage__fallback-role">
                {player?.role || 'Cricket Conquest'}
              </span>
            </div>
          </div>
        )}

        {/* Floating Category/Tier Chip on Card corner */}
        {player?.playerCategory && (
          <div className="player-image-stage__category-badge">
            <Sparkles size={12} />
            <span>{player.playerCategory}</span>
          </div>
        )}

        {/* Player LOT ID Tag */}
        {player?.id && (
          <div className="player-image-stage__id-tag">
            <span>LOT {player.id}</span>
          </div>
        )}
      </div>

      {/* Ground stage pedestal reflection for depth */}
      <div className="player-image-stage__pedestal" />
    </div>
  );
};
