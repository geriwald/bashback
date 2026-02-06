export interface ParsedCommand {
  type: 'command';
  timestamp: string;
  workspace: string;
  workspaceSource: 'git' | 'dir';
  command: string;
  id: string;
}

export interface ParsedPrompt {
  type: 'prompt';
  timestamp: string;
  prompt: string;
  id: string;
}

export type ParsedEntry = ParsedCommand | ParsedPrompt;

// Legacy format: [2026-02-05 14:32:01] [workspace] CMD: command
const LINE_REGEX = /^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\] \[([^\]]+)\] CMD: (.+)$/;
// Fallback for old format without workspace
const LINE_REGEX_LEGACY = /^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\] CMD: (.+)$/;

interface JsonLogEntry {
  type?: string;
  timestamp: string;
  workspace?: string;
  workspace_source?: string;
  command?: string;
  prompt?: string;
}

function parseJsonLine(line: string): ParsedEntry | null {
  try {
    const entry = JSON.parse(line) as JsonLogEntry;

    // Prompt entry
    if (entry.type === 'prompt' && entry.timestamp && entry.prompt) {
      return {
        type: 'prompt',
        timestamp: entry.timestamp,
        prompt: entry.prompt,
        id: `${entry.timestamp}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      };
    }

    // Command entry
    if (entry.timestamp && entry.command) {
      return {
        type: 'command',
        timestamp: entry.timestamp,
        workspace: entry.workspace || 'unknown',
        workspaceSource: (entry.workspace_source === 'git' ? 'git' : 'dir'),
        command: entry.command,
        id: `${entry.timestamp}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      };
    }
  } catch {
    // Not JSON, try legacy format
  }
  return null;
}

function parseLegacyLine(line: string): ParsedCommand | null {
  let match = line.match(LINE_REGEX);
  if (match) {
    return {
      type: 'command',
      timestamp: match[1],
      workspace: match[2],
      workspaceSource: 'dir',
      command: match[3],
      id: `${match[1]}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    };
  }

  // Try legacy format without workspace
  match = line.match(LINE_REGEX_LEGACY);
  if (match) {
    return {
      type: 'command',
      timestamp: match[1],
      workspace: 'unknown',
      workspaceSource: 'dir',
      command: match[2],
      id: `${match[1]}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    };
  }

  return null;
}

export function parseLine(line: string): ParsedEntry | null {
  // Try JSON format first (new format with multiline support)
  const jsonResult = parseJsonLine(line);
  if (jsonResult) return jsonResult;

  // Fall back to legacy text format
  return parseLegacyLine(line);
}

export function parseLog(content: string): ParsedEntry[] {
  return content
    .split('\n')
    .filter((line) => line.trim())
    .map(parseLine)
    .filter((entry): entry is ParsedEntry => entry !== null);
}
