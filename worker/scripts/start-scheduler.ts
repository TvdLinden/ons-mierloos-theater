import { start } from '@/lib/jobs/schedular';

async function main() {
  await start();
}

main().catch((err) => {
  console.error('❌ Failed to start scheduler:', err);
  process.exit(1);
});
