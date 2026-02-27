const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// 🔐 Secret key for broadcast (must match admin.html)
const ADMIN_SECRET = process.env.BROADCAST_SECRET || "gim@admin!";

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---------- Visitor tracking ----------
let clients = [];
let visitors = []; // { ip, firstVisit }

// Middleware to track unique visitors by IP
app.use((req, res, next) => {
  // Get client IP (handles proxies)
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  if (ip && !visitors.find(v => v.ip === ip)) {
    visitors.push({ ip, firstVisit: Date.now() });
    console.log(`✨ New unique visitor. Total: ${visitors.length}`);
  }
  next();
});

// SSE endpoint for real-time updates
app.get('/events', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });
  res.flushHeaders();

  const clientId = Date.now();
  const newClient = { id: clientId, res };
  clients.push(newClient);

  // Send welcome event with visitor count
  res.write(`data: ${JSON.stringify({ 
    title: 'Connected', 
    body: 'You are now connected to live updates!',
    totalVisitors: visitors.length
  })}\n\n`);

  req.on('close', () => {
    clients = clients.filter(c => c.id !== clientId);
    console.log(`Client ${clientId} disconnected. Total clients: ${clients.length}`);
  });

  console.log(`New client connected: ${clientId}. Total clients: ${clients.length}`);
});

// Broadcast endpoint (protected)
app.post('/broadcast', (req, res) => {
  const payload = req.body || {};
  const providedSecret = payload.secret;

  if (!providedSecret || providedSecret !== ADMIN_SECRET) {
    console.warn('⚠️ Unauthorized broadcast attempt');
    return res.status(403).json({ error: 'Unauthorized: Invalid secret' });
  }

  if (!payload.title || !payload.body) {
    return res.status(400).json({ error: 'Title and body required' });
  }

  const data = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || null,
    icon: payload.icon || null,
    timestamp: new Date().toISOString()
  });

  let sentCount = 0;
  clients.forEach(c => {
    try {
      c.res.write(`data: ${data}\n\n`);
      sentCount++;
    } catch (err) {
      clients = clients.filter(client => client.id !== c.id);
    }
  });

  console.log(`✅ Broadcast sent to ${sentCount} clients: "${payload.title}"`);
  res.json({ ok: true, sentTo: sentCount });
});

// Keepalive ping
setInterval(() => {
  clients.forEach(c => {
    try { c.res.write(': ping\n\n'); } catch (err) {
      clients = clients.filter(client => client.id !== c.id);
    }
  });
}, 30000);

// Health endpoint (active clients)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    clients: clients.length,
    totalUniqueVisitors: visitors.length,
    uptime: process.uptime()
  });
});

// Detailed stats endpoint (real data)
app.get('/api/stats/detailed', (req, res) => {
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const oneWeek = 7 * oneDay;
  const oneMonth = 30 * oneDay; // approximate

  // Count visitors per period
  const today = visitors.filter(v => (now - v.firstVisit) < oneDay).length;
  const thisWeek = visitors.filter(v => (now - v.firstVisit) < oneWeek).length;
  const thisMonth = visitors.filter(v => (now - v.firstVisit) < oneMonth).length;

  // Average daily visitors (since first visitor)
  let average = 0;
  if (visitors.length > 0) {
    const firstDate = Math.min(...visitors.map(v => v.firstVisit));
    const daysSince = Math.ceil((now - firstDate) / oneDay) || 1;
    average = (visitors.length / daysSince).toFixed(1);
  }

  // For clicks/views we'll add later – returning 0 for now
  res.json({
    today,
    week: thisWeek,
    month: thisMonth,
    average,
    clicks: 0,
    views: 0,
    perVisitor: 0
  });
});

// For local development
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Visitor tracking active – total so far: ${visitors.length}`);
  });
}

module.exports = app;
