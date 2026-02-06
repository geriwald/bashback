export interface ParsedCommand {
  timestamp: string;
  workspace: string;
  workspaceSource: 'git' | 'dir';
  command: string;
  id: string;
}

// Legacy format: [2026-02-05 14:32:01] [workspace] CMD: command
const LINE_REGEX = /^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\] \[([^\]]+)\] CMD: (.+)$/;
// Fallback for old format without workspace
const LINE_REGEX_LEGACY = /^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\] CMD: (.+)$/;

interface JsonLogEntry {
  timestamp: string;
  workspace: string;
  workspace_source?: string;
  command: string;
}

function parseJsonLine(line: string): ParsedCommand | null {
  try {
    const entry = JSON.parse(line) as JsonLogEntry;
    if (entry.timestamp && entry.command) {
      return {
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
      timestamp: match[1],
      workspace: 'unknown',
      workspaceSource: 'dir',
      command: match[2],
      id: `${match[1]}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    };
  }

  return null;
}

export function parseLine(line: string): ParsedCommand | null {
  // Try JSON format first (new format with multiline support)
  const jsonResult = parseJsonLine(line);
  if (jsonResult) return jsonResult;

  // Fall back to legacy text format
  return parseLegacyLine(line);
}

export function parseLog(content: string): ParsedCommand[] {
  return content
    .split('\n')
    .filter((line) => line.trim())
    .map(parseLine)
    .filter((cmd): cmd is ParsedCommand => cmd !== null);
}
