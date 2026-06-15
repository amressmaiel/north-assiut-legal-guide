(function(){
  'use strict';
  const PHASE = '5.22';
  const PERF_LOG_KEY = 'sand_performance_maintenance_log_v522';
  const INDEX_KEY = 'sand_search_index_meta_v522';
  const TEMP_PATTERNS = [/temp/i,/tmp/i,/draft_preview/i,/demo_/i,/preview/i,/cache/i];
  const LOG_KEYS = [
    'sand_notifications_v516','sand_communication_audit_log_v5161','sand_backup_restore_history_v521',
    'sand_case_files_activity_v517','sand_legal_content_audit_v519','sand_institutional_reports_cache_v520'
  ];
  function safeParse(raw, fallback){ try{return JSON.parse(raw)}catch(e){return fallback} }
  function bytes(v){ return new Blob([String(v||'')]).size; }
  function fmt(n){ if(n<1024) return n+' B'; if(n<1024*1024) return (n/1024).toFixed(1)+' KB'; return (n/1024/1024).toFixed(2)+' MB'; }
  function now(){ return new Date().toISOString(); }
  function user(){ return window.SAND_AUTH_STATE?.account || window.currentAuthUser || {}; }
  function isAdmin(){ const r=String(user().role||user().accountRole||'').toLowerCase(); return ['owner','system_owner','admin','manager','auditor','backup'].some(x=>r.includes(x)); }
  function escape(s){ return String(s??'').replace(/[&<>"]/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m])); }
  function setMain(html){ const el=document.getElementById('appView')||document.querySelector('main')||document.body; el.innerHTML=html; document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active', b.dataset.nav==='performance-maintenance-center')); window.scrollTo({top:0,behavior:'smooth'}); }
  function toast(msg){ try{ window.showToast ? window.showToast(msg) : alert(msg); }catch(e){ alert(msg); } }
  function log(action, details){ const a=safeParse(localStorage.getItem(PERF_LOG_KEY),'[]')||[]; a.unshift({id:'pm_'+Date.now(),action,details,at:now(),by:user().name||user().displayName||'local-admin'}); localStorage.setItem(PERF_LOG_KEY, JSON.stringify(a.slice(0,80))); }
  function allKeys(){ return Object.keys(localStorage).sort(); }
  function scan(){
    const keys=allKeys(); let total=0; const rows=[]; const byPrefix={}; const temp=[];
    keys.forEach(k=>{ const raw=localStorage.getItem(k)||''; const size=bytes(raw); total+=size; const prefix=k.split('_').slice(0,2).join('_')||k; byPrefix[prefix]=(byPrefix[prefix]||0)+size; const risk = size>250000?'large':size>80000?'medium':'normal'; const isTemp=TEMP_PATTERNS.some(p=>p.test(k)); if(isTemp) temp.push(k); rows.push({key:k,size,risk,isTemp}); });
    const large=rows.filter(r=>r.size>80000).sort((a,b)=>b.size-a.size).slice(0,15);
    const groups=Object.entries(byPrefix).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([name,size])=>({name,size}));
    const score=Math.max(45, Math.min(100, 100 - Math.round(total/350000) - Math.max(0,large.length-3)*3 - Math.min(10,temp.length)));
    return {keys,total,rows,large,groups,temp,score};
  }
  function trimArrayKey(k,max){ const raw=localStorage.getItem(k); if(!raw) return 0; const arr=safeParse(raw,null); if(!Array.isArray(arr) || arr.length<=max) return 0; localStorage.setItem(k, JSON.stringify(arr.slice(0,max))); return arr.length-max; }
  function cleanTemp(){ const s=scan(); let removed=0, freed=0; s.temp.forEach(k=>{ const raw=localStorage.getItem(k); if(raw!==null){ freed+=bytes(raw); localStorage.removeItem(k); removed++; } }); log('clean_temp',`حذف ${removed} مفتاح مؤقت وتحرير ${fmt(freed)}`); toast(`تم حذف ${removed} عنصر مؤقت.`); render(); }
  function trimLogs(){ let removed=0; LOG_KEYS.forEach(k=>{ removed+=trimArrayKey(k,80); }); log('trim_logs',`تم تقليل السجلات القديمة بعدد ${removed} عنصر`); toast(`تم تقليل السجلات القديمة: ${removed} عنصر.`); render(); }
  function rebuildIndex(){
    const laws = [];
    try{ if(Array.isArray(window.LAWS_INDEX)) laws.push(...window.LAWS_INDEX); }catch(e){}
    try{ if(window.CRIMINAL_PROCEDURE_174_2025) laws.push({id:'criminal-procedure-174-2025', title:'قانون الإجراءات الجنائية 174 لسنة 2025'}); }catch(e){}
    const articlesCount = (window.ALL_ARTICLES?.length || window.articles?.length || 0);
    const meta={phase:PHASE, rebuiltAt:now(), laws:laws.length, articles:articlesCount, status:'ready', note:'فهرس خفيف لبيانات البحث؛ لا يكرر النصوص الكبيرة داخل التخزين المحلي.'};
    localStorage.setItem(INDEX_KEY, JSON.stringify(meta)); log('rebuild_index',`إعادة بناء فهرس خفيف: ${meta.laws} قوانين، ${meta.articles} مادة`); toast('تم تحديث فهرس البحث الخفيف.'); render();
  }
  function compactJsonKeys(){
    let touched=0, saved=0;
    allKeys().forEach(k=>{ const raw=localStorage.getItem(k); if(!raw || raw.length<2000) return; const obj=safeParse(raw,null); if(!obj) return; const min=JSON.stringify(obj); if(min.length<raw.length){ localStorage.setItem(k,min); touched++; saved += raw.length-min.length; } });
    log('compact_json',`ضغط ${touched} مفتاح JSON وتوفير ${fmt(saved)}`); toast(`تم ضغط ${touched} عنصر وتوفير ${fmt(saved)}.`); render();
  }
  function exportScan(){ const s=scan(); const payload={phase:PHASE,createdAt:now(),totalSize:s.total,keys:s.keys.length,large:s.large,groups:s.groups,tempKeys:s.temp,score:s.score}; const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='sand-performance-scan.json'; a.click(); URL.revokeObjectURL(a.href); }
  function rows(list){ return list.length?list.map(r=>`<div class="pm-row"><span>${escape(r.key||r.name)}</span><b>${fmt(r.size)}</b><em class="${r.risk||''}">${r.isTemp?'مؤقت':r.risk==='large'?'كبير':'طبيعي'}</em></div>`).join(''):'<p class="pm-empty">لا توجد عناصر حرجة.</p>'; }
  function history(){ const a=safeParse(localStorage.getItem(PERF_LOG_KEY),'[]')||[]; return a.slice(0,8).map(x=>`<div class="pm-log"><b>${escape(x.action)}</b><span>${escape(x.details)}</span><small>${new Date(x.at).toLocaleString('ar-EG')}</small></div>`).join('') || '<p class="pm-empty">لا يوجد سجل صيانة بعد.</p>'; }
  function render(){
    if(!isAdmin()){ setMain(`<section class="pm-page"><div class="pm-hero"><div><span>المرحلة 5.22</span><h2>تحسين الأداء وتنظيف البيانات</h2><p>هذه الشاشة مخصصة للإدارة فقط.</p></div></div></section>`); return; }
    const s=scan(); const idx=safeParse(localStorage.getItem(INDEX_KEY),null);
    setMain(`<section class="pm-page">
      <div class="pm-hero"><div><span>المرحلة 5.22</span><h2>مركز تحسين الأداء وتنظيف البيانات</h2><p>صيانة مؤسسية للتخزين المحلي، تنظيف المؤقتات، تقليل السجلات القديمة، وضبط فهارس البحث بدون التأثير على البيانات الأساسية.</p></div><div class="pm-score"><b>${s.score}%</b><small>مؤشر خفة التشغيل</small></div></div>
      <div class="pm-kpis"><div><b>${s.keys.length}</b><span>مفاتيح تخزين</span></div><div><b>${fmt(s.total)}</b><span>الحجم المحلي</span></div><div><b>${s.large.length}</b><span>عناصر كبيرة</span></div><div><b>${s.temp.length}</b><span>عناصر مؤقتة</span></div></div>
      <div class="pm-actions"><button onclick="PerformanceMaintenanceCenter.cleanTemp()">🧹 تنظيف المؤقتات</button><button onclick="PerformanceMaintenanceCenter.trimLogs()">📉 تقليل السجلات</button><button onclick="PerformanceMaintenanceCenter.compactJsonKeys()">🗜️ ضغط JSON</button><button onclick="PerformanceMaintenanceCenter.rebuildIndex()">🔎 إعادة بناء الفهرس</button><button onclick="PerformanceMaintenanceCenter.exportScan()">⬇️ تصدير تقرير الفحص</button></div>
      <div class="pm-grid"><div class="pm-panel"><h3>أكبر عناصر التخزين</h3>${rows(s.large)}</div><div class="pm-panel"><h3>توزيع الحجم حسب المجموعة</h3>${rows(s.groups)}</div><div class="pm-panel"><h3>حالة الفهرس</h3><p class="pm-info">${idx?`آخر تحديث: ${new Date(idx.rebuiltAt).toLocaleString('ar-EG')} — قوانين: ${idx.laws} — مواد: ${idx.articles}`:'لم يتم بناء فهرس خفيف بعد.'}</p><ul><li>لا يتم تكرار النصوص القانونية الكبيرة داخل الفهرس.</li><li>تحميل التفاصيل يتم عند الطلب لتقليل الذاكرة.</li><li>ينصح بتشغيل الصيانة قبل النسخ الاحتياطي الكامل.</li></ul></div><div class="pm-panel"><h3>سجل الصيانة</h3>${history()}</div></div>
    </section>`);
  }
  window.openPerformanceMaintenanceCenter=render;
  window.PerformanceMaintenanceCenter={render,cleanTemp,trimLogs,compactJsonKeys,rebuildIndex,exportScan};
})();
