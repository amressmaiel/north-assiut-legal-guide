// Phase 5.5.3 — Worker Auth API + Real Login + Server Permissions
// منصة الدليل القضائي الذكي — واجهة مصادقة إنتاجية أولية على Cloudflare Worker + D1
// Required binding: AUTH_DB = Cloudflare D1 database
// Required env vars:
//   AUTH_PUBLIC_JWK           Public JWK used for bootstrap/license verification
//   ALLOWED_ORIGINS           comma separated allowed origins
// Optional env vars:
//   SESSION_TTL_MINUTES       default 480
//   MAX_LOGIN_ATTEMPTS        default 5
//   LOCKOUT_MINUTES           default 15
//   PBKDF2_ITERATIONS         default 100000

const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' };
const MAX_BODY = 1024 * 1024;
const DEFAULT_SESSION_TTL_MINUTES = 8 * 60;

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      if (request.method === 'OPTIONS') return cors(null, 204, env, request);
      await ensureAuthDb(env);

      // Public auth/bootstrap endpoints
      if (url.pathname === '/api/auth/health' && request.method === 'GET') {
        return cors(json({ ok: true, phase: '5.5.3', service: 'auth-api' }), 200, env, request);
      }
      if (url.pathname === '/api/bootstrap/status' && request.method === 'GET') {
        return cors(await bootstrapStatus(env), 200, env, request);
      }
      if (url.pathname === '/api/bootstrap/request' && request.method === 'POST') {
        return cors(await createBootstrapRequest(env), 200, env, request);
      }
      if (url.pathname === '/api/bootstrap/complete' && request.method === 'POST') {
        const body = await readJson(request);
        return cors(await completeBootstrap(env, body, request), 200, env, request);
      }
      if (url.pathname === '/api/license/verify' && request.method === 'POST') {
        const body = await readJson(request);
        return cors(await verifyLicenseEnvelope(env, body), 200, env, request);
      }
      if (url.pathname === '/api/auth/register' && request.method === 'POST') {
        const body = await readJson(request);
        return cors(await registerRequest(env, body, request), 200, env, request);
      }
      if (url.pathname === '/api/auth/check-username' && request.method === 'POST') {
        const body = await readJson(request);
        return cors(await checkUsername(env, body), 200, env, request);
      }
      if (url.pathname === '/api/auth/login' && request.method === 'POST') {
        const body = await readJson(request);
        return cors(await login(env, body, request), 200, env, request);
      }

      // Protected routes below
      const ctx = await requireAuth(env, request);
      if (url.pathname === '/api/auth/me' && request.method === 'GET') {
        return cors(json({ ok: true, user: ctx.publicUser, permissions: ctx.permissions }), 200, env, request);
      }
      if (url.pathname === '/api/auth/logout' && request.method === 'POST') {
        return cors(await logout(env, ctx), 200, env, request);
      }
      if (url.pathname === '/api/users' && request.method === 'GET') {
        await requirePermission(ctx, 'users.manage');
        return cors(await listUsers(env), 200, env, request);
      }
      if (url.pathname === '/api/users/pending' && request.method === 'GET') {
        await requirePermission(ctx, 'users.manage');
        return cors(await listPendingUsers(env), 200, env, request);
      }
      if (url.pathname === '/api/users/approve' && request.method === 'POST') {
        await requirePermission(ctx, 'users.manage');
        const body = await readJson(request);
        return cors(await approveUser(env, ctx, body), 200, env, request);
      }
      if (url.pathname === '/api/users/reject' && request.method === 'POST') {
        await requirePermission(ctx, 'users.manage');
        const body = await readJson(request);
        return cors(await rejectUser(env, ctx, body), 200, env, request);
      }
      if (url.pathname === '/api/users/update-status' && request.method === 'POST') {
        await requirePermission(ctx, 'users.manage');
        const body = await readJson(request);
        return cors(await updateUserStatus(env, ctx, body), 200, env, request);
      }
      if (url.pathname === '/api/roles' && request.method === 'GET') {
        await requirePermission(ctx, 'users.manage');
        return cors(await listRoles(env), 200, env, request);
      }
      if (url.pathname === '/api/permissions' && request.method === 'GET') {
        await requirePermission(ctx, 'roles.manage');
        return cors(await listPermissions(env), 200, env, request);
      }
      if (url.pathname === '/api/devices' && request.method === 'GET') {
        await requirePermission(ctx, 'users.manage');
        return cors(await listDevices(env), 200, env, request);
      }
      if (url.pathname === '/api/devices/update-status' && request.method === 'POST') {
        await requirePermission(ctx, 'users.manage');
        const body = await readJson(request);
        return cors(await updateDeviceStatus(env, ctx, body), 200, env, request);
      }
      if (url.pathname === '/api/audit' && request.method === 'GET') {
        await requirePermission(ctx, 'audit.view');
        return cors(await listAudit(env, url), 200, env, request);
      }
      return cors(json({ ok: false, error: 'NOT_FOUND' }), 404, env, request);
    } catch (err) {
      const status = err?.status || 500;
      return cors(json({ ok: false, error: err?.code || 'SERVER_ERROR', message: String(err?.message || err) }), status, env, request);
    }
  }
};

