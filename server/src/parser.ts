export interface ParsedCommand {
  timestamp: string;
  workspace: string;
  command: string;
  id: string;
}

// Format: [2026-02-05 14:32:01] [workspace] CMD: command
const LINE_REGEX = /^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\] \[([^\]]+)\] CMD: (.+)$/;
// Fallback for old format without workspace
const LINE_REGEX_LEGACY = /^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\] CMD: (.+)$/;

export function parseLine(line: string): ParsedCommand | null {
  let match = line.match(LINE_REGEX);
  if (match) {
    return {
      timestamp: match[1],
      workspace: match[2],
      command: match[3],
      id: `${match[1]}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    };
  }

  // Try legacy format
  match = line.match(LINE_REGEX_LEGACY);
  if (match) {
    return {
      timestamp: match[1],
      workspace: 'unknown',
      command: match[2],
      id: `${match[1]}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    };
  }

  return null;
}

export function parseLog(content: string): ParsedCommand[] {
  return content
    .split('\n')
    .filter((line) => line.trim())
    .map(parseLine)
    .filter((cmd): cmd is ParsedCommand => cmd !== null);
}
