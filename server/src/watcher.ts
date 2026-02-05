import chokidar from 'chokidar';
import { readFile, stat, writeFile } from 'fs/promises';
import { parseLine, type ParsedCommand } from './parser.js';

const LOG_FILE = '/tmp/bashback.log';

export type CommandHandler = (command: ParsedCommand) => void;

export async function ensureLogFile(): Promise<void> {
  try {
    await stat(LOG_FILE);
  } catch {
    await writeFile(LOG_FILE, '', 'utf-8');
  }
}

export async function getHistory(): Promise<ParsedCommand[]> {
  try {
    const content = await readFile(LOG_FILE, 'utf-8');
    return content
      .split('\n')
      .filter((line) => line.trim())
      .map((line, index) => {
        const parsed = parseLine(line);
        if (parsed) {
          parsed.id = `${parsed.timestamp}-${index}`;
        }
        return parsed;
      })
      .filter((cmd): cmd is ParsedCommand => cmd !== null);
  } catch {
    return [];
  }
}

export function watchLogFile(onCommand: CommandHandler): () => void {
  let lastSize = 0;
  let lineCounter = 0;

  const processNewContent = async () => {
    try {
      const stats = await stat(LOG_FILE);
      const currentSize = stats.size;

      if (currentSize > lastSize) {
        const content = await readFile(LOG_FILE, 'utf-8');
        const lines = content.split('\n').filter((line) => line.trim());

        for (let i = Math.max(0, lines.length - 10); i < lines.length; i++) {
          const line = lines[i];
          const parsed = parseLine(line);
          if (parsed) {
            parsed.id = `${parsed.timestamp}-${lineCounter++}`;
            onCommand(parsed);
          }
        }

        lastSize = currentSize;
      } else if (currentSize < lastSize) {
        lastSize = currentSize;
        lineCounter = 0;
      }
    } catch {
      // File might not exist yet
    }
  };

  const watcher = chokidar.watch(LOG_FILE, {
    persistent: true,
    usePolling: true,
    interval: 100,
  });

  watcher.on('change', processNewContent);
  watcher.on('add', processNewContent);

  // Initialize lastSize
  stat(LOG_FILE)
    .then((stats) => {
      lastSize = stats.size;
    })
    .catch(() => {
      lastSize = 0;
    });

  return () => {
    watcher.close();
  };
}
