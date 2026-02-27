const express = require('express');
const path = require('path');
const app = express();

// Simple static file serving
app.use(express.static(path.join(__dirname, 'public')));

// Basic health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

module.exports = app;
