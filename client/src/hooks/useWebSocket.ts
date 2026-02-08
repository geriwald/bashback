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

export interface SubagentRecord {
  id: string;
  agentType: string;
  description: string;
  workspace: string;
  workspaceSource: 'git' | 'dir';
  startTimestamp: string;
  stopTimestamp: string | null;
  status: 'running' | 'completed';
}

// FIFO queue for matching PreToolUse[Task] descriptions to SubagentStart events
interface PendingDescQueue {
  [agentType: string]: string[];
}

function popDescription(queue: PendingDescQueue, agentType: string): string {
  const descs = queue[agentType];
  if (descs && descs.length > 0) {
    return descs.shift()!;
  }
  return '';
}

function pushDescription(queue: PendingDescQueue, agentType: string, description: string) {
  if (!queue[agentType]) {
    queue[agentType] = [];
  }
  queue[agentType].push(description);
}

// Build subagent records from history entries by correlating task/start/stop events
function buildSubagentsFromHistory(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  entries: any[]
): SubagentRecord[] {
  const queue: PendingDescQueue = {};
  const records = new Map<string, SubagentRecord>();

  for (const entry of entries) {
    if (entry.type === 'subagent_task') {
      pushDescription(queue, entry.subagentType || entry.subagent_type, entry.description);
    } else if (entry.type === 'subagent_start') {
      const agentId = entry.agentId || entry.agent_id;
      const agentType = entry.agentType || entry.agent_type || 'unknown';
      if (!agentId) continue;
      records.set(agentId, {
        id: agentId,
        agentType,
        description: popDescription(queue, agentType),
        workspace: entry.workspace || 'unknown',
        workspaceSource: entry.workspaceSource || entry.workspace_source === 'git' ? 'git' : 'dir',
        startTimestamp: entry.timestamp,
        stopTimestamp: null,
        status: 'running',
      });
    } else if (entry.type === 'subagent_stop') {
      const agentId = entry.agentId || entry.agent_id;
      if (!agentId) continue;
      const existing = records.get(agentId);
      if (existing) {
        existing.stopTimestamp = entry.timestamp;
        existing.status = 'completed';
      }
    }
  }

  return Array.from(records.values());
}

export function useWebSocket() {
  const [commands, setCommands] = useState<Command[]>([]);
  const [prompts, setPrompts] = useState<PromptRecord[]>([]);
  const [subagents, setSubagents] = useState<SubagentRecord[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number>();
  const pendingDescQueueRef = useRef<PendingDescQueue>({});

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
        } else if (message.type === 'subagent_task') {
          pushDescription(
            pendingDescQueueRef.current,
            message.data.subagentType || message.data.subagent_type,
            message.data.description
          );
        } else if (message.type === 'subagent_start') {
          const agentId = message.data.agentId || message.data.agent_id;
          const agentType = message.data.agentType || message.data.agent_type || 'unknown';
          if (!agentId) return;
          setSubagents((prev) => {
            if (prev.some((s) => s.id === agentId)) return prev;
            return [...prev, {
              id: agentId,
              agentType,
              description: popDescription(pendingDescQueueRef.current, agentType),
              workspace: message.data.workspace || 'unknown',
              workspaceSource: message.data.workspaceSource || (message.data.workspace_source === 'git' ? 'git' : 'dir'),
              startTimestamp: message.data.timestamp,
              stopTimestamp: null,
              status: 'running',
            }];
          });
        } else if (message.type === 'subagent_stop') {
          const agentId = message.data.agentId || message.data.agent_id;
          if (!agentId) return;
          setSubagents((prev) => prev.map((s) =>
            s.id === agentId
              ? { ...s, stopTimestamp: message.data.timestamp, status: 'completed' as const }
              : s
          ));
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
        const cmds: Command[] = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subagentEntries: any[] = [];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        history.forEach((entry: any) => {
          if (entry.type === 'subagent_task' || entry.type === 'subagent_start' || entry.type === 'subagent_stop') {
            subagentEntries.push(entry);
          } else if (entry.type !== 'prompt') {
            cmds.push(entry);
          }
        });

        setCommands(cmds);
        setSubagents(buildSubagentsFromHistory(subagentEntries));
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
    setSubagents([]);
    pendingDescQueueRef.current = {};
  }, []);

  return { commands, prompts, subagents, connected, clearDisplay, clearLog };
}
