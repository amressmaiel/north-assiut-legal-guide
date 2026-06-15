/**
 * Phase 5.24 — Cloudflare Worker scaffold for platform settings.
 * No secrets are returned to frontend. Store public operational settings only.
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Id'
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    try {
      if (url.pathname === '/health') return json({ ok: true, service: 'platform-settings', phase: '5.24' }, cors);
      if (!env.DB) return json({ ok: false, error: 'D1 binding DB is not configured' }, cors, 500);
      const userId = request.headers.get('X-User-Id') || 'system';
      if (url.pathname === '/settings' && request.method === 'GET') {
        const scope = url.searchParams.get('scope') || 'global';
        const row = await env.DB.prepare('SELECT scope, settings_json, updated_at, updated_by FROM platform_settings WHERE scope = ?').bind(scope).first();
        return json({ ok: true, scope, settings: row ? JSON.parse(row.settings_json || '{}') : {}, updatedAt: row?.updated_at || null, updatedBy: row?.updated_by || null }, cors);
      }
      if (url.pathname === '/settings' && request.method === 'POST') {
        const body = await request.json();
        const scope = String(body.scope || 'global');
        const settings = body.settings && typeof body.settings === 'object' ? body.settings : {};
        const now = new Date().toISOString();
        await env.DB.prepare(`INSERT INTO platform_settings(scope, settings_json, updated_at, updated_by)
          VALUES(?,?,?,?)
          ON CONFLICT(scope) DO UPDATE SET settings_json=excluded.settings_json, updated_at=excluded.updated_at, updated_by=excluded.updated_by`)
          .bind(scope, JSON.stringify(settings), now, userId).run();
        await env.DB.prepare('INSERT INTO platform_settings_audit(id, scope, action, details_json, created_at, created_by) VALUES(?,?,?,?,?,?)')
          .bind(crypto.randomUUID(), scope, 'settings.update', JSON.stringify({ keys: Object.keys(settings) }), now, userId).run();
        return json({ ok: true, scope, updatedAt: now }, cors);
      }
      if (url.pathname === '/audit' && request.method === 'GET') {
        const scope = url.searchParams.get('scope') || 'global';
        const rows = await env.DB.prepare('SELECT * FROM platform_settings_audit WHERE scope = ? ORDER BY created_at DESC LIMIT 100').bind(scope).all();
        return json({ ok: true, items: rows.results || [] }, cors);
      }
      return json({ ok: false, error: 'Not found' }, cors, 404);
    } catch (err) {
      return json({ ok: false, error: err.message || 'Unexpected error' }, cors, 500);
    }
  }
};
function json(data, cors, status = 200) {
  return new Response(JSON.stringify(data, null, 2), { status, headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' } });
}
