import { seed50PlayersAndResetAuction } from './src/db/seed50Players.js';
import { AuctionSessionService } from './src/services/auctionSessionService.js';

async function main() {
  try {
    const res = await seed50PlayersAndResetAuction();
    console.log(`[INIT] Seeded ${res.playersCount} players, ${res.teamsCount} teams, Session #${res.sessionId}`);
    const state = await AuctionSessionService.startAuction(res.sessionId);
    console.log(`[STAGE] Stage initialized with: ${state.currentPlayer?.name} (${state.currentPlayer?.id}) - Base Price: ₹${state.currentPlayer?.basePrice} Cr`);
    console.log(`[QUEUE] Total Queue: ${state.queueStats.total} players (${state.queueStats.queued} queued, ${state.queueStats.sold} sold)`);
    process.exit(0);
  } catch (err) {
    console.error('Seed 50 failed:', err);
    process.exit(1);
  }
}

main();