function json(data, init = {}) { return new Response(JSON.stringify(data, null, 2), { ...init, headers: JSON_HEADERS }); }
function authError(code, status=401, message=code) { const e = new Error(message); e.code = code; e.status = status; return e; }
function nowIso() { return new Date().toISOString(); }
function addMinutes(minutes) { return new Date(Date.now() + Number(minutes || 0) * 60000).toISOString(); }
function uuid() { return crypto.randomUUID(); }
function normalizeUsername(v) { return String(v || '').trim().toLowerCase(); }
function safeStr(v, max=5000) { return String(v ?? '').trim().slice(0, max); }
async function ensureAuthDb(env) { if (!env.AUTH_DB) throw authError('AUTH_DB_NOT_BOUND', 500, 'AUTH_DB binding is missing'); }

function cors(response, status, env, request) {
  const origin = request?.headers?.get('origin') || '';
  const allowed = (env?.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  const allowOrigin = allowed.includes(origin) ? origin : (allowed[0] || '*');
  const headers = new Headers(response?.headers || JSON_HEADERS);
  headers.set('access-control-allow-origin', allowOrigin);
  headers.set('vary', 'Origin');
  headers.set('access-control-allow-methods', 'GET,POST,OPTIONS');
  headers.set('access-control-allow-headers', 'content-type, authorization, x-device-fingerprint, x-device-label');
  headers.set('access-control-max-age', '86400');
  if (!response) return new Response(null, { status, headers });
  return new Response(response.body, { status: response.status || status, headers });
}
async function readJson(request) {
  const len = Number(request.headers.get('content-length') || 0);
  if (len > MAX_BODY) throw authError('REQUEST_TOO_LARGE', 413, 'حجم الطلب أكبر من المسموح');
  return await request.json();
}
async function sha256Text(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2,'0')).join('');
}
function base64url(bytes) {
  let s = btoa(String.fromCharCode(...new Uint8Array(bytes)));
  return s.replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function base64urlToBytes(s) {
  s = String(s || '').replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s); const bytes = new Uint8Array(bin.length);
  for (let i=0;i<bin.length;i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
function stableStringify(obj) {
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) return '[' + obj.map(stableStringify).join(',') + ']';
  return '{' + Object.keys(obj).sort().map(k => JSON.stringify(k)+':'+stableStringify(obj[k])).join(',') + '}';
}
async function hashPassword(password, salt) {
  const iterations = 100000;
  const baseKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(String(password || '')), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name:'PBKDF2', salt:new TextEncoder().encode(salt), iterations, hash:'SHA-256' }, baseKey, 256);
  return [...new Uint8Array(bits)].map(b => b.toString(16).padStart(2,'0')).join('');
}
function validatePassword(password) {
  const p = String(password || '');
  if (p.length < 10) return 'PASSWORD_TOO_SHORT';
  if (!/[A-Z]/.test(p)) return 'PASSWORD_NEEDS_UPPERCASE';
  if (!/[a-z]/.test(p)) return 'PASSWORD_NEEDS_LOWERCASE';
  if (!/[0-9]/.test(p)) return 'PASSWORD_NEEDS_DIGIT';
  return null;
}
async function audit(env, action, severity='info', details={}, actorUserId=null, targetType=null, targetId=null) {
  await env.AUTH_DB.prepare(`INSERT INTO audit_logs(id, actor_user_id, action, target_type, target_id, severity, details_json, created_at) VALUES(?,?,?,?,?,?,?,?)`)
    .bind(uuid(), actorUserId, action, targetType, targetId, severity, JSON.stringify(details || {}), nowIso()).run();
}
async function hasOwner(env) { const r = await env.AUTH_DB.prepare(`SELECT COUNT(*) AS c FROM users WHERE is_super_owner=1`).first(); return Number(r?.c || 0) > 0; }
async function getPermissions(env, userId) {
  const rows = await env.AUTH_DB.prepare(`SELECT p.key FROM users u JOIN role_permissions rp ON rp.role_id=u.role_id JOIN permissions p ON p.id=rp.permission_id WHERE u.id=? AND rp.allowed=1`).bind(userId).all();
  return (rows.results || []).map(r => r.key);
}
function publicUser(row) {
  if (!row) return null;
  return { id: row.id, username: row.username, fullName: row.full_name, email: row.email, roleId: row.role_id, roleName: row.role_name, roleDisplayName: row.role_display_name, status: row.status, validFrom: row.valid_from, validUntil: row.valid_until, maxDevices: row.max_devices, mustChangePassword: !!row.must_change_password, isSuperOwner: !!row.is_super_owner, lastLoginAt: row.last_login_at };
}
async function verifyEnvelope(env, envelope, expectedType) {
  if (!envelope || typeof envelope !== 'object') throw authError('INVALID_ENVELOPE', 400);
  const { payload, signature, alg } = envelope;
  if (!payload || !signature) throw authError('MISSING_PAYLOAD_OR_SIGNATURE', 400);
  if (expectedType && payload.type !== expectedType) throw authError('UNEXPECTED_ENVELOPE_TYPE', 400);
  if ((alg || 'RSA-PSS-SHA256') !== 'RSA-PSS-SHA256') throw authError('UNSUPPORTED_SIGNATURE_ALG', 400);
  const publicJwk = JSON.parse(env.AUTH_PUBLIC_JWK || '{}');
  if (!publicJwk.kty) throw authError('AUTH_PUBLIC_JWK_NOT_CONFIGURED', 500);
  const key = await crypto.subtle.importKey('jwk', publicJwk, { name:'RSA-PSS', hash:'SHA-256' }, false, ['verify']);
  const ok = await crypto.subtle.verify({ name:'RSA-PSS', saltLength:32 }, key, base64urlToBytes(signature), new TextEncoder().encode(stableStringify(payload)));
  if (!ok) throw authError('INVALID_SIGNATURE', 400);
  return payload;
}

