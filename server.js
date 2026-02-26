// server.js
// Simple static server + SSE endpoint to broadcast updates to connected clients.
// Now with secret key protection for the broadcast endpoint!

const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// 🔐 Secret key for broadcast protection
// In production, use environment variable: process.env.BROADCAST_SECRET
const ADMIN_SECRET = process.env.BROADCAST_SECRET || "gim032011"; // Change this to your secret!

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let clients = [];

// SSE endpoint for real-time updates
app.get('/events', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*' // Allow connections from your domain
  });
  res.flushHeaders();

  const clientId = Date.now();
  const newClient = {
    id: clientId,
    res
  };
  clients.push(newClient);

  // Send a welcome event immediately when client connects
  res.write(`data: ${JSON.stringify({ 
    title: 'Connected', 
    body: 'You are now connected to live updates from Godbuild Imoh Michael\'s site!' 
  })}\n\n`);

  // Remove client on connection close
  req.on('close', () => {
    clients = clients.filter(c => c.id !== clientId);
    console.log(`Client ${clientId} disconnected. Total clients: ${clients.length}`);
  });

  console.log(`New client connected: ${clientId}. Total clients: ${clients.length}`);
});

// Broadcast endpoint (PROTECTED with secret key)
app.post('/broadcast', (req, res) => {
  const payload = req.body || {};
  
  // 🔐 SECRET KEY CHECK - Only authorized requests can broadcast
  const providedSecret = payload.secret;
  
  if (!providedSecret || providedSecret !== ADMIN_SECRET) {
    console.warn('⚠️ Unauthorized broadcast attempt detected!');
    return res.status(403).json({ 
      error: 'Unauthorized: Invalid or missing secret key',
      hint: 'You need to provide the correct secret key to broadcast'
    });
  }
  
  // Validate required fields
  if (!payload.title || !payload.body) {
    return res.status(400).json({ 
      error: 'Title and body are required' 
    });
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
      console.error('Error sending to client:', err);
      // Remove dead connection
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

// Keepalive ping to prevent connection timeouts
setInterval(() => {
  clients.forEach(c => {
    try { 
      c.res.write(': ping\n\n'); 
    } catch (err) {
      // Remove dead connections
      clients = clients.filter(client => client.id !== c.id);
    }
  });
}, 30000); // Send ping every 30 seconds

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    clients: clients.length,
    uptime: process.uptime(),
    serverTime: new Date().toISOString()
  });
});

// For local development
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 SSE endpoint: http://localhost:${PORT}/events`);
    console.log(`📢 Broadcast endpoint: http://localhost:${PORT}/broadcast`);
    console.log(`🔐 Secret key protection is ACTIVE`);
    console.log(`⚠️  Keep your secret key safe! Current key: ${ADMIN_SECRET}`);
  });
}

// Export for Vercel serverless
module.exports = app;
