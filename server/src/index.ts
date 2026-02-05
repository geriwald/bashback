import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile, writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createWebSocketServer } from './websocket.js';
import { watchLogFile, getHistory, ensureLogFile } from './watcher.js';

const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));

const PORT = 3001;

async function main() {
  await ensureLogFile();

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/history', async (_req, res) => {
    const history = await getHistory();
    res.json(history);
  });

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.post('/api/clear-log', async (_req, res) => {
    try {
      await writeFile('/tmp/bashback.log', '', 'utf-8');
      res.json({ success: true });
    } catch (error) {
      console.error('Error clearing log:', error);
      res.status(500).json({ error: 'Failed to clear log' });
    }
  });

  // Get command description from --help
  app.get('/api/explain-command', async (req, res) => {
    const { command } = req.query;
    if (!command || typeof command !== 'string') {
      return res.status(400).json({ error: 'Missing command parameter' });
    }

    // Security: only allow alphanumeric commands
    if (!/^[a-zA-Z0-9_-]+$/.test(command)) {
      return res.status(400).json({ error: 'Invalid command name' });
    }

    try {
      let helpOutput = '';
      try {
        const { stdout, stderr } = await execAsync(`${command} --help 2>&1`, { timeout: 5000 });
        helpOutput = stdout || stderr;
      } catch {
        try {
          const { stdout, stderr } = await execAsync(`${command} -h 2>&1`, { timeout: 5000 });
          helpOutput = stdout || stderr;
        } catch {
          return res.json({ description: null });
        }
      }

      // Extract description from help output
      const description = parseCommandDescription(helpOutput, command);
      res.json({ description });
    } catch (error) {
      console.error('Error fetching command help:', error);
      res.json({ description: null });
    }
  });

  function parseCommandDescription(helpText: string, command: string): string | null {
    const lines = helpText.split('\n').filter(l => l.trim());
    if (lines.length === 0) return null;

    // Common patterns:
    // 1. "Usage: command - description"
    // 2. First non-empty line after "NAME" section
    // 3. First line that looks like a description (not usage pattern)

    for (const line of lines) {
      // Skip usage lines
      if (/^usage:/i.test(line.trim())) continue;
      if (line.trim().startsWith(command) && line.includes('[')) continue;

      // Look for "command - description" pattern
      const dashMatch = line.match(new RegExp(`${command}\\s*[-–—]\\s*(.+)`, 'i'));
      if (dashMatch) {
        const desc = dashMatch[1].trim();
        return desc.length > 100 ? desc.substring(0, 97) + '...' : desc;
      }

      // First meaningful line (not a usage pattern)
      const trimmed = line.trim();
      if (trimmed.length > 10 && !trimmed.startsWith('-') && !/^\[/.test(trimmed)) {
        return trimmed.length > 100 ? trimmed.substring(0, 97) + '...' : trimmed;
      }
    }

    return null;
  }

  // Parse --help to find flag explanation
  app.get('/api/explain-flag', async (req, res) => {
    const { command, flag } = req.query;
    if (!command || !flag || typeof command !== 'string' || typeof flag !== 'string') {
      return res.status(400).json({ error: 'Missing command or flag parameter' });
    }

    // Security: only allow alphanumeric commands
    if (!/^[a-zA-Z0-9_-]+$/.test(command)) {
      return res.status(400).json({ error: 'Invalid command name' });
    }

    try {
      // Try --help first, then -h, then man
      let helpOutput = '';
      try {
        const { stdout, stderr } = await execAsync(`${command} --help 2>&1`, { timeout: 5000 });
        helpOutput = stdout || stderr;
      } catch {
        try {
          const { stdout, stderr } = await execAsync(`${command} -h 2>&1`, { timeout: 5000 });
          helpOutput = stdout || stderr;
        } catch {
          // Try man page as last resort
          try {
            const { stdout } = await execAsync(`man ${command} 2>/dev/null | col -b`, { timeout: 5000 });
            helpOutput = stdout;
          } catch {
            return res.json({ explanation: null, source: null });
          }
        }
      }

      // Parse the help output to find the flag
      const result = parseFlagFromHelp(helpOutput, flag);
      res.json({
        explanation: result?.explanation ?? null,
        shortForm: result?.shortForm ?? null,
        longForm: result?.longForm ?? null,
        source: result ? 'help' : null
      });
    } catch (error) {
      console.error('Error fetching help:', error);
      res.json({ explanation: null, source: null });
    }
  });

  interface FlagParseResult {
    shortForm: string | null;
    longForm: string | null;
    explanation: string;
  }

  function parseFlagFromHelp(helpText: string, flag: string): FlagParseResult | null {
    const lines = helpText.split('\n');
    const flagPattern = flag.replace(/^-+/, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Pattern to capture: -x, --xxx-yyy[=VALUE]  description
    // Groups: 1=short flag, 2=long flag (optional), 3=description
    const fullPattern = new RegExp(
      `^\\s*(-${flagPattern})(?:,\\s*(--[\\w-]+))?(?:[=\\s]\\S*)?\\s{2,}(.+)`,
      'i'
    );
    // Pattern for long flag only: --xxx-yyy  description
    const longOnlyPattern = new RegExp(
      `^\\s*(--${flagPattern})(?:[=\\s]\\S*)?\\s{2,}(.+)`,
      'i'
    );
    // Pattern for man pages
    const manPattern = new RegExp(`^\\s*-${flagPattern}[,\\s]`);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Try full pattern first (short + long)
      let match = line.match(fullPattern);
      if (match) {
        let desc = match[3].trim();
        if (i + 1 < lines.length && lines[i + 1].match(/^\s{4,}\S/)) {
          desc += ' ' + lines[i + 1].trim();
        }
        if (desc.length > 100) desc = desc.substring(0, 97) + '...';
        return {
          shortForm: match[1],
          longForm: match[2] || null,
          explanation: desc
        };
      }

      // Try long flag only
      match = line.match(longOnlyPattern);
      if (match) {
        let desc = match[2].trim();
        if (i + 1 < lines.length && lines[i + 1].match(/^\s{4,}\S/)) {
          desc += ' ' + lines[i + 1].trim();
        }
        if (desc.length > 100) desc = desc.substring(0, 97) + '...';
        return {
          shortForm: null,
          longForm: match[1],
          explanation: desc
        };
      }

      // Try man page pattern
      if (line.match(manPattern) && i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        if (nextLine && !nextLine.startsWith('-')) {
          return {
            shortForm: flag.startsWith('--') ? null : flag,
            longForm: flag.startsWith('--') ? flag : null,
            explanation: nextLine.length > 100 ? nextLine.substring(0, 97) + '...' : nextLine
          };
        }
      }
    }

    return null;
  }

  // Custom descriptions file path (gitignored, local to each user)
  const customDescriptionsPath = join(__dirname, '../../customDescriptions.local.json');

  // Get custom descriptions from local JSON file
  app.get('/api/custom-descriptions', async (_req, res) => {
    try {
      const content = await readFile(customDescriptionsPath, 'utf-8');
      res.json(JSON.parse(content));
    } catch {
      // File doesn't exist yet, return empty
      res.json({ commands: {}, flags: {}, longForms: {} });
    }
  });

  // Save custom descriptions to local JSON file (gitignored)
  app.post('/api/save-descriptions', async (req, res) => {
    const { commands, flags, longForms } = req.body as {
      commands: Record<string, string>;
      flags: Record<string, Record<string, string>>;
      longForms?: Record<string, Record<string, string>>;
    };

    if (!commands && !flags) {
      return res.status(400).json({ error: 'No descriptions provided' });
    }

    try {
      // Load existing custom descriptions
      let existing = { commands: {}, flags: {}, longForms: {} };
      try {
        const content = await readFile(customDescriptionsPath, 'utf-8');
        existing = JSON.parse(content);
      } catch {
        // File doesn't exist yet
      }

      // Merge with new descriptions (new ones override existing)
      const merged = {
        commands: { ...existing.commands, ...commands },
        flags: { ...existing.flags },
        longForms: { ...existing.longForms, ...(longForms || {}) },
      };

      // Deep merge flags
      if (flags) {
        for (const [cmd, cmdFlags] of Object.entries(flags)) {
          merged.flags[cmd] = { ...(merged.flags[cmd] || {}), ...cmdFlags };
        }
      }

      await writeFile(customDescriptionsPath, JSON.stringify(merged, null, 2), 'utf-8');
      res.json({ success: true, message: 'Descriptions saved to customDescriptions.local.json' });
    } catch (error) {
      console.error('Error saving descriptions:', error);
      res.status(500).json({ error: 'Failed to save descriptions' });
    }
  });

  const server = createServer(app);
  const { broadcast } = createWebSocketServer(server);

  const seenIds = new Set<string>();

  watchLogFile((command) => {
    if (!seenIds.has(command.id)) {
      seenIds.add(command.id);
      console.log(`New command: ${command.command}`);
      broadcast(command);
    }
  });

  server.listen(PORT, () => {
    console.log(`bashback server running on http://localhost:${PORT}`);
    console.log(`Watching /tmp/bashback.log for new commands...`);
  });
}

main().catch(console.error);
