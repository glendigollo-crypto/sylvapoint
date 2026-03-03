-- Migration: dimension_illustrations table
-- Stores paths to Gemini-generated editorial illustrations per dimension per audit

CREATE TABLE IF NOT EXISTS dimension_illustrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  dimension_key TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_dim_illustrations_unique
  ON dimension_illustrations(audit_id, dimension_key);
