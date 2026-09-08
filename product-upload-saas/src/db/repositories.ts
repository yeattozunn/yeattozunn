import { pool } from './pool';

export interface SheetLookup {
  customerId: string;
  webhookToken: string;
}

export async function findSheetByIdAndToken(
  sheetId: string,
  webhookToken: string,
): Promise<SheetLookup | null> {
  const result = await pool.query(
    `SELECT customer_id, webhook_token
       FROM customer_sheets
      WHERE sheet_id = $1 AND webhook_token = $2`,
    [sheetId, webhookToken],
  );
  if (result.rowCount === 0) return null;
  const row = result.rows[0];
  return { customerId: row.customer_id, webhookToken: row.webhook_token };
}

export async function isSubscriptionActive(customerId: string): Promise<boolean> {
  const result = await pool.query(
    `SELECT payment_status, expires_at
       FROM subscriptions
      WHERE customer_id = $1`,
    [customerId],
  );
  if (result.rowCount === 0) return false;
  const { payment_status, expires_at } = result.rows[0];
  if (payment_status !== 'confirmed') return false;
  if (!expires_at) return false;
  return new Date(expires_at).getTime() > Date.now();
}

export async function createUploadJob(customerId: string, sheetId: string): Promise<string> {
  const result = await pool.query(
    `INSERT INTO upload_jobs (customer_id, sheet_id, status)
     VALUES ($1, $2, 'queued')
     RETURNING id`,
    [customerId, sheetId],
  );
  return result.rows[0].id;
}

export async function markJobStarted(jobId: string): Promise<void> {
  await pool.query(
    `UPDATE upload_jobs SET status = 'processing', started_at = now() WHERE id = $1`,
    [jobId],
  );
}

export async function markJobFinished(
  jobId: string,
  status: 'completed' | 'failed',
  rowsProcessed: number,
  errorLog?: string,
): Promise<void> {
  await pool.query(
    `UPDATE upload_jobs
        SET status = $2, finished_at = now(), rows_processed = $3, error_log = $4
      WHERE id = $1`,
    [jobId, status, rowsProcessed, errorLog ?? null],
  );
}

export interface IdeasoftCredentials {
  storeUrl: string;
  username: string;
  passwordEncrypted: string;
  totpSecretEncrypted: string | null;
}

export async function getIdeasoftCredentials(customerId: string): Promise<IdeasoftCredentials | null> {
  const result = await pool.query(
    `SELECT store_url, username, password_encrypted, totp_secret_encrypted
       FROM ideasoft_credentials
      WHERE customer_id = $1`,
    [customerId],
  );
  if (result.rowCount === 0) return null;
  const row = result.rows[0];
  return {
    storeUrl: row.store_url,
    username: row.username,
    passwordEncrypted: row.password_encrypted,
    totpSecretEncrypted: row.totp_secret_encrypted,
  };
}

export interface PendingPayment {
  customerId: string;
  customerName: string;
  paymentReferenceCode: string;
  plan: string;
}

export async function listPendingPayments(): Promise<PendingPayment[]> {
  const result = await pool.query(
    `SELECT s.customer_id, c.name AS customer_name, s.payment_reference_code, s.plan
       FROM subscriptions s
       JOIN customers c ON c.id = s.customer_id
      WHERE s.payment_status = 'pending'
      ORDER BY s.created_at ASC`,
  );
  return result.rows.map((r) => ({
    customerId: r.customer_id,
    customerName: r.customer_name,
    paymentReferenceCode: r.payment_reference_code,
    plan: r.plan,
  }));
}

export async function confirmPayment(customerId: string): Promise<void> {
  await pool.query(
    `UPDATE subscriptions
        SET payment_status = 'confirmed',
            expires_at = GREATEST(COALESCE(expires_at, now()), now()) + INTERVAL '1 month',
            updated_at = now()
      WHERE customer_id = $1`,
    [customerId],
  );
}
