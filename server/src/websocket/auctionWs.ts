import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';

export interface WsMessage {
  type:
    | 'CONNECTED'
    | 'AUCTION_STATE_UPDATE'
    | 'NEW_BID'
    | 'STAGE_CHANGE'
    | 'PLAYER_SOLD'
    | 'PLAYER_UNSOLD'
    | 'SALE_UNDONE'
    | 'TIMER_TICK'
    | 'PONG';
  payload: any;
  timestamp?: string;
}

class AuctionWebSocketManager {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();

  init(server: Server): WebSocketServer {
    this.wss = new WebSocketServer({ server, path: '/ws/auction' });

    this.wss.on('connection', (ws: WebSocket) => {
      this.clients.add(ws);

      // Send initial welcome message
      ws.send(
        JSON.stringify({
          type: 'CONNECTED',
          payload: { message: 'Connected to ZenTriX26 Live Auction real-time stream' },
          timestamp: new Date().toISOString(),
        })
      );

      ws.on('message', (message: string) => {
        try {
          const parsed = JSON.parse(message.toString());
          if (parsed.type === 'PING') {
            ws.send(JSON.stringify({ type: 'PONG', timestamp: new Date().toISOString() }));
          }
        } catch {
          // ignore invalid json
        }
      });

      ws.on('close', () => {
        this.clients.delete(ws);
      });

      ws.on('error', (err) => {
        console.error('[WS ERROR]', err);
        this.clients.delete(ws);
      });
    });

    console.log('[WS] Live Auction WebSocket Server initialized at /ws/auction');
    return this.wss;
  }

  broadcast(message: WsMessage): void {
    const payloadStr = JSON.stringify({
      ...message,
      timestamp: message.timestamp || new Date().toISOString(),
    });

    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payloadStr);
      }
    }
  }

  getConnectedCount(): number {
    return this.clients.size;
  }
}

export const auctionWsManager = new AuctionWebSocketManager();
