// Phase 5.5.2 — Auth / Bootstrap / Digital License Foundation
// Cloudflare Worker module syntax.
// Required binding in wrangler.toml: AUTH_DB = Cloudflare D1 database
// Required env variable: AUTH_PUBLIC_JWK = RSA-PSS public JWK JSON used to verify signed bootstrap/license envelopes.
// This is the security foundation, not the full login system yet.

const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' };
const MAX_BODY = 512 * 1024;

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      if (request.method === 'OPTIONS') return cors(null, 204, env, request);

      if (url.pathname === '/api/auth/health') {
        return cors(json({ ok: true, phase: '5.5.2', service: 'auth-foundation' }), 200, env, request);
      }
      if (url.pathname === '/api/bootstrap/status' && request.method === 'GET') {
        return cors(await bootstrapStatus(env), 200, env, request);
      }
      if (url.pathname === '/api/bootstrap/request' && request.method === 'POST') {
        return cors(await createBootstrapRequest(env), 200, env, request);
      }
      if (url.pathname === '/api/bootstrap/complete' && request.method === 'POST') {
        const body = await readJson(request);
        return cors(await completeBootstrap(env, body), 200, env, request);
      }
      if (url.pathname === '/api/license/verify' && request.method === 'POST') {
        const body = await readJson(request);
        return cors(await verifyLicenseEnvelope(env, body), 200, env, request);
      }
      return cors(json({ ok: false, error: 'NOT_FOUND' }), 404, env, request);
    } catch (err) {
      return cors(json({ ok: false, error: 'SERVER_ERROR', message: String(err?.message || err) }), 500, env, request);
    }
  }
};

