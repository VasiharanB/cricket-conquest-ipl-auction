import React from 'react';
import {
  Play,
  Plus,
  Undo2,
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
  teams: AuctionTeam[];
  selectedTeamId: string | null;
  onSelectTeam: (teamId: string) => void;
  onStartBidding: () => void;
  onIncreaseBid: (increment: number) => void;
  onUndoBid: () => void;
  onUndoSale: () => void;
  onGoingOnce: () => void;
  onGoingTwice: () => void;
  onMarkSold: () => void;
  onMarkUnsold: () => void;
  onNextPlayer: () => void;
  onTogglePause: () => void;
  canBid: boolean;
  canUndo: boolean;
  canSold: boolean;
  isVolunteer?: boolean;
}

export const AuctionControls: React.FC<AuctionControlsProps> = ({
  auctionState,
  teams,
  selectedTeamId,
  onSelectTeam,
  onStartBidding,
  onIncreaseBid,
  onUndoBid,
  onUndoSale,
  onGoingOnce,
  onGoingTwice,
  onMarkSold,
  onMarkUnsold,
  onNextPlayer,
  onTogglePause,
  canBid,
  canUndo,
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
        {/* Team Selector for Bidding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' }}>Bidder:</span>
          <select
            value={selectedTeamId || ''}
            onChange={(e) => onSelectTeam(e.target.value)}
            disabled={!canBid || isPaused}
            style={{
              background: '#1E293B',
              color: '#F8FAFC',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 8,
              padding: '6px 10px',
              fontSize: 13,
              outline: 'none',
              maxWidth: 160,
              cursor: 'pointer',
            }}
          >
            <option value="" disabled>Select Team...</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} (₹{t.remainingPurse} Cr)
              </option>
            ))}
          </select>
        </div>

        {/* GROUP 1: Bid Manipulation */}
        <div className="auction-controls-dock__group auction-controls-dock__group--bids">
          {auctionState === 'INITIAL' || auctionState === 'PLAYER_READY' ? (
            <button
              className="ctrl-btn ctrl-btn--start"
              onClick={onStartBidding}
              title="Open the bidding window"
            >
              <Play size={16} fill="currentColor" />
              <span>Start Bidding</span>
            </button>
          ) : (
            <div className="ctrl-btn-chips">
              <button
                className="ctrl-chip-btn"
                onClick={() => onIncreaseBid(0.20)}
                disabled={!canBid || isPaused || !selectedTeamId}
                title="Increase bid by 0.20 Cr"
              >
                <Plus size={12} />
                <span>+0.20</span>
              </button>
              <button
                className="ctrl-chip-btn ctrl-chip-btn--primary"
                onClick={() => onIncreaseBid(0.50)}
                disabled={!canBid || isPaused || !selectedTeamId}
                title="Increase bid by 0.50 Cr"
              >
                <Plus size={12} />
                <span>+0.50</span>
              </button>
              <button
                className="ctrl-chip-btn"
                onClick={() => onIncreaseBid(1.00)}
                disabled={!canBid || isPaused || !selectedTeamId}
                title="Increase bid by 1.00 Cr"
              >
                <Plus size={12} />
                <span>+1.00</span>
              </button>
              <button
                className="ctrl-chip-btn"
                onClick={() => onIncreaseBid(2.00)}
                disabled={!canBid || isPaused || !selectedTeamId}
                title="Increase bid by 2.00 Cr"
              >
                <Plus size={12} />
                <span>+2.00</span>
              </button>
            </div>
          )}

          {/* Undo Action */}
          <button
            className="ctrl-btn ctrl-btn--undo"
            onClick={onUndoBid}
            disabled={!canUndo || isPaused}
            title="Undo last bid"
          >
            <Undo2 size={14} />
            <span>Undo Bid</span>
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

          {/* Next Player */}
          <button
            className="ctrl-btn ctrl-btn--next"
            onClick={onNextPlayer}
            title="Transition to next player in queue"
          >
            <SkipForward size={15} />
            <span>Next Player</span>
          </button>
        </div>
      </div>
    </div>
  );
};
