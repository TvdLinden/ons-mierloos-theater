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

  const hourlyExpression = '0 * * * *';
  register('orphaned_order_cleanup', hourlyExpression, async () => {
    await createJob('orphaned_order_cleanup', {});
  });

  register('cleanup_old_jobs', hourlyExpression, async () => {
    await createJob('cleanup_old_jobs', {});
  });

  console.log('🚀 Scheduler started');
}
