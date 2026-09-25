import React from 'react';
import { Shield } from 'lucide-react';
import type { AuctionTeam } from './types';
import { formatCrores } from './auctionCurrency';

interface TeamPurseStripProps {
  teams: AuctionTeam[];
  highestBidderName: string;
  onSelectTeam?: (team: AuctionTeam) => void;
}

export const TeamPurseStrip: React.FC<TeamPurseStripProps> = ({
  teams,
  highestBidderName,
  onSelectTeam,
}) => {
  return (
    <div className="team-purse-strip">
      <div className="team-purse-strip__header">
        <span className="team-purse-strip__title">TEAM PURSES</span>
        <span className="team-purse-strip__count">{teams.length} Franchises</span>
      </div>

      <div className="team-purse-strip__scroll">
        {teams.map((team) => {
          const isHighest = team.name.toLowerCase() === highestBidderName.toLowerCase();
          const starting = team.startingPurse || 100;
          const pct = Math.round((team.remainingPurse / starting) * 100);
          const initials = team.name
            .split(' ')
            .slice(0, 2)
            .map((w) => w[0])
            .join('')
            .toUpperCase();

          return (
            <div
              key={team.id}
              className={`team-purse-item ${isHighest ? 'team-purse-item--active' : ''}`}
              onClick={() => onSelectTeam && onSelectTeam(team)}
              title={`${team.name} • Remaining: ${formatCrores(team.remainingPurse)} (${pct}%) • Squad: ${team.playersBought} players`}
            >
              <div className="team-purse-item__top">
                <div
                  className="team-purse-item__badge"
                  style={{ background: `linear-gradient(135deg, ${team.accentColor || '#3B82F6'}, #1E293B)` }}
                >
                  <Shield size={11} />
                  <span>{initials}</span>
                </div>

                <div className="team-purse-item__details">
                  <span className="team-purse-item__name">{team.name}</span>
                  <span className="team-purse-item__squad">{team.playersBought} bought</span>
                </div>

                <div className="team-purse-item__purse">
                  <span className="team-purse-item__amount">{formatCrores(team.remainingPurse)}</span>
                </div>
              </div>

              {/* Purse usage progress bar */}
              <div className="team-purse-item__progress-track">
                <div
                  className="team-purse-item__progress-fill"
                  style={{
                    width: `${Math.min(100, Math.max(4, pct))}%`,
                    backgroundColor: isHighest ? '#10B981' : team.accentColor || '#3B82F6',
                  }}
                />
              </div>

              {isHighest && (
                <div className="team-purse-item__active-flag">
                  <span>HOLDING BID</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
