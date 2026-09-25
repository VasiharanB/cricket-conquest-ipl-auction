import React from 'react';
import { Radio, Maximize2, Minimize2, ArrowLeft, Sliders, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AuctionHeaderProps {
  roundNumber?: number;
  totalTeamsCount?: number;
  checkedInTeamsCount?: number;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  showDemoPanel: boolean;
  onToggleDemoPanel: () => void;
  isConnectedToDb: boolean;
}

export const AuctionHeader: React.FC<AuctionHeaderProps> = ({
  roundNumber = 1,
  totalTeamsCount = 16,
  checkedInTeamsCount = 12,
  isFullscreen,
  onToggleFullscreen,
  showDemoPanel,
  onToggleDemoPanel,
  isConnectedToDb,
}) => {
  const navigate = useNavigate();

  return (
    <header className="auction-header">
      {/* LEFT: Branding */}
      <div className="auction-header__left">
        <button
          className="auction-header__back-btn"
          onClick={() => navigate('/organizer')}
          title="Exit to Dashboard"
        >
          <ArrowLeft size={16} />
          <span>Dashboard</span>
        </button>

        <div className="auction-header__divider" />

        <div className="auction-header__brand">
          <span className="auction-header__brand-title">CRICKET CONQUEST</span>
          <span className="auction-header__brand-sub">ZenTriX'26</span>
        </div>
      </div>

      {/* CENTER: Status & Round */}
      <div className="auction-header__center">
        <div className="auction-header__round-pill">
          <span className="auction-header__round-text">ROUND {roundNumber}</span>
          <span className="auction-header__stage-badge">LIVE AUCTION</span>
        </div>
      </div>

      {/* RIGHT: Live status, Teams & Actions */}
      <div className="auction-header__right">
        {/* Live Indicator */}
        <div className="auction-header__live-tag">
          <span className="auction-header__live-pulse" />
          <Radio size={14} className="auction-header__live-icon" />
          <span className="auction-header__live-text">LIVE</span>
        </div>

        {/* Teams Count */}
        <div className="auction-header__stat-chip" title="Teams checked-in for auction">
          <span className="auction-header__stat-label">Teams:</span>
          <span className="auction-header__stat-value">{checkedInTeamsCount}/{totalTeamsCount}</span>
        </div>

        {/* Database connection badge */}
        {isConnectedToDb && (
          <div className="auction-header__db-chip" title="Connected to MySQL Player Database">
            <ShieldCheck size={13} />
            <span>DB Active</span>
          </div>
        )}

        {/* Demo Mode Toggle Button */}
        <button
          className={`auction-header__action-btn ${showDemoPanel ? 'auction-header__action-btn--active' : ''}`}
          onClick={onToggleDemoPanel}
          title="Toggle Simulation / Test Controls"
        >
          <Sliders size={15} />
          <span>Demo Mode</span>
        </button>

        {/* Fullscreen Toggle */}
        <button
          className="auction-header__icon-btn"
          onClick={onToggleFullscreen}
          title={isFullscreen ? 'Exit Fullscreen' : 'Projector Fullscreen'}
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>
    </header>
  );
};
