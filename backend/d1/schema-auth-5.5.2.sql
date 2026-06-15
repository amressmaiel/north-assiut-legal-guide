-- Phase 5.5.2 Auth Foundation Schema for Cloudflare D1
-- منصة الدليل القضائي الذكي — نظام التهيئة الآمنة والترخيص الموقّع
-- ملاحظة: هذه الجداول مصممة للإنتاج على Cloudflare D1 ولا تعتمد على localStorage.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS auth_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 10,
  protected INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS permissions (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id TEXT NOT NULL,
  permission_id TEXT NOT NULL,
  allowed INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS licenses (
  id TEXT PRIMARY KEY,
  license_id TEXT NOT NULL UNIQUE,
  license_type TEXT NOT NULL CHECK (license_type IN ('owner','user','organization','trial')),
  issued_to TEXT NOT NULL,
  organization TEXT,
  valid_from TEXT NOT NULL,
  valid_until TEXT NOT NULL,
  max_users INTEGER NOT NULL DEFAULT 1,
  max_devices INTEGER NOT NULL DEFAULT 1,
  features_json TEXT NOT NULL DEFAULT '{}',
  payload_hash TEXT NOT NULL,
  signature TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','expired','revoked')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  role_id TEXT NOT NULL,
  license_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending_approval' CHECK (status IN ('pending_approval','active','suspended','expired','rejected','blocked')),
  valid_from TEXT,
  valid_until TEXT,
  max_devices INTEGER NOT NULL DEFAULT 1,
  must_change_password INTEGER NOT NULL DEFAULT 1,
  is_super_owner INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  approved_at TEXT,
  approved_by TEXT,
  last_login_at TEXT,
  FOREIGN KEY (role_id) REFERENCES roles(id),
  FOREIGN KEY (license_id) REFERENCES licenses(id),
  FOREIGN KEY (approved_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS user_devices (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  device_fingerprint_hash TEXT NOT NULL,
  device_label TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','replaced','revoked')),
  first_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
  replaced_by TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_devices_unique ON user_devices(user_id, device_fingerprint_hash);

CREATE TABLE IF NOT EXISTS active_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  device_id TEXT,
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (device_id) REFERENCES user_devices(id)
);

CREATE TABLE IF NOT EXISTS bootstrap_requests (
  id TEXT PRIMARY KEY,
  request_nonce TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','completed','expired','revoked')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS used_bootstrap_grants (
  id TEXT PRIMARY KEY,
  grant_id TEXT NOT NULL UNIQUE,
  payload_hash TEXT NOT NULL,
  signature TEXT NOT NULL,
  used_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_owner_user_id TEXT,
  FOREIGN KEY (created_owner_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS revoked_license_cache (
  license_id TEXT PRIMARY KEY,
  reason TEXT,
  revoked_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info','notice','important','critical')),
  details_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (actor_user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON active_sessions(expires_at);

INSERT OR IGNORE INTO roles(id, name, display_name, level, protected, description) VALUES
('role_super_owner','super_owner','مالك النظام الرئيسي',100,1,'صلاحيات مطلقة لا يجوز حذفها أو تعطيلها من أي حساب آخر'),
('role_system_admin','system_admin','مدير النظام',80,0,'إدارة المستخدمين والإعدادات دون المساس بالمالك الرئيسي'),
('role_content_manager','content_manager','مدير المحتوى',60,0,'إدارة القوانين والقوالب وشخصية سند'),
('role_member','prosecution_member','عضو نيابة',40,0,'استخدام أدوات سند والتحليل والتصدير'),
('role_reviewer','reviewer','مراجع',30,0,'مراجعة وقراءة التقارير دون إدارة النظام'),
('role_readonly','read_only','قراءة فقط',10,0,'استعراض المحتوى دون إنشاء أو تعديل'),
('role_trial','trial','تجريبي',5,0,'صلاحيات محدودة لمدة قصيرة');

INSERT OR IGNORE INTO permissions(id, key, category, display_name, description) VALUES
('perm_sand_text','sand.text','sand','استخدام سند النصي','إرسال أسئلة نصية إلى سند'),
('perm_sand_voice','sand.voice','sand','استخدام سند الصوتي','تشغيل الحوار الصوتي المباشر'),
('perm_case_analyze','case.analyze','case','تحليل واقعة','استخدام غرفة تحليل الواقعة'),
('perm_report_export','report.export','reports','تصدير تقارير','تصدير Word/HTML/PDF'),
('perm_drafts_create','drafts.create','drafts','إنشاء مسودات','توليد مسودات التصرف والاستيفاء'),
('perm_drafts_edit','drafts.edit','drafts','تحرير المسودات','فتح محرر المسودات الذكي'),
('perm_content_manage','content.manage','admin','إدارة المحتوى','إدارة القوانين والقوالب وشخصية سند'),
('perm_users_manage','users.manage','admin','إدارة المستخدمين','قبول وتعطيل وتجديد المستخدمين'),
('perm_roles_manage','roles.manage','admin','إدارة الأدوار والصلاحيات','تعديل خرائط الصلاحيات'),
('perm_licenses_manage','licenses.manage','admin','إدارة التراخيص','إصدار وتعطيل وتجديد التراخيص'),
('perm_audit_view','audit.view','admin','عرض سجل العمليات','استعراض Audit Log'),
('perm_settings_manage','settings.manage','admin','إدارة إعدادات المنصة','تعديل إعدادات المنصة العامة');

-- Super Owner gets all permissions
INSERT OR IGNORE INTO role_permissions(role_id, permission_id, allowed)
SELECT 'role_super_owner', id, 1 FROM permissions;

-- System Admin
INSERT OR IGNORE INTO role_permissions(role_id, permission_id, allowed)
SELECT 'role_system_admin', id, CASE WHEN key IN ('users.manage','roles.manage','audit.view','settings.manage','sand.text','case.analyze','report.export') THEN 1 ELSE 0 END FROM permissions;

-- Content Manager
INSERT OR IGNORE INTO role_permissions(role_id, permission_id, allowed)
SELECT 'role_content_manager', id, CASE WHEN key IN ('content.manage','sand.text','case.analyze','report.export','drafts.create','drafts.edit') THEN 1 ELSE 0 END FROM permissions;

-- Prosecution Member
INSERT OR IGNORE INTO role_permissions(role_id, permission_id, allowed)
SELECT 'role_member', id, CASE WHEN key IN ('sand.text','sand.voice','case.analyze','report.export','drafts.create','drafts.edit') THEN 1 ELSE 0 END FROM permissions;

-- Trial
INSERT OR IGNORE INTO role_permissions(role_id, permission_id, allowed)
SELECT 'role_trial', id, CASE WHEN key IN ('sand.text','case.analyze') THEN 1 ELSE 0 END FROM permissions;
