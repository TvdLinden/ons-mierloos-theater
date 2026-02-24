import express from 'express';
import { start } from '@/lib/jobs/scheduler';

const PORT = process.env.PORT || 8080;

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
    service: 'ons-mierloos-scheduler',
    status: 'running',
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`🏥 Health check server running on port ${PORT}`);
  console.log(`📍 Health endpoint: http://localhost:${PORT}/health`);
});

async function main() {
  await start();
}

main().catch((err) => {
  console.error('❌ Failed to start scheduler:', err);
  process.exit(1);
});
