import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile, writeFile, appendFile } from 'fs/promises';
import { existsSync } from 'fs';
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
    const { command, flag, subCommand } = req.query;
    if (!command || !flag || typeof command !== 'string' || typeof flag !== 'string') {
      return res.status(400).json({ error: 'Missing command or flag parameter' });
    }

    // Security: only allow alphanumeric commands
    if (!/^[a-zA-Z0-9_-]+$/.test(command)) {
      return res.status(400).json({ error: 'Invalid command name' });
    }
    if (subCommand && typeof subCommand === 'string' && !/^[a-zA-Z0-9_-]+$/.test(subCommand)) {
      return res.status(400).json({ error: 'Invalid subcommand name' });
    }

    // Build the command to get help (e.g., "git add" instead of just "git")
    const fullCommand = subCommand && typeof subCommand === 'string'
      ? `${command} ${subCommand}`
      : command;

    try {
      // Try --help first, then -h, then man
      let helpOutput = '';
      try {
        const { stdout, stderr } = await execAsync(`${fullCommand} --help 2>&1`, { timeout: 5000 });
        helpOutput = stdout || stderr;
      } catch {
        try {
          const { stdout, stderr } = await execAsync(`${fullCommand} -h 2>&1`, { timeout: 5000 });
          helpOutput = stdout || stderr;
        } catch {
          // Try man page as last resort (only for base command)
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
    // Pattern for man pages: -x, --long on its own line, description on next line
    const manPattern = new RegExp(`^\\s*-${flagPattern}[,\\s]`);
    // Git-style: -A, --all, --no-ignore-removal (multiple aliases, desc on next line)
    const gitStylePattern = new RegExp(`^\\s*(-${flagPattern})(?:,\\s*(--[\\w-]+))?(?:,\\s*--[\\w-]+)*\\s*$`, 'i');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Try full pattern first (short + long + inline description)
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

      // Try git-style pattern (flag on one line, description on next)
      match = line.match(gitStylePattern);
      if (match && i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        if (nextLine && !nextLine.startsWith('-')) {
          let desc = nextLine;
          // Collect more lines if they're indented
          for (let j = i + 2; j < lines.length && j < i + 4; j++) {
            if (lines[j].match(/^\s{4,}\S/) && !lines[j].trim().startsWith('-')) {
              desc += ' ' + lines[j].trim();
            } else {
              break;
            }
          }
          if (desc.length > 100) desc = desc.substring(0, 97) + '...';
          return {
            shortForm: match[1],
            longForm: match[2] || null,
            explanation: desc
          };
        }
      }

      // Try man page pattern (fallback)
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
      let existing: {
        commands: Record<string, string>;
        flags: Record<string, Record<string, string>>;
        longForms: Record<string, Record<string, string>>;
      } = { commands: {}, flags: {}, longForms: {} };
      try {
        const content = await readFile(customDescriptionsPath, 'utf-8');
        existing = JSON.parse(content);
      } catch {
        // File doesn't exist yet
      }

      // Merge with new descriptions (new ones override existing)
      const merged: typeof existing = {
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

  // Hook installation paths
  const homeDir = process.env.HOME || process.env.USERPROFILE || '';
  const claudeHooksDir = join(homeDir, '.claude', 'hooks');
  const claudeSettingsPath = join(homeDir, '.claude', 'settings.json');
  const hookSourcePath = join(__dirname, '../../hook/bashback-hook.sh');
  const hookDestPath = join(claudeHooksDir, 'bashback-hook.sh');

  // Check if hook is installed
  app.get('/api/hook-status', async (_req, res) => {
    try {
      // Check if hook file exists
      let hookExists = false;
      try {
        await readFile(hookDestPath);
        hookExists = true;
      } catch {
        hookExists = false;
      }

      // Check if settings.json has the hook configured
      let hookConfigured = false;
      try {
        const settings = JSON.parse(await readFile(claudeSettingsPath, 'utf-8'));
        const postToolUse = settings.hooks?.PostToolUse || [];
        hookConfigured = postToolUse.some((h: { matcher?: string; hooks?: { command?: string }[] }) =>
          h.matcher === 'Bash' &&
          h.hooks?.some((hh: { command?: string }) => hh.command?.includes('bashback-hook.sh'))
        );
      } catch {
        hookConfigured = false;
      }

      res.json({
        installed: hookExists && hookConfigured,
        hookExists,
        hookConfigured,
      });
    } catch (error) {
      console.error('Error checking hook status:', error);
      res.status(500).json({ error: 'Failed to check hook status' });
    }
  });

  // Install the Claude hook (legacy single-step endpoint)
  app.post('/api/install-hook', async (_req, res) => {
    try {
      await execAsync(`mkdir -p "${claudeHooksDir}"`);
      const hookContent = await readFile(hookSourcePath, 'utf-8');
      await writeFile(hookDestPath, hookContent, { mode: 0o755 });

      let settings: Record<string, unknown> = {};
      try {
        settings = JSON.parse(await readFile(claudeSettingsPath, 'utf-8'));
      } catch { /* File doesn't exist */ }

      if (!settings.hooks) settings.hooks = {};
      const hooks = settings.hooks as Record<string, unknown[]>;
      if (!hooks.PostToolUse) hooks.PostToolUse = [];

      const postToolUse = hooks.PostToolUse as { matcher?: string; hooks?: { type?: string; command?: string }[] }[];
      const bashHook = postToolUse.find(h => h.matcher === 'Bash');

      if (bashHook) {
        if (!bashHook.hooks) bashHook.hooks = [];
        const alreadyInstalled = bashHook.hooks.some(h => h.command?.includes('bashback-hook.sh'));
        if (!alreadyInstalled) {
          bashHook.hooks.push({ type: 'command', command: '~/.claude/hooks/bashback-hook.sh' });
        }
      } else {
        postToolUse.push({
          matcher: 'Bash',
          hooks: [{ type: 'command', command: '~/.claude/hooks/bashback-hook.sh' }],
        });
      }

      await writeFile(claudeSettingsPath, JSON.stringify(settings, null, 2), 'utf-8');

      const now = new Date();
      const timestamp = now.toISOString().replace('T', ' ').substring(0, 19);
      const sampleLine = `{"timestamp":"${timestamp}","workspace":"bashback","command":"echo 'Welcome to bashback! Hook installed successfully.'"}\n`;
      await appendFile('/tmp/bashback.log', sampleLine, 'utf-8');

      res.json({ success: true, message: 'Hook installed! Restart Claude Code to activate.' });
    } catch (error) {
      console.error('Error installing hook:', error);
      res.status(500).json({ error: 'Failed to install hook' });
    }
  });

  // Step-by-step installation API
  interface InstallStep {
    id: string;
    title: string;
    description: string;
    command: string;
  }

  app.get('/api/install-steps', (_req, res) => {
    // Display paths use ~ for readability, actual execution uses resolved paths
    const displayHome = '~/.claude';
    const steps: InstallStep[] = [
      {
        id: 'check-jq',
        title: 'Check jq dependency',
        description: 'Verify that jq (JSON processor) is installed',
        command: 'which jq && jq --version',
      },
      {
        id: 'create-hooks-dir',
        title: 'Create hooks directory',
        description: 'Create the Claude Code hooks directory if it does not exist',
        command: `mkdir -p ${displayHome}/hooks`,
      },
      {
        id: 'copy-hook',
        title: 'Copy hook script',
        description: 'Copy bashback-hook.sh to the Claude hooks directory',
        command: `cp bashback-hook.sh ${displayHome}/hooks/ && chmod +x ${displayHome}/hooks/bashback-hook.sh`,
      },
      {
        id: 'configure-settings',
        title: 'Configure Claude settings',
        description: 'Add the bashback hook to Claude Code PostToolUse settings',
        command: `cat ${displayHome}/settings.json`,
      },
      {
        id: 'verify',
        title: 'Verify installation',
        description: 'Check that the hook is properly installed and configured',
        command: `test -x ${displayHome}/hooks/bashback-hook.sh && grep bashback ${displayHome}/settings.json`,
      },
    ];
    res.json(steps);
  });

  app.post('/api/install-steps/:stepId/execute', async (req, res) => {
    const { stepId } = req.params;

    try {
      switch (stepId) {
        case 'check-jq': {
          try {
            const { stdout: whichOut } = await execAsync('which jq', { timeout: 5000 });
            const { stdout: versionOut } = await execAsync('jq --version 2>&1', { timeout: 5000 });
            res.json({ success: true, output: `$ which jq\n${whichOut.trim()}\n$ jq --version\n${versionOut.trim()}` });
          } catch {
            res.json({ success: false, output: '$ which jq\njq: not found\n\nInstall jq: apt install jq (Debian/Ubuntu) or brew install jq (macOS)' });
          }
          break;
        }
        case 'create-hooks-dir': {
          const { stdout, stderr } = await execAsync(`mkdir -pv "${claudeHooksDir}" 2>&1`, { timeout: 5000 });
          const raw = (stdout + stderr).trim();
          const lsOut = (await execAsync(`ls -la "${claudeHooksDir}/" 2>&1`, { timeout: 5000 })).stdout.trim();
          res.json({ success: true, output: `$ mkdir -pv ~/.claude/hooks\n${raw || '(directory already exists)'}\n$ ls -la ~/.claude/hooks/\n${lsOut}` });
          break;
        }
        case 'copy-hook': {
          const hookContent = await readFile(hookSourcePath, 'utf-8');
          await writeFile(hookDestPath, hookContent, { mode: 0o755 });
          const { stdout: lsOut } = await execAsync(`ls -la "${hookDestPath}"`, { timeout: 5000 });
          const { stdout: wcOut } = await execAsync(`wc -l < "${hookDestPath}"`, { timeout: 5000 });
          res.json({ success: true, output: `$ cp bashback-hook.sh ~/.claude/hooks/ && chmod +x ~/.claude/hooks/bashback-hook.sh\n$ ls -la ~/.claude/hooks/bashback-hook.sh\n${lsOut.trim()}\n$ wc -l < ~/.claude/hooks/bashback-hook.sh\n${wcOut.trim()} lines` });
          break;
        }
        case 'configure-settings': {
          const output: string[] = [];

          // Read existing settings
          let settings: Record<string, unknown> = {};
          let settingsExisted = false;
          try {
            const raw = await readFile(claudeSettingsPath, 'utf-8');
            settings = JSON.parse(raw);
            settingsExisted = true;
          } catch { /* File doesn't exist */ }

          output.push(`$ cat ~/.claude/settings.json`);
          output.push(settingsExisted ? '(file exists, reading current config)' : '(file not found, creating new config)');

          // Check existing hooks
          if (!settings.hooks) settings.hooks = {};
          const hooks = settings.hooks as Record<string, unknown[]>;
          if (!hooks.PostToolUse) hooks.PostToolUse = [];

          const postToolUse = hooks.PostToolUse as { matcher?: string; hooks?: { type?: string; command?: string }[] }[];
          const bashHook = postToolUse.find(h => h.matcher === 'Bash');

          if (bashHook) {
            if (!bashHook.hooks) bashHook.hooks = [];
            const existingHooks = bashHook.hooks.map(h => h.command).filter(Boolean);
            output.push(`\nExisting Bash PostToolUse hooks (${existingHooks.length}):`);
            existingHooks.forEach(h => output.push(`  - ${h}`));

            const alreadyInstalled = bashHook.hooks.some(h => h.command?.includes('bashback-hook.sh'));
            if (alreadyInstalled) {
              output.push(`\nbashback-hook.sh already configured, skipping.`);
              res.json({ success: true, output: output.join('\n') });
              break;
            }
            output.push(`\nAppending bashback-hook.sh to existing Bash hooks...`);
            bashHook.hooks.push({ type: 'command', command: '~/.claude/hooks/bashback-hook.sh' });
          } else {
            const existingEvents = Object.keys(hooks).filter(k => (hooks[k] as unknown[]).length > 0);
            if (existingEvents.length > 0) {
              output.push(`\nExisting hook events: ${existingEvents.join(', ')}`);
            }
            output.push(`\nNo Bash PostToolUse hooks found. Creating new entry...`);
            postToolUse.push({
              matcher: 'Bash',
              hooks: [{ type: 'command', command: '~/.claude/hooks/bashback-hook.sh' }],
            });
          }

          await writeFile(claudeSettingsPath, JSON.stringify(settings, null, 2), 'utf-8');

          // Show the resulting PostToolUse section
          const resultSettings = JSON.parse(await readFile(claudeSettingsPath, 'utf-8'));
          const resultHooks = JSON.stringify(resultSettings.hooks?.PostToolUse, null, 2);
          output.push(`\n$ cat ~/.claude/settings.json | jq '.hooks.PostToolUse'`);
          output.push(resultHooks);

          res.json({ success: true, output: output.join('\n') });
          break;
        }
        case 'verify': {
          const output: string[] = [];

          // Check hook file
          output.push(`$ ls -la ~/.claude/hooks/bashback-hook.sh`);
          try {
            const { stdout } = await execAsync(`ls -la "${hookDestPath}"`, { timeout: 5000 });
            output.push(stdout.trim());
          } catch {
            output.push('ls: cannot access: No such file or directory');
          }

          // Check executable
          output.push(`\n$ test -x ~/.claude/hooks/bashback-hook.sh && echo "executable: yes" || echo "executable: no"`);
          try {
            await execAsync(`test -x "${hookDestPath}"`);
            output.push('executable: yes');
          } catch {
            output.push('executable: no');
          }

          // Check settings
          output.push(`\n$ grep bashback-hook ~/.claude/settings.json`);
          try {
            const { stdout } = await execAsync(`grep "bashback-hook" "${claudeSettingsPath}"`, { timeout: 5000 });
            output.push(stdout.trim());
          } catch {
            output.push('(no match)');
          }

          const hookOk = existsSync(hookDestPath);
          let execOk = false;
          try { await execAsync(`test -x "${hookDestPath}"`); execOk = true; } catch { /* */ }
          let settingsOk = false;
          try {
            const c = await readFile(claudeSettingsPath, 'utf-8');
            settingsOk = c.includes('bashback-hook.sh');
          } catch { /* */ }

          const allGood = hookOk && execOk && settingsOk;
          output.push(allGood
            ? '\n--- All checks passed. Restart Claude Code to activate. ---'
            : '\n--- Some checks failed. Review the steps above. ---');

          res.json({ success: allGood, output: output.join('\n') });
          break;
        }
        default:
          res.status(404).json({ success: false, output: `Unknown step: ${stepId}` });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.json({ success: false, output: `Error: ${message}` });
    }
  });

  // Serve built client in production (after all API routes)
  const clientDistPath = join(__dirname, '../../client/dist');
  if (existsSync(clientDistPath)) {
    app.use(express.static(clientDistPath));
    app.get('*', (_req, res) => {
      res.sendFile(join(clientDistPath, 'index.html'));
    });
  }

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
