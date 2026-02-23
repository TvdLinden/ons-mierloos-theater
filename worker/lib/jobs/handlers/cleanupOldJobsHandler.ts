import { cleanupOldJobs } from '@ons-mierloos-theater/shared/jobs/jobProcessor';

export async function handleCleanupOldJobs(
  jobId: string,
  data: any,
): Promise<{ success: boolean }> {
  console.log(`Running cleanup for old jobs (Job ID: ${jobId}) with data:`, data);
  try {
    await cleanupOldJobs(14);
  } catch (error) {
    console.error(`Error during cleanup of old jobs (Job ID: ${jobId}):`, error);
    throw error; // Rethrow to trigger retry logic in worker
  }
  return { success: true };
}
