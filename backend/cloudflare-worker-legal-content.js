/**
 * Phase 5.19 — Cloudflare Worker for Legal Content Management
 * Endpoints: /health, /laws, /articles, /audit
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Id, X-User-Role'
};
function json(data, status=200){ return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type':'application/json; charset=utf-8' }}); }
async function body(req){ try{ return await req.json(); }catch(e){ return {}; } }
function isAdmin(req){ return ['owner','system_owner','admin','content_admin','manager'].includes((req.headers.get('X-User-Role')||'').toLowerCase()); }
async function audit(env, action, details, req){
  if(!env.DB) return;
  await env.DB.prepare('INSERT INTO legal_content_audit (id, action, details, user_id, created_at) VALUES (?1, ?2, ?3, ?4, datetime("now"))')
    .bind(crypto.randomUUID(), action, details || '', req.headers.get('X-User-Id') || 'anonymous').run();
}
export default {
  async fetch(req, env){
    if(req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
    const url = new URL(req.url);
    const path = url.pathname.replace(/\/$/, '') || '/';
    try{
      if(path === '/health') return json({ ok:true, service:'legal-content-manager', phase:'5.19', time:new Date().toISOString() });
      if(!env.DB) return json({ ok:false, error:'D1 binding DB is required' }, 500);

      if(path === '/laws' && req.method === 'GET'){
        const { results } = await env.DB.prepare('SELECT * FROM legal_laws WHERE deleted_at IS NULL ORDER BY updated_at DESC').all();
        return json({ ok:true, laws: results || [] });
      }
      if(path === '/laws' && req.method === 'POST'){
        if(!isAdmin(req)) return json({ ok:false, error:'forbidden' }, 403);
        const b = await body(req); const id = b.id || crypto.randomUUID();
        await env.DB.prepare('INSERT OR REPLACE INTO legal_laws (id,title,law_number,category,description,status,source,created_at,updated_at) VALUES (?1,?2,?3,?4,?5,?6,?7,COALESCE((SELECT created_at FROM legal_laws WHERE id=?1),datetime("now")),datetime("now"))')
          .bind(id,b.title||'',b.number||b.law_number||'',b.category||'',b.description||'',b.status||'draft',b.source||'cloud').run();
        await audit(env,'save_law',b.title||id,req); return json({ ok:true, id });
      }
      if(path === '/articles' && req.method === 'GET'){
        const lawId = url.searchParams.get('law_id');
        const stmt = lawId ? env.DB.prepare('SELECT * FROM legal_articles WHERE law_id=?1 AND deleted_at IS NULL ORDER BY article_number').bind(lawId) : env.DB.prepare('SELECT * FROM legal_articles WHERE deleted_at IS NULL ORDER BY updated_at DESC LIMIT 500');
        const { results } = await stmt.all(); return json({ ok:true, articles: results || [] });
      }
      if(path === '/articles' && req.method === 'POST'){
        if(!isAdmin(req)) return json({ ok:false, error:'forbidden' }, 403);
        const b = await body(req); const id = b.id || crypto.randomUUID();
        await env.DB.prepare(`INSERT OR REPLACE INTO legal_articles (id,law_id,article_number,title,official_text,practical_explanation,prosecution_points,examples,common_errors,keywords,linked_articles,status,source,created_at,updated_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,COALESCE((SELECT created_at FROM legal_articles WHERE id=?1),datetime('now')),datetime('now'))`)
          .bind(id,b.lawId||b.law_id,b.number||b.article_number||'',b.title||'',b.officialText||b.official_text||'',b.practicalExplanation||b.practical_explanation||'',b.prosecutionPoints||b.prosecution_points||'',b.examples||'',b.commonErrors||b.common_errors||'',b.keywords||'',b.linkedArticles||b.linked_articles||'',b.status||'draft',b.source||'cloud').run();
        await audit(env,'save_article',(b.number||id),req); return json({ ok:true, id });
      }
      if(path === '/audit' && req.method === 'GET'){
        const { results } = await env.DB.prepare('SELECT * FROM legal_content_audit ORDER BY created_at DESC LIMIT 300').all();
        return json({ ok:true, audit: results || [] });
      }
      return json({ ok:false, error:'not_found' }, 404);
    }catch(err){ return json({ ok:false, error: err.message }, 500); }
  }
};
