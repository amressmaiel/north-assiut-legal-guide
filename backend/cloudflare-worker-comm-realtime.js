/**
 * Cloudflare Worker — Sand Secure Communication Realtime API
 * Phase 5.16.2
 *
 * Bindings expected:
 *   DB: Cloudflare D1 database
 * Optional env:
 *   COMM_SHARED_SECRET: shared secret used as Bearer token
 *   ALLOWED_ORIGIN: comma separated origins, or * for development
 */
function json(data,status=200,headers={}){
  return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8',...corsHeaders(),...headers}});
}
function corsHeaders(){ return {'access-control-allow-origin':'*','access-control-allow-methods':'GET,POST,OPTIONS','access-control-allow-headers':'content-type,authorization,x-sand-device,x-sand-workspace'}; }
function safeText(v,max=200000){ const s=typeof v==='string'?v:JSON.stringify(v??null); return s.length>max?s.slice(0,max):s; }
function now(){ return new Date().toISOString(); }
function id(){ return `srv_${Date.now()}_${crypto.randomUUID()}`; }
async function body(req){ try{return await req.json();}catch{return {};}}
function workspace(req,payload){ return String(payload.workspace||req.headers.get('x-sand-workspace')||'default').slice(0,80); }
function device(req,payload){ return String(payload.deviceId||req.headers.get('x-sand-device')||'unknown').slice(0,120); }
async function requireAuth(req,env){
  if(!env.COMM_SHARED_SECRET) return true;
  const h=req.headers.get('authorization')||'';
  const token=h.replace(/^Bearer\s+/i,'').trim();
  return token && token===env.COMM_SHARED_SECRET;
}
async function ensureSchema(env){
  // Safe lightweight auto-init; production can run SQL migration instead.
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS comm_events (
    id TEXT PRIMARY KEY,
    workspace TEXT NOT NULL,
    key TEXT NOT NULL,
    user_id TEXT,
    user_name TEXT,
    device_id TEXT,
    reason TEXT,
    value_json TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_comm_events_workspace_created ON comm_events(workspace, created_at)`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS comm_snapshots (
    workspace TEXT NOT NULL,
    key TEXT NOT NULL,
    value_json TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    updated_by TEXT,
    device_id TEXT,
    PRIMARY KEY(workspace,key)
  )`).run();
}
async function handlePing(req,env){
  const ok=await requireAuth(req,env); if(!ok) return json({ok:false,error:'unauthorized'},401);
  await ensureSchema(env);
  return json({ok:true,name:'Sand Communication Realtime Worker',phase:'5.16.2',serverTime:now()});
}
function mergeArrays(a,b){
  const map=new Map();
  for(const x of Array.isArray(a)?a:[]) if(x&&x.id) map.set(String(x.id),x);
  for(const x of Array.isArray(b)?b:[]) if(x&&x.id){
    const old=map.get(String(x.id));
    const oldT=Date.parse(old?.updatedAt||old?.respondedAt||old?.at||old?.createdAt||0)||0;
    const newT=Date.parse(x.updatedAt||x.respondedAt||x.at||x.createdAt||0)||0;
    if(!old || newT>=oldT) map.set(String(x.id),Object.assign({},old||{},x));
  }
  return Array.from(map.values());
}
function mergeValues(oldValue,newValue){
  if(Array.isArray(oldValue)||Array.isArray(newValue)) return mergeArrays(oldValue,newValue);
  return Object.assign({}, oldValue||{}, newValue||{});
}
async function upsertSnapshot(env,ws,key,incoming,userId,dev){
  const row=await env.DB.prepare('SELECT value_json FROM comm_snapshots WHERE workspace=? AND key=?').bind(ws,key).first();
  let merged=incoming;
  if(row){ try{ merged=mergeValues(JSON.parse(row.value_json||'null'),incoming); }catch{} }
  await env.DB.prepare(`INSERT INTO comm_snapshots(workspace,key,value_json,updated_at,updated_by,device_id)
    VALUES(?,?,?,?,?,?)
    ON CONFLICT(workspace,key) DO UPDATE SET value_json=excluded.value_json,updated_at=excluded.updated_at,updated_by=excluded.updated_by,device_id=excluded.device_id`)
    .bind(ws,key,safeText(merged),now(),String(userId||''),String(dev||'')).run();
}
async function handleSync(req,env){
  const ok=await requireAuth(req,env); if(!ok) return json({ok:false,error:'unauthorized'},401);
  await ensureSchema(env);
  const p=await body(req); const ws=workspace(req,p); const dev=device(req,p); const userId=String(p.userId||'anonymous').slice(0,160); const userName=String(p.userName||'').slice(0,200); const since=String(p.since||'1970-01-01T00:00:00.000Z');
  const incoming=Array.isArray(p.outbox)?p.outbox:[];
  for(const ev of incoming){
    if(!ev || !ev.key) continue;
    const evId=String(ev.id||id()).slice(0,180);
    const key=String(ev.key).slice(0,120);
    const value=ev.value ?? null;
    await env.DB.prepare('INSERT OR IGNORE INTO comm_events(id,workspace,key,user_id,user_name,device_id,reason,value_json,created_at) VALUES(?,?,?,?,?,?,?,?,?)')
      .bind(evId,ws,key,userId,userName,dev,String(ev.reason||'client-change').slice(0,80),safeText(value),String(ev.at||now())).run();
    await upsertSnapshot(env,ws,key,value,userId,dev);
  }
  // Full snapshots from client help bootstrap/repair newly deployed servers.
  if(p.snapshots && typeof p.snapshots==='object'){
    for(const [key,value] of Object.entries(p.snapshots)){
      await upsertSnapshot(env,ws,String(key).slice(0,120),value,userId,dev);
    }
  }
  const rows=await env.DB.prepare('SELECT id,workspace,key,user_id,user_name,device_id,reason,value_json,created_at FROM comm_events WHERE workspace=? AND created_at>? ORDER BY created_at ASC LIMIT 250')
    .bind(ws,since).all();
  const events=(rows.results||[]).map(r=>({id:r.id,workspace:r.workspace,key:r.key,userId:r.user_id,userName:r.user_name,deviceId:r.device_id,reason:r.reason,value:JSON.parse(r.value_json||'null'),at:r.created_at}));
  const snapRows=await env.DB.prepare('SELECT key,value_json,updated_at FROM comm_snapshots WHERE workspace=?').bind(ws).all();
  const snapshots={};
  for(const r of (snapRows.results||[])){ try{ snapshots[r.key]=JSON.parse(r.value_json||'null'); }catch{ snapshots[r.key]=null; } }
  return json({ok:true,serverTime:now(),events,snapshots});
}
export default {
  async fetch(req,env){
    if(req.method==='OPTIONS') return new Response(null,{headers:corsHeaders()});
    const url=new URL(req.url);
    try{
      if(url.pathname.endsWith('/comm/ping')) return handlePing(req,env);
      if(url.pathname.endsWith('/comm/sync')) return handleSync(req,env);
      return json({ok:false,error:'not_found',phase:'5.16.2'},404);
    }catch(err){
      return json({ok:false,error:String(err?.message||err)},500);
    }
  }
};
