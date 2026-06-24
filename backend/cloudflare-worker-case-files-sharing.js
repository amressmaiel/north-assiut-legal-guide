/**
 * Phase 5.18 — Cloudflare Worker skeleton for secure case-file sharing.
 * Intended to be mounted beside the Phase 5.17 case-files Worker.
 * Requires D1 binding: DB
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const headers = {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,POST,OPTIONS',
      'access-control-allow-headers': 'content-type,authorization,x-user-id'
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers });

    const userId = request.headers.get('x-user-id') || 'anonymous';
    try {
      if (url.pathname === '/case-files/shares/list') {
        const fileId = url.searchParams.get('file_id');
        if (!fileId) return json({ ok:false, error:'file_id required' }, headers, 400);
        const rows = await env.DB.prepare('SELECT * FROM case_file_shares WHERE file_id = ? ORDER BY created_at DESC').bind(fileId).all();
        return json({ ok:true, rows: rows.results || [] }, headers);
      }

      if (url.pathname === '/case-files/shares/create' && request.method === 'POST') {
        const body = await request.json();
        const id = body.id || crypto.randomUUID();
        await env.DB.prepare(`INSERT INTO case_file_shares
          (id,file_id,from_user_id,to_user_id,permission,message,status,created_at,expires_at)
          VALUES (?,?,?,?,?,?,?,?,?)`).bind(
          id, body.file_id, userId, body.to_user_id, body.permission || 'read', body.message || '',
          'active', new Date().toISOString(), body.expires_at || null
        ).run();
        return json({ ok:true, id }, headers);
      }

      if (url.pathname === '/case-files/shares/revoke' && request.method === 'POST') {
        const body = await request.json();
        await env.DB.prepare('UPDATE case_file_shares SET status = ?, revoked_at = ? WHERE id = ? AND from_user_id = ?')
          .bind('revoked', new Date().toISOString(), body.id, userId).run();
        return json({ ok:true }, headers);
      }

      if (url.pathname === '/case-files/reviews/create' && request.method === 'POST') {
        const body = await request.json();
        const id = body.id || crypto.randomUUID();
        await env.DB.prepare(`INSERT INTO case_file_reviews
          (id,file_id,reviewer_user_id,reviewer_name,review_text,status,created_at)
          VALUES (?,?,?,?,?,?,?)`).bind(
          id, body.file_id, userId, body.reviewer_name || '', body.review_text || '', 'pending', new Date().toISOString()
        ).run();
        return json({ ok:true, id }, headers);
      }

      return json({ ok:false, error:'Not found' }, headers, 404);
    } catch (err) {
      return json({ ok:false, error:String(err && err.message || err) }, headers, 500);
    }
  }
};

function json(payload, headers, status=200){ return new Response(JSON.stringify(payload), { status, headers }); }
