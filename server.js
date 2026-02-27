const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// 🔐 Secret key (must match admin.html)
const ADMIN_SECRET = process.env.BROADCAST_SECRET || "gim@admin!";

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---------- Visitor tracking ----------
let clients = [];
let visitors = []; // { ip, firstVisit }

app.use((req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  if (ip && !visitors.find(v => v.ip === ip)) {
    visitors.push({ ip, firstVisit: Date.now() });
    console.log(`✨ New unique visitor. Total: ${visitors.length}`);
  }
  next();
});

// SSE endpoint
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

  const activePoll = polls.find(p => p.active && p.expiresAt > Date.now());
  res.write(`data: ${JSON.stringify({ 
    title: 'Connected', 
    body: 'Live updates active',
    totalVisitors: visitors.length,
    activePoll: activePoll ? { id: activePoll.id, question: activePoll.question } : null
  })}\n\n`);

  req.on('close', () => {
    clients = clients.filter(c => c.id !== clientId);
  });
});

// Broadcast endpoint (protected)
app.post('/broadcast', (req, res) => {
  const payload = req.body;
  if (payload.secret !== ADMIN_SECRET) return res.status(403).json({ error: 'Unauthorized' });
  if (!payload.title || !payload.body) return res.status(400).json({ error: 'Title and body required' });

  const data = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || null,
    icon: payload.icon || null,
    timestamp: new Date().toISOString()
  });

  let sent = 0;
  clients.forEach(c => {
    try { c.res.write(`data: ${data}\n\n`); sent++; } catch (err) {
      clients = clients.filter(client => client.id !== c.id);
    }
  });
  res.json({ ok: true, sentTo: sent });
});

// Keepalive ping
setInterval(() => {
  clients.forEach(c => {
    try { c.res.write(': ping\n\n'); } catch (err) {
      clients = clients.filter(client => client.id !== c.id);
    }
  });
}, 30000);

// Health endpoint
app.get('/health', (req, res) => {
  res.json({
    clients: clients.length,
    totalUniqueVisitors: visitors.length
  });
});

// Detailed stats
app.get('/api/stats/detailed', (req, res) => {
  const now = Date.now();
  const oneDay = 86400000;
  const oneWeek = 7 * oneDay;
  const oneMonth = 30 * oneDay;
  const today = visitors.filter(v => now - v.firstVisit < oneDay).length;
  const week = visitors.filter(v => now - v.firstVisit < oneWeek).length;
  const month = visitors.filter(v => now - v.firstVisit < oneMonth).length;
  const firstDate = Math.min(...visitors.map(v => v.firstVisit));
  const daysSince = Math.ceil((now - firstDate) / oneDay) || 1;
  const average = (visitors.length / daysSince).toFixed(1);
  res.json({ today, week, month, average, clicks: 0, views: 0, perVisitor: 0 });
});
 
// ---------- Live poll ----------
let polls = [];
let nextPollId = 1;

app.post('/api/poll/create', (req, res) => {
  const { secret, question, options, type } = req.body;
  if (secret !== ADMIN_SECRET) return res.status(403).json({ error: 'Unauthorized' });
  if (!question || !options || options.length < 2) return res.status(400).json({ error: 'Invalid poll data' });
  if (!['single', 'multiple'].includes(type)) return res.status(400).json({ error: 'Type must be single or multiple' });

  polls.forEach(p => p.active = false); // deactivate previous

  const newPoll = {
    id: nextPollId++,
    question,
    options: options.map(opt => ({ text: opt, votes: 0 })),
    type,
    active: true,
    createdAt: Date.now(),
    expiresAt: Date.now() + 60 * 60 * 1000 // 1 hour
  };
  polls.push(newPoll);

  // Notify all clients
  const pollData = JSON.stringify({ type: 'new_poll', poll: { id: newPoll.id, question: newPoll.question } });
  clients.forEach(c => { try { c.res.write(`data: ${pollData}\n\n`); } catch (e) {} });

  res.json({ success: true, pollId: newPoll.id });
});

app.get('/api/poll/active', (req, res) => {
  const active = polls.find(p => p.active && p.expiresAt > Date.now());
  if (!active) return res.json({ active: false });
  res.json({
    active: true,
    id: active.id,
    question: active.question,
    options: active.options.map(o => ({ text: o.text })),
    type: active.type
  });
});

app.post('/api/poll/vote', (req, res) => {
  const { pollId, selectedOptions } = req.body;
  const poll = polls.find(p => p.id === pollId && p.active && p.expiresAt > Date.now());
  if (!poll) return res.status(404).json({ error: 'Poll not found or expired' });
  if (!Array.isArray(selectedOptions) || selectedOptions.length === 0) return res.status(400).json({ error: 'No options' });
  if (poll.type === 'single' && selectedOptions.length > 1) return res.status(400).json({ error: 'Only one option allowed' });
  for (let idx of selectedOptions) {
    if (idx < 0 || idx >= poll.options.length) return res.status(400).json({ error: 'Invalid option' });
    poll.options[idx].votes++;
  }
  res.json({ success: true });
});

app.get('/api/poll/results/:id', (req, res) => {
  const poll = polls.find(p => p.id === parseInt(req.params.id));
  if (!poll) return res.status(404).json({ error: 'Poll not found' });
  res.json(poll);
});

// Export for Vercel
module.exports = app;
