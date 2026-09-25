import React from 'react';
import { Radio, AlertCircle, AlertTriangle, CheckCircle2, XCircle, PauseCircle, UserCheck } from 'lucide-react';
import type { AuctionUIState } from './types';

interface AuctionStateIndicatorProps {
  state: AuctionUIState;
}

export const AuctionStateIndicator: React.FC<AuctionStateIndicatorProps> = ({ state }) => {
  const getBadgeConfig = () => {
    switch (state) {
      case 'BIDDING':
        return {
          label: 'BIDDING ACTIVE',
          sub: 'Bids Open',
          icon: Radio,
          variant: 'bidding',
        };
      case 'GOING_ONCE':
        return {
          label: 'GOING ONCE',
          sub: 'First Call',
          icon: AlertCircle,
          variant: 'going-once',
        };
      case 'GOING_TWICE':
        return {
          label: 'GOING TWICE',
          sub: 'Final Call Before Hammer',
          icon: AlertTriangle,
          variant: 'going-twice',
        };
      case 'SOLD':
        return {
          label: 'SOLD!',
          sub: 'Hammer Down',
          icon: CheckCircle2,
          variant: 'sold',
        };
      case 'UNSOLD':
        return {
          label: 'UNSOLD',
          sub: 'Passed to Re-auction',
          icon: XCircle,
          variant: 'unsold',
        };
      case 'PAUSED':
        return {
          label: 'AUCTION PAUSED',
          sub: 'Awaiting Resume',
          icon: PauseCircle,
          variant: 'paused',
        };
      case 'PLAYER_READY':
        return {
          label: 'PLAYER ON STAGE',
          sub: 'Ready for Opening Bid',
          icon: UserCheck,
          variant: 'ready',
        };
      case 'NEXT_PLAYER':
        return {
          label: 'PREPARING NEXT PLAYER',
          sub: 'Next Lot',
          icon: Radio,
          variant: 'transition',
        };
      case 'INITIAL':
      default:
        return {
          label: 'AUCTION READY',
          sub: 'Awaiting Start',
          icon: Radio,
          variant: 'initial',
        };
    }
  };

  const config = getBadgeConfig();
  const IconComponent = config.icon;

  return (
    <div className={`auction-state-pill auction-state-pill--${config.variant}`}>
      <span className="auction-state-pill__pulse" />
      <span className="auction-state-pill__icon">
        <IconComponent size={16} />
      </span>
      <div className="auction-state-pill__content">
        <span className="auction-state-pill__label">{config.label}</span>
        <span className="auction-state-pill__sub">{config.sub}</span>
      </div>
    </div>
  );
};
