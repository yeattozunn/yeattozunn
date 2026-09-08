import { Router } from 'express';
import { findSheetByIdAndToken, isSubscriptionActive, createUploadJob } from '../../db/repositories';
import { uploadQueue } from '../../queue/queue';

export const uploadTriggerRouter = Router();

// POST /api/upload-trigger
// Body: { sheet_id: string, webhook_token: string }
// Called by the Google Apps Script "Şimdi Yükle" menu item.
uploadTriggerRouter.post('/upload-trigger', async (req, res) => {
  const { sheet_id, webhook_token } = req.body ?? {};

  if (typeof sheet_id !== 'string' || typeof webhook_token !== 'string' || !sheet_id || !webhook_token) {
    return res.status(400).json({ error: 'sheet_id and webhook_token are required' });
  }

  const sheet = await findSheetByIdAndToken(sheet_id, webhook_token);
  if (!sheet) {
    // Same response for "sheet not found" and "token mismatch" so the
    // endpoint doesn't leak which part of the pair was wrong.
    return res.status(403).json({ error: 'Invalid sheet_id or webhook_token' });
  }

  const active = await isSubscriptionActive(sheet.customerId);
  if (!active) {
    return res.status(402).json({ error: 'Subscription is not active. Job rejected.' });
  }

  const jobId = await createUploadJob(sheet.customerId, sheet_id);
  await uploadQueue.add(
    'process-sheet',
    { jobId, customerId: sheet.customerId, sheetId: sheet_id },
    { jobId, removeOnComplete: true, removeOnFail: false },
  );

  return res.status(202).json({ status: 'queued', job_id: jobId });
});
