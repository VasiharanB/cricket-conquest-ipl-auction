import React from 'react';
import { PlayerImage } from './PlayerImage';
import { PlayerInfo } from './PlayerInfo';
import { CurrentBid } from './CurrentBid';
import { HighestBidder } from './HighestBidder';
import { AuctionStateIndicator } from './AuctionStateIndicator';
import type { AuctionPlayer, AuctionTeam, AuctionUIState } from './types';

interface PlayerStageProps {
  player: AuctionPlayer | null;
  auctionState: AuctionUIState;
  currentBid: number;
  highestBidderTeam: AuctionTeam | null;
  highestBidderName: string;
  hasBids: boolean;
  timerSeconds: number;
  isPaused: boolean;
  hideRating?: boolean;
  hideTimer?: boolean;
}

export const PlayerStage: React.FC<PlayerStageProps> = ({
  player,
  auctionState,
  currentBid,
  highestBidderTeam,
  highestBidderName,
  hasBids,
  timerSeconds,
  isPaused,
  hideRating = false,
  hideTimer = false,
}) => {
  return (
    <section className="auction-player-stage">
      {/* Background ambient lighting effects */}
      <div className="auction-player-stage__backdrop-glow" />
      <div className="auction-player-stage__light-beam" />

      <div className="auction-player-stage__grid">
        {/* HERO LEFT: Large Dominant Player Portrait */}
        <div className="auction-player-stage__portrait-col">
          <PlayerImage player={player} isHero={true} />
        </div>

        {/* HERO RIGHT: Player Details, Bidding & Live Numbers */}
        <div className="auction-player-stage__details-col">
          {/* Active Broadcast State Pill */}
          <div className="auction-player-stage__state-row">
            <AuctionStateIndicator state={auctionState} />
          </div>

          {/* Player Information (Name, Role, Nationality, Base Price) */}
          <PlayerInfo player={player} hideRating={hideRating} />

          {/* Big Number Section: Current Bid Hero */}
          <div className="auction-player-stage__bidding-zone">
            <CurrentBid
              amount={currentBid}
              basePrice={player?.basePrice ?? 0}
              timerSeconds={timerSeconds}
              isPaused={isPaused}
              hideTimer={hideTimer}
            />

            {/* Highest Bidder Team Info */}
            <HighestBidder
              team={highestBidderTeam}
              teamName={highestBidderName}
              hasBids={hasBids}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
