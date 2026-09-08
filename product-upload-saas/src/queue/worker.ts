import 'dotenv/config';
import { Worker, Job } from 'bullmq';
import { redisConnection, UploadJobData } from './queue';
import { decrypt } from '../crypto/encryption';
import {
  getIdeasoftCredentials,
  isSubscriptionActive,
  markJobStarted,
  markJobFinished,
} from '../db/repositories';
import { login, logout, createProduct, Credentials } from '../playwright/ideasoftBot';
import { readUnprocessedRows, writeRowStatus, writeSummaryBanner, statusUploaded, statusError } from '../sheets/googleSheets';

async function processUploadJob(job: Job<UploadJobData>): Promise<void> {
  const { jobId, customerId, sheetId } = job.data;

  // Re-check the subscription at execution time too: the job may have sat
  // in the queue long enough for the plan to have expired since the
  // webhook accepted it.
  const active = await isSubscriptionActive(customerId);
  if (!active) {
    await markJobFinished(jobId, 'failed', 0, 'Subscription expired before job could run');
    return;
  }

  const creds = await getIdeasoftCredentials(customerId);
  if (!creds) {
    await markJobFinished(jobId, 'failed', 0, 'No IdeaSoft credentials on file for this customer');
    return;
  }

  const credentials: Credentials = {
    storeUrl: creds.storeUrl,
    username: creds.username,
    password: decrypt(creds.passwordEncrypted),
    totpSecret: creds.totpSecretEncrypted ? decrypt(creds.totpSecretEncrypted) : null,
  };

  await markJobStarted(jobId);

  const rows = await readUnprocessedRows(sheetId);
  let processed = 0;
  let session;

  try {
    session = await login(credentials);

    for (const row of rows) {
      try {
        await createProduct(session, row);
        await writeRowStatus(sheetId, row.rowNumber, statusUploaded());
        processed += 1;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await writeRowStatus(sheetId, row.rowNumber, statusError(message));
      }
    }
  } finally {
    if (session) await logout(session);
  }

  await writeSummaryBanner(sheetId, processed, rows.length);
  await markJobFinished(jobId, 'completed', processed);
}

export const uploadWorker = new Worker<UploadJobData>(
  'product-upload',
  async (job) => {
    try {
      await processUploadJob(job);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await markJobFinished(job.data.jobId, 'failed', 0, message);
      throw err;
    }
  },
  { connection: redisConnection, concurrency: 1 },
);

uploadWorker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});

console.log('Upload worker started');
