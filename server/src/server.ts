import dotenv from 'dotenv';
import http from 'http';
import { app } from './app.js';
import { testDbConnection, pool } from './db/pool.js';
import { seedOrganizers } from './db/seedOrganizers.js';
import { seedPlayersAndTeams } from './db/seedPlayersAndTeams.js';
import { auctionWsManager } from './websocket/auctionWs.js';

dotenv.config();

const PORT = Number(process.env.PORT) || 5000;

async function startServer() {
  try {
    await testDbConnection();
    await seedOrganizers();
    await seedPlayersAndTeams();

    const server = http.createServer(app);
    auctionWsManager.init(server);

    server.on('error', (err) => {
      console.error('[SERVER ERROR]', err);
    });

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`[SERVER] Cricket Conquest API & WebSocket running on http://0.0.0.0:${PORT}`);
    });

    const shutdown = async (signal: string) => {
      console.log(`\n[SERVER] Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await pool.end();
        console.log('[SERVER] Closed all database pools. Exiting process.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error('[SERVER FATAL] Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
