/* Phase 5.17 — Minimal Cloudflare Worker for case files sync.
   Bind D1 database as CASE_FILES_DB before production use. */
const json = (data, status=200) => new Response(JSON.stringify(data), {status, headers:{'content-type':'application/json; charset=utf-8','access-control-allow-origin':'*','access-control-allow-methods':'GET,POST,OPTIONS','access-control-allow-headers':'content-type,authorization'}});
function uid(req){ return req.headers.get('x-user-id') || 'local-user'; }
export default {
  async fetch(req, env){
    if(req.method === 'OPTIONS') return json({ok:true});
    const url = new URL(req.url);
    if(!env.CASE_FILES_DB) return json({ok:false,error:'CASE_FILES_DB binding is not configured'}, 500);
    const userId = uid(req);
    if(url.pathname === '/case-files' && req.method === 'GET'){
      const rows = await env.CASE_FILES_DB.prepare('SELECT * FROM case_files WHERE owner_user_id=? ORDER BY updated_at DESC LIMIT 500').bind(userId).all();
      return json({ok:true, files: rows.results || []});
    }
    if(url.pathname === '/case-files/upsert' && req.method === 'POST'){
      const file = await req.json(); const now = new Date().toISOString();
      await env.CASE_FILES_DB.prepare(`INSERT INTO case_files(id,owner_user_id,title,case_number,case_year,prosecution_name,incident_type,status,priority,facts_summary,original_facts,closest_charge,archived,created_at,updated_at)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        ON CONFLICT(id) DO UPDATE SET title=excluded.title,case_number=excluded.case_number,case_year=excluded.case_year,prosecution_name=excluded.prosecution_name,incident_type=excluded.incident_type,status=excluded.status,priority=excluded.priority,facts_summary=excluded.facts_summary,original_facts=excluded.original_facts,closest_charge=excluded.closest_charge,archived=excluded.archived,updated_at=excluded.updated_at`)
        .bind(file.id, userId, file.title||'ملف واقعة', file.caseNumber||'', file.caseYear||'', file.prosecutionName||'', file.incidentType||'أخرى', file.status||'studying', file.priority||'normal', file.factsSummary||'', file.originalFacts||'', file.closestCharge||'', file.archived?1:0, file.createdAt||now, now).run();
      return json({ok:true,id:file.id,updatedAt:now});
    }
    return json({ok:false,error:'Not found'},404);
  }
};
