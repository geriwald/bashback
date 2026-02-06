import { useEffect, useRef, useState, useCallback } from 'react';
import { API_URL, WS_URL } from '../lib/apiConfig';

export interface Command {
  id: string;
  timestamp: string;
  workspace: string;
  workspaceSource: 'git' | 'dir';
  command: string;
}

export interface Correction {
  message: string;
  replacement: string;
  offset: number;
  length: number;
  original: string;
}

export interface PromptRecord {
  id: string;
  timestamp: string;
  prompt: string;
  corrections: Correction[];
}

export function useWebSocket() {
  const [commands, setCommands] = useState<Command[]>([]);
  const [prompts, setPrompts] = useState<PromptRecord[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number>();

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log('WebSocket connected');
      setConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'command') {
          setCommands((prev) => {
            if (prev.some((cmd) => cmd.id === message.data.id)) {
              return prev;
            }
            return [...prev, message.data];
          });
        } else if (message.type === 'prompt') {
          setPrompts((prev) => {
            if (prev.some((p) => p.id === message.data.id)) {
              return prev;
            }
            return [...prev, message.data];
          });
        }
      } catch (error) {
        console.error('Failed to parse message:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setConnected(false);
      wsRef.current = null;

      reconnectTimeoutRef.current = window.setTimeout(() => {
        connect();
      }, 2000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    wsRef.current = ws;
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/history`);
      if (response.ok) {
        const history = await response.json();
        // History now contains both commands and prompts (prompts have type: 'prompt')
        const cmds: Command[] = [];
        history.forEach((entry: Command & { type?: string }) => {
          if (entry.type !== 'prompt') {
            cmds.push(entry);
          }
        });
        setCommands(cmds);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  }, []);

  useEffect(() => {
    loadHistory();
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect, loadHistory]);

  const clearDisplay = useCallback(() => {
    setCommands([]);
  }, []);

  const clearLog = useCallback(async () => {
    try {
      await fetch(`${API_URL}/api/clear-log`, { method: 'POST' });
    } catch (error) {
      console.error('Failed to clear log:', error);
    }
    setCommands([]);
    setPrompts([]);
  }, []);

  return { commands, prompts, connected, clearDisplay, clearLog };
}
