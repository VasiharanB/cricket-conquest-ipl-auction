import React, { useEffect, useRef } from 'react';
import { Trophy, Sparkles, Shield } from 'lucide-react';
import { PlayerImage } from './PlayerImage';
import type { AuctionPlayer, AuctionTeam } from './types';
import { formatCrores } from './auctionCurrency';

interface SoldOverlayProps {
  player: AuctionPlayer | null;
  winningTeam: AuctionTeam | null;
  winningTeamName: string;
  finalBid: number;
  onAnimationComplete: () => void;
}

export const SoldOverlay: React.FC<SoldOverlayProps> = ({
  player,
  winningTeam,
  winningTeamName,
  finalBid,
  onAnimationComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Auto-dismiss after celebration duration (~2.5s)
  useEffect(() => {
    const timer = setTimeout(() => {
      onAnimationComplete();
    }, 2600);

    return () => clearTimeout(timer);
  }, [onAnimationComplete]);

  // Canvas particle celebration effect (soft elegant confetti/sparkles)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#F59E0B', '#3B82F6', '#10B981', '#7C3AED', '#EC4899', '#FFFFFF'];
    const particleCount = 65; // Elegant, not overwhelming

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      alpha: number;
      rotation: number;
      vRot: number;
    }

    const particles: Particle[] = [];
    const originX = canvas.width / 2;
    const originY = canvas.height / 2;

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 3;
      particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2, // Slight upward bias
        size: Math.random() * 6 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 8,
      });
    }

    let startTime = performance.now();

    const render = (time: number) => {
      const elapsed = time - startTime;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12; // Gentle gravity
        p.vx *= 0.98; // Air friction
        p.rotation += p.vRot;
        if (elapsed > 1200) {
          p.alpha = Math.max(0, p.alpha - 0.02);
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
        ctx.restore();
      });

      if (elapsed < 2600) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    animationFrameId = requestAnimationFrame(render);

    const handleResize = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const teamColor = winningTeam?.accentColor || '#3B82F6';
  const teamInitials = (winningTeamName || 'TEAM')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <div className="sold-overlay">
      {/* Backdrop with soft blur and dim */}
      <div className="sold-overlay__backdrop" />

      {/* Confetti canvas */}
      <canvas ref={canvasRef} className="sold-overlay__canvas" />

      {/* Expanding luminous rings */}
      <div className="sold-overlay__expanding-ring" />
      <div className="sold-overlay__expanding-ring sold-overlay__expanding-ring--secondary" />

      {/* Central Hero Celebration Stage */}
      <div className="sold-overlay__stage">
        {/* Giant Animated SOLD Banner */}
        <div className="sold-overlay__banner">
          <div className="sold-overlay__banner-badge">
            <Trophy size={28} className="sold-overlay__trophy-icon" />
            <span className="sold-overlay__sold-title">SOLD!</span>
            <Sparkles size={24} className="sold-overlay__sparkle-icon" />
          </div>
        </div>

        {/* Hero Player Portrait - pops out of card into center stage */}
        <div className="sold-overlay__portrait-wrapper">
          <div
            className="sold-overlay__glow-burst"
            style={{
              background: `radial-gradient(circle, ${teamColor}66 0%, rgba(245, 158, 11, 0.4) 50%, transparent 75%)`,
            }}
          />
          <div className="sold-overlay__portrait-inner">
            <PlayerImage player={player} isHero={true} className="sold-overlay__player-img" />
          </div>
        </div>

        {/* Sold Details Box */}
        <div className="sold-overlay__details">
          <h2 className="sold-overlay__player-name">{player?.name}</h2>

          <div className="sold-overlay__winner-strip">
            <span className="sold-overlay__sold-to-label">Sold to</span>
            <div className="sold-overlay__team-chip">
              <div
                className="sold-overlay__team-mini-logo"
                style={{ background: `linear-gradient(135deg, ${teamColor}, #1E293B)` }}
              >
                <Shield size={14} />
                <span>{teamInitials}</span>
              </div>
              <span className="sold-overlay__team-name">{winningTeamName}</span>
            </div>
          </div>

          <div className="sold-overlay__price-tag">
            <span className="sold-overlay__price-prefix">Winning Bid</span>
            <span className="sold-overlay__price-value">
              {formatCrores(finalBid)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
