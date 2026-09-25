import React from 'react';
import { Crown, Shield, Wallet } from 'lucide-react';
import type { AuctionTeam } from './types';
import { formatCrores, normalizeToCrores } from './auctionCurrency';

interface HighestBidderProps {
  team: AuctionTeam | null;
  teamName?: string;
  hasBids: boolean;
}

export const HighestBidder: React.FC<HighestBidderProps> = ({
  team,
  teamName,
  hasBids,
}) => {
  const resolvedName = team?.name || teamName || 'No Bids Yet';
  const remainingPurse = team?.remainingPurse ?? 100;
  const startingPurse = team?.startingPurse ?? 100;
  const normalizedRemaining = normalizeToCrores(remainingPurse);
  const normalizedStarting = normalizeToCrores(startingPurse) || 100;
  const pursePercentage = Math.round((normalizedRemaining / normalizedStarting) * 100);

  // Generate team initials for logo placeholder
  const teamInitials = resolvedName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  const accentColor = team?.accentColor || '#3B82F6';

  return (
    <div className={`highest-bidder-card ${hasBids ? 'highest-bidder-card--active' : 'highest-bidder-card--waiting'}`}>
      <div className="highest-bidder-card__top">
        <div className="highest-bidder-card__tag">
          <Crown size={14} className="highest-bidder-card__crown-icon" />
          <span>HIGHEST BIDDER</span>
        </div>
        {hasBids && <span className="highest-bidder-card__pulse-dot" />}
      </div>

      <div className="highest-bidder-card__body">
        {/* Team logo badge placeholder */}
        <div
          className="highest-bidder-card__logo"
          style={{ background: `linear-gradient(135deg, ${accentColor} 0%, #1E293B 100%)` }}
        >
          <Shield size={18} className="highest-bidder-card__shield" />
          <span className="highest-bidder-card__initials">{teamInitials}</span>
        </div>

        {/* Team name & college/info */}
        <div className="highest-bidder-card__info">
          <h3 className="highest-bidder-card__name">{resolvedName}</h3>
          {team?.college && (
            <span className="highest-bidder-card__college">{team.college}</span>
          )}
        </div>
      </div>

      {/* Remaining Purse Strip */}
      {hasBids && (
        <div className="highest-bidder-card__purse-section">
          <div className="highest-bidder-card__purse-header">
            <div className="highest-bidder-card__purse-label">
              <Wallet size={13} />
              <span>Remaining Purse</span>
            </div>
            <span className="highest-bidder-card__purse-amount">
              {formatCrores(remainingPurse)} <span className="highest-bidder-card__purse-pct">({pursePercentage}%)</span>
            </span>
          </div>

          <div className="highest-bidder-card__purse-track">
            <div
              className="highest-bidder-card__purse-fill"
              style={{
                width: `${Math.min(100, Math.max(5, pursePercentage))}%`,
                background: `linear-gradient(90deg, ${accentColor}, #10B981)`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
