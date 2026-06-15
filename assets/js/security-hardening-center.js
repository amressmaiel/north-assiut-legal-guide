(function(){
  'use strict';
  const PHASE='5.23';
  const SECURITY_LOG_KEY='sand_security_hardening_log_v523';
  const CHECKS=[
    {id:'guest-isolation',cat:'الضيوف',title:'عزل بوابة الضيوف عن أدوات المنصة',test:()=>!!document.querySelector('[data-nav="training-center"]') && typeof window.openSecureCommunicationCenter==='function',risk:'high',fix:'روابط الضيوف يجب أن تعرض صفحة حضور فقط دون قوائم أو أدوات داخلية.'},
    {id:'admin-screens',cat:'الصلاحيات',title:'حماية الشاشات الإدارية',test:()=>typeof window.openBackupRestoreCenter==='function' && typeof window.openLegalContentManager==='function',risk:'critical',fix:'استمرار فحص الدور والصلاحيات قبل عرض أدوات الإدارة.'},
    {id:'notifications',cat:'الإشعارات',title:'وجود مركز إشعارات مؤسسي',test:()=>typeof window.openNotificationsCenter==='function',risk:'medium',fix:'ربط الأحداث الأمنية والتنبيهات الإدارية بمركز الإشعارات.'},
    {id:'communication',cat:'التواصل',title:'خصوصية التواصل والزملاء الموثوقين',test:()=>typeof window.openSecureCommunicationCenter==='function',risk:'high',fix:'منع الرسائل الفردية إلا بعد الموافقة أو الصلاحية الإدارية.'},
    {id:'case-sharing',cat:'ملفات الوقائع',title:'مشاركة ملفات الوقائع بصلاحيات',test:()=>localStorage.getItem('sand_case_file_shares_v518')!==null || typeof window.openCaseFilesCenter==='function',risk:'high',fix:'المشاركة يجب أن تكون بمدة وصلاحية وسجل مراجعة.'},
    {id:'backup',cat:'النسخ الاحتياطي',title:'وجود مركز نسخ واستعادة محمي',test:()=>typeof window.openBackupRestoreCenter==='function',risk:'critical',fix:'الاستعادة لا تتم إلا للإدارة مع فحص checksum.'},
    {id:'auth-api',cat:'الربط',title:'ضبط رابط Auth API أو ظهور تحذير واضح',test:()=>!!(localStorage.getItem('sand_auth_api_url') || window.SAND_AUTH_API_URL || window.APP_CONFIG?.authApiUrl),risk:'critical',fix:'ضع رابط Worker الخاص بالعضويات في إعدادات المنصة قبل العرض الرسمي.'},
    {id:'comm-api',cat:'الربط',title:'ضبط رابط تواصل Realtime أو العمل المحلي الاحتياطي',test:()=>!!(localStorage.getItem('sand_comm_realtime_api_url') || window.APP_CONFIG?.communicationApiUrl),risk:'medium',fix:'اضبط Worker التواصل لو مطلوب تواصل بين أجهزة مختلفة.'},
    {id:'conflicts',cat:'سلامة الكود',title:'عدم وجود علامات تعارض Git داخل الصفحة الحالية',test:()=>!document.documentElement.innerHTML.includes('<<<<<<<') && !document.documentElement.innerHTML.includes('>>>>>>>'),risk:'critical',fix:'فحص المشروع من PowerShell وإزالة أي علامات تعارض.'},
    {id:'console-sensitive',cat:'الخصوصية',title:'عدم إظهار بيانات حساسة في الواجهة',test:()=>!document.body.innerText.includes('SECRET') && !document.body.innerText.includes('PRIVATE_KEY'),risk:'critical',fix:'عدم وضع مفاتيح أو أسرار داخل الواجهة الأمامية.'}
  ];
  function safeParse(raw, fallback){ try{return JSON.parse(raw)}catch(e){return fallback} }
  function now(){return new Date().toISOString()}
  function escape(s){return String(s??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]))}
  function user(){return window.SAND_AUTH_STATE?.account || window.currentAuthUser || {}}
  function isAdmin(){const r=String(user().role||user().accountRole||'').toLowerCase(); return ['owner','system_owner','admin','manager','auditor','security'].some(x=>r.includes(x));}
  function setMain(html){const el=document.getElementById('appView')||document.querySelector('main')||document.body; el.innerHTML=html; document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active', b.dataset.nav==='security-audit-center')); window.scrollTo({top:0,behavior:'smooth'});}
  function log(action,details){const a=safeParse(localStorage.getItem(SECURITY_LOG_KEY),'[]')||[]; a.unshift({id:'sec_'+Date.now(),action,details,at:now(),by:user().name||user().displayName||'local-admin'}); localStorage.setItem(SECURITY_LOG_KEY,JSON.stringify(a.slice(0,120)));}
  function runChecks(){return CHECKS.map(c=>{let ok=false; try{ok=!!c.test()}catch(e){ok=false} return {...c,ok};});}
  function score(results){const weight={critical:18,high:11,medium:7,low:4}; let max=0,miss=0; results.forEach(r=>{max+=weight[r.risk]||5; if(!r.ok) miss+=weight[r.risk]||5;}); return Math.max(0,Math.round((1-(miss/max))*100));}
  function createSecurityNotification(title,body,priority='high'){
    try{ if(typeof window.upsertNotification==='function') window.upsertNotification({category:'security',priority,title,body,source:'security-hardening',fingerprint:'security-hardening-'+Date.now(),action:'openSecurityAuditCenter && openSecurityAuditCenter()'}); }catch(e){}
  }
  function markReviewed(id){const map=safeParse(localStorage.getItem('sand_security_reviewed_checks_v523'),'{}')||{}; map[id]={at:now(),by:user().name||'admin'}; localStorage.setItem('sand_security_reviewed_checks_v523',JSON.stringify(map)); log('review_check','تمت مراجعة البند: '+id); render();}
  function exportReport(){const results=runChecks(); const payload={phase:PHASE,createdAt:now(),score:score(results),results}; const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='sand-security-audit-report.json'; a.click(); URL.revokeObjectURL(a.href); log('export_security_report','تم تصدير تقرير المراجعة الأمنية');}
  function sendCriticalAlerts(){const failed=runChecks().filter(r=>!r.ok && ['critical','high'].includes(r.risk)); if(!failed.length){createSecurityNotification('المراجعة الأمنية سليمة','لا توجد عناصر حرجة أو عالية غير مكتملة.','info');} else {createSecurityNotification('بنود أمنية تحتاج مراجعة',`يوجد ${failed.length} بند حرج/هام يحتاج متابعة قبل العرض الرسمي.`,'critical');} log('send_security_alerts',`إرسال تنبيه بعدد ${failed.length} بنود`); render();}
  function rows(results){const reviewed=safeParse(localStorage.getItem('sand_security_reviewed_checks_v523'),'{}')||{}; return results.map(r=>`<div class="sh-row ${r.ok?'ok':'fail'}"><div><span>${escape(r.cat)}</span><h4>${r.ok?'✅':'⚠️'} ${escape(r.title)}</h4><p>${escape(r.fix)}</p><small>مستوى الخطورة: ${escape(r.risk)} ${reviewed[r.id]?' — تمت المراجعة إداريًا':''}</small></div><button onclick="SecurityHardeningCenter.markReviewed('${r.id}')">اعتماد المراجعة</button></div>`).join('');}
  function history(){const a=safeParse(localStorage.getItem(SECURITY_LOG_KEY),'[]')||[]; return a.slice(0,8).map(x=>`<div class="sh-log"><b>${escape(x.action)}</b><span>${escape(x.details)}</span><small>${new Date(x.at).toLocaleString('ar-EG')}</small></div>`).join('') || '<p class="sh-empty">لا يوجد سجل مراجعة بعد.</p>';}
  function render(){
    if(!isAdmin()){ setMain(`<section class="sh-page"><div class="sh-hero"><div><span>المرحلة 5.23</span><h2>المراجعة الأمنية الشاملة</h2><p>هذه الشاشة مخصصة للإدارة فقط.</p></div></div></section>`); return; }
    const results=runChecks(); const sc=score(results); const failed=results.filter(r=>!r.ok); const critical=failed.filter(r=>r.risk==='critical').length;
    setMain(`<section class="sh-page"><div class="sh-hero"><div><span>المرحلة 5.23</span><h2>المراجعة الأمنية الشاملة قبل العرض الرسمي</h2><p>فحص صلاحيات الشاشات، الضيوف، المشاركة، الربط، النسخ الاحتياطي، وسلامة الواجهة من علامات التعارض أو البيانات الحساسة.</p></div><div class="sh-score"><b>${sc}%</b><small>مؤشر الجاهزية الأمنية</small></div></div>
      <div class="sh-kpis"><div><b>${results.length}</b><span>بنود فحص</span></div><div><b>${failed.length}</b><span>تحتاج متابعة</span></div><div><b>${critical}</b><span>حرجة</span></div><div><b>${results.length-failed.length}</b><span>سليمة</span></div></div>
      <div class="sh-actions"><button onclick="SecurityHardeningCenter.render()">🔄 إعادة الفحص</button><button onclick="SecurityHardeningCenter.exportReport()">⬇️ تصدير التقرير</button><button onclick="SecurityHardeningCenter.sendCriticalAlerts()">🔔 إرسال تنبيه أمني</button><button onclick="openAccessControlCenter && openAccessControlCenter()">🛡️ إنفاذ الصلاحيات</button></div>
      <div class="sh-layout"><div class="sh-panel wide"><h3>نتائج الفحص الأمني</h3>${rows(results)}</div><div class="sh-panel"><h3>سياسة ما قبل العرض الرسمي</h3><ul><li>الزائر لا يرى أدوات المنصة.</li><li>الضيف يدخل بوابة الحضور فقط.</li><li>المشاركة بصلاحية ومدة وسجل.</li><li>النسخ والاستعادة للإدارة فقط.</li><li>لا أسرار داخل ملفات الواجهة.</li><li>فحص Git conflict قبل كل رفع.</li></ul><h3>سجل المراجعة</h3>${history()}</div></div>
    </section>`);
  }
  window.openSecurityAuditCenter=render;
  window.SecurityHardeningCenter={render,markReviewed,exportReport,sendCriticalAlerts};
})();
