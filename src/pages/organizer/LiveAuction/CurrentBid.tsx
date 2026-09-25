import React, { useEffect, useState, useRef } from 'react';
import { TrendingUp, Coins } from 'lucide-react';
import { AuctionTimer } from './AuctionTimer';
import { normalizeToCrores, formatCroreNumber } from './auctionCurrency';

interface CurrentBidProps {
  amount: number;
  basePrice?: number;
  timerSeconds: number;
  isPaused?: boolean;
}

export const CurrentBid: React.FC<CurrentBidProps> = ({
  amount,
  basePrice = 0,
  timerSeconds,
  isPaused = false,
}) => {
  const [displayAmount, setDisplayAmount] = useState(amount);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevAmountRef = useRef(amount);

  useEffect(() => {
    if (prevAmountRef.current !== amount) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setDisplayAmount(amount);
        prevAmountRef.current = amount;
      }, 150);

      const endTimer = setTimeout(() => {
        setIsAnimating(false);
      }, 500);

      return () => {
        clearTimeout(timer);
        clearTimeout(endTimer);
      };
    }
  }, [amount]);

  const crAmount = normalizeToCrores(displayAmount);
  const crBase = normalizeToCrores(basePrice);
  const numStr = formatCroreNumber(displayAmount);
  const diffFromBase = Math.max(0, crAmount - crBase);
  const multiplier = crBase > 0 ? (crAmount / crBase).toFixed(1) : '1.0';

  return (
    <div className="current-bid-stage">
      <div className="current-bid-stage__header">
        <div className="current-bid-stage__title-wrap">
          <Coins size={16} className="current-bid-stage__icon" />
          <span className="current-bid-stage__label">CURRENT BID</span>
        </div>

        {/* Timer is integrated seamlessly into top-right of bid hero */}
        <AuctionTimer seconds={timerSeconds} isPaused={isPaused} />
      </div>

      <div className={`current-bid-stage__amount-wrap ${isAnimating ? 'current-bid-stage__amount-wrap--animating' : ''}`}>
        <span className="current-bid-stage__symbol">₹</span>
        <span className="current-bid-stage__number">{numStr}</span>
        <span className="current-bid-stage__unit">Cr</span>
      </div>

      {/* Dynamic growth stats */}
      <div className="current-bid-stage__stats">
        {diffFromBase > 0 && (
          <span className="current-bid-stage__diff">
            <TrendingUp size={12} />
            +₹{diffFromBase % 1 === 0 ? diffFromBase : diffFromBase.toFixed(2)} Cr ({multiplier}x)
          </span>
        )}
      </div>
    </div>
  );
};
