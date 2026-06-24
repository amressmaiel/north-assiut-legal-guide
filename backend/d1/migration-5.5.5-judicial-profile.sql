-- Phase 5.5.5 — Add judicial verification profile to membership requests
-- Run once on Cloudflare D1:
-- wrangler d1 execute north_assiut_auth_db --remote --file=backend/d1/migration-5.5.5-judicial-profile.sql

ALTER TABLE users ADD COLUMN judicial_profile_json TEXT;
