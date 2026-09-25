import React from 'react';
import { Radio, ArrowUpRight, History } from 'lucide-react';
import type { LiveBid } from './types';
import { formatCrores } from './auctionCurrency';

interface BidActivityProps {
  bids: LiveBid[];
}

export const BidActivity: React.FC<BidActivityProps> = ({ bids }) => {
  return (
    <div className="bid-activity-panel">
      <div className="bid-activity-panel__header">
        <div className="bid-activity-panel__title-wrap">
          <Radio size={13} className="bid-activity-panel__pulse-icon" />
          <span className="bid-activity-panel__title">LIVE BIDS</span>
        </div>
        <span className="bid-activity-panel__count">{bids.length} bids</span>
      </div>

      <div className="bid-activity-panel__list">
        {bids.length === 0 ? (
          <div className="bid-activity-panel__empty">
            <History size={16} />
            <span>Waiting for opening bid...</span>
          </div>
        ) : (
          bids.map((bid, index) => (
            <div
              key={bid.id}
              className={`bid-activity-item ${index === 0 ? 'bid-activity-item--latest' : ''}`}
            >
              <div className="bid-activity-item__left">
                <span className="bid-activity-item__index">#{bids.length - index}</span>
                <span className="bid-activity-item__team">{bid.teamName}</span>
              </div>

              <div className="bid-activity-item__right">
                <span className="bid-activity-item__amount">
                  {formatCrores(bid.amount)}
                </span>
                <ArrowUpRight size={12} className="bid-activity-item__arrow" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
