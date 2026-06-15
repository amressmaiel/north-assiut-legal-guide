/**
 * admin-security-audit.js — Phase 5.11
 * مركز الأمن وسجل العمليات والنسخ الاحتياطي الإداري.
 */
(function(){
  function esc(v){return String(v??'').replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[m]));}
  function toast(msg){ if(typeof judicialToast==='function') judicialToast(msg); else alert(msg); }
  function auth(){ return window.SandAuthApi; }
  function ensure(){
    if(!auth()?.isLoggedIn?.()){ openSandAuthLogin?.(); return false; }
    const isOwner=auth()?.currentUser?.()?.isSuperOwner || auth()?.currentUser?.()?.is_super_owner;
    if(!isOwner && !auth()?.hasPermission?.('audit.view') && !auth()?.hasPermission?.('users.manage')){ toast('مركز الأمن متاح لمالك النظام أو من يملك صلاحية مراجعة السجل.'); return false; }
    return true;
  }
  function d(v){return v?String(v).replace('T',' ').slice(0,19):'—'}
  async function load(){
    const [audit, users, devices] = await Promise.all([
      auth().audit(250).catch(e=>({ok:false,logs:[],error:e.message})),
      auth().users().catch(e=>({ok:false,users:[],error:e.message})),
      auth().devices().catch(e=>({ok:false,devices:[],error:e.message}))
    ]);
    return {logs:audit.logs||[],users:users.users||[],devices:devices.devices||[]};
  }
  function severityClass(s){
    s=String(s||'info').toLowerCase();
    if(/danger|critical|خطر|high/.test(s)) return 'danger';
    if(/warn|تنبيه|medium/.test(s)) return 'warn';
    return 'info';
  }
  function stats(db){
    const failed=db.logs.filter(x=>/FAILED|DENIED|INVALID|REVOKED|BLOCK/.test(x.action||'')).length;
    const logins=db.logs.filter(x=>/LOGIN_SUCCESS/.test(x.action||'')).length;
    const adminOps=db.logs.filter(x=>/USER_|ROLE_|LICENSE|DEVICE|BOOTSTRAP/.test(x.action||'')).length;
    const activeDevices=db.devices.filter(x=>(x.status||'')==='active').length;
    return `<div class="license-stats-grid security-stats">
      <article><b>${db.logs.length}</b><span>عملية مسجلة</span></article>
      <article><b>${logins}</b><span>دخول ناجح</span></article>
      <article><b>${failed}</b><span>محاولات/قرارات حرجة</span></article>
      <article><b>${adminOps}</b><span>عمليات إدارية</span></article>
      <article><b>${activeDevices}</b><span>أجهزة نشطة</span></article>
    </div>`;
  }
  function filters(){
    return `<div class="settings-card wide security-filter-card"><h3>فلترة سجل العمليات</h3><div class="settings-form-grid three">
      <label>بحث<input id="auditSearch" placeholder="اسم مستخدم / إجراء / تفاصيل" oninput="filterAuditRows()"></label>
      <label>نوع العملية<select id="auditType" onchange="filterAuditRows()"><option value="">الكل</option><option value="LOGIN">دخول</option><option value="USER">مستخدمين</option><option value="LICENSE">تراخيص</option><option value="DEVICE">أجهزة</option><option value="BOOTSTRAP">Bootstrap</option><option value="FAILED">فشل/رفض</option></select></label>
      <label>الخطورة<select id="auditSeverity" onchange="filterAuditRows()"><option value="">الكل</option><option value="info">معلومة</option><option value="warning">تنبيه</option><option value="danger">خطر</option></select></label>
    </div></div>`;
  }
  function auditTable(logs){
    const rows=logs.map(a=>{
      const txt=[a.action,a.actor_username,a.severity,a.details_json,a.target_type,a.target_id].join(' ');
      return `<tr data-audit-row data-search="${esc(txt).toLowerCase()}" data-action="${esc(a.action||'')}" data-severity="${esc(severityClass(a.severity))}"><td>${d(a.created_at||a.createdAt)}</td><td><b>${esc(a.action)}</b><br><small>${esc(a.actor_username||a.actorUsername||'النظام')}</small></td><td><span class="audit-severity ${severityClass(a.severity)}">${esc(a.severity||'info')}</span></td><td>${esc(a.target_type||a.targetType||'—')}</td><td><code>${esc(a.details_json||a.detailsJson||'{}')}</code></td></tr>`;
    }).join('') || '<tr><td colspan="5">لا يوجد سجل عمليات.</td></tr>';
    return `<div class="settings-card wide"><div class="card-title-actions"><h3>📜 سجل العمليات المركزي</h3><div><button class="soft-btn" onclick="exportAuditJson()">تصدير JSON</button><button class="soft-btn" onclick="printAuditReport()">طباعة تقرير</button></div></div><table class="admin-table audit-table"><thead><tr><th>الوقت</th><th>الإجراء</th><th>الخطورة</th><th>الهدف</th><th>التفاصيل</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }
  function securityPolicies(){
    return `<div class="settings-card wide"><h3>⚙️ سياسات الأمان المقترحة</h3><div class="policy-grid">
      <article><b>الجلسة</b><span>انتهاء تلقائي + تحقق من /me عند التحديث</span></article>
      <article><b>العضوية</b><span>رفض الدخول عند انتهاء valid_until من Worker</span></article>
      <article><b>الأجهزة</b><span>تفعيل/إيقاف/إلغاء لكل جهاز من لوحة التراخيص</span></article>
      <article><b>الصلاحيات</b><span>إخفاء الواجهة + رفض السيرفر لأي Endpoint غير مصرح</span></article>
      <article><b>السجل</b><span>كل قبول أو رفض أو دخول أو تعديل ترخيص يسجل في D1</span></article>
      <article><b>المفاتيح</b><span>private-auth-key خارج GitHub نهائيًا</span></article>
    </div></div>`;
  }
  function backupPanel(){
    return `<div class="settings-card wide"><h3>📦 نسخ احتياطي إداري</h3><p class="muted">تصدير إعدادات الواجهة المحلية والقوالب المخصصة وسجل الجلسة الحالي. بيانات D1 الكاملة تُدار من Cloudflare.</p><div class="admin-toolbar"><button class="gold-btn" onclick="exportLocalAdminBackup()">تصدير نسخة إعدادات محلية</button><button class="soft-btn" onclick="openLicenseDeviceAdmin()">فتح التراخيص والأجهزة</button><button class="soft-btn" onclick="openMembershipAdmin()">فتح العضويات</button></div></div>`;
  }
  function render(db){
    return `<section class="admin-settings-page security-audit-page"><div class="page-title-row"><div><span class="eyebrow">Phase 5.11</span><h2>📜 مركز الأمن وسجل العمليات</h2><p>لوحة رقابية لمالك النظام لمتابعة الدخول، التراخيص، الأجهزة، والقرارات الإدارية.</p></div><div class="admin-toolbar"><button class="soft-btn" onclick="openAccessControlCenter()">🛡️ إنفاذ الصلاحيات</button><button class="gold-btn" onclick="openSecurityAuditCenter()">تحديث</button></div></div>${stats(db)}${filters()}${auditTable(db.logs)}${securityPolicies()}${backupPanel()}</section>`;
  }
  window.filterAuditRows=function(){
    const q=(document.getElementById('auditSearch')?.value||'').toLowerCase().trim();
    const type=document.getElementById('auditType')?.value||'';
    const sev=document.getElementById('auditSeverity')?.value||'';
    document.querySelectorAll('[data-audit-row]').forEach(r=>{
      const okQ=!q || r.dataset.search.includes(q);
      const okT=!type || (r.dataset.action||'').includes(type);
      const okS=!sev || (r.dataset.severity||'')===sev || (sev==='warning' && r.dataset.severity==='warn');
      r.style.display=(okQ&&okT&&okS)?'':'none';
    });
  };
  function download(name, content, type='application/json'){
    const blob=new Blob([content],{type}); const a=document.createElement('a');
    a.href=URL.createObjectURL(blob); a.download=name; document.body.appendChild(a); a.click();
    setTimeout(()=>{URL.revokeObjectURL(a.href); a.remove();},500);
  }
  window.exportAuditJson=async function(){ const db=await load(); download('sand-audit-log.json', JSON.stringify(db.logs,null,2)); };
  window.exportLocalAdminBackup=function(){
    const keys=Object.keys(localStorage).filter(k=>/^sand_|northAssiut|SAND_/.test(k));
    const data={exportedAt:new Date().toISOString(), keys:{}};
    keys.forEach(k=>data.keys[k]=localStorage.getItem(k));
    download('sand-local-admin-backup.json', JSON.stringify(data,null,2));
  };
  window.printAuditReport=function(){ window.print(); };
  window.openSecurityAuditCenter=async function(){
    if(!ensure()) return;
    if(typeof closeSidebar==='function') closeSidebar();
    document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
    document.querySelector('[data-nav="security-audit-center"]')?.classList.add('active');
    const v=document.getElementById('appView'); if(!v) return;
    v.innerHTML='<section class="admin-settings-page"><div class="loading-card">جاري تحميل مركز الأمن...</div></section>';
    try{ const db=await load(); v.innerHTML=render(db); }
    catch(e){ v.innerHTML=`<section class="admin-settings-page"><div class="settings-alert danger">${esc(e.message||e)}</div></section>`; }
  };
})();
