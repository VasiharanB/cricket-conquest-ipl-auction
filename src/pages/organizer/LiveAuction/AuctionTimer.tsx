import React from 'react';
import { useLocation } from 'react-router-dom';
import { Timer } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

interface AuctionTimerProps {
  seconds: number;
  totalDuration?: number;
  isPaused?: boolean;
}

export const AuctionTimer: React.FC<AuctionTimerProps> = ({
  seconds,
  totalDuration = 15,
  isPaused = false,
}) => {
  const location = useLocation();
  const { user } = useAuth();

  // The timer MUST be visible ONLY from Admin/Organizer side, NEVER on participant side
  const isParticipantPage = location.pathname.includes('/participant');
  const isOrganizerSide = location.pathname.startsWith('/organizer');
  const isAdminOrAuctioneer = user?.role === 'Admin' || user?.role === 'Auctioneer';

  if (isParticipantPage || !isOrganizerSide || !isAdminOrAuctioneer) {
    return null;
  }
  const isUrgent = seconds <= 5 && seconds > 0;
  const isZero = seconds === 0;

  const formatTime = (secs: number) => {
    const s = Math.max(0, secs);
    const mm = String(Math.floor(s / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  };

  // Progress fraction from 0 to 1
  const progress = Math.min(1, Math.max(0, seconds / totalDuration));
  const dashOffset = 100 - progress * 100;

  return (
    <div
      className={`auction-timer ${isUrgent ? 'auction-timer--urgent' : ''} ${
        isZero ? 'auction-timer--zero' : ''
      } ${isPaused ? 'auction-timer--paused' : ''}`}
      title={isPaused ? 'Timer Paused' : `Bidding window: ${seconds}s`}
    >
      <div className="auction-timer__dial">
        <svg viewBox="0 0 36 36" className="auction-timer__svg">
          <circle
            cx="18"
            cy="18"
            r="15"
            className="auction-timer__circle-bg"
          />
          <circle
            cx="18"
            cy="18"
            r="15"
            className="auction-timer__circle-fill"
            strokeDasharray="94.2"
            strokeDashoffset={(dashOffset * 94.2) / 100}
          />
        </svg>
        <Timer size={13} className="auction-timer__icon" />
      </div>

      <div className="auction-timer__content">
        <span className="auction-timer__time">{formatTime(seconds)}</span>
        <span className="auction-timer__label">
          {isPaused ? 'PAUSED' : isUrgent ? 'CLOSING' : 'TIMER'}
        </span>
      </div>
    </div>
  );
};
