/**
 * admin-license-devices.js — Phase 5.9
 * إدارة التراخيص والأجهزة ومدة العضوية من Cloudflare Auth API.
 */
(function(){
  function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}
  function byId(id){return document.getElementById(id)}
  function toast(msg){ if(typeof judicialToast==='function') judicialToast(msg); else alert(msg); }
  function closeNav(){ if(typeof closeSidebar==='function') closeSidebar(); }
  function ensureAdmin(){
    if(!window.SandAuthApi?.isLoggedIn?.()) { openSandAuthLogin?.(); return false; }
    if(!SandAuthApi.hasPermission('licenses.manage') && !SandAuthApi.hasPermission('users.manage') && !SandAuthApi.currentUser()?.isSuperOwner){
      toast('هذه الشاشة مخصصة لمالك النظام أو مدير التراخيص والأجهزة.');
      return false;
    }
    return true;
  }
  function badge(v){
    const map={active:'نشط',suspended:'موقوف',expired:'منتهي',revoked:'ملغي',blocked:'محظور',pending_approval:'بانتظار الموافقة',replaced:'مستبدل'};
    return `<span class="auth-status auth-${esc(v||'')}">${map[v]||esc(v||'—')}</span>`;
  }
  function d(v){return v?String(v).slice(0,10):'—'}
  function isSoon(date){ if(!date) return false; const t=new Date(date).getTime(); return t>Date.now() && t-Date.now()<=30*24*3600*1000; }
  function isExpired(date){ return date && new Date(date).getTime()<Date.now(); }
  async function loadAll(){
    const [users, devices, audit, licenses] = await Promise.all([
      SandAuthApi.users().catch(e=>({ok:false,users:[],error:e.message})),
      SandAuthApi.devices().catch(e=>({ok:false,devices:[],error:e.message})),
      SandAuthApi.audit(80).catch(e=>({ok:false,logs:[],error:e.message})),
      SandAuthApi.licenses ? SandAuthApi.licenses().catch(e=>({ok:false,licenses:[],error:e.message})) : Promise.resolve({ok:false,licenses:[]})
    ]);
    return {users:users.users||[],devices:devices.devices||[],audit:audit.logs||[],licenses:licenses.licenses||[]};
  }
  function shell(inner){
    return `<section class="admin-settings-page license-admin-page">
      <div class="page-title-row">
        <div><span class="eyebrow">نظام الأمان والترخيص</span><h2>🎫 إدارة التراخيص والأجهزة</h2><p>تحكم في مدة العضوية، عدد الأجهزة، حالة التراخيص، واستبدال أو إلغاء الأجهزة المفعلة.</p></div>
        <div class="admin-toolbar"><button class="soft-btn" onclick="openMembershipAdmin()">👥 العضويات</button><button class="gold-btn" onclick="openLicenseDeviceAdmin()">تحديث</button></div>
      </div>
      ${inner}
    </section>`;
  }
  function renderStats(db){
    const activeUsers=db.users.filter(u=>u.status==='active').length;
    const expired=db.users.filter(u=>isExpired(u.valid_until||u.validUntil)).length;
    const soon=db.users.filter(u=>isSoon(u.valid_until||u.validUntil)).length;
    const activeDevices=db.devices.filter(d=>d.status==='active').length;
    const activeLic=db.licenses.filter(l=>l.status==='active').length;
    return `<div class="license-stats-grid">
      <article><b>${activeUsers}</b><span>مستخدم نشط</span></article>
      <article><b>${soon}</b><span>عضويات قرب الانتهاء</span></article>
      <article><b>${expired}</b><span>عضويات منتهية</span></article>
      <article><b>${activeDevices}</b><span>جهاز مفعل</span></article>
      <article><b>${activeLic}</b><span>ترخيص نشط</span></article>
    </div>`;
  }
  function renderUsers(db){
    const rows=db.users.map(u=>{
      const vu=u.valid_until||u.validUntil; const vf=u.valid_from||u.validFrom;
      const cls=isExpired(vu)?'danger-row':(isSoon(vu)?'warn-row':'');
      return `<tr class="${cls}"><td><b>${esc(u.full_name||u.fullName||u.username)}</b><br><small>${esc(u.username)}</small></td><td>${esc(u.role_display_name||u.roleDisplayName||u.role_id||'—')}</td><td>${badge(u.status)}</td><td>${d(vf)} ⇐ ${d(vu)}</td><td>${esc(u.max_devices||u.maxDevices||1)}</td><td>${d(u.last_login_at||u.lastLoginAt)}</td><td class="actions-cell"><button class="mini-btn" onclick="openUserAccessDialog('${esc(u.id)}')">تعديل الوصول</button><button class="mini-btn" onclick="resetUserDevices('${esc(u.id)}')">تصفير الأجهزة</button></td></tr>`;
    }).join('')||'<tr><td colspan="7">لا توجد مستخدمون.</td></tr>';
    return `<div class="settings-card wide"><h3>⏳ مدد العضوية وحدود الأجهزة</h3><p class="muted">راجع انتهاء العضويات وعدّل المدة أو عدد الأجهزة من هنا.</p><table class="admin-table"><thead><tr><th>المستخدم</th><th>الدور</th><th>الحالة</th><th>المدة</th><th>الأجهزة</th><th>آخر دخول</th><th>إجراءات</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }
  function renderLicenses(db){
    const rows=db.licenses.map(l=>`<tr><td><b>${esc(l.license_id||l.licenseId)}</b><br><small>${esc(l.license_type||l.licenseType||'')}</small></td><td>${esc(l.issued_to||l.issuedTo||'')}</td><td>${esc(l.organization||'')}</td><td>${d(l.valid_from||l.validFrom)} ⇐ ${d(l.valid_until||l.validUntil)}</td><td>${esc(l.max_users||l.maxUsers||1)} / ${esc(l.max_devices||l.maxDevices||1)}</td><td>${badge(l.status)}</td><td><button class="mini-btn" onclick="setLicenseStatus('${esc(l.id)}','suspended')">إيقاف</button><button class="mini-btn" onclick="setLicenseStatus('${esc(l.id)}','active')">تفعيل</button><button class="danger-mini-btn" onclick="setLicenseStatus('${esc(l.id)}','revoked')">إلغاء</button></td></tr>`).join('')||'<tr><td colspan="7">لا توجد تراخيص مسجلة.</td></tr>';
    return `<div class="settings-card wide"><h3>🎫 التراخيص</h3><p class="muted">إدارة حالة التراخيص المسجلة. إصدار تراخيص موقعة جديدة يتم من أدوات التوقيع الآمنة وليس من الواجهة.</p><table class="admin-table"><thead><tr><th>الترخيص</th><th>صادر إلى</th><th>الجهة</th><th>المدة</th><th>مستخدم/أجهزة</th><th>الحالة</th><th>إجراءات</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }
  function renderDevices(db){
    const rows=db.devices.map(x=>`<tr><td><b>${esc(x.device_label||x.deviceLabel||'جهاز')}</b><br><small>${esc((x.device_fingerprint_hash||'').slice(0,18))}...</small></td><td>${esc(x.full_name||x.fullName||x.username||'—')}<br><small>${esc(x.username||'')}</small></td><td>${badge(x.status)}</td><td>${d(x.first_seen_at||x.firstSeenAt)}</td><td>${d(x.last_seen_at||x.lastSeenAt)}</td><td><button class="mini-btn" onclick="setDeviceStatus('${esc(x.id)}','active')">تفعيل</button><button class="mini-btn" onclick="setDeviceStatus('${esc(x.id)}','suspended')">إيقاف</button><button class="danger-mini-btn" onclick="setDeviceStatus('${esc(x.id)}','revoked')">إلغاء</button></td></tr>`).join('')||'<tr><td colspan="6">لا توجد أجهزة.</td></tr>';
    return `<div class="settings-card wide"><h3>🖥️ الأجهزة المفعلة</h3><p class="muted">إيقاف الجهاز يمنع الدخول منه حتى تعيد تفعيله أو تصفّر أجهزة المستخدم.</p><table class="admin-table"><thead><tr><th>الجهاز</th><th>المستخدم</th><th>الحالة</th><th>أول ظهور</th><th>آخر ظهور</th><th>إجراءات</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }
  function renderAudit(db){
    const rows=db.audit.filter(a=>/DEVICE|LICENSE|USER_APPROVED|USER_STATUS|LOGIN_DEVICE/.test(a.action||'')).slice(0,50).map(a=>`<tr><td>${esc(a.created_at||a.createdAt||'')}</td><td><b>${esc(a.action)}</b><br><small>${esc(a.actor_username||'')}</small></td><td>${esc(a.severity||'')}</td><td><code>${esc(a.details_json||a.detailsJson||'{}')}</code></td></tr>`).join('')||'<tr><td colspan="4">لا توجد عمليات تراخيص/أجهزة حديثة.</td></tr>';
    return `<div class="settings-card wide"><h3>📜 سجل عمليات التراخيص والأجهزة</h3><table class="admin-table"><thead><tr><th>الوقت</th><th>الإجراء</th><th>الخطورة</th><th>التفاصيل</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }
  function render(db){
    return shell(`${renderStats(db)}<div class="auth-admin-tabs license-tabs"><button class="active" data-license-tab="users" onclick="setLicenseTab('users')">⏳ العضويات</button><button data-license-tab="licenses" onclick="setLicenseTab('licenses')">🎫 التراخيص</button><button data-license-tab="devices" onclick="setLicenseTab('devices')">🖥️ الأجهزة</button><button data-license-tab="audit" onclick="setLicenseTab('audit')">📜 السجل</button></div><section class="license-panel active" data-license-panel="users">${renderUsers(db)}</section><section class="license-panel" data-license-panel="licenses">${renderLicenses(db)}</section><section class="license-panel" data-license-panel="devices">${renderDevices(db)}</section><section class="license-panel" data-license-panel="audit">${renderAudit(db)}</section>`);
  }
  window.setLicenseTab=function(tab){document.querySelectorAll('[data-license-tab]').forEach(b=>b.classList.toggle('active',b.dataset.licenseTab===tab));document.querySelectorAll('[data-license-panel]').forEach(p=>p.classList.toggle('active',p.dataset.licensePanel===tab));};
  window.openLicenseDeviceAdmin=async function(){
    if(!ensureAdmin()) return;
    closeNav();
    document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
    document.querySelector('[data-nav="license-device-admin"]')?.classList.add('active');
    const v=byId('appView'); if(!v) return;
    v.innerHTML=shell('<div class="loading-card">جاري تحميل التراخيص والأجهزة...</div>');
    try{ const db=await loadAll(); v.innerHTML=render(db); }
    catch(e){ v.innerHTML=shell(`<div class="settings-alert danger">${esc(e.message||e)}</div>`); }
  };
  window.openUserAccessDialog=async function(userId){
    const db=await loadAll(); const u=db.users.find(x=>x.id===userId); if(!u) return toast('المستخدم غير موجود.');
    const currentValid=(u.valid_until||u.validUntil||'').slice(0,10);
    const maxDevices=u.max_devices||u.maxDevices||1;
    const status=u.status||'active';
    const html=`<div class="modal-backdrop active" id="accessDialog"><div class="modal-card license-modal"><h3>تعديل صلاحيات الوصول</h3><p><b>${esc(u.full_name||u.fullName||u.username)}</b> — ${esc(u.username)}</p><label>الحالة<select id="dlgStatus"><option value="active" ${status==='active'?'selected':''}>نشط</option><option value="suspended" ${status==='suspended'?'selected':''}>موقوف</option><option value="expired" ${status==='expired'?'selected':''}>منتهي</option><option value="blocked" ${status==='blocked'?'selected':''}>محظور</option></select></label><label>تاريخ انتهاء العضوية<input id="dlgValidUntil" type="date" value="${esc(currentValid)}"></label><label>عدد الأجهزة المسموح<input id="dlgMaxDevices" type="number" min="1" max="10" value="${esc(maxDevices)}"></label><label>ملاحظة إدارية<textarea id="dlgNote" rows="3" placeholder="سبب التعديل أو التجديد"></textarea></label><div class="form-actions"><button class="gold-btn" onclick="saveUserAccess('${esc(userId)}')">حفظ التعديل</button><button class="soft-btn" onclick="document.getElementById('accessDialog').remove()">إلغاء</button></div></div></div>`;
    document.body.insertAdjacentHTML('beforeend',html);
  };
  window.saveUserAccess=async function(userId){
    try{
      await SandAuthApi.updateUserAccess({userId,status:byId('dlgStatus').value,validUntil:byId('dlgValidUntil').value,maxDevices:Number(byId('dlgMaxDevices').value||1),note:byId('dlgNote').value});
      byId('accessDialog')?.remove(); toast('تم تحديث وصول المستخدم.'); openLicenseDeviceAdmin();
    }catch(e){toast(e.message||String(e));}
  };
  window.resetUserDevices=async function(userId){ if(!confirm('سيتم إلغاء/استبدال كل أجهزة هذا المستخدم. هل تريد المتابعة؟')) return; try{ await SandAuthApi.resetUserDevices({userId}); toast('تم تصفير أجهزة المستخدم.'); openLicenseDeviceAdmin(); }catch(e){toast(e.message||e);} };
  window.setDeviceStatus=async function(deviceId,status){ try{ await SandAuthApi.updateDeviceStatus({deviceId,status}); toast('تم تحديث حالة الجهاز.'); openLicenseDeviceAdmin(); setTimeout(()=>setLicenseTab('devices'),0);}catch(e){toast(e.message||e);} };
  window.setLicenseStatus=async function(licenseId,status){ try{ await SandAuthApi.updateLicenseStatus({licenseId,status}); toast('تم تحديث حالة الترخيص.'); openLicenseDeviceAdmin(); setTimeout(()=>setLicenseTab('licenses'),0);}catch(e){toast(e.message||e);} };
})();
