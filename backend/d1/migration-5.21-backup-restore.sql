-- Phase 5.21 Backup & Restore Center
CREATE TABLE IF NOT EXISTS backup_restore_audit (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT,
  action TEXT NOT NULL,
  backup_checksum TEXT,
  backup_size INTEGER DEFAULT 0,
  modules TEXT,
  details TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_backup_restore_audit_created_at ON backup_restore_audit(created_at);
