import React, { useState, useEffect, useCallback } from 'react';
import { AuctionHeader } from './AuctionHeader';
import { PlayerStage } from './PlayerStage';
import { NextPlayerPreview } from './NextPlayerPreview';
import { BidActivity } from './BidActivity';
import { TeamPurseStrip } from './TeamPurseStrip';
import { AuctionControls } from './AuctionControls';
import { SoldOverlay } from './SoldOverlay';
import { UnsoldOverlay } from './UnsoldOverlay';
import { PlayerSelectorModal } from './PlayerSelectorModal';
import { DemoControls } from './DemoControls';
import { Loader2, AlertCircle } from 'lucide-react';
import { auctionService, type LiveAuctionState } from '../../../services/auctionService';
import { useAuctionSocket } from '../../../hooks/useAuctionSocket';
import { useAuth } from '../../../contexts/AuthContext';
import type { AuctionPlayer, AuctionTeam, AuctionUIState, LiveBid } from './types';
import './LiveAuction.css';

const DEFAULT_TEAMS: AuctionTeam[] = [
  { id: 'CC26-001', name: 'Royal Strikers', college: 'PSG Tech', startingPurse: 100, remainingPurse: 100, playersBought: 0, color: '#3B82F6', accentColor: '#3B82F6' },
  { id: 'CC26-002', name: 'Mumbai Warriors', college: 'CIT', startingPurse: 100, remainingPurse: 100, playersBought: 0, color: '#0284C7', accentColor: '#0284C7' },
  { id: 'CC26-003', name: 'Chennai Kings', college: 'SKCET', startingPurse: 100, remainingPurse: 100, playersBought: 0, color: '#EAB308', accentColor: '#EAB308' },
  { id: 'CC26-004', name: 'Delhi Titans', college: 'KCT', startingPurse: 100, remainingPurse: 100, playersBought: 0, color: '#6366F1', accentColor: '#6366F1' },
];

