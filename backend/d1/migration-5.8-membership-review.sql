-- Phase 5.8 — Professional membership request review metadata
-- Safe migration: adds review fields to users table if they do not already exist.

ALTER TABLE users ADD COLUMN review_status TEXT DEFAULT 'new';
ALTER TABLE users ADD COLUMN review_note TEXT;
ALTER TABLE users ADD COLUMN reviewed_at TEXT;
