-- Add deep_analysis_status column to audits table
-- Tracks the state of the post-gate deep analysis pipeline

ALTER TABLE audits
  ADD COLUMN IF NOT EXISTS deep_analysis_status TEXT DEFAULT NULL;

-- Values: NULL (not started), 'running', 'complete', 'failed'
COMMENT ON COLUMN audits.deep_analysis_status IS 'Deep analysis pipeline status: NULL | running | complete | failed';