async function bootstrapStatus(env) { const ownerExists = await hasOwner(env); return json({ ok:true, phase:'5.5.3', bootstrapRequired: !ownerExists, ownerExists }); }
async function createBootstrapRequest(env) {
  if (await hasOwner(env)) return json({ ok:false, error:'OWNER_ALREADY_EXISTS' }, { status:409 });
  const id = uuid(), nonce = uuid().replace(/-/g,'') + '.' + Date.now(), expires = addMinutes(30);
  await env.AUTH_DB.prepare(`INSERT INTO bootstrap_requests(id, request_nonce, status, created_at, expires_at) VALUES(?,?,?,?,?)`).bind(id, nonce, 'open', nowIso(), expires).run();
  await audit(env, 'BOOTSTRAP_REQUEST_CREATED', 'important', { requestId:id });
  return json({ ok:true, requestId:id, requestNonce:nonce, expiresAt:expires });
}
async function completeBootstrap(env, body, request) {
  if (await hasOwner(env)) return json({ ok:false, error:'OWNER_ALREADY_EXISTS' }, { status:409 });
  const payload = await verifyEnvelope(env, body.envelope, 'bootstrap_owner');
  const req = await env.AUTH_DB.prepare(`SELECT * FROM bootstrap_requests WHERE request_nonce=? AND status='open'`).bind(payload.requestNonce).first();
  if (!req) return json({ ok:false, error:'BOOTSTRAP_REQUEST_NOT_FOUND_OR_CLOSED' }, { status:400 });
  if (new Date(req.expires_at).getTime() < Date.now()) return json({ ok:false, error:'BOOTSTRAP_REQUEST_EXPIRED' }, { status:400 });
  const used = await env.AUTH_DB.prepare(`SELECT id FROM used_bootstrap_grants WHERE grant_id=?`).bind(payload.grantId).first();
  if (used) return json({ ok:false, error:'BOOTSTRAP_GRANT_ALREADY_USED' }, { status:400 });
  if (!payload.validUntil || new Date(payload.validUntil).getTime() < Date.now()) return json({ ok:false, error:'BOOTSTRAP_GRANT_EXPIRED' }, { status:400 });
  const passwordProblem = validatePassword(payload.owner.password);
  if (passwordProblem) return json({ ok:false, error: passwordProblem }, { status:400 });
  const username = normalizeUsername(payload.owner.username);
  const exists = await env.AUTH_DB.prepare(`SELECT id FROM users WHERE username=?`).bind(username).first();
  if (exists) return json({ ok:false, error:'USERNAME_EXISTS' }, { status:409 });

  const userId = uuid(), salt = uuid(), passwordHash = await hashPassword(payload.owner.password, salt);
  const licenseDbId = uuid(), payloadHash = await sha256Text(stableStringify(payload));
  await env.AUTH_DB.batch([
    env.AUTH_DB.prepare(`INSERT INTO licenses(id, license_id, license_type, issued_to, organization, valid_from, valid_until, max_users, max_devices, features_json, payload_hash, signature, status, created_at, updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .bind(licenseDbId, payload.license.licenseId, 'owner', payload.owner.fullName, payload.license.organization || '', payload.validFrom, payload.validUntil, 1, payload.license.maxDevices || 3, JSON.stringify(payload.license.features || {}), payloadHash, body.envelope.signature, 'active', nowIso(), nowIso()),
    env.AUTH_DB.prepare(`INSERT INTO users(id, username, full_name, email, password_hash, password_salt, role_id, license_id, status, valid_from, valid_until, max_devices, must_change_password, is_super_owner, created_at, approved_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .bind(userId, username, payload.owner.fullName, payload.owner.email || null, passwordHash, salt, 'role_super_owner', licenseDbId, 'active', payload.validFrom, payload.validUntil, payload.license.maxDevices || 3, 1, 1, nowIso(), nowIso()),
    env.AUTH_DB.prepare(`INSERT INTO used_bootstrap_grants(id, grant_id, payload_hash, signature, used_at, created_owner_user_id) VALUES(?,?,?,?,?,?)`)
      .bind(uuid(), payload.grantId, payloadHash, body.envelope.signature, nowIso(), userId),
    env.AUTH_DB.prepare(`UPDATE bootstrap_requests SET status='completed', completed_at=? WHERE id=?`).bind(nowIso(), req.id)
  ]);
  await audit(env, 'BOOTSTRAP_OWNER_CREATED', 'critical', { username }, userId, 'user', userId);
  return json({ ok:true, ownerCreated:true, username, mustChangePassword:true });
}
async function verifyLicenseEnvelope(env, body) {
  const payload = await verifyEnvelope(env, body.envelope, body.expectedType || undefined);
  const now = Date.now();
  if (payload.validFrom && new Date(payload.validFrom).getTime() > now) return json({ ok:false, valid:false, error:'LICENSE_NOT_YET_VALID' });
  if (payload.validUntil && new Date(payload.validUntil).getTime() < now) return json({ ok:false, valid:false, error:'LICENSE_EXPIRED' });
  const revoked = payload.license?.licenseId ? await env.AUTH_DB.prepare(`SELECT license_id FROM revoked_license_cache WHERE license_id=?`).bind(payload.license.licenseId).first() : null;
  if (revoked) return json({ ok:false, valid:false, error:'LICENSE_REVOKED' });
  return json({ ok:true, valid:true, payload });
}

async function checkUsername(env, body) {
  const username = normalizeUsername(body.username);
  if (!/^[a-zA-Z0-9_.-]{3,32}$/.test(username)) return json({ ok:false, exists:false, valid:false, error:'INVALID_USERNAME' });
  const row = await env.AUTH_DB.prepare(`SELECT id FROM users WHERE username=?`).bind(username).first();
  return json({ ok:true, exists: !!row, valid:true });
}

function cleanJudicialProfile(input) {
  const src = input && typeof input === 'object' ? input : {};
  const allowed = ['phone','judicialTitle','prosecutionOffice','parentProsecution','judicialDistrict','employeeCode','officialEmail','requestReason','requestedAccess','referenceName','verificationContact','notes','submittedAt'];
  const out = {};
  for (const key of allowed) {
    const max = key === 'notes' ? 1200 : 240;
    const value = safeStr(src[key], max);
    if (value) out[key] = value;
  }
  return out;
}

async function registerRequest(env, body, request) {
  const username = normalizeUsername(body.username);
  const fullName = safeStr(body.fullName || body.full_name, 200);
  const email = safeStr(body.email, 200) || null;
  const password = String(body.password || '');
  const judicialProfile = cleanJudicialProfile(body.judicialProfile || body.judicial_profile || {});
  const prosecutionOffice = judicialProfile.prosecutionOffice || safeStr(body.organization, 200);
  if (!fullName) return json({ ok:false, error:'FULL_NAME_REQUIRED' }, { status:400 });
  if (!/^[a-zA-Z0-9_.-]{3,32}$/.test(username)) return json({ ok:false, error:'INVALID_USERNAME' }, { status:400 });
  if (!judicialProfile.judicialTitle || !prosecutionOffice) return json({ ok:false, error:'JUDICIAL_PROFILE_REQUIRED', message:'يلزم إدخال الصفة القضائية والنيابة التابع لها لمراجعة طلب العضوية.' }, { status:400 });
  const passwordProblem = validatePassword(password);
  if (passwordProblem) return json({ ok:false, error:passwordProblem }, { status:400 });
  const exists = await env.AUTH_DB.prepare(`SELECT id FROM users WHERE username=?`).bind(username).first();
  if (exists) return json({ ok:false, error:'USERNAME_EXISTS' }, { status:409 });
  const salt = uuid(), passwordHash = await hashPassword(password, salt), userId = uuid();
  const profileJson = JSON.stringify({ ...judicialProfile, prosecutionOffice, reviewStatus:'pending_admin_review' });
  try {
    await env.AUTH_DB.prepare(`INSERT INTO users(id, username, full_name, email, password_hash, password_salt, role_id, status, valid_from, valid_until, max_devices, must_change_password, is_super_owner, judicial_profile_json, created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .bind(userId, username, fullName, email, passwordHash, salt, 'role_trial', 'pending_approval', null, null, 1, 1, 0, profileJson, nowIso()).run();
  } catch (e) {
    // Backward compatibility if the D1 migration adding judicial_profile_json has not been applied yet.
    await env.AUTH_DB.prepare(`INSERT INTO users(id, username, full_name, email, password_hash, password_salt, role_id, status, valid_from, valid_until, max_devices, must_change_password, is_super_owner, created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .bind(userId, username, fullName, email, passwordHash, salt, 'role_trial', 'pending_approval', null, null, 1, 1, 0, nowIso()).run();
  }
  await audit(env, 'REGISTER_REQUEST_CREATED', 'notice', { username, origin: request.headers.get('origin') || null, judicialProfile }, userId, 'user', userId);
  return json({ ok:true, success:true, userId, status:'pending_approval', message:'تم تسجيل طلب العضوية وهو الآن بانتظار مراجعة الإدارة والتحقق من الصفة القضائية.' });
}
async function login(env, body, request) {
  const username = normalizeUsername(body.username);
  const password = String(body.password || '');
  const deviceRaw = request.headers.get('x-device-fingerprint') || body.deviceFingerprint || `${request.headers.get('user-agent') || 'unknown'}:${username}`;
  const deviceHash = await sha256Text(deviceRaw);
  const user = await env.AUTH_DB.prepare(`SELECT u.*, r.name AS role_name, r.display_name AS role_display_name FROM users u LEFT JOIN roles r ON r.id=u.role_id WHERE u.username=?`).bind(username).first();
  if (!user) { await audit(env, 'LOGIN_FAILED', 'important', { username, reason:'not_found' }); return json({ ok:false, error:'INVALID_CREDENTIALS' }, { status:401 }); }
  if (user.status !== 'active') { await audit(env, 'LOGIN_FAILED', 'important', { username, reason:user.status }, user.id, 'user', user.id); return json({ ok:false, error:'ACCOUNT_NOT_ACTIVE', status:user.status }, { status:403 }); }
  if (user.valid_until && new Date(user.valid_until).getTime() < Date.now()) {
    await env.AUTH_DB.prepare(`UPDATE users SET status='expired' WHERE id=?`).bind(user.id).run();
    await audit(env, 'LOGIN_FAILED', 'important', { username, reason:'expired' }, user.id, 'user', user.id);
    return json({ ok:false, error:'ACCOUNT_EXPIRED' }, { status:403 });
  }
  const passwordHash = await hashPassword(password, user.password_salt);
  if (passwordHash !== user.password_hash) { await audit(env, 'LOGIN_FAILED', 'important', { username, reason:'bad_password' }, user.id, 'user', user.id); return json({ ok:false, error:'INVALID_CREDENTIALS' }, { status:401 }); }

  let device = await env.AUTH_DB.prepare(`SELECT * FROM user_devices WHERE user_id=? AND device_fingerprint_hash=?`).bind(user.id, deviceHash).first();
  if (!device) {
    const c = await env.AUTH_DB.prepare(`SELECT COUNT(*) AS c FROM user_devices WHERE user_id=? AND status='active'`).bind(user.id).first();
    if (Number(c?.c || 0) >= Number(user.max_devices || 1) && !user.is_super_owner) {
      await audit(env, 'LOGIN_DEVICE_LIMIT_BLOCKED', 'critical', { username, maxDevices:user.max_devices }, user.id, 'device', null);
      return json({ ok:false, error:'DEVICE_LIMIT_REACHED', maxDevices:user.max_devices }, { status:403 });
    }
    const deviceId = uuid();
    await env.AUTH_DB.prepare(`INSERT INTO user_devices(id, user_id, device_fingerprint_hash, device_label, status, first_seen_at, last_seen_at) VALUES(?,?,?,?,?,?,?)`)
      .bind(deviceId, user.id, deviceHash, safeStr(request.headers.get('x-device-label') || body.deviceLabel || 'جهاز غير مسمى', 120), 'active', nowIso(), nowIso()).run();
    device = { id: deviceId, status:'active' };
  } else {
    if (device.status !== 'active') return json({ ok:false, error:'DEVICE_NOT_ACTIVE', status:device.status }, { status:403 });
    await env.AUTH_DB.prepare(`UPDATE user_devices SET last_seen_at=? WHERE id=?`).bind(nowIso(), device.id).run();
  }

  const tokenBytes = new Uint8Array(32); crypto.getRandomValues(tokenBytes);
  const token = 'snd_' + base64url(tokenBytes);
  const tokenHash = await sha256Text(token);
  const sessionId = uuid();
  const expiresAt = addMinutes(Number(env.SESSION_TTL_MINUTES || DEFAULT_SESSION_TTL_MINUTES));
  await env.AUTH_DB.batch([
    env.AUTH_DB.prepare(`INSERT INTO active_sessions(id, user_id, token_hash, device_id, expires_at, created_at, last_seen_at) VALUES(?,?,?,?,?,?,?)`)
      .bind(sessionId, user.id, tokenHash, device.id, expiresAt, nowIso(), nowIso()),
    env.AUTH_DB.prepare(`UPDATE users SET last_login_at=? WHERE id=?`).bind(nowIso(), user.id)
  ]);
  const perms = await getPermissions(env, user.id);
  await audit(env, 'LOGIN_SUCCESS', 'notice', { username, deviceId:device.id, sessionId }, user.id, 'session', sessionId);
  return json({ ok:true, token, expiresAt, user: publicUser(user), permissions: perms });
}
async function requireAuth(env, request) {
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!token) throw authError('AUTH_REQUIRED', 401, 'تسجيل الدخول مطلوب');
  const tokenHash = await sha256Text(token);
  const session = await env.AUTH_DB.prepare(`SELECT s.*, u.*, r.name AS role_name, r.display_name AS role_display_name FROM active_sessions s JOIN users u ON u.id=s.user_id LEFT JOIN roles r ON r.id=u.role_id WHERE s.token_hash=? AND s.revoked_at IS NULL`).bind(tokenHash).first();
  if (!session) throw authError('INVALID_SESSION', 401);
  if (new Date(session.expires_at).getTime() < Date.now()) throw authError('SESSION_EXPIRED', 401);
  if (session.status !== 'active') throw authError('ACCOUNT_NOT_ACTIVE', 403);
  await env.AUTH_DB.prepare(`UPDATE active_sessions SET last_seen_at=? WHERE id=?`).bind(nowIso(), session.id).run();
  const permissions = await getPermissions(env, session.user_id);
  return { sessionId: session.id, userId: session.user_id, user: session, publicUser: publicUser(session), permissions };
}
async function requirePermission(ctx, key) { if (ctx.user.is_super_owner) return true; if (!ctx.permissions.includes(key)) throw authError('PERMISSION_DENIED', 403, 'ليست لديك صلاحية تنفيذ هذا الإجراء'); }
async function logout(env, ctx) { await env.AUTH_DB.prepare(`UPDATE active_sessions SET revoked_at=? WHERE id=?`).bind(nowIso(), ctx.sessionId).run(); await audit(env, 'LOGOUT', 'info', {}, ctx.userId, 'session', ctx.sessionId); return json({ ok:true }); }

async function listUsers(env) {
  const rows = await env.AUTH_DB.prepare(`SELECT u.id,u.username,u.full_name,u.email,u.status,u.valid_from,u.valid_until,u.max_devices,u.is_super_owner,u.created_at,u.approved_at,u.last_login_at,r.display_name AS role_display_name FROM users u LEFT JOIN roles r ON r.id=u.role_id ORDER BY u.created_at DESC LIMIT 500`).all();
  return json({ ok:true, users: rows.results || [] });
}
async function listPendingUsers(env) {
  try {
    const rows = await env.AUTH_DB.prepare(`SELECT id,username,full_name,email,status,created_at,judicial_profile_json FROM users WHERE status='pending_approval' ORDER BY created_at DESC LIMIT 200`).all();
    return json({ ok:true, requests: rows.results || [] });
  } catch (e) {
    const rows = await env.AUTH_DB.prepare(`SELECT id,username,full_name,email,status,created_at FROM users WHERE status='pending_approval' ORDER BY created_at DESC LIMIT 200`).all();
    return json({ ok:true, requests: rows.results || [] });
  }
}
async function listRoles(env) { const rows = await env.AUTH_DB.prepare(`SELECT * FROM roles ORDER BY level DESC`).all(); return json({ ok:true, roles: rows.results || [] }); }
async function listPermissions(env) { const rows = await env.AUTH_DB.prepare(`SELECT * FROM permissions ORDER BY category, key`).all(); return json({ ok:true, permissions: rows.results || [] }); }
async function approveUser(env, ctx, body) {
  const userId = safeStr(body.userId, 80), roleId = safeStr(body.roleId || 'role_member', 80), maxDevices = Math.max(1, Math.min(10, Number(body.maxDevices || 1)));
  const validFrom = body.validFrom || nowIso().slice(0,10);
  const validUntil = body.validUntil || new Date(Date.now() + 30*24*3600*1000).toISOString().slice(0,10);
  const target = await env.AUTH_DB.prepare(`SELECT * FROM users WHERE id=?`).bind(userId).first();
  if (!target) return json({ ok:false, error:'USER_NOT_FOUND' }, { status:404 });
  if (target.is_super_owner && !ctx.user.is_super_owner) return json({ ok:false, error:'CANNOT_MODIFY_SUPER_OWNER' }, { status:403 });
  await env.AUTH_DB.prepare(`UPDATE users SET status='active', role_id=?, valid_from=?, valid_until=?, max_devices=?, approved_at=?, approved_by=? WHERE id=?`)
    .bind(roleId, validFrom, validUntil, maxDevices, nowIso(), ctx.userId, userId).run();
  await audit(env, 'USER_APPROVED', 'important', { roleId, validFrom, validUntil, maxDevices }, ctx.userId, 'user', userId);
  return json({ ok:true });
}
async function rejectUser(env, ctx, body) {
  const userId = safeStr(body.userId, 80);
  await env.AUTH_DB.prepare(`UPDATE users SET status='rejected' WHERE id=? AND is_super_owner=0`).bind(userId).run();
  await audit(env, 'USER_REJECTED', 'important', { reason: safeStr(body.reason, 500) }, ctx.userId, 'user', userId);
  return json({ ok:true });
}
async function updateUserStatus(env, ctx, body) {
  const status = safeStr(body.status, 30);
  if (!['active','suspended','expired','blocked'].includes(status)) return json({ ok:false, error:'INVALID_STATUS' }, { status:400 });
  const userId = safeStr(body.userId, 80);
  const target = await env.AUTH_DB.prepare(`SELECT * FROM users WHERE id=?`).bind(userId).first();
  if (!target) return json({ ok:false, error:'USER_NOT_FOUND' }, { status:404 });
  if (target.is_super_owner && !ctx.user.is_super_owner) return json({ ok:false, error:'CANNOT_MODIFY_SUPER_OWNER' }, { status:403 });
  await env.AUTH_DB.prepare(`UPDATE users SET status=? WHERE id=?`).bind(status, userId).run();
  await audit(env, 'USER_STATUS_UPDATED', 'important', { status }, ctx.userId, 'user', userId);
  return json({ ok:true });
}
async function listDevices(env) {
  const rows = await env.AUTH_DB.prepare(`SELECT d.*, u.username, u.full_name FROM user_devices d JOIN users u ON u.id=d.user_id ORDER BY d.last_seen_at DESC LIMIT 500`).all();
  return json({ ok:true, devices: rows.results || [] });
}
async function updateDeviceStatus(env, ctx, body) {
  const deviceId = safeStr(body.deviceId, 80), status = safeStr(body.status, 30);
  if (!['active','suspended','replaced','revoked'].includes(status)) return json({ ok:false, error:'INVALID_STATUS' }, { status:400 });
  await env.AUTH_DB.prepare(`UPDATE user_devices SET status=? WHERE id=?`).bind(status, deviceId).run();
  await audit(env, 'DEVICE_STATUS_UPDATED', 'important', { status }, ctx.userId, 'device', deviceId);
  return json({ ok:true });
}
async function listAudit(env, url) {
  const limit = Math.max(1, Math.min(300, Number(url.searchParams.get('limit') || 100)));
  const rows = await env.AUTH_DB.prepare(`SELECT a.*, u.username AS actor_username FROM audit_logs a LEFT JOIN users u ON u.id=a.actor_user_id ORDER BY a.created_at DESC LIMIT ?`).bind(limit).all();
  return json({ ok:true, logs: rows.results || [] });
}
