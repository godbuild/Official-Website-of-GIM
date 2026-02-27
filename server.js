const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const ADMIN_SECRET = process.env.BROADCAST_SECRET || "gim@admin!";

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Visitor tracking
let clients = [];
let visitors = [];

app.use((req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  if (ip && !visitors.find(v => v.ip === ip)) {
    visitors.push({ ip, firstVisit: Date.now() });
  }
  next();
});

// SSE endpoint
app.get('/events', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  res.flushHeaders();

  const clientId = Date.now();
  clients.push({ id: clientId, res });

  const activePoll = polls?.find(p => p.active && p.expiresAt > Date.now());
  res.write(`data: ${JSON.stringify({ 
    connected: true,
    activePoll: activePoll ? { id: activePoll.id, question: activePoll.question } : null
  })}\n\n`);

  req.on('close', () => {
    clients = clients.filter(c => c.id !== clientId);
  });
});

// Broadcast endpoint
app.post('/broadcast', (req, res) => {
  if (req.body.secret !== ADMIN_SECRET) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  const data = JSON.stringify(req.body);
  let sentCount = 0;
  clients.forEach(c => {
    try {
      c.res.write(`data: ${data}\n\n`);
      sentCount++;
    } catch (e) {}
  });
  res.json({ ok: true, sentTo: sentCount });
});

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
  
  res.json({
    today: visitors.filter(v => now - v.firstVisit < oneDay).length,
    week: visitors.filter(v => now - v.firstVisit < oneWeek).length,
    month: visitors.filter(v => now - v.firstVisit < oneMonth).length,
    average: (visitors.length / 30).toFixed(1),
    clicks: 0,
    views: 0,
    perVisitor: 0
  });
});

// Poll endpoints (simplified)
let polls = [];
let nextPollId = 1;

app.post('/api/poll/create', (req, res) => {
  if (req.body.secret !== ADMIN_SECRET) return res.status(403).json({ error: 'Unauthorized' });
  
  const newPoll = {
    id: nextPollId++,
    question: req.body.question,
    options: req.body.options.map(opt => ({ text: opt, votes: 0 })),
    type: req.body.type,
    active: true,
    expiresAt: Date.now() + 3600000
  };
  
  polls.forEach(p => p.active = false);
  polls.push(newPoll);
  
  // Notify clients
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
  const poll = polls.find(p => p.id === req.body.pollId && p.active);
  if (!poll) return res.status(404).json({ error: 'Poll not found' });
  
  req.body.selectedOptions.forEach(idx => {
    if (poll.options[idx]) poll.options[idx].votes++;
  });
  
  res.json({ success: true });
});

module.exports = app;
