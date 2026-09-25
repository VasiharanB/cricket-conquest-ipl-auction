import React from 'react';
import {
  Play,
  Users,
  X,
  SkipForward,
  Pause,
  AlertCircle,
  AlertTriangle,
  Gavel,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import type { AuctionUIState, AuctionTeam } from './types';

interface AuctionControlsProps {
  auctionState: AuctionUIState;
  teams?: AuctionTeam[];
  onStartBidding: () => void;
  onOpenPlayerSelector: () => void;
  onUndoSale: () => void;
  onGoingOnce: () => void;
  onGoingTwice: () => void;
  onMarkSold: () => void;
  onMarkUnsold: () => void;
  onNextPlayer: () => void;
  onTogglePause: () => void;
  canSold: boolean;
  isVolunteer?: boolean;
  isAdmin?: boolean;
}

export const AuctionControls: React.FC<AuctionControlsProps> = ({
  auctionState,
  onStartBidding,
  onOpenPlayerSelector,
  onUndoSale,
  onGoingOnce,
  onGoingTwice,
  onMarkSold,
  onMarkUnsold,
  onNextPlayer,
  onTogglePause,
  canSold,
  isVolunteer,
}) => {
  const isPaused = auctionState === 'PAUSED';
  const isSoldOrUnsold = auctionState === 'SOLD' || auctionState === 'UNSOLD';
  const isBidding = auctionState === 'BIDDING';
  const isGoingOnce = auctionState === 'GOING_ONCE';
  const isGoingTwice = auctionState === 'GOING_TWICE';
  const isInBiddingFlow = isBidding || isGoingOnce || isGoingTwice;
  const hasPlayer = auctionState !== 'INITIAL' && auctionState !== 'PLAYER_READY';

  if (isVolunteer) {
    return (
      <div className="auction-controls-dock">
        <div className="auction-controls-dock__inner" style={{ justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#38BDF8', fontSize: 14, fontWeight: 500 }}>
            <ShieldCheck size={18} />
            <span>Volunteer Access: Live stage viewing mode. Controls reserved for Auctioneer & Admin.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auction-controls-dock">
      <div className="auction-controls-dock__inner">
        {/* GROUP 1: Player Selection & Starting */}
        <div className="auction-controls-dock__group">
          {auctionState === 'INITIAL' || auctionState === 'PLAYER_READY' ? (
            <button
              className="ctrl-btn ctrl-btn--start"
              onClick={onStartBidding}
              title="Open the bidding window"
            >
              <Play size={16} fill="currentColor" />
              <span>Start Bidding</span>
            </button>
          ) : null}

          {/* Select Any Player from Pool */}
          <button
            type="button"
            className="ctrl-btn"
            onClick={onOpenPlayerSelector}
            disabled={isPaused || isVolunteer}
            style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.25) 0%, rgba(37, 99, 235, 0.15) 100%)',
              border: '1px solid rgba(59, 130, 246, 0.45)',
              color: '#93C5FD',
              fontWeight: 700,
              gap: 7,
            }}
            title="Browse and select ANY player from the database to auction"
          >
            <Users size={16} color="#60A5FA" />
            <span>Select Player</span>
          </button>
        </div>

        <div className="auction-controls-dock__divider" />

        {/* GROUP 2: Auctioneer Calls & Primary SOLD */}
        <div className="auction-controls-dock__group auction-controls-dock__group--calls">
          <button
            className={`ctrl-btn ctrl-btn--call ${
              isGoingOnce ? 'ctrl-btn--call-active' : ''
            }`}
            onClick={onGoingOnce}
            disabled={isPaused || !isInBiddingFlow || isVolunteer}
            title="Announce: Going once"
          >
            <AlertCircle size={15} />
            <span>Going Once</span>
          </button>

          <button
            className={`ctrl-btn ctrl-btn--call-twice ${
              isGoingTwice ? 'ctrl-btn--call-twice-active' : ''
            }`}
            onClick={onGoingTwice}
            disabled={isPaused || !isInBiddingFlow || isVolunteer}
            title="Announce: Going twice"
          >
            <AlertTriangle size={15} />
            <span>Going Twice</span>
          </button>

          {/* PRIMARY ACTION: MARK SOLD */}
          <button
            className="ctrl-btn ctrl-btn--sold-hero"
            onClick={onMarkSold}
            disabled={!canSold || isPaused}
            title="Bring the hammer down and mark player SOLD!"
          >
            <div className="ctrl-btn--sold-hero-glow" />
            <Gavel size={18} className="ctrl-btn--sold-icon" />
            <span className="ctrl-btn--sold-text">MARK SOLD</span>
          </button>
        </div>

        <div className="auction-controls-dock__divider" />

        {/* GROUP 3: Lifecycle Actions & Undo Sale */}
        <div className="auction-controls-dock__group auction-controls-dock__group--meta">
          <button
            className="ctrl-btn ctrl-btn--unsold"
            onClick={onMarkUnsold}
            disabled={isPaused || !hasPlayer || isSoldOrUnsold || isVolunteer}
            title="Mark player as UNSOLD"
          >
            <X size={15} />
            <span>Unsold</span>
          </button>

          {/* Undo Last Sale Recovery */}
          <button
            className="ctrl-btn"
            style={{ background: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#F87171' }}
            onClick={onUndoSale}
            title="Undo the last player purchase and restore purse"
          >
            <RotateCcw size={14} />
            <span>Undo Sale</span>
          </button>

          {/* Pause Toggle */}
          <button
            className={`ctrl-btn ctrl-btn--pause ${isPaused ? 'ctrl-btn--pause-active' : ''}`}
            onClick={onTogglePause}
            title={isPaused ? 'Resume auction' : 'Pause auction'}
          >
            {isPaused ? <Play size={14} fill="currentColor" /> : <Pause size={14} />}
            <span>{isPaused ? 'Resume' : 'Pause'}</span>
          </button>

          {/* Next Player - Manual Trigger by Admin/Auctioneer */}
          <button
            className={`ctrl-btn ctrl-btn--next ${isSoldOrUnsold ? 'ctrl-btn--next-prominent' : ''}`}
            onClick={onNextPlayer}
            disabled={isPaused || isVolunteer}
            style={
              isSoldOrUnsold
                ? {
                    background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                    color: '#FFFFFF',
                    borderColor: '#60A5FA',
                    boxShadow: '0 0 22px rgba(37, 99, 235, 0.6)',
                    fontWeight: 800,
                    animation: 'pulse 1.8s infinite',
                  }
                : undefined
            }
            title={isVolunteer ? 'Volunteer mode: view only' : 'Bring next queued player to auction stage'}
          >
            <SkipForward size={15} />
            <span>Next Player</span>
          </button>
        </div>
      </div>
    </div>
  );
};
