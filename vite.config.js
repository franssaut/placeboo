import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import handler from './api/convert.js';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'placeboo-api-dev-server',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url && req.url.startsWith('/api/convert')) {
            // Buffer request body
            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });
            req.on('end', async () => {
              try {
                req.body = body ? JSON.parse(body) : {};
              } catch {
                req.body = body;
              }

              // Polyfill res.status and res.json for Express/Vercel compatibility
              res.status = (code) => {
                res.statusCode = code;
                return res;
              };
              res.json = (data) => {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(data));
              };

              try {
                await handler(req, res);
              } catch (err) {
                console.error('[Vite API Middleware Error]:', err);
                if (!res.writableEnded) {
                  res.statusCode = 500;
                  res.end(JSON.stringify({ success: false, error: err.message }));
                }
              }
            });
            return;
          }
          next();
        });
      }
    }
  ]
});
