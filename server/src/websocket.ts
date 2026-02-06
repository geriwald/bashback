import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';

export function createWebSocketServer(server: Server): {
  broadcast: (message: { type: string; data: unknown }) => void;
} {
  const wss = new WebSocketServer({ server });

  const clients = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    console.log('bashback: client connected');
    clients.add(ws);

    ws.on('close', () => {
      console.log('bashback: client disconnected');
      clients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('bashback: websocket error:', error);
      clients.delete(ws);
    });
  });

  const broadcast = (message: { type: string; data: unknown }) => {
    const json = JSON.stringify(message);
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(json);
      }
    }
  };

  return { broadcast };
}
