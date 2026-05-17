// Minimal test server - NO WS, NO VITE - Just HTTP
const express = require('express');
const { createServer } = require('http');
const path = require('path');

const app = express();
const server = createServer(app);

// HELLO WORLD - NO WS, NO VITE
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html><head><title>Test Server</title></head><body>
      <h1>✅ HTTP WORKS! Port 5000 alive.</h1>
      <p>Check console/network: No 426?</p>
      <p>If you see this, HTTP is working correctly.</p>
      <img src="/favicon.ico" alt="favicon" />
    </body></html>
  `);
});

app.get('/favicon.ico', (req, res) => {
  res.status(204).end(); // Silent OK
});

// Log all requests
app.use((req, res, next) => {
  console.log(`🔍 ${new Date().toISOString()} ${req.method} ${req.url}`);
  console.log('Headers:', {
    upgrade: req.headers.upgrade || 'NO',
    connection: req.headers.connection || 'NO',
    accept: req.headers.accept || 'NO'
  });
  next();
});

server.listen(5000, () => {
  console.log('🧪 Test server running: http://localhost:5000');
  console.log('✅ If you see this page, HTTP works - no 426 errors!');
});

