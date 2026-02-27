// server.js - Updated with Unique Visitor Tracking

const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// 🔐 Secret key for broadcast protection
const ADMIN_SECRET = process.env.BROADCAST_SECRET || "Godbuild2026Secure!";

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let clients = [];
let uniqueVisitors = new Set(); // Store unique IP addresses
let totalUniqueVisitors = 0; // Counter

// Middleware to track unique visitors
app.use((req, res, next) => {
  // Get client IP address
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  
  // Add to set if not already present
  if (!uniqueVisitors.has(ip)) {
    uniqueVisitors.add(ip);
    totalUniqueVisitors = uniqueVisitors.size;
    console.log(`✨ New unique visitor! Total: ${totalUniqueVisitors}`);
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
  const newClient = {
    id: clientId,
    res
  };
  clients.push(newClient);

  // Send welcome event with visitor count
  res.write(`data: ${JSON.stringify({ 
    title: 'Connected', 
    body: 'You are now connected to live updates!',
    totalVisitors: totalUniqueVisitors
  })}\n\n`);

  req.on('close', () => {
    clients = clients.filter(c => c.id !== clientId);
    console.log(`Client ${clientId} disconnected. Total clients: ${clients.length}`);
  });

  console.log(`New client connected: ${clientId}. Total clients: ${clients.length}`);
});

// Broadcast endpoint (PROTECTED)
app.post('/broadcast', (req, res) => {
  const payload = req.body || {};
  
  // Secret key check
  const providedSecret = payload.secret;
  
  if (!providedSecret || providedSecret !== ADMIN_SECRET) {
    console.warn('⚠️ Unauthorized broadcast attempt detected!');
    return res.status(403).json({ 
      error: 'Unauthorized: Invalid or missing secret key'
    });
  }
  
  if (!payload.title || !payload.body) {
    return res.status(400).json({ error: 'Title and body are required' });
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
  res.json({ 
    ok: true, 
    sentTo: sentCount,
    message: 'Update broadcast successfully'
  });
});

// Keepalive ping
setInterval(() => {
  clients.forEach(c => {
    try { 
      c.res.write(': ping\n\n'); 
    } catch (err) {
      clients = clients.filter(client => client.id !== c.id);
    }
  });
}, 30000);

// Enhanced health check endpoint with visitor stats
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    clients: clients.length,
    totalUniqueVisitors: totalUniqueVisitors,
    uptime: process.uptime(),
    serverTime: new Date().toISOString()
  });
});

// Endpoint to get total unique visitors (for admin)
app.get('/api/stats/visitors', (req, res) => {
  // Simple check - in production, add admin auth
  res.json({ 
    totalUniqueVisitors: totalUniqueVisitors,
    activeVisitors: clients.length
  });
});

// For local development
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 SSE endpoint: http://localhost:${PORT}/events`);
    console.log(`📊 Visitor tracking active - Total so far: ${totalUniqueVisitors}`);
  });
}

module.exports = app;
