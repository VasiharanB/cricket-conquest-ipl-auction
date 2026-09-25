import React from 'react';
import { Modal } from '../Modal/Modal';
import { Badge } from '../Badge/Badge';
import type { PlayerRecord } from '../../services/playerService';
import './PlayerDetailModal.css';

interface PlayerDetailModalProps {
  player: PlayerRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PlayerDetailModal: React.FC<PlayerDetailModalProps> = ({
  player,
  isOpen,
  onClose,
}) => {
  if (!player) return null;

  const roleColors: Record<string, string> = {
    Batter: '#3B5BDB',
    Batsman: '#3B5BDB',
    Bowler: '#16A34A',
    'All-rounder': '#7C3AED',
    Wicketkeeper: '#F59E0B',
  };

  const statusVariantMap: Record<string, 'sold' | 'unsold' | 'available'> = {
    Sold: 'sold',
    Unsold: 'unsold',
    Available: 'available',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Player Profile" size="md">
      <div className="player-detail-modal">
        <div className="player-detail-modal__header">
          <div className="player-detail-modal__avatar">
            {player.name.charAt(0)}
          </div>
          <div className="player-detail-modal__info">
            <h2 className="player-detail-modal__name">{player.name}</h2>
            <div className="player-detail-modal__tags">
              <span
                className="role-tag"
                style={{ '--role-color': roleColors[player.role] || '#3B5BDB' } as React.CSSProperties}
              >
                {player.role}
              </span>
              <span className="player-detail-modal__code">{player.id}</span>
              <Badge variant={statusVariantMap[player.status] || 'available'} dot>
                {player.status}
              </Badge>
            </div>
          </div>
        </div>

        <div className="player-detail-modal__grid">
          <div className="player-detail-modal__item">
            <span className="player-detail-modal__label">Player ID</span>
            <span className="player-detail-modal__value font-mono">{player.id}</span>
          </div>

          <div className="player-detail-modal__item">
            <span className="player-detail-modal__label">Nationality</span>
            <span className="player-detail-modal__value">
              <span className={`nat-tag nat-tag--${player.nationality.toLowerCase()}`}>
                {player.nationality}
              </span>
            </span>
          </div>

          <div className="player-detail-modal__item">
            <span className="player-detail-modal__label">Category</span>
            <span className="player-detail-modal__value">{player.playerCategory || 'General'}</span>
          </div>

          <div className="player-detail-modal__item">
            <span className="player-detail-modal__label">Base Price</span>
            <span className="player-detail-modal__value font-bold text-royal">
              ₹{player.basePrice} Cr
            </span>
          </div>

          <div className="player-detail-modal__item">
            <span className="player-detail-modal__label">Rating</span>
            <span className="player-detail-modal__value">
              {player.rating !== null && player.rating !== undefined
                ? `${player.rating} / 100`
                : '—'}
            </span>
          </div>

          <div className="player-detail-modal__item">
            <span className="player-detail-modal__label">Auction Status</span>
            <span className="player-detail-modal__value">{player.status}</span>
          </div>

          {player.status === 'Sold' && player.soldFor !== null && player.soldFor !== undefined && (
            <div className="player-detail-modal__item player-detail-modal__item--full">
              <span className="player-detail-modal__label">Winning Bid (Sold For)</span>
              <span className="player-detail-modal__value text-success font-bold">
                ₹{player.soldFor} Cr
              </span>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
