import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import type { ParsedCommand } from './parser.js';

export function createWebSocketServer(server: Server): {
  broadcast: (command: ParsedCommand) => void;
} {
  const wss = new WebSocketServer({ server });

  const clients = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    console.log('Client connected');
    clients.add(ws);

    ws.on('close', () => {
      console.log('Client disconnected');
      clients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
  });

  const broadcast = (command: ParsedCommand) => {
    const message = JSON.stringify({ type: 'command', data: command });
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  };

  return { broadcast };
}
