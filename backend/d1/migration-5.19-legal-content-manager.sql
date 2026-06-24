-- Phase 5.19 — Legal Content Management D1 Schema
CREATE TABLE IF NOT EXISTS legal_laws (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  law_number TEXT,
  category TEXT,
  description TEXT,
  status TEXT DEFAULT 'draft',
  source TEXT DEFAULT 'cloud',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);
CREATE TABLE IF NOT EXISTS legal_articles (
  id TEXT PRIMARY KEY,
  law_id TEXT NOT NULL,
  article_number TEXT,
  title TEXT,
  official_text TEXT,
  practical_explanation TEXT,
  prosecution_points TEXT,
  examples TEXT,
  common_errors TEXT,
  keywords TEXT,
  linked_articles TEXT,
  status TEXT DEFAULT 'draft',
  source TEXT DEFAULT 'cloud',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT,
  FOREIGN KEY (law_id) REFERENCES legal_laws(id)
);
CREATE TABLE IF NOT EXISTS legal_content_audit (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  details TEXT,
  user_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_legal_laws_status ON legal_laws(status);
CREATE INDEX IF NOT EXISTS idx_legal_articles_law ON legal_articles(law_id);
CREATE INDEX IF NOT EXISTS idx_legal_articles_status ON legal_articles(status);
CREATE INDEX IF NOT EXISTS idx_legal_content_audit_created ON legal_content_audit(created_at);