function json(data, init = {}) { return new Response(JSON.stringify(data, null, 2), { ...init, headers: JSON_HEADERS }); }
function cors(response, status, env, request) {
  const origin = request?.headers?.get('origin') || '';
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  const allowOrigin = allowed.includes(origin) ? origin : (allowed[0] || '*');
  const headers = new Headers(response?.headers || JSON_HEADERS);
  headers.set('access-control-allow-origin', allowOrigin);
  headers.set('vary', 'Origin');
  headers.set('access-control-allow-methods', 'GET,POST,OPTIONS');
  headers.set('access-control-allow-headers', 'content-type, authorization, x-device-fingerprint');
  if (!response) return new Response(null, { status, headers });
  return new Response(response.body, { status: response.status || status, headers });
}
async function readJson(request) {
  const len = Number(request.headers.get('content-length') || 0);
  if (len > MAX_BODY) throw new Error('REQUEST_TOO_LARGE');
  return await request.json();
}
function nowIso() { return new Date().toISOString(); }
function plusMinutes(min) { return new Date(Date.now() + min * 60000).toISOString(); }
function uuid() { return crypto.randomUUID(); }
async function sha256Text(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2,'0')).join('');
}
function base64urlToBytes(s) {
  s = String(s || '').replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s);
  const bytes = new Uint8Array(bin.length);
  for (let i=0;i<bin.length;i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
function stableStringify(obj) {
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) return '[' + obj.map(stableStringify).join(',') + ']';
  return '{' + Object.keys(obj).sort().map(k => JSON.stringify(k)+':'+stableStringify(obj[k])).join(',') + '}';
}
async function verifyEnvelope(env, envelope, expectedType) {
  if (!envelope || typeof envelope !== 'object') throw new Error('INVALID_ENVELOPE');
  const { payload, signature, alg } = envelope;
  if (!payload || !signature) throw new Error('MISSING_PAYLOAD_OR_SIGNATURE');
  if (expectedType && payload.type !== expectedType) throw new Error('UNEXPECTED_ENVELOPE_TYPE');
  if ((alg || 'RSA-PSS-SHA256') !== 'RSA-PSS-SHA256') throw new Error('UNSUPPORTED_SIGNATURE_ALG');

  const publicJwk = JSON.parse(env.AUTH_PUBLIC_JWK || '{}');
  if (!publicJwk.kty) throw new Error('AUTH_PUBLIC_JWK_NOT_CONFIGURED');
  const key = await crypto.subtle.importKey(
    'jwk', publicJwk,
    { name: 'RSA-PSS', hash: 'SHA-256' },
    false,
    ['verify']
  );
  const data = new TextEncoder().encode(stableStringify(payload));
  const sig = base64urlToBytes(signature);
  const ok = await crypto.subtle.verify({ name: 'RSA-PSS', saltLength: 32 }, key, sig, data);
  if (!ok) throw new Error('INVALID_SIGNATURE');
  return payload;
}
async function hashPassword(password, salt) {
  const baseKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name:'PBKDF2', salt:new TextEncoder().encode(salt), iterations:210000, hash:'SHA-256' }, baseKey, 256);
  return [...new Uint8Array(bits)].map(b => b.toString(16).padStart(2,'0')).join('');
}
async function audit(env, action, severity='info', details={}) {
  await env.AUTH_DB.prepare(`INSERT INTO audit_logs(id, action, severity, details_json, created_at) VALUES(?,?,?,?,?)`)
    .bind(uuid(), action, severity, JSON.stringify(details), nowIso()).run();
}
async function hasOwner(env) {
  const row = await env.AUTH_DB.prepare(`SELECT COUNT(*) AS c FROM users WHERE is_super_owner=1`).first();
  return Number(row?.c || 0) > 0;
}
async function bootstrapStatus(env) {
  const ownerExists = await hasOwner(env);
  return json({ ok: true, bootstrapRequired: !ownerExists, ownerExists, phase: '5.5.2' });
}
async function createBootstrapRequest(env) {
  if (await hasOwner(env)) return json({ ok:false, error:'OWNER_ALREADY_EXISTS' }, { status: 409 });
  const id = uuid();
  const nonce = uuid().replace(/-/g,'') + '.' + Date.now();
  await env.AUTH_DB.prepare(`INSERT INTO bootstrap_requests(id, request_nonce, status, created_at, expires_at) VALUES(?,?,?,?,?)`)
    .bind(id, nonce, 'open', nowIso(), plusMinutes(30)).run();
  await audit(env, 'BOOTSTRAP_REQUEST_CREATED', 'important', { requestId:id });
  return json({ ok:true, requestId:id, requestNonce:nonce, expiresAt:plusMinutes(30), message:'وقّع هذا الطلب بملف Bootstrap لإنشاء مالك النظام الأول.' });
}
async function completeBootstrap(env, body) {
  if (await hasOwner(env)) return json({ ok:false, error:'OWNER_ALREADY_EXISTS' }, { status: 409 });
  const payload = await verifyEnvelope(env, body.envelope, 'bootstrap_owner');
  const req = await env.AUTH_DB.prepare(`SELECT * FROM bootstrap_requests WHERE request_nonce=? AND status='open'`).bind(payload.requestNonce).first();
  if (!req) return json({ ok:false, error:'BOOTSTRAP_REQUEST_NOT_FOUND_OR_CLOSED' }, { status: 400 });
  if (new Date(req.expires_at).getTime() < Date.now()) return json({ ok:false, error:'BOOTSTRAP_REQUEST_EXPIRED' }, { status: 400 });
  const used = await env.AUTH_DB.prepare(`SELECT id FROM used_bootstrap_grants WHERE grant_id=?`).bind(payload.grantId).first();
  if (used) return json({ ok:false, error:'BOOTSTRAP_GRANT_ALREADY_USED' }, { status: 400 });
  const validUntilMs = new Date(payload.validUntil).getTime();
  if (!payload.validUntil || validUntilMs < Date.now()) return json({ ok:false, error:'BOOTSTRAP_GRANT_EXPIRED' }, { status: 400 });

  const userId = uuid();
  const salt = uuid();
  const passwordHash = await hashPassword(payload.owner.password, salt);
  const licenseDbId = uuid();
  const payloadHash = await sha256Text(stableStringify(payload));

  await env.AUTH_DB.batch([
    env.AUTH_DB.prepare(`INSERT INTO licenses(id, license_id, license_type, issued_to, organization, valid_from, valid_until, max_users, max_devices, features_json, payload_hash, signature, status, created_at, updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .bind(licenseDbId, payload.license.licenseId, 'owner', payload.owner.fullName, payload.license.organization || '', payload.validFrom, payload.validUntil, 1, payload.license.maxDevices || 3, JSON.stringify(payload.license.features || {}), payloadHash, body.envelope.signature, 'active', nowIso(), nowIso()),
    env.AUTH_DB.prepare(`INSERT INTO users(id, username, full_name, email, password_hash, password_salt, role_id, license_id, status, valid_from, valid_until, max_devices, must_change_password, is_super_owner, created_at, approved_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .bind(userId, payload.owner.username, payload.owner.fullName, payload.owner.email || null, passwordHash, salt, 'role_super_owner', licenseDbId, 'active', payload.validFrom, payload.validUntil, payload.license.maxDevices || 3, 1, 1, nowIso(), nowIso()),
    env.AUTH_DB.prepare(`INSERT INTO used_bootstrap_grants(id, grant_id, payload_hash, signature, used_at, created_owner_user_id) VALUES(?,?,?,?,?,?)`)
      .bind(uuid(), payload.grantId, payloadHash, body.envelope.signature, nowIso(), userId),
    env.AUTH_DB.prepare(`UPDATE bootstrap_requests SET status='completed', completed_at=? WHERE id=?`).bind(nowIso(), req.id)
  ]);
  await audit(env, 'BOOTSTRAP_OWNER_CREATED', 'critical', { ownerUserId:userId, username:payload.owner.username });
  return json({ ok:true, ownerCreated:true, username:payload.owner.username, mustChangePassword:true });
}
async function verifyLicenseEnvelope(env, body) {
  const payload = await verifyEnvelope(env, body.envelope, body.expectedType || undefined);
  const now = Date.now();
  if (payload.validFrom && new Date(payload.validFrom).getTime() > now) return json({ ok:false, valid:false, error:'LICENSE_NOT_YET_VALID' });
  if (payload.validUntil && new Date(payload.validUntil).getTime() < now) return json({ ok:false, valid:false, error:'LICENSE_EXPIRED' });
  const revoked = payload.license?.licenseId
    ? await env.AUTH_DB.prepare(`SELECT license_id FROM revoked_license_cache WHERE license_id=?`).bind(payload.license.licenseId).first()
    : null;
  if (revoked) return json({ ok:false, valid:false, error:'LICENSE_REVOKED' });
  return json({ ok:true, valid:true, payload });
}
