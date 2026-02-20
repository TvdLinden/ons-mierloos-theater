import cron from 'node-cron';
import { createJob } from '@ons-mierloos-theater/shared/jobs/jobProcessor';

function register(name: string, expression: string, handler: () => Promise<void>) {
  console.log(`🗓 Registering job "${name}" -> ${expression}`);

  cron.schedule(expression, async () => {
    try {
      console.log(`⏰ Running scheduled job: ${name}`);
      await handler();
    } catch (err) {
      console.error(`❌ Scheduled job failed (${name}):`, err);
    }
  });
}

export async function start() {
  console.log('🚀 Starting scheduler...');

  const dailyExpression = '0 0 * * *';
  register('orphaned_order_cleanup', dailyExpression, async () => {
    await createJob('orphaned_order_cleanup', {});
  });

  const hourlyExpression = '0 * * * *';
  register('orphaned_jobs_cleanup', hourlyExpression, async () => {
    await createJob('orphaned_jobs_cleanup', {});
  });

  console.log('🚀 Scheduler started');
}