export const LiveAuction: React.FC = () => {
  const { user } = useAuth();
  const isVolunteer = String(user?.role || '').toLowerCase() === 'volunteer';
  const isAdmin = String(user?.role || '').toLowerCase() === 'admin';
  // Auctioneer bids on behalf of teams; Admin manages flow but does NOT bid

  // === REAL BACKEND STATE ===
  const [sessionState, setSessionState] = useState<LiveAuctionState | null>(null);
  const [teams, setTeams] = useState<AuctionTeam[]>(DEFAULT_TEAMS);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(DEFAULT_TEAMS[0].id);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // === OVERLAYS & UI MODES ===
  const [showSoldOverlay, setShowSoldOverlay] = useState<boolean>(false);
  const [showUnsoldOverlay, setShowUnsoldOverlay] = useState<boolean>(false);
  const [showPlayerSelector, setShowPlayerSelector] = useState<boolean>(false);
  const [showDemoPanel, setShowDemoPanel] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [timerSeconds, setTimerSeconds] = useState<number>(15);

  const colors = ['#3B82F6', '#0284C7', '#EAB308', '#6366F1', '#EF4444', '#8B5CF6', '#F97316', '#EC4899', '#10B981', '#14B8A6'];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Map backend teams to AuctionTeam UI format
  const mapBackendTeams = useCallback((backendTeams: any[]): AuctionTeam[] => {
    return backendTeams.map((t, idx) => ({
      id: t.id,
      name: t.name,
      college: t.college,
      startingPurse: Number(t.startingPurse) || 100,
      remainingPurse: Number(t.remainingPurse) || 100,
      playersBought: Number(t.playersBought) || 0,
      color: colors[idx % colors.length],
      accentColor: colors[idx % colors.length],
    }));
  }, []);

  // Sync state handler
  const handleApplyState = useCallback((state: LiveAuctionState) => {
    setSessionState(state);
    if (state.teams && state.teams.length > 0) {
      setTeams(mapBackendTeams(state.teams));
      if (!selectedTeamId) {
        setSelectedTeamId(state.teams[0].id);
      }
    }
    if (state.timerSeconds !== undefined) {
      setTimerSeconds(state.timerSeconds);
    }
  }, [mapBackendTeams, selectedTeamId]);

  // --- Real-time WebSocket hook ---
  useAuctionSocket({
    onStateUpdate: (state) => {
      handleApplyState(state);
    },
    onPlayerSold: () => {
      setShowSoldOverlay(true);
    },
    onPlayerUnsold: () => {
      setShowUnsoldOverlay(true);
    },
    onSaleUndone: (state) => {
      setShowSoldOverlay(false);
      setShowUnsoldOverlay(false);
      showToast('Previous sale was undone. Player and team purse restored.');
      handleApplyState(state);
    },
    onTimerTick: (seconds) => {
      setTimerSeconds(seconds);
    },
  });

  // Client-side countdown timer:
  // Timer is ON ONLY when 'Going Once' or 'Going Twice' is selected.
  // When another bid is placed, stage reverts to 'BIDDING' and timer resets to 15s, waiting for Going Once.
  useEffect(() => {
    const stage = sessionState?.stageState || 'INITIAL';
    const isGoingCallActive = stage === 'GOING_ONCE' || stage === 'GOING_TWICE';

    if (!isGoingCallActive) {
      // In BIDDING, INITIAL, or any other state: keep timer at reset position (15s) and DO NOT count down
      setTimerSeconds(sessionState?.timerSeconds || 15);
      return;
    }

    // When Going Once or Going Twice is selected, start the timer countdown
    const countdown = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(countdown);
          // Safeguard progression if server WS had any latency
          if (!isVolunteer) {
            if (stage === 'GOING_ONCE') {
              auctionService.setStage('GOING_TWICE').then(handleApplyState).catch(() => {});
            } else if (stage === 'GOING_TWICE') {
              if (sessionState?.highestBidder) {
                auctionService.sellPlayer().then((st) => {
                  setShowSoldOverlay(true);
                  handleApplyState(st);
                }).catch(() => {});
              } else {
                auctionService.markUnsold().then((st) => {
                  setShowUnsoldOverlay(true);
                  handleApplyState(st);
                }).catch(() => {});
              }
            }
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, [sessionState?.stageState, sessionState?.timerSeconds, sessionState?.highestBidder, isVolunteer, handleApplyState]);

  // --- Initial Data Load from Backend API ---
  const loadLiveAuction = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const state = await auctionService.getState();
      handleApplyState(state);
    } catch (err: any) {
      console.warn('Live Auction API connection error:', err);
      setApiError(err?.message || 'Could not connect to Auction API.');
    } finally {
      setIsLoading(false);
    }
  }, [handleApplyState]);

  useEffect(() => {
    loadLiveAuction();
  }, [loadLiveAuction]);

  // Derived state from sessionState
  const auctionState: AuctionUIState = sessionState?.stageState || 'INITIAL';
  const currentBid = sessionState?.currentBid || 0;
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

  const nextPlayer: AuctionPlayer | null = sessionState?.nextPlayer
    ? {
        id: sessionState.nextPlayer.id,
        dbId: sessionState.nextPlayer.dbId,
        name: sessionState.nextPlayer.name,
        role: sessionState.nextPlayer.role,
        nationality: sessionState.nextPlayer.nationality,
        playerCategory: sessionState.nextPlayer.playerCategory,
        basePrice: sessionState.nextPlayer.basePrice,
        status: sessionState.nextPlayer.status,
        rating: sessionState.nextPlayer.rating,
      }
    : null;

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

  const bidHistory: LiveBid[] = (sessionState?.bidHistory || []).map((b) => ({
    id: String(b.id),
    teamName: b.teamName,
    teamId: b.teamId,
    amount: b.amount,
    timestamp: b.timestamp,
  }));

  // --- Auction Controls Handlers ---
  const handleStartBidding = async () => {
    try {
      const state = await auctionService.startAuction();
      handleApplyState(state);
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const handleSelectPlayer = async (player: any) => {
    try {
      const state = await auctionService.selectPlayer(player.id);
      handleApplyState(state);
      showToast(`Player ${player.name} brought to stage!`);
    } catch (err: any) {
      showToast(err.message || 'Failed to select player');
      throw err;
    }
  };

  const handleGoingOnce = async () => {
    try {
      const state = await auctionService.setStage('GOING_ONCE');
      handleApplyState(state);
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const handleGoingTwice = async () => {
    try {
      const state = await auctionService.setStage('GOING_TWICE');
      handleApplyState(state);
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const handleMarkSold = async () => {
    try {
      const state = await auctionService.sellPlayer();
      setShowSoldOverlay(true);
      handleApplyState(state);
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const handleMarkUnsold = async () => {
    try {
      const state = await auctionService.markUnsold();
      setShowUnsoldOverlay(true);
      handleApplyState(state);
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const handleUndoSale = async () => {
    if (!window.confirm('Are you sure you want to undo the last sale? This will restore the player and the team purse.')) {
      return;
    }
    try {
      const state = await auctionService.undoLastSale();
      handleApplyState(state);
      showToast('Last sale undone successfully.');
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const handleNextPlayer = async () => {
    try {
      const state = await auctionService.nextPlayer();
      handleApplyState(state);
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const handleTogglePause = async () => {
    try {
      if (auctionState === 'PAUSED') {
        const state = await auctionService.resumeAuction();
        handleApplyState(state);
      } else {
        const state = await auctionService.pauseAuction();
        handleApplyState(state);
      }
    } catch (err: any) {
      showToast(err.message);
    }
  };

  // Fullscreen toggle
  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  const hasBids = bidHistory.length > 0;
  const canSold = !isVolunteer && hasBids && (auctionState === 'BIDDING' || auctionState === 'GOING_ONCE' || auctionState === 'GOING_TWICE');

  return (
    <div className="live-auction-wrapper">
      {/* Background Animated Atmosphere */}
      <div className="live-auction-bg-orbs">
        <div className="live-auction-bg-orb live-auction-bg-orb--1" />
        <div className="live-auction-bg-orb live-auction-bg-orb--2" />
        <div className="live-auction-bg-orb live-auction-bg-orb--3" />
      </div>
      <div className="live-auction-bg-grid" />

      {/* Toast Notification */}
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

      {/* Top Compact Auction Status Bar */}
      <AuctionHeader
        roundNumber={sessionState?.roundNumber || 1}
        totalTeamsCount={sessionState?.teams.length || 4}
        checkedInTeamsCount={teams.length}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        showDemoPanel={showDemoPanel}
        onToggleDemoPanel={() => setShowDemoPanel((prev) => !prev)}
        isConnectedToDb={true}
      />

      {/* Main Auction Stage Container */}
      <main className="live-auction-main">
        {isLoading && (
          <div className="auction-status-banner auction-status-banner--loading">
            <Loader2 size={16} className="auction-spinner" />
            <span>Synchronizing live auction state with MySQL database...</span>
          </div>
        )}

        {apiError && (
          <div className="auction-status-banner auction-status-banner--error">
            <AlertCircle size={16} />
            <span>{apiError}</span>
          </div>
        )}

        {/* Main Stage Two-Column Grid */}
        <div className="live-auction-stage-grid">
          {/* Central Hero Player Stage */}
          <PlayerStage
            player={currentPlayer}
            auctionState={auctionState}
            currentBid={currentBid}
            highestBidderTeam={highestBidderTeam}
            highestBidderName={highestBidderName}
            hasBids={hasBids}
            timerSeconds={timerSeconds}
            isPaused={auctionState === 'PAUSED'}
          />

          {/* Auxiliary Side Panels: Next Up & Live Bid Feed */}
          <aside className="live-auction-side-col">
            <NextPlayerPreview
              player={nextPlayer}
              onSkipToNext={!isVolunteer ? handleNextPlayer : undefined}
              onOpenPlayerSelector={!isVolunteer ? () => setShowPlayerSelector(true) : undefined}
            />

            <BidActivity bids={bidHistory} />
          </aside>
        </div>

        {/* Compact Team Purse Strip at Bottom of Stage */}
        <TeamPurseStrip
          teams={teams}
          highestBidderName={highestBidderName}
          onSelectTeam={(team) => {
            setSelectedTeamId(team.id);
          }}
        />
      </main>

      {/* Floating Organizer Control Dock */}
      <AuctionControls
        auctionState={auctionState}
        teams={teams}
        onStartBidding={handleStartBidding}
        onOpenPlayerSelector={() => setShowPlayerSelector(true)}
        onUndoSale={handleUndoSale}
        onGoingOnce={handleGoingOnce}
        onGoingTwice={handleGoingTwice}
        onMarkSold={handleMarkSold}
        onMarkUnsold={handleMarkUnsold}
        onNextPlayer={handleNextPlayer}
        onTogglePause={handleTogglePause}
        canSold={canSold}
        isVolunteer={isVolunteer}
        isAdmin={isAdmin}
      />

      {/* Signature SOLD Celebration Overlay */}
      {showSoldOverlay && (
        <SoldOverlay
          player={currentPlayer}
          winningTeam={highestBidderTeam}
          winningTeamName={highestBidderName}
          finalBid={currentBid}
          onAnimationComplete={() => {
            setShowSoldOverlay(false);
          }}
        />
      )}

      {/* UNSOLD Overlay */}
      {showUnsoldOverlay && (
        <UnsoldOverlay
          player={currentPlayer}
          onAnimationComplete={() => {
            setShowUnsoldOverlay(false);
          }}
        />
      )}

      {/* Organizer Player Selector Modal */}
      <PlayerSelectorModal
        isOpen={showPlayerSelector}
        onClose={() => setShowPlayerSelector(false)}
        onSelectPlayer={handleSelectPlayer}
        currentPlayerId={currentPlayer?.id}
      />

      {/* Interactive Simulation / Demo Controls Drawer */}
      <DemoControls
        isOpen={showDemoPanel}
        onClose={() => setShowDemoPanel(false)}
        currentState={auctionState}
        onSetState={(st) => auctionService.setStage(st).then(handleApplyState)}
        onSimulateBid={() => {}}
        onTriggerSold={handleMarkSold}
        onTriggerUnsold={handleMarkUnsold}
        onNextPlayer={handleNextPlayer}
        onResetAuction={() => handleUndoSale()}
        availablePlayers={currentPlayer ? [currentPlayer] : []}
        onSelectPlayer={(p) => handleSelectPlayer(p)}
        currentPlayerId={currentPlayer?.id}
      />
    </div>
  );
};
