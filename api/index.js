const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'World Bank API is running' });
});

// Proxy all other requests to your main server logic
// Note: You'll need to adapt your server routes to work as serverless functions
app.use('/api/*', (req, res) => {
  res.status(501).json({ error: 'API endpoints need to be implemented for serverless deployment' });
});

module.exports = app;