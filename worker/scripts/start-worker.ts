#!/usr/bin/env tsx

import express from 'express';
import { startWorker, setupGracefulShutdown } from '@/lib/jobs/worker';

const PORT = process.env.PORT || 8080;

// Create Express app for health checks (required by Cloud Run)
const app = express();

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/', (req, res) => {
  res.status(200).json({
    service: 'ons-mierloos-worker',
    status: 'running',
    timestamp: new Date().toISOString(),
  });
});

// Start HTTP server for health checks
app.listen(PORT, () => {
  console.log(`🏥 Health check server running on port ${PORT}`);
  console.log(`📍 Health endpoint: http://localhost:${PORT}/health`);
});

// Setup graceful shutdown handlers
setupGracefulShutdown();

// Start the worker (this runs indefinitely)
console.log('🔧 Environment:', process.env.NODE_ENV || 'development');
console.log('🗄️  Database:', process.env.DATABASE_URL ? 'configured' : 'NOT configured');

startWorker().catch((error) => {
  console.error('💥 Worker crashed:', error);
  process.exit(1);
});
