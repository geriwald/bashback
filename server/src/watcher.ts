import chokidar from 'chokidar';
import { readFile, stat, writeFile } from 'fs/promises';
import { parseLine, type ParsedEntry } from './parser.js';

const LOG_FILE = '/tmp/bashback.log';

export type EntryHandler = (entry: ParsedEntry) => void;

export async function ensureLogFile(): Promise<void> {
  try {
    await stat(LOG_FILE);
  } catch {
    await writeFile(LOG_FILE, '', 'utf-8');
  }
}

export async function getHistory(): Promise<ParsedEntry[]> {
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
      .filter((entry): entry is ParsedEntry => entry !== null);
  } catch {
    return [];
  }
}

export function watchLogFile(onEntry: EntryHandler): () => void {
  let lastSize = 0;
  let lastLineCount = 0;

  const processNewContent = async () => {
    try {
      const stats = await stat(LOG_FILE);
      const currentSize = stats.size;

      if (currentSize > lastSize) {
        const content = await readFile(LOG_FILE, 'utf-8');
        const lines = content.split('\n').filter((line) => line.trim());

        // Only process lines we haven't seen yet
        for (let i = lastLineCount; i < lines.length; i++) {
          const line = lines[i];
          const parsed = parseLine(line);
          if (parsed) {
            parsed.id = `${parsed.timestamp}-${i}`;
            onEntry(parsed);
          }
        }

        lastLineCount = lines.length;
        lastSize = currentSize;
      } else if (currentSize < lastSize) {
        // File was truncated (e.g. clear log)
        lastSize = currentSize;
        lastLineCount = 0;
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

  // Initialize lastSize and lastLineCount to skip existing content
  readFile(LOG_FILE, 'utf-8')
    .then((content) => {
      lastLineCount = content.split('\n').filter((line) => line.trim()).length;
      return stat(LOG_FILE);
    })
    .then((stats) => {
      lastSize = stats.size;
    })
    .catch(() => {
      lastSize = 0;
      lastLineCount = 0;
    });

  return () => {
    watcher.close();
  };
}
