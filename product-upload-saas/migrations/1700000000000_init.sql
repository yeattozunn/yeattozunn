-- Initial schema for IdeaSoft multi-tenant product upload SaaS.
-- Run with: psql "$DATABASE_URL" -f migrations/1700000000000_init.sql
-- (or adapt into node-pg-migrate migrations if using the JS runner)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE customers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  contact_info TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One row per customer. password/TOTP secret are stored as AES-256-GCM
-- ciphertext (base64), never plaintext. See src/crypto/encryption.ts.
CREATE TABLE ideasoft_credentials (
  customer_id            UUID PRIMARY KEY REFERENCES customers(id) ON DELETE CASCADE,
  store_url              TEXT NOT NULL,
  username               TEXT NOT NULL,
  password_encrypted     TEXT NOT NULL,
  totp_secret_encrypted  TEXT,
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- A customer may in principle run more than one sheet (e.g. separate
-- catalogs), so this is customer_id -> many rather than 1:1.
CREATE TABLE customer_sheets (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id    UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  sheet_id       TEXT NOT NULL,
  webhook_token  TEXT NOT NULL UNIQUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (customer_id, sheet_id)
);

CREATE TABLE subscriptions (
  customer_id           UUID PRIMARY KEY REFERENCES customers(id) ON DELETE CASCADE,
  plan                  TEXT NOT NULL DEFAULT 'standard',
  payment_reference_code TEXT NOT NULL UNIQUE,
  payment_status        TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'confirmed')),
  expires_at            TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE upload_jobs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id    UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  sheet_id       TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  started_at     TIMESTAMPTZ,
  finished_at    TIMESTAMPTZ,
  rows_processed INTEGER NOT NULL DEFAULT 0,
  error_log      TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_customer_sheets_sheet_id ON customer_sheets(sheet_id);
CREATE INDEX idx_upload_jobs_customer_id ON upload_jobs(customer_id);
CREATE INDEX idx_upload_jobs_status ON upload_jobs(status);
