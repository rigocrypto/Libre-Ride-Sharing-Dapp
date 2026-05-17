import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { type Server } from "node:http";

import { nanoid } from "nanoid";
import { type Express } from "express";
import { createServer as createViteServer, createLogger } from "vite";

import viteConfig from "../vite.config";
import runApp from "./app";

export async function setupVite(app: Express, server: Server) {
  const viteLogger = createLogger();
  const serverOptions = {
    middlewareMode: true,
    // In middleware mode, Vite handles HMR through its middleware
    // Don't configure HMR separately - let Vite middleware handle it
    // The server parameter tells Vite to use our existing HTTP server
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  // IMPORTANT: API routes are registered in registerRoutes() BEFORE setupVite() is called
  // So API routes should already be registered by the time we get here.
  // Wrap Vite middleware to skip /api/* routes (they're handled by Express API routes)
  
  // Vite middleware - handles assets, HMR WebSocket, and dev server
  // Skip /api/* routes - let Express API routes handle them
  app.use((req, res, next) => {
    // If it's an API route, skip Vite middleware entirely
    if (req.path.startsWith('/api')) {
      return next(); // Skip Vite, let Express API routes handle it
    }
    // For non-API routes, pass to Vite
    vite.middlewares(req, res, next);
  });
  
  // 3. Favicon fallback (quick win - prevents 404s)
  app.get('/favicon.ico', (req, res) => {
    res.status(204).end(); // No content, no error
  });
  
  // 4. Catch-all for client-side routing (AFTER Vite middleware)
  // IMPORTANT: Skip API routes - they should be handled by API routes registered earlier
  app.use("*", async (req, res, next) => {
    // Check BOTH req.path and req.originalUrl to catch API routes
    const isApiRoute = req.path.startsWith('/api') || req.originalUrl.startsWith('/api');
    
    // Skip API routes - they should have been handled by API routes
    if (isApiRoute) {
      // If we reach here, the API route doesn't exist or wasn't registered
      console.log(`⚠️ API route reached catch-all (not handled): ${req.method} ${req.path} (originalUrl: ${req.originalUrl})`);
      return res.status(404).json({ 
        error: 'API route not found', 
        method: req.method, 
        path: req.path,
        originalUrl: req.originalUrl 
      });
    }

    // Skip WebSocket routes
    if (req.path === '/ws' || req.path.startsWith('/ws/')) {
      return next();
    }

    // Skip static assets (should be handled by Vite)
    if (req.path.startsWith('/src/') || 
        req.path.startsWith('/@') || 
        req.path.startsWith('/node_modules/') ||
        req.path.includes('.')) {
      return next();
    }

    console.log(`🌐 Catch-all handler: ${req.method} ${req.url} (path: ${req.path}, originalUrl: ${req.originalUrl})`);
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      console.log(`✅ Sending HTML response for ${url}`);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      console.error(`❌ Catch-all error for ${url}:`, e);
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
  
  // 5. WebSocket upgrade handler - ONLY on raw HTTP server, NEVER in Express middleware
  // This runs AFTER Vite middleware is configured
  const wss = (server as any).wss;
  if (wss) {
    server.on('upgrade', (request, socket, head) => {
      const { url, headers } = request;
      console.log(`⚡ WS upgrade attempt: ${url}`);
      console.log('WS Headers:', {
        upgrade: headers.upgrade || 'NO',
        connection: headers.connection || 'NO'
      });
      
      // STRICT CHECKS: Only process actual WebSocket upgrades for /ws path
      if (
        url !== '/ws' ||  // Wrong path? Ignore
        !headers.upgrade || headers.upgrade.toLowerCase() !== 'websocket' ||
        !headers.connection || !headers.connection.toLowerCase().includes('upgrade')
      ) {
        // Not a valid WebSocket upgrade - close socket quietly, NO 426!
        // Regular HTTP requests should NEVER reach here
        console.log(`❌ Invalid WS upgrade for ${url} - destroying socket`);
        socket.destroy();
        return;
      }
      
      // Valid WebSocket upgrade for /ws path
      console.log(`✅ Valid WS upgrade for ${url} - handling`);
      wss.handleUpgrade(request, socket, head, (ws: any) => {
        wss.emit('connection', ws, request);
      });
    });
  }
}

(async () => {
  await runApp(setupVite);
})();
