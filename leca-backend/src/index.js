const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { initSocket } = require('./socket');

const authRoutes = require('./routes/auth');
const listingsRoutes = require('./routes/listings');
const transactionsRoutes = require('./routes/transactions');
const messagesRoutes = require('./routes/messages');
const profilesRoutes = require('./routes/profiles');

const app = express();
const server = http.createServer(app);

// Socket.IO
initSocket(server);

// Middlewares
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.split(',') : '*', credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

// Health
app.get('/api/health', (req, res) => res.json({ ok: true, service: 'leca-backend', ts: Date.now() }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingsRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/profiles', profilesRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // Avoid leaking details in production
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`LECA backend listening on port ${PORT}`);
});

