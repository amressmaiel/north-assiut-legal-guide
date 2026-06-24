/**
 * Phase 5.20 — Institutional Reports Worker Stub
 * Receives lightweight institutional report snapshots and returns aggregated summaries.
 * Bindings expected later: REPORTS_DB (D1)
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization'
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    try {
      if (url.pathname === '/health') {
        return json({ ok: true, service: 'institutional-reports', phase: '5.20', at: new Date().toISOString() }, cors);
      }
      if (url.pathname === '/reports/snapshot' && request.method === 'POST') {
        const body = await request.json();
        const id = crypto.randomUUID();
        if (env.REPORTS_DB) {
          await env.REPORTS_DB.prepare(
            'INSERT INTO report_snapshots (id, owner_user_id, payload_json, created_at) VALUES (?, ?, ?, ?)'
          ).bind(id, body.ownerUserId || 'local-admin', JSON.stringify(body), new Date().toISOString()).run();
        }
        return json({ ok: true, id }, cors);
      }
      if (url.pathname === '/reports/snapshots' && request.method === 'GET') {
        if (!env.REPORTS_DB) return json({ ok: true, items: [], mode: 'no-db-binding' }, cors);
        const rows = await env.REPORTS_DB.prepare('SELECT id, owner_user_id, created_at FROM report_snapshots ORDER BY created_at DESC LIMIT 100').all();
        return json({ ok: true, items: rows.results || [] }, cors);
      }
      return json({ ok: false, error: 'not_found' }, cors, 404);
    } catch (err) {
      return json({ ok: false, error: err.message || String(err) }, cors, 500);
    }
  }
};
function json(data, cors, status = 200) {
  return new Response(JSON.stringify(data, null, 2), { status, headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' } });
}
