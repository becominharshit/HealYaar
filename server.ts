import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleAiRequest } from './api/ai';
import { handleHealthRequest } from './api/health';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);
  const isProd = process.env.NODE_ENV === 'production';

  // Parse JSON payloads up to 6MB so oversized uploads reach handleAiRequest's 413 check cleanly
  app.use(express.json({ limit: '6mb' }));

  // Lightweight health probe
  app.get('/api/health', (req, res) => {
    handleHealthRequest(req, res);
  });

  // Server-side authenticated Gemini AI proxy
  app.post('/api/ai', async (req, res) => {
    await handleAiRequest(req, res);
  });

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get(/.*/, (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[HealYaar Server] Running on http://0.0.0.0:${PORT} (${isProd ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('[HealYaar Server] Failed to start:', err);
  process.exit(1);
});
