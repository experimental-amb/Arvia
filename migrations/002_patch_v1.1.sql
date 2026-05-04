-- ============================================================
-- Migration 002 — Patch v1.1: intent, priority, DLQ, idempotencia
-- ============================================================

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS intent        VARCHAR(32),
  ADD COLUMN IF NOT EXISTS priority      SMALLINT NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS skip_reason   VARCHAR(64),
  ADD COLUMN IF NOT EXISTS retry_count   SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ;

ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_status_check;
ALTER TABLE messages ADD CONSTRAINT messages_status_check
  CHECK (status IN ('pending','processing','processed','failed',
                    'duplicate_24h_skipped','skipped_by_intent','dlq'));

CREATE INDEX IF NOT EXISTS idx_messages_intent         ON messages(intent);
CREATE INDEX IF NOT EXISTS idx_messages_next_retry     ON messages(next_retry_at)
  WHERE status = 'failed' AND next_retry_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_status_pending ON messages(created_at)
  WHERE status = 'pending';

ALTER TABLE hashes DROP CONSTRAINT IF EXISTS hashes_content_hash_key;
ALTER TABLE hashes ADD CONSTRAINT hashes_content_hash_key UNIQUE (content_hash);

CREATE OR REPLACE VIEW v_pipeline_health AS
SELECT
  NOW() AS as_of,
  (SELECT COUNT(*) FROM messages WHERE status='pending')                                                 AS backlog_pending,
  (SELECT COUNT(*) FROM messages WHERE status='processing' AND updated_at < NOW() - INTERVAL '5 min')   AS stuck_processing,
  (SELECT COUNT(*) FROM messages WHERE status='failed' AND next_retry_at <= NOW())                       AS ready_to_retry,
  (SELECT COUNT(*) FROM messages WHERE status='dlq')                                                     AS dead_letter,
  (SELECT COUNT(*) FROM messages WHERE created_at > NOW() - INTERVAL '1 hour')                           AS ingested_1h,
  (SELECT ROUND(AVG(EXTRACT(EPOCH FROM (updated_at - created_at))),2)
     FROM messages WHERE status='processed' AND created_at > NOW() - INTERVAL '1 hour')                  AS avg_latency_1h_sec;

CREATE OR REPLACE FUNCTION fn_unstick_processing(p_minutes INT DEFAULT 5)
RETURNS INTEGER AS $$
DECLARE v_count INTEGER;
BEGIN
  UPDATE messages SET status='failed',
      retry_count = retry_count + 1,
      next_retry_at = NOW() + (INTERVAL '1 minute' * POWER(2, retry_count)),
      updated_at = NOW()
  WHERE status='processing' AND updated_at < NOW() - (INTERVAL '1 minute' * p_minutes);
  GET DIAGNOSTICS v_count = ROW_COUNT; RETURN v_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_move_to_dlq(p_max_retries INT DEFAULT 5)
RETURNS INTEGER AS $$
DECLARE v_count INTEGER;
BEGIN
  UPDATE messages SET status='dlq', updated_at=NOW()
   WHERE status='failed' AND retry_count >= p_max_retries;
  GET DIAGNOSTICS v_count = ROW_COUNT; RETURN v_count;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN RAISE NOTICE 'Migration 002 applied: intent + DLQ + idempotencia'; END $$;
