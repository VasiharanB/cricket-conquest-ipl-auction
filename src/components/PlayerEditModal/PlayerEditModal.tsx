import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { Modal } from '../Modal/Modal';
import { Button } from '../Button/Button';
import { useAuth } from '../../contexts/AuthContext';
import { playerService } from '../../services/playerService';
import type { PlayerRecord } from '../../services/playerService';
import './PlayerEditModal.css';

interface PlayerEditModalProps {
  player: PlayerRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedPlayer: PlayerRecord) => void;
}

export const PlayerEditModal: React.FC<PlayerEditModalProps> = ({
  player,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';

  const [name, setName] = useState('');
  const [role, setRole] = useState('Batter');
  const [nationality, setNationality] = useState('India');
  const [category, setCategory] = useState('General');
  const [basePrice, setBasePrice] = useState<number | string>('2.0');
  const [rating, setRating] = useState<number | string>('');
  const [keyPoints, setKeyPoints] = useState<number | string>('');
  const [status, setStatus] = useState<'Available' | 'Sold' | 'Unsold'>('Available');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (player) {
      setName(player.name);
      setRole(player.role === 'Batsman' ? 'Batter' : player.role);
      setNationality(player.nationality);
      setCategory(player.playerCategory || 'General');
      setBasePrice(player.basePrice);
      setRating(player.rating !== null && player.rating !== undefined ? player.rating : '');
      setKeyPoints(player.key_points !== null && player.key_points !== undefined ? player.key_points : '');
      setStatus(player.status);
      setError(null);
    }
  }, [player]);

  if (!player) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Player Name is required');
      return;
    }
    if (!nationality.trim()) {
      setError('Nationality is required');
      return;
    }
    const priceNum = Number(basePrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Base Price must be greater than 0');
      return;
    }
    let ratingNum: number | null = null;
    if (rating !== '' && rating !== null && rating !== undefined) {
      ratingNum = Number(rating);
      if (isNaN(ratingNum) || ratingNum < 0 || ratingNum > 100) {
        setError('Rating must be between 0 and 100');
        return;
      }
    }

    let keyPointsNum: number | undefined = undefined;
    if (isAdmin && keyPoints !== '' && keyPoints !== null && keyPoints !== undefined) {
      keyPointsNum = Number(keyPoints);
      if (isNaN(keyPointsNum) || keyPointsNum < 0) {
        setError('Key points must be a non-negative number');
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const updated = await playerService.updatePlayer(player.id, {
        player_name: name.trim(),
        role,
        nationality: nationality.trim(),
        player_category: category.trim(),
        base_price: priceNum,
        rating: ratingNum,
        key_points: keyPointsNum,
        status,
      });

      onSuccess(updated);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update player');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Player — ${player.id}`} size="md">
      <form onSubmit={handleSubmit} className="player-edit-modal">
        {error && (
          <div className="player-edit-modal__alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="player-edit-modal__grid">
          <div className="player-edit-modal__field">
            <label className="player-edit-modal__label">Player ID</label>
            <input
              type="text"
              value={player.id}
              disabled
              className="player-edit-modal__input player-edit-modal__input--disabled"
            />
          </div>

          <div className="player-edit-modal__field">
            <label className="player-edit-modal__label">Player Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Virat Kohli"
              required
              className="player-edit-modal__input"
            />
          </div>

          <div className="player-edit-modal__field">
            <label className="player-edit-modal__label">Role *</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="player-edit-modal__select"
            >
              <option value="Batter">Batter</option>
              <option value="Bowler">Bowler</option>
              <option value="All-rounder">All-rounder</option>
              <option value="Wicketkeeper">Wicketkeeper</option>
            </select>
          </div>

          <div className="player-edit-modal__field">
            <label className="player-edit-modal__label">Nationality *</label>
            <input
              type="text"
              value={nationality}
              onChange={(e) => setNationality(e.target.value)}
              placeholder="e.g. India, Australia"
              required
              className="player-edit-modal__input"
            />
          </div>

          <div className="player-edit-modal__field">
            <label className="player-edit-modal__label">Player Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Marquee, Capped"
              className="player-edit-modal__input"
            />
          </div>

          <div className="player-edit-modal__field">
            <label className="player-edit-modal__label">Base Price (₹ Cr) *</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              required
              className="player-edit-modal__input"
            />
          </div>

          <div className="player-edit-modal__field">
            <label className="player-edit-modal__label">Rating (0–100)</label>
            <input
              type="number"
              step="0.5"
              min="0"
              max="100"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              placeholder="e.g. 94.5"
              className="player-edit-modal__input"
            />
          </div>

          {isAdmin && (
            <div className="player-edit-modal__field">
              <label className="player-edit-modal__label">Secret Key Points 🔑 (Admin Only)</label>
              <input
                type="number"
                min="0"
                value={keyPoints}
                onChange={(e) => setKeyPoints(e.target.value)}
                placeholder="e.g. 95"
                className="player-edit-modal__input"
                style={{ borderColor: '#D97706' }}
              />
            </div>
          )}

          <div className="player-edit-modal__field">
            <label className="player-edit-modal__label">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'Available' | 'Sold' | 'Unsold')}
              className="player-edit-modal__select"
            >
              <option value="Available">Available</option>
              <option value="Sold">Sold</option>
              <option value="Unsold">Unsold</option>
            </select>
          </div>
        </div>

        <div className="player-edit-modal__actions">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            icon={isSubmitting ? <Loader2 className="animate-spin" size={16} /> : undefined}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
