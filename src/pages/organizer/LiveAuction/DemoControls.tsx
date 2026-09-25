import React from 'react';
import {
  Sliders,
  Play,
  RotateCcw,
  Zap,
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
  SkipForward,
  Coins,
} from 'lucide-react';
import type { AuctionUIState, AuctionPlayer } from './types';

interface DemoControlsProps {
  isOpen: boolean;
  onClose: () => void;
  currentState: AuctionUIState;
  onSetState: (state: AuctionUIState) => void;
  onSimulateBid: () => void;
  onTriggerSold: () => void;
  onTriggerUnsold: () => void;
  onNextPlayer: () => void;
  onResetAuction: () => void;
  availablePlayers: AuctionPlayer[];
  onSelectPlayer: (player: AuctionPlayer) => void;
  currentPlayerId?: string;
}

export const DemoControls: React.FC<DemoControlsProps> = ({
  isOpen,
  onClose,
  currentState,
  onSetState,
  onSimulateBid,
  onTriggerSold,
  onTriggerUnsold,
  onNextPlayer,
  onResetAuction,
  availablePlayers,
  onSelectPlayer,
  currentPlayerId,
}) => {
  if (!isOpen) return null;

  const states: { id: AuctionUIState; label: string; icon: any }[] = [
    { id: 'INITIAL', label: 'Initial', icon: RotateCcw },
    { id: 'PLAYER_READY', label: 'Player Ready', icon: Play },
    { id: 'BIDDING', label: 'Bidding', icon: Zap },
    { id: 'GOING_ONCE', label: 'Going Once', icon: AlertCircle },
    { id: 'GOING_TWICE', label: 'Going Twice', icon: AlertTriangle },
    { id: 'SOLD', label: 'SOLD!', icon: CheckCircle2 },
    { id: 'UNSOLD', label: 'UNSOLD', icon: XCircle },
    { id: 'PAUSED', label: 'Paused', icon: RotateCcw },
  ];

  return (
    <div className="demo-panel">
      <div className="demo-panel__header">
        <div className="demo-panel__title-wrap">
          <Sliders size={16} />
          <span className="demo-panel__title">Simulation & Demo Console</span>
        </div>
        <button className="demo-panel__close-btn" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="demo-panel__body">
        {/* Quick State Overrides */}
        <div className="demo-panel__section">
          <span className="demo-panel__label">FORCE AUCTION STATE</span>
          <div className="demo-panel__btn-grid">
            {states.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                className={`demo-panel__state-btn ${
                  currentState === id ? 'demo-panel__state-btn--active' : ''
                }`}
                onClick={() => {
                  if (id === 'SOLD') onTriggerSold();
                  else if (id === 'UNSOLD') onTriggerUnsold();
                  else onSetState(id);
                }}
              >
                <Icon size={12} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Simulated Actions */}
        <div className="demo-panel__section">
          <span className="demo-panel__label">QUICK SIMULATION ACTIONS</span>
          <div className="demo-panel__actions">
            <button className="demo-panel__action-btn" onClick={onSimulateBid}>
              <Coins size={14} />
              <span>Simulate Rival Bid</span>
            </button>
            <button className="demo-panel__action-btn demo-panel__action-btn--sold" onClick={onTriggerSold}>
              <CheckCircle2 size={14} />
              <span>Test SOLD Animation</span>
            </button>
            <button className="demo-panel__action-btn demo-panel__action-btn--unsold" onClick={onTriggerUnsold}>
              <XCircle size={14} />
              <span>Test UNSOLD Animation</span>
            </button>
            <button className="demo-panel__action-btn" onClick={onNextPlayer}>
              <SkipForward size={14} />
              <span>Advance Next Player</span>
            </button>
            <button className="demo-panel__action-btn demo-panel__action-btn--reset" onClick={onResetAuction}>
              <RotateCcw size={14} />
              <span>Reset Lot</span>
            </button>
          </div>
        </div>

        {/* Player Switcher (Loaded from DB) */}
        {availablePlayers.length > 0 && (
          <div className="demo-panel__section">
            <span className="demo-panel__label">SWITCH PLAYER (FROM DB POOL)</span>
            <div className="demo-panel__player-list">
              {availablePlayers.slice(0, 12).map((p) => (
                <button
                  key={p.id}
                  className={`demo-panel__player-chip ${
                    p.id === currentPlayerId ? 'demo-panel__player-chip--active' : ''
                  }`}
                  onClick={() => onSelectPlayer(p)}
                >
                  <span className="demo-panel__player-chip-id">{p.id}</span>
                  <span className="demo-panel__player-chip-name">{p.name}</span>
                  <span className="demo-panel__player-chip-role">({p.role})</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
