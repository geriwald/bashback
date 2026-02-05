import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { createWebSocketServer } from './websocket.js';
import { watchLogFile, getHistory, ensureLogFile } from './watcher.js';

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
