import express from 'express';
import cors from 'cors';
import playerRoutes from './routes/playerRoutes.js';
import teamRoutes from './routes/teamRoutes.js';
import authRoutes from './routes/authRoutes.js';
import auctionRoutes from './routes/auctionRoutes.js';
import participantRoutes from './routes/participantRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

export const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'cricket-conquest-api',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/auction', auctionRoutes);
app.use('/api/participant', participantRoutes);
app.use('/api/participants', participantRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/teams', teamRoutes);

// Error Handling
app.use(errorHandler);
