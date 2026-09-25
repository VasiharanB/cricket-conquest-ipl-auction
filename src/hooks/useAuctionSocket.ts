import { useEffect, useRef, useState, useCallback } from 'react';
import type { LiveAuctionState } from '../services/auctionService';

export interface UseAuctionSocketOptions {
  onStateUpdate?: (state: LiveAuctionState) => void;
  onNewBid?: (bid: any, state?: LiveAuctionState) => void;
  onPlayerSold?: (state: LiveAuctionState) => void;
  onPlayerUnsold?: (state: LiveAuctionState) => void;
  onSaleUndone?: (state: LiveAuctionState) => void;
  onTimerTick?: (seconds: number) => void;
}

export function useAuctionSocket(options: UseAuctionSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const connect = useCallback(() => {
    // Clean up any existing socket
    if (socketRef.current) {
      try {
        socketRef.current.close();
      } catch {
        // ignore
      }
    }

    const envWsUrl = (import.meta as any).env?.VITE_WS_URL;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.port === '5173' ? 'localhost:5000' : window.location.host;
    const wsUrl = envWsUrl || `${protocol}//${host}/ws/auction`;

    try {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        console.log('[WS] Connected to Live Auction server at', wsUrl);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const { type, payload } = data;

          switch (type) {
            case 'AUCTION_STATE_UPDATE':
              optionsRef.current.onStateUpdate?.(payload);
              break;
            case 'NEW_BID':
              optionsRef.current.onNewBid?.(payload.bid, payload.state);
              if (payload.state) optionsRef.current.onStateUpdate?.(payload.state);
              break;
            case 'STAGE_CHANGE':
              if (payload.state) optionsRef.current.onStateUpdate?.(payload.state);
              break;
            case 'PLAYER_SOLD':
              if (payload.state) {
                optionsRef.current.onPlayerSold?.(payload.state);
                optionsRef.current.onStateUpdate?.(payload.state);
              }
              break;
            case 'PLAYER_UNSOLD':
              if (payload.state) {
                optionsRef.current.onPlayerUnsold?.(payload.state);
                optionsRef.current.onStateUpdate?.(payload.state);
              }
              break;
            case 'SALE_UNDONE':
              if (payload.state) {
                optionsRef.current.onSaleUndone?.(payload.state);
                optionsRef.current.onStateUpdate?.(payload.state);
              }
              break;
            case 'TIMER_TICK':
              optionsRef.current.onTimerTick?.(payload.timerSeconds);
              break;
            default:
              break;
          }
        } catch (err) {
          console.error('[WS] Error processing message:', err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Attempt reconnect after 2 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 2000);
      };

      ws.onerror = (err) => {
        console.warn('[WS] Socket error:', err);
        ws.close();
      };
    } catch (err) {
      console.error('[WS] Connection initialization error:', err);
      reconnectTimeoutRef.current = setTimeout(connect, 3000);
    }
  }, []);

  useEffect(() => {
    connect();

    // Heartbeat ping every 25 seconds when connected
    const pingInterval = setInterval(() => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'PING' }));
      }
    }, 25000);

    // Fallback polling when socket is disconnected or connecting
    const fallbackPollInterval = setInterval(async () => {
      if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
        try {
          const res = await fetch('/api/auction/state');
          if (res.ok) {
            const json = await res.json();
            if (json.success && json.data) {
              optionsRef.current.onStateUpdate?.(json.data);
            }
          }
        } catch {
          // Ignore polling errors while connecting
        }
      }
    }, 2000);

    return () => {
      clearInterval(pingInterval);
      clearInterval(fallbackPollInterval);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) socketRef.current.close();
    };
  }, [connect]);

  return { isConnected };
}
