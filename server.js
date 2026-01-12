// server.js
// Simple static server + SSE endpoint to broadcast updates to connected clients.
// Usage:
// 1) npm init -y
// 2) npm i express
// 3) place public/ folder (index.html, styles.css, script.js) beside this file
// 4) node server.js
//
// POST /broadcast  with JSON { title, body, url, icon } to broadcast to clients.
// Example: curl -X POST -H "Content-Type: application/json" -d '{"title":"Update","body":"New post"}' http://localhost:3000/broadcast

const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let clients = [];

// SSE endpoint
app.get('/events', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  });
  res.flushHeaders();

  const clientId = Date.now();
  const newClient = {
    id: clientId,
    res
  };
  clients.push(newClient);

  // send a welcome event
  res.write(`data: ${JSON.stringify({ title: 'connected', body: 'Connected to updates stream' })}\n\n`);

  req.on('close', () => {
    clients = clients.filter(c => c.id !== clientId);
  });
});

// Broadcast endpoint (admin)
app.post('/broadcast', (req, res) => {
  const payload = req.body || {};
  const data = JSON.stringify(payload);
  clients.forEach(c => {
    try {
      c.res.write(`data: ${data}\n\n`);
    } catch (err) {
      // ignore
    }
  });
  res.json({ ok: true, sentTo: clients.length });
});

// keepalive ping to avoid some proxies closing connection
setInterval(() => {
  clients.forEach(c => {
    try { c.res.write(': ping\n\n'); } catch (err) {}
  });
}, 30000);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
