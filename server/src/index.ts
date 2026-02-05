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

  // Save custom descriptions to explainCommand.ts
  app.post('/api/save-descriptions', async (req, res) => {
    const { commands, flags } = req.body as {
      commands: Record<string, string>;
      flags: Record<string, Record<string, string>>;
    };

    if (!commands && !flags) {
      return res.status(400).json({ error: 'No descriptions provided' });
    }

    try {
      const filePath = join(__dirname, '../../client/src/lib/explainCommand.ts');
      let content = await readFile(filePath, 'utf-8');

      // Update COMMAND_DESCRIPTIONS
      if (commands && Object.keys(commands).length > 0) {
        for (const [cmd, desc] of Object.entries(commands)) {
          const escapedDesc = desc.replace(/'/g, "\\'");
          const regex = new RegExp(`(${cmd}:\\s*')[^']*(')`);
          if (content.match(regex)) {
            // Update existing
            content = content.replace(regex, `$1${escapedDesc}$2`);
          } else {
            // Add new entry before the closing brace of COMMAND_DESCRIPTIONS
            const insertPoint = content.indexOf('};');
            if (insertPoint !== -1) {
              const newEntry = `  ${cmd}: '${escapedDesc}',\n`;
              content = content.slice(0, insertPoint) + newEntry + content.slice(insertPoint);
            }
          }
        }
      }

      // Update FLAGS
      if (flags && Object.keys(flags).length > 0) {
        for (const [cmd, cmdFlags] of Object.entries(flags)) {
          for (const [flag, desc] of Object.entries(cmdFlags)) {
            const escapedDesc = desc.replace(/'/g, "\\'");
            // Try to find existing flag in the command's flags
            const flagRegex = new RegExp(`(${cmd}:\\s*\\{[^}]*'${flag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}':\\s*')[^']*(')`);
            if (content.match(flagRegex)) {
              content = content.replace(flagRegex, `$1${escapedDesc}$2`);
            } else {
              // Find the command's flags block and add the new flag
              const cmdBlockRegex = new RegExp(`(${cmd}:\\s*\\{)([^}]*)(\\})`);
              const match = content.match(cmdBlockRegex);
              if (match) {
                const newFlag = `\n    '${flag}': '${escapedDesc}',`;
                content = content.replace(cmdBlockRegex, `$1$2${newFlag}\n  $3`);
              } else {
                // Command doesn't exist in FLAGS, add it
                const flagsEndRegex = /(\n};)\s*\n\nexport interface/;
                const flagsMatch = content.match(flagsEndRegex);
                if (flagsMatch) {
                  const newBlock = `  ${cmd}: {\n    '${flag}': '${escapedDesc}',\n  },\n`;
                  content = content.replace(flagsEndRegex, `\n${newBlock}$1\n\nexport interface`);
                }
              }
            }
          }
        }
      }

      await writeFile(filePath, content, 'utf-8');
      res.json({ success: true, message: 'Descriptions saved to explainCommand.ts' });
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
