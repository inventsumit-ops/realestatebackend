const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const connectDB = require('./src/config/db');
const { errorHandler, notFound } = require('./src/middleware/errorMiddleware');

const app = express();

connectDB();

app.use(helmet());
app.use(compression());
app.use(morgan('combined'));

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', limiter);

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'https://realestatebackend-nu.vercel.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Real Estate Backend API is running',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      users: '/api/users',
      properties: '/api/properties',
      agents: '/api/agents',
      inquiries: '/api/inquiries',
      reviews: '/api/reviews',
      favorites: '/api/favorites',
      appointments: '/api/appointments',
      messages: '/api/messages',
      admin: '/api/admin'
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/users', require('./src/routes/userRoutes'));
app.use('/api/properties', require('./src/routes/propertyRoutes'));
app.use('/api/agents', require('./src/routes/agentRoutes'));
app.use('/api/inquiries', require('./src/routes/inquiryRoutes'));
app.use('/api/reviews', require('./src/routes/reviewRoutes'));
app.use('/api/favorites', require('./src/routes/favoriteRoutes'));
app.use('/api/appointments', require('./src/routes/appointmentRoutes'));
app.use('/api/messages', require('./src/routes/messageRoutes'));
app.use('/api/admin', require('./src/routes/adminRoutes'));

// Handle favicon.ico requests to prevent 404 errors
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

process.on('unhandledRejection', (err, promise) => {
  console.error(`Error: ${err.message}`);
  server.close(() => {
    process.exit(1);
  });
});

process.on('uncaughtException', (err) => {
  console.error(`Uncaught Exception: ${err.message}`);
  process.exit(1);
});

module.exports = app;
