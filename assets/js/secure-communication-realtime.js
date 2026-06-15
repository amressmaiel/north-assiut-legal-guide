/**
 * secure-communication-realtime.js — Phase 5.16.2
 * تحويل مركز التواصل القضائي من Local-first إلى Realtime-ready عبر Worker/Backend.
 * يعمل بدون سيرفر كنسخة محلية، وعند ضبط رابط Worker يزامن الرسائل والطلبات والمجموعات بين الأجهزة.
 */
(function(){
  const CONFIG_KEY='sand_comm_realtime_config_v1';
  const DEVICE_KEY='sand_comm_device_id_v1';
  const LAST_SYNC_KEY='sand_comm_last_sync_v1';
  const OUTBOX_KEY='sand_comm_realtime_outbox_v1';
  const LOCK_KEY='sand_comm_realtime_lock_v1';
  const WATCHED_KEYS=[
    'sand_comm_messages_v1',
    'sand_comm_requests_v1',
    'sand_comm_connections_v1',
    'sand_comm_groups_v1',
    'sand_comm_blocks_v1',
    'sand_comm_audit_v1',
    'sand_comm_privacy_v1'
  ];
  const KEY_LABELS={
    sand_comm_messages_v1:'الرسائل',
    sand_comm_requests_v1:'طلبات التواصل',
    sand_comm_connections_v1:'الزملاء الموثوقون',
    sand_comm_groups_v1:'المجموعات والقنوات',
    sand_comm_blocks_v1:'الحظر',
    sand_comm_audit_v1:'سجل التدقيق',
    sand_comm_privacy_v1:'إعدادات الخصوصية'
  };

  function esc(v){ return typeof window.esc==='function' ? window.esc(v) : String(v??'').replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[m])); }
  function readJson(k,f){ try{ const v=JSON.parse(localStorage.getItem(k)||'null'); return v??f; }catch{ return f; } }
  function writeJson(k,v){ localStorage.setItem(k,JSON.stringify(v)); }
  function arr(v){ return Array.isArray(v)?v:[]; }
  function now(){ return new Date().toISOString(); }
  function id(p='rt'){ return `${p}_${Date.now()}_${Math.random().toString(16).slice(2,9)}`; }
  function toast(msg){ if(window.showToast) window.showToast(msg); else console.log(msg); }
  function currentUser(){ return window.SandAuthApi?.currentUser?.() || null; }
  function uid(){ const u=currentUser(); return String(u?.id||u?.userId||u?.email||u?.username||'local_owner'); }
  function userName(){ const u=currentUser(); return u?(u.fullName||u.full_name||u.name||u.username||'مستخدم المنصة'):'مالك النظام المحلي'; }
  function canAdmin(){ const u=currentUser(); return !!(u&&(u.isSuperOwner||u.is_super_owner||u.role==='owner'||u.role==='super_owner')) || !!window.SandAuthApi?.hasPermission?.('chat.admin'); }
  function deviceId(){ let d=localStorage.getItem(DEVICE_KEY); if(!d){ d=`sand-device-${Date.now()}-${Math.random().toString(16).slice(2,10)}`; localStorage.setItem(DEVICE_KEY,d); } return d; }
  function config(){ return Object.assign({enabled:false,mode:'poll',endpoint:'',pollSeconds:8,token:'',workspace:'north-assiut-legal-guide',allowRemoteMembers:true,debug:false}, readJson(CONFIG_KEY,{})); }
  function saveConfig(c){ writeJson(CONFIG_KEY,Object.assign(config(),c||{})); }
  function outbox(){ return arr(readJson(OUTBOX_KEY,[])); }
  function saveOutbox(v){ writeJson(OUTBOX_KEY,arr(v).slice(-600)); }
  function lastSync(){ return localStorage.getItem(LAST_SYNC_KEY)||'1970-01-01T00:00:00.000Z'; }
  function setLastSync(v){ localStorage.setItem(LAST_SYNC_KEY,v||now()); }

  function addStyles(){
    if(document.getElementById('sandCommRealtimeStyles')) return;
    document.head.insertAdjacentHTML('beforeend',`<style id="sandCommRealtimeStyles">
      .comm-realtime-strip{display:flex;align-items:center;justify-content:space-between;gap:12px;border:1px solid rgba(218,176,83,.24);background:linear-gradient(135deg,rgba(218,176,83,.12),rgba(0,0,0,.18));border-radius:18px;padding:12px;margin-top:12px;color:#f6e7bd;flex-wrap:wrap}.comm-rt-status{display:inline-flex;align-items:center;gap:8px;border:1px solid rgba(255,255,255,.14);background:rgba(0,0,0,.28);border-radius:999px;padding:7px 11px;font-weight:800}.comm-rt-dot{width:10px;height:10px;border-radius:50%;background:#888;box-shadow:0 0 0 4px rgba(255,255,255,.06)}.comm-rt-status.online .comm-rt-dot{background:#4ade80;box-shadow:0 0 0 4px rgba(74,222,128,.15)}.comm-rt-status.syncing .comm-rt-dot{background:#facc15;box-shadow:0 0 0 4px rgba(250,204,21,.15)}.comm-rt-status.offline .comm-rt-dot{background:#fb7185;box-shadow:0 0 0 4px rgba(251,113,133,.15)}.comm-rt-btn{border:1px solid rgba(218,176,83,.36);background:rgba(20,17,10,.9);color:#f5d78d;border-radius:999px;padding:8px 12px;cursor:pointer;font-family:Cairo}.comm-rt-btn.gold{background:linear-gradient(135deg,#d9ad46,#7a5315);color:#111;font-weight:900}.comm-rt-modal-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.comm-rt-field{display:flex;flex-direction:column;gap:6px}.comm-rt-field label{color:#f4d58a;font-weight:800}.comm-rt-field input,.comm-rt-field select{border:1px solid rgba(218,176,83,.22);background:#0c0c0c;color:#fff;border-radius:14px;padding:11px;font-family:Cairo}.comm-rt-note{border:1px solid rgba(218,176,83,.18);background:rgba(218,176,83,.08);border-radius:16px;padding:12px;color:#ead9b2;line-height:1.8}.comm-rt-log{max-height:180px;overflow:auto;background:#070707;border-radius:14px;border:1px solid rgba(255,255,255,.08);padding:8px}.comm-rt-log div{padding:6px;border-bottom:1px solid rgba(255,255,255,.06);color:#ddd;font-size:12px}.comm-message-tools{display:flex;gap:6px;margin-top:7px;flex-wrap:wrap}.comm-pinned-badge{display:inline-flex;border:1px solid rgba(218,176,83,.34);color:#f7d884;border-radius:999px;padding:3px 7px;font-size:11px;margin-inline-start:6px}.comm-attachment-pill{display:inline-flex;align-items:center;gap:6px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);padding:5px 8px;border-radius:999px;color:#f5dca0;font-size:12px;margin-top:5px}.comm-read-confirm{display:inline-flex;align-items:center;gap:5px;color:#a7f3d0;font-size:11px;margin-top:4px}
      @media(max-width:900px){.comm-rt-modal-grid{grid-template-columns:1fr}}
    </style>`);
  }

  function status(kind,msg){
    window.__sandCommRtStatus={kind:kind||'local',msg:msg||'محلي فقط',at:now()};
    document.querySelectorAll('[data-comm-rt-status]').forEach(el=>{ el.className=`comm-rt-status ${kind||''}`; el.innerHTML=`<span class="comm-rt-dot"></span><span>${esc(msg||'محلي فقط')}</span>`; });
  }
  function notify(n){ try{ window.SandNotifications?.create?.(Object.assign({category:'system',priority:'normal',source:'secure-communication-realtime',fingerprint:`comm-rt-${Date.now()}-${Math.random()}`},n||{})); }catch{} }

  function enqueue(key, value, reason){
    const cfg=config();
    if(!WATCHED_KEYS.includes(key)) return;
    const item={id:id('evt'),workspace:cfg.workspace,userId:uid(),userName:userName(),deviceId:deviceId(),key,reason:reason||'local-change',value,at:now()};
    const q=outbox(); q.push(item); saveOutbox(q);
    if(cfg.enabled) scheduleSync(700);
  }

  const originalSetItem=Storage.prototype.setItem;
  if(!window.__sandCommRealtimeStoragePatched){
    Storage.prototype.setItem=function(k,v){
      const before=this.getItem(k);
      originalSetItem.apply(this,arguments);
      if(this===localStorage && WATCHED_KEYS.includes(k) && before!==v && !window.__sandCommApplyingRemote){
        try{ enqueue(k, JSON.parse(v||'null'), 'storage-change'); }catch{ enqueue(k, v, 'storage-change'); }
      }
    };
    window.__sandCommRealtimeStoragePatched=true;
  }

  function endpoint(path){ const ep=String(config().endpoint||'').trim().replace(/\/+$/,''); return ep ? `${ep}${path}` : ''; }
  async function api(path,body){
    const cfg=config();
    const url=endpoint(path);
    if(!url) throw new Error('لم يتم ضبط رابط Worker الخاص بالتواصل.');
    const headers={'Content-Type':'application/json','X-Sand-Device':deviceId(),'X-Sand-Workspace':cfg.workspace};
    if(cfg.token) headers['Authorization']=`Bearer ${cfg.token}`;
    const res=await fetch(url,{method:'POST',headers,body:JSON.stringify(body||{}),cache:'no-store'});
    if(!res.ok) throw new Error(`Communication API ${res.status}`);
    return res.json();
  }

  function mergeValue(key, remoteValue){
    if(remoteValue==null) return;
    const local=readJson(key, Array.isArray(remoteValue)?[]:{});
    let merged;
    if(Array.isArray(local) || Array.isArray(remoteValue)){
      const map=new Map();
      arr(local).forEach(x=>{ if(x&&x.id) map.set(String(x.id),x); });
      arr(remoteValue).forEach(x=>{
        if(!x||!x.id) return;
        const old=map.get(String(x.id));
        const oldTime=Date.parse(old?.updatedAt||old?.respondedAt||old?.at||old?.createdAt||0)||0;
        const newTime=Date.parse(x.updatedAt||x.respondedAt||x.at||x.createdAt||0)||0;
        if(!old || newTime>=oldTime) map.set(String(x.id),Object.assign({},old||{},x));
      });
      merged=Array.from(map.values()).sort((a,b)=>(Date.parse(b.at||b.createdAt||b.updatedAt||0)||0)-(Date.parse(a.at||a.createdAt||a.updatedAt||0)||0));
    }else{
      merged=Object.assign({}, local||{}, remoteValue||{});
    }
    window.__sandCommApplyingRemote=true;
    try{ writeJson(key, merged); }finally{ window.__sandCommApplyingRemote=false; }
  }

  async function syncNow(manual){
    const cfg=config();
    if(!cfg.enabled){ status('','محلي فقط — فعّل الربط الحقيقي من الإعدادات'); return false; }
    if(!cfg.endpoint){ status('offline','لم يتم ضبط رابط Worker'); return false; }
    const lock=Number(localStorage.getItem(LOCK_KEY)||0);
    if(Date.now()-lock<4000 && !manual) return false;
    localStorage.setItem(LOCK_KEY,String(Date.now()));
    status('syncing','جارِ مزامنة مركز التواصل…');
    const q=outbox();
    const snapshots={};
    WATCHED_KEYS.forEach(k=>{ snapshots[k]=readJson(k, k==='sand_comm_privacy_v1'?{}:[]); });
    try{
      const payload={workspace:cfg.workspace,userId:uid(),userName:userName(),deviceId:deviceId(),since:lastSync(),outbox:q.slice(-100),snapshots};
      const data=await api('/comm/sync',payload);
      arr(data.events).forEach(ev=>{ if(ev.deviceId!==deviceId() && ev.key) mergeValue(ev.key, ev.value); });
      if(data.snapshots){ Object.keys(data.snapshots).forEach(k=>{ if(WATCHED_KEYS.includes(k)) mergeValue(k,data.snapshots[k]); }); }
      saveOutbox([]);
      setLastSync(data.serverTime||now());
      status('online',`متصل — آخر مزامنة ${new Date().toLocaleTimeString('ar-EG-u-nu-arab',{hour:'2-digit',minute:'2-digit'})}`);
      if(manual) toast('تمت مزامنة مركز التواصل بنجاح.');
      if(window.__sandCommLastTab && typeof window.openSecureCommunicationCenter==='function') setTimeout(()=>decorate(),250);
      return true;
    }catch(err){
      console.warn('[SandCommRealtime]',err);
      status('offline','تعذر الاتصال — يعمل محليًا مؤقتًا');
      if(manual) toast('تعذر الاتصال بخدمة التواصل الحقيقي. راجع رابط Worker أو الصلاحيات.');
      return false;
    }finally{ localStorage.removeItem(LOCK_KEY); }
  }

  let timer=null;
  function scheduleSync(ms){ clearTimeout(timer); timer=setTimeout(()=>syncNow(false),ms||1000); }
  function startLoop(){
    const cfg=config();
    clearInterval(window.__sandCommRtInterval);
    if(cfg.enabled){
      window.__sandCommRtInterval=setInterval(()=>syncNow(false),Math.max(4,Number(cfg.pollSeconds)||8)*1000);
      scheduleSync(1200);
    }else status('','محلي فقط');
  }

  function renderRealtimeStrip(){
    const cfg=config(); const s=window.__sandCommRtStatus||{};
    return `<div class="comm-realtime-strip" id="commRealtimeStrip"><div><b>🌐 الاتصال الحقيقي بين الأجهزة</b><div style="font-size:12px;color:#d8c79d">${cfg.enabled?'المزامنة مفعّلة عبر Worker عند توفر الاتصال.':'الوضع الحالي محلي؛ فعّل Worker ليصبح التواصل حقيقيًا بين الأعضاء.'}</div></div><span data-comm-rt-status class="comm-rt-status ${esc(s.kind||'')}"><span class="comm-rt-dot"></span><span>${esc(s.msg||'محلي فقط')}</span></span><div style="display:flex;gap:7px;flex-wrap:wrap"><button class="comm-rt-btn gold" onclick="SandCommRealtime.openSettings()">إعداد الربط</button><button class="comm-rt-btn" onclick="SandCommRealtime.syncNow(true)">مزامنة الآن</button></div></div>`;
  }

  function decorate(){
    addStyles();
    const shell=document.querySelector('.comm-shell');
    if(shell && !document.getElementById('commRealtimeStrip')){
      const hero=shell.querySelector('.comm-hero');
      (hero||shell).insertAdjacentHTML(hero?'afterend':'afterbegin',renderRealtimeStrip());
    }
    decorateMessages();
    const s=window.__sandCommRtStatus||{}; status(s.kind||'',s.msg||'محلي فقط');
  }

  const originalOpen=window.openSecureCommunicationCenter;
  function patchOpen(){
    if(!originalOpen || originalOpen.__rtPatched) return;
    window.openSecureCommunicationCenter=function(active){ const r=originalOpen.apply(this,arguments); setTimeout(decorate,80); return r; };
    window.openSecureCommunicationCenter.__rtPatched=true;
  }

  function openSettings(){
    addStyles();
    const cfg=config();
    const html=`<div class="review-modal-backdrop" onclick="this.remove()"><div class="review-modal" style="max-width:920px" onclick="event.stopPropagation()"><button class="review-modal-close" onclick="this.closest('.review-modal-backdrop').remove()">×</button><span class="institutional-kicker">🌐 مركز التواصل الحقيقي</span><h3>إعداد المزامنة بين الأجهزة</h3><div class="comm-rt-note">هذه الطبقة تجعل مركز التواصل يعمل بين أجهزة مختلفة عند نشر Worker التواصل وربطه بالمنصة. بدون الرابط يظل النظام محليًا كاحتياطي آمن.</div><div class="comm-rt-modal-grid" style="margin-top:12px"><div class="comm-rt-field"><label>تفعيل التواصل الحقيقي</label><select id="commRtEnabled"><option value="false" ${!cfg.enabled?'selected':''}>غير مفعّل — محلي فقط</option><option value="true" ${cfg.enabled?'selected':''}>مفعّل عبر Worker</option></select></div><div class="comm-rt-field"><label>Workspace / نطاق المنصة</label><input id="commRtWorkspace" value="${esc(cfg.workspace)}" placeholder="north-assiut-legal-guide"></div><div class="comm-rt-field" style="grid-column:1/-1"><label>رابط Worker الخاص بالتواصل</label><input id="commRtEndpoint" value="${esc(cfg.endpoint)}" placeholder="https://your-worker.your-subdomain.workers.dev"></div><div class="comm-rt-field"><label>مفتاح الربط الاختياري</label><input id="commRtToken" value="${esc(cfg.token)}" placeholder="Bearer token / shared secret"></div><div class="comm-rt-field"><label>معدل المزامنة</label><select id="commRtPoll"><option value="5" ${Number(cfg.pollSeconds)===5?'selected':''}>كل ٥ ثوانٍ</option><option value="8" ${Number(cfg.pollSeconds)===8?'selected':''}>كل ٨ ثوانٍ</option><option value="15" ${Number(cfg.pollSeconds)===15?'selected':''}>كل ١٥ ثانية</option><option value="30" ${Number(cfg.pollSeconds)===30?'selected':''}>كل ٣٠ ثانية</option></select></div></div><div class="comm-rt-note" style="margin-top:12px"><b>ما الذي تتم مزامنته؟</b><br>${WATCHED_KEYS.map(k=>`• ${KEY_LABELS[k]||k}`).join('<br>')}</div><div class="comm-actions"><button class="comm-btn gold" onclick="SandCommRealtime.saveSettingsFromModal()">حفظ وتفعيل</button><button class="comm-btn" onclick="SandCommRealtime.testConnection()">اختبار الاتصال</button><button class="comm-btn" onclick="SandCommRealtime.syncNow(true)">مزامنة الآن</button><button class="comm-btn red" onclick="SandCommRealtime.disable()">إيقاف الربط</button></div><h4 style="color:#f5d58a">آخر حالة</h4><div class="comm-rt-log" id="commRtLog"><div>${esc((window.__sandCommRtStatus||{}).msg||'لم يتم الاختبار بعد')}</div><div>Device: ${esc(deviceId())}</div><div>Last sync: ${esc(lastSync())}</div><div>Outbox: ${outbox().length}</div></div></div></div>`;
    document.body.insertAdjacentHTML('beforeend',html);
  }

  function saveSettingsFromModal(){
    const enabled=document.getElementById('commRtEnabled')?.value==='true';
    const endpointVal=String(document.getElementById('commRtEndpoint')?.value||'').trim();
    const workspace=String(document.getElementById('commRtWorkspace')?.value||'north-assiut-legal-guide').trim();
    const token=String(document.getElementById('commRtToken')?.value||'').trim();
    const pollSeconds=Number(document.getElementById('commRtPoll')?.value||8);
    saveConfig({enabled,endpoint:endpointVal,workspace,token,pollSeconds});
    startLoop(); decorate(); toast(enabled?'تم تفعيل طبقة التواصل الحقيقي.':'تم حفظ الإعدادات في الوضع المحلي.');
  }
  async function testConnection(){
    saveSettingsFromModal();
    try{ status('syncing','جارِ اختبار Worker…'); const data=await api('/comm/ping',{workspace:config().workspace,userId:uid(),deviceId:deviceId()}); status('online',`متصل — ${data.name||'Communication Worker'}`); toast('تم الاتصال بخدمة التواصل الحقيقي بنجاح.'); }
    catch(e){ status('offline','فشل اختبار الاتصال'); toast('فشل الاتصال بخدمة التواصل.'); }
  }
  function disable(){ saveConfig({enabled:false}); startLoop(); decorate(); toast('تم إيقاف الربط الحقيقي، والعودة للوضع المحلي.'); }

  // Phase 5.16.2 advanced message controls: pin, read receipt, simple attachment metadata.
  function getMessages(){ return arr(readJson('sand_comm_messages_v1',[])); }
  function setMessages(v){ writeJson('sand_comm_messages_v1',v); }
  function updateMessage(mid,patch){ const ms=getMessages().map(m=>m.id===mid?Object.assign({},m,patch,{updatedAt:now()}):m); setMessages(ms); }
  function pinMessage(mid){ updateMessage(mid,{pinned:true,pinnedBy:uid(),pinnedAt:now()}); toast('تم تثبيت الرسالة.'); rerenderInbox(); }
  function unpinMessage(mid){ updateMessage(mid,{pinned:false,updatedAt:now()}); toast('تم إلغاء تثبيت الرسالة.'); rerenderInbox(); }
  function confirmRead(mid){ const ms=getMessages(); const m=ms.find(x=>x.id===mid); if(!m) return; const readBy=Array.from(new Set([...(m.readBy||[]),uid()])); updateMessage(mid,{readBy,readConfirmedAt:now()}); toast('تم تسجيل تأكيد الاطلاع.'); rerenderInbox(); }
  function addAttachmentMeta(mid){
    const label=prompt('اكتب اسم المرفق أو الرابط المختصر:'); if(!label) return;
    const url=prompt('ضع رابط المرفق إن وجد، أو اتركه فارغًا:')||'';
    const ms=getMessages(); const m=ms.find(x=>x.id===mid); if(!m) return;
    const attachments=arr(m.attachments); attachments.push({id:id('att'),label,url,addedBy:uid(),addedAt:now()});
    updateMessage(mid,{attachments}); toast('تم إضافة بيانات المرفق للرسالة.'); rerenderInbox();
  }
  function rerenderInbox(){ if(typeof window.openSecureCommunicationCenter==='function') window.openSecureCommunicationCenter('inbox'); }
  function decorateMessages(){
    const selected=window.__sandCommSelected; if(!selected) return;
    const list=document.getElementById('commMessagesList'); if(!list) return;
    const msgs=getMessages().filter(m=>m.threadId===selected.id);
    msgs.forEach(m=>{
      const text=String(m.text||'').slice(0,42);
      const bubbles=Array.from(list.querySelectorAll('.comm-message'));
      const el=bubbles.find(b=>b.textContent.includes(text));
      if(!el || el.dataset.rtDecorated) return;
      el.dataset.rtDecorated='1';
      if(m.pinned) el.querySelector('b')?.insertAdjacentHTML('afterend','<span class="comm-pinned-badge">مثبتة</span>');
      const attachments=arr(m.attachments).map(a=>`<span class="comm-attachment-pill">📎 ${esc(a.url?`<a href="${a.url}" target="_blank" rel="noopener">${a.label}</a>`:a.label)}</span>`).join('');
      const readCount=arr(m.readBy).length;
      el.insertAdjacentHTML('beforeend',`${attachments}<div class="comm-read-confirm">✓ تأكيدات الاطلاع: ${readCount}</div><div class="comm-message-tools"><button class="comm-rt-btn" onclick="SandCommRealtime.confirmRead('${esc(m.id)}')">تأكيد اطلاع</button><button class="comm-rt-btn" onclick="SandCommRealtime.${m.pinned?'unpinMessage':'pinMessage'}('${esc(m.id)}')">${m.pinned?'إلغاء التثبيت':'تثبيت'}</button><button class="comm-rt-btn" onclick="SandCommRealtime.addAttachmentMeta('${esc(m.id)}')">إضافة مرفق</button></div>`);
    });
  }

  // Cross-tab instant updates while remote sync handles different devices.
  let channel=null;
  try{
    channel=new BroadcastChannel('sand_comm_realtime_channel');
    channel.onmessage=(ev)=>{ if(ev?.data?.type==='comm-local-change' && ev.data.deviceId!==deviceId()){ scheduleSync(500); if(typeof window.openSecureCommunicationCenter==='function') setTimeout(()=>decorate(),100); } };
  }catch{}
  window.addEventListener('storage',ev=>{ if(WATCHED_KEYS.includes(ev.key)) setTimeout(decorate,120); });
  const oldEnqueue=enqueue;
  // announce local changes to other tabs by wrapping through a polling watcher
  let lastOutboxLen=outbox().length;
  setInterval(()=>{ const len=outbox().length; if(len!==lastOutboxLen){ lastOutboxLen=len; try{ channel?.postMessage({type:'comm-local-change',deviceId:deviceId(),at:now()}); }catch{} } },1000);

  window.SandCommRealtime={config,saveConfig,openSettings,saveSettingsFromModal,testConnection,syncNow,disable,startLoop,decorate,pinMessage,unpinMessage,confirmRead,addAttachmentMeta};
  addStyles();
  setTimeout(()=>{ patchOpen(); startLoop(); decorate(); },500);
})();
