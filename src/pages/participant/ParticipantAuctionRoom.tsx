import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Trophy,
  ArrowLeft,
  HelpCircle,
  AlertCircle,
  Gavel,
  Shield,
  Loader2,
  Crown,
} from 'lucide-react';
import { participantService, type ParticipantProfile } from '../../services/participantService';
import { auctionService, type LiveAuctionState } from '../../services/auctionService';
import { useAuctionSocket } from '../../hooks/useAuctionSocket';
import { PlayerStage } from '../organizer/LiveAuction/PlayerStage';
import { BidActivity } from '../organizer/LiveAuction/BidActivity';
import { SoldOverlay } from '../organizer/LiveAuction/SoldOverlay';
import { UnsoldOverlay } from '../organizer/LiveAuction/UnsoldOverlay';
import type { AuctionPlayer, AuctionTeam, LiveBid } from '../organizer/LiveAuction/types';
import './ParticipantAuctionRoom.css';

export const ParticipantAuctionRoom: React.FC = () => {
  const [profile, setProfile] = useState<ParticipantProfile | null>(null);
  const [sessionState, setSessionState] = useState<LiveAuctionState | null>(null);
  const [timerSeconds, setTimerSeconds] = useState<number>(15);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isBidding, setIsBidding] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showSoldOverlay, setShowSoldOverlay] = useState<boolean>(false);
  const [showUnsoldOverlay, setShowUnsoldOverlay] = useState<boolean>(false);

  const navigate = useNavigate();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = useCallback(async () => {
    try {
      const [prof, state] = await Promise.all([
        participantService.getProfile(),
        auctionService.getState(),
      ]);
      setProfile(prof);
      setSessionState(state);
      if (state.timerSeconds !== undefined) {
        setTimerSeconds(state.timerSeconds);
      }
    } catch {
      navigate('/participant/login');
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadData();

    // Heartbeat ping
    const pingInterval = setInterval(() => {
      participantService.ping('auction');
    }, 15000);

    return () => clearInterval(pingInterval);
  }, [loadData]);

  // WebSocket real-time sync
  useAuctionSocket({
    onStateUpdate: (st) => {
      setSessionState(st);
      if (st.timerSeconds !== undefined) setTimerSeconds(st.timerSeconds);
    },
    onPlayerSold: () => {
      setShowSoldOverlay(true);
      loadData();
    },
    onPlayerUnsold: () => {
      setShowUnsoldOverlay(true);
      loadData();
    },
    onTimerTick: (sec) => {
      setTimerSeconds(sec);
    },
  });

  const currentPlayer: AuctionPlayer | null = sessionState?.currentPlayer
    ? {
        id: sessionState.currentPlayer.id,
        dbId: sessionState.currentPlayer.dbId,
        name: sessionState.currentPlayer.name,
        role: sessionState.currentPlayer.role,
        nationality: sessionState.currentPlayer.nationality,
        playerCategory: sessionState.currentPlayer.playerCategory,
        basePrice: sessionState.currentPlayer.basePrice,
        status: sessionState.currentPlayer.status,
        rating: sessionState.currentPlayer.rating,
      }
    : null;

  const currentBid = sessionState?.currentBid || 0;
  const isAuctionActive = sessionState?.status === 'ACTIVE';
  const stageState = sessionState?.stageState || 'INITIAL';

  const highestBidderTeam: AuctionTeam | null = sessionState?.highestBidder
    ? {
        id: sessionState.highestBidder.id,
        name: sessionState.highestBidder.name,
        college: sessionState.highestBidder.college,
        startingPurse: sessionState.highestBidder.startingPurse,
        remainingPurse: sessionState.highestBidder.remainingPurse,
        playersBought: sessionState.highestBidder.playersBought,
        color: '#0284C7',
        accentColor: '#0284C7',
      }
    : null;

  const highestBidderName = highestBidderTeam?.name || 'Awaiting Opening Bid';
  const isMyTeamLeading = highestBidderTeam?.id === profile?.teamId;

  const bidHistory: LiveBid[] = (sessionState?.bidHistory || []).map((b) => ({
    id: String(b.id),
    teamName: b.teamName,
    teamId: b.teamId,
    amount: b.amount,
    timestamp: b.timestamp,
  }));

  const handlePlaceBid = async (increment: number) => {
    if (!profile || isBidding) return;
    setIsBidding(true);
    try {
      const targetBid = +(currentBid + increment).toFixed(2);
      await participantService.placeBid(targetBid);
      showToast(`Bid placed for ₹${targetBid.toFixed(2)} Cr!`);
      const updatedProfile = await participantService.getProfile();
      setProfile(updatedProfile);
    } catch (err: any) {
      showToast(err.message || 'Bid rejected');
    } finally {
      setIsBidding(false);
    }
  };

  const handleCallHelper = async () => {
    const reason = prompt('Please enter your question or technical issue:');
    if (!reason || !reason.trim()) return;
    try {
      await participantService.requestHelp(reason.trim());
      showToast('Support request sent! A helper is on their way.');
    } catch (err: any) {
      alert(err.message || 'Failed to request support');
    }
  };

  if (isLoading || !profile) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#050814', color: '#00F59B' }}>
        <Loader2 size={36} className="spin-animation" />
        <span style={{ marginLeft: 14, fontSize: 16 }}>Entering Auction Room...</span>
      </div>
    );
  }

  const canBid =
    isAuctionActive &&
    (stageState === 'BIDDING' || stageState === 'GOING_ONCE' || stageState === 'GOING_TWICE') &&
    !isMyTeamLeading;

  return (
    <div className="part-room">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(239, 68, 68, 0.95)',
            color: '#FFFFFF',
            padding: '12px 24px',
            borderRadius: 12,
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            zIndex: 9999,
            fontSize: 14,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <AlertCircle size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Bar */}
      <header className="part-room-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link
            to="/participant/dashboard"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: '#94A3B8',
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <ArrowLeft size={16} />
            <span>Dashboard</span>
          </Link>
          <div className="part-room-badge">
            <Trophy size={14} />
            <span>ZenTriX'26 Live Stage</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase' }}>Bidding As</span>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#00F59B' }}>{profile.teamName}</div>
          </div>

          <button
            onClick={handleCallHelper}
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#FCA5A5',
              padding: '6px 14px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
            }}
          >
            <HelpCircle size={14} />
            <span>Call Helper</span>
          </button>
        </div>
      </header>

      {/* Main Stage Grid */}
      <main style={{ flex: 1, padding: '24px 28px 120px', maxWidth: 1400, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 24, alignItems: 'start' }}>
          {/* Left Player Stage */}
          <PlayerStage
            player={currentPlayer}
            auctionState={stageState}
            currentBid={currentBid}
            highestBidderTeam={highestBidderTeam}
            highestBidderName={highestBidderName}
            hasBids={bidHistory.length > 0}
            timerSeconds={timerSeconds}
            isPaused={stageState === 'PAUSED'}
          />

          {/* Right Bid Feed */}
          <BidActivity bids={bidHistory} />
        </div>
      </main>

      {/* Contestant Floating Bidding Dock */}
      <div className={`part-bidding-dock ${isMyTeamLeading ? 'part-dock-leading' : ''}`}>
        <div className="part-dock-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={18} color={isMyTeamLeading ? '#FFB800' : '#00F59B'} />
            <span className="part-dock-team">{profile.teamName}</span>
            {isMyTeamLeading && (
              <span style={{ background: '#FFB800', color: '#050814', padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Crown size={12} /> HIGHEST BIDDER
              </span>
            )}
          </div>
          <span className="part-dock-purse">
            Remaining Purse: ₹{profile.remainingPurse.toFixed(2)} Cr · Squad: {profile.squad.length}/15
          </span>
        </div>

        {/* Quick Increment Bids */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            className="part-chip-bid"
            onClick={() => handlePlaceBid(0.20)}
            disabled={!canBid || isBidding}
          >
            +0.20 Cr
          </button>
          <button
            type="button"
            className="part-chip-bid"
            onClick={() => handlePlaceBid(0.50)}
            disabled={!canBid || isBidding}
          >
            +0.50 Cr
          </button>
          <button
            type="button"
            className="part-chip-bid"
            onClick={() => handlePlaceBid(1.00)}
            disabled={!canBid || isBidding}
          >
            +1.00 Cr
          </button>

          {/* Primary Action Button */}
          <button
            type="button"
            className="part-bid-btn"
            onClick={() => handlePlaceBid(0.50)}
            disabled={!canBid || isBidding}
          >
            <Gavel size={18} />
            <span>{isMyTeamLeading ? 'HOLDING BID' : 'BID NOW (+0.50)'}</span>
          </button>
        </div>
      </div>

      {/* SOLD Celebration Overlay */}
      {showSoldOverlay && (
        <SoldOverlay
          player={currentPlayer}
          winningTeam={highestBidderTeam}
          winningTeamName={highestBidderName}
          finalBid={currentBid}
          onAnimationComplete={() => setShowSoldOverlay(false)}
        />
      )}

      {/* UNSOLD Overlay */}
      {showUnsoldOverlay && (
        <UnsoldOverlay
          player={currentPlayer}
          onAnimationComplete={() => setShowUnsoldOverlay(false)}
        />
      )}
    </div>
  );
};
