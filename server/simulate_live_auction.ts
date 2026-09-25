import { BiddingService } from './src/services/biddingService.js';
import { AuctionTransactionService } from './src/services/auctionTransactionService.js';
import { AuctionSessionService } from './src/services/auctionSessionService.js';
import { pool } from './src/db/pool.js';
import type { RowDataPacket } from 'mysql2';

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runLiveAuctionSimulation() {
  console.log('=== STARTING 50-PLAYER REAL-TIME AUCTION SIMULATION ===');
  const sessionId = await AuctionSessionService.getOrCreateActiveSession();

  // Fetch available teams
  const [teams] = await pool.query<RowDataPacket[]>('SELECT id, team_id, team_name, remaining_purse FROM teams ORDER BY id ASC');
  console.log(`Found ${teams.length} teams participating in auction.`);

  // We will auction first 8 lots with competitive bidding
  const lotsToProcess = 8;

  for (let i = 0; i < lotsToProcess; i++) {
    const state = await AuctionSessionService.getAuctionState(sessionId);
    const player = state.currentPlayer;
    if (!player) {
      console.log('No player currently on stage, advancing...');
      await AuctionSessionService.nextPlayer(sessionId);
      continue;
    }

    console.log(`\n--- [LOT #${i + 1}] AUCTIONING: ${player.name} (${player.role} - Base: ₹${player.basePrice} Cr) ---`);

    // Pick 2-3 competing teams
    const teamA = teams[i % teams.length];
    const teamB = teams[(i + 1) % teams.length];
    const teamC = teams[(i + 2) % teams.length];

    // Bid 1: Team A opening bid
    const bid1Amount = player.basePrice;
    console.log(`  > ${teamA.team_name} places opening bid of ₹${bid1Amount} Cr`);
    await BiddingService.placeBid({
      sessionId,
      teamId: teamA.id,
      bidAmount: bid1Amount,
    });
    await delay(300);

    // Bid 2: Team B counter-bid
    const bid2Amount = Number((bid1Amount + 0.5).toFixed(2));
    console.log(`  > ${teamB.team_name} raises bid to ₹${bid2Amount} Cr`);
    await BiddingService.placeBid({
      sessionId,
      teamId: teamB.id,
      bidAmount: bid2Amount,
    });
    await delay(300);

    // Bid 3: Team C counter-bid (for higher marquee players)
    let winningTeam = teamB;
    let winningBid = bid2Amount;

    if (player.playerCategory === 'Marquee' || player.basePrice >= 2.0) {
      const bid3Amount = Number((bid2Amount + 0.5).toFixed(2));
      console.log(`  > ${teamC.team_name} raises bid to ₹${bid3Amount} Cr`);
      await BiddingService.placeBid({
        sessionId,
        teamId: teamC.id,
        bidAmount: bid3Amount,
      });
      winningTeam = teamC;
      winningBid = bid3Amount;
      await delay(300);
    }

    // Call Going Once -> Going Twice
    await AuctionSessionService.setStageState(sessionId, 'GOING_ONCE');
    await delay(200);
    await AuctionSessionService.setStageState(sessionId, 'GOING_TWICE');
    await delay(200);

    // Hammer down: SOLD!
    console.log(`  🔨 SOLD! ${player.name} sold to ${winningTeam.team_name} for ₹${winningBid} Cr!`);
    await AuctionTransactionService.sellCurrentPlayer(sessionId);

    // Advance to next player
    await delay(300);
    await AuctionSessionService.nextPlayer(sessionId);
  }

  // Handle Lot 9 as an UNSOLD player demo (e.g. overseas high reserve player)
  const stateUnsold = await AuctionSessionService.getAuctionState(sessionId);
  if (stateUnsold.currentPlayer) {
    console.log(`\n--- [LOT #9] DEMO UNSOLD: ${stateUnsold.currentPlayer.name} ---`);
    console.log('  > No bids received within 15 seconds timer.');
    await AuctionTransactionService.markCurrentPlayerUnsold(sessionId);
    await AuctionSessionService.nextPlayer(sessionId);
  }

  // Now set up Lot 10 on stage in active BIDDING state with Mumbai Indians having placed a bid
  const activeState = await AuctionSessionService.getAuctionState(sessionId);
  if (activeState.currentPlayer) {
    const mi = teams[0];
    console.log(`\n--- [ACTIVE LOT ON STAGE]: ${activeState.currentPlayer.name} (${activeState.currentPlayer.role}) ---`);
    await BiddingService.placeBid({
      sessionId,
      teamId: mi.id,
      bidAmount: activeState.currentPlayer.basePrice,
    });
    await AuctionSessionService.setTimer(sessionId, 25);
    console.log(`  > Active bid placed by ${mi.team_name} at ₹${activeState.currentPlayer.basePrice} Cr with 25s timer.`);
  }

  const finalState = await AuctionSessionService.getAuctionState(sessionId);
  console.log('\n=== REAL-TIME AUCTION SIMULATION COMPLETED ===');
  console.log(`Total Players Sold: ${finalState.queueStats.sold}`);
  console.log(`Total Players Unsold: ${finalState.queueStats.unsold}`);
  console.log(`Remaining in Queue: ${finalState.queueStats.queued}`);
  console.log(`Current Player on Live Stage: ${finalState.currentPlayer?.name} (Current Bid: ₹${finalState.currentBid} Cr)`);
  process.exit(0);
}

runLiveAuctionSimulation().catch((err) => {
  console.error('Auction simulation error:', err);
  process.exit(1);
});
