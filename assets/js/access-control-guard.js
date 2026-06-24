/**
 * access-control-guard.js — Phase 5.10
 * محرك إنفاذ الصلاحيات وحالة الدخول على مستوى الواجهة.
 * ملاحظة: الحسم الأمني النهائي يجب أن يبقى في Cloudflare Worker، وهذا الملف ينظم الواجهة ويمنع التشغيل العرضي.
 */
(function(){
  const NAV_POLICY = {
    'membership-admin': ['users.manage','roles.manage','licenses.manage'],
    'license-device-admin': ['licenses.manage','users.manage'],
    'access-control-center': ['users.manage','roles.manage','audit.view'],
    'security-audit-center': ['audit.view','users.manage','licenses.manage'],
    'admin-settings': ['settings.manage'],
    'content-admin': ['content.manage','templates.manage','laws.manage'],
    'case-analysis': ['case.analysis'],
    'judicial-tools': ['tools.use'],
    'sand': ['sand.text'],
    'laws': ['laws.read'],
    'reports': ['reports.export']
  };
  const TOOL_POLICY = [
    { selector:'[onclick*="openMembershipAdmin"]', permissions:['users.manage','roles.manage','licenses.manage'] },
    { selector:'[onclick*="openLicenseDeviceAdmin"]', permissions:['licenses.manage','users.manage'] },
    { selector:'[onclick*="openInstitutionalContentAdmin"]', permissions:['content.manage','templates.manage','laws.manage'] },
    { selector:'[onclick*="openSecurityAuditCenter"]', permissions:['audit.view','users.manage','licenses.manage'] },
    { selector:'[onclick*="openAccessControlCenter"]', permissions:['users.manage','roles.manage','audit.view'] }
  ];
  function auth(){ return window.SandAuthApi; }
  function user(){ return auth()?.currentUser?.() || null; }
  function isOwner(){ const u=user(); return !!(u?.isSuperOwner || u?.is_super_owner || u?.role_key==='super_owner' || u?.role==='Super Owner'); }
  function isLogged(){ return !!auth()?.isLoggedIn?.(); }
  function hasAny(perms){ if(isOwner()) return true; if(!Array.isArray(perms) || !perms.length) return true; return perms.some(p=>auth()?.hasPermission?.(p)); }
  function esc(v){ return String(v??'').replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[m])); }
  function toast(msg){ if(typeof judicialToast==='function') judicialToast(msg); else alert(msg); }
  function authState(){
    const u=user();
    if(!u) return {state:'visitor', label:'زائر', details:'تسجيل الدخول مطلوب'};
    const status=u.status || u.account_status || 'active';
    if(status === 'pending_approval') return {state:'pending', label:'بانتظار الموافقة', details:'طلب العضوية قيد المراجعة'};
    if(status !== 'active') return {state:'blocked', label:'غير نشط', details:'الحساب غير مفعل أو موقوف'};
    const exp = u.valid_until || u.validUntil || auth()?.expiresAt?.();
    if(exp && new Date(exp).getTime() < Date.now()) return {state:'expired', label:'منتهي', details:'انتهت مدة العضوية'};
    return {state:'active', label:isOwner()?'مالك النظام':'جلسة مفعلة', details:u.full_name || u.fullName || u.username || 'مستخدم'};
  }
  function updateAuthShell(){
    const st=authState();
    document.body.dataset.authState = st.state;
    document.body.classList.toggle('sand-guest-mode', st.state !== 'active');
    document.querySelectorAll('[data-nav]').forEach(btn=>{
      const nav=btn.getAttribute('data-nav');
      const required=NAV_POLICY[nav];
      const allowed=(st.state==='active') && hasAny(required);
      if(required) btn.classList.toggle('permission-hidden', !allowed);
      btn.disabled = !!required && !allowed;
      if(required && !allowed) btn.setAttribute('title','غير متاح حسب صلاحيات العضوية'); else btn.removeAttribute('title');
    });
    TOOL_POLICY.forEach(rule=>{
      document.querySelectorAll(rule.selector).forEach(el=>{
        const allowed=(st.state==='active') && hasAny(rule.permissions);
        el.classList.toggle('permission-hidden', !allowed);
        el.disabled = !allowed;
      });
    });
    let badge=document.getElementById('sandSessionBadge');
    if(!badge){
      badge=document.createElement('div');
      badge.id='sandSessionBadge';
      badge.className='session-badge';
      document.body.appendChild(badge);
    }
    badge.innerHTML = `<b>${esc(st.label)}</b><span>${esc(st.details)}</span>`;
  }
  function requirePermissions(perms, message){
    if(!isLogged()){ window.openSandAuthLogin?.(); return false; }
    const st=authState();
    if(st.state !== 'active'){ toast(st.details || 'الحساب غير مفعل.'); return false; }
    if(!hasAny(perms)){ toast(message || 'ليست لديك صلاحية فتح هذه الشاشة.'); return false; }
    return true;
  }
  function renderPermissionMatrix(){
    const perms = auth()?.permissions?.() || [];
    const u=user();
    const rows = Object.entries(NAV_POLICY).map(([area, required])=>{
      const ok=hasAny(required);
      return `<tr><td>${esc(area)}</td><td>${esc(required.join(' أو '))}</td><td>${ok?'✅ مسموح':'⛔ غير مسموح'}</td></tr>`;
    }).join('');
    return `<section class="admin-settings-page access-control-page">
      <div class="page-title-row"><div><span class="eyebrow">Phase 5.10</span><h2>🛡️ مركز إنفاذ الصلاحيات</h2><p>مراجعة ما يظهر للمستخدم وما يتم حجبه حسب الدور والصلاحيات الحالية.</p></div><button class="gold-btn" onclick="SandAccessGuard.refresh()">تحديث</button></div>
      <div class="settings-grid two">
        <article class="settings-card"><h3>حالة الجلسة</h3><p><b>${esc(u?.full_name||u?.fullName||u?.username||'غير مسجل')}</b></p><p>${esc(authState().label)} — ${esc(authState().details)}</p></article>
        <article class="settings-card"><h3>الصلاحيات الفعلية</h3><p>${isOwner()?'مالك النظام — كل الصلاحيات':(perms.length?esc(perms.join('، ')):'لا توجد صلاحيات محفوظة في الجلسة')}</p></article>
      </div>
      <div class="settings-card wide"><h3>مصفوفة الوصول للشاشات</h3><table class="admin-table"><thead><tr><th>الشاشة</th><th>الصلاحيات المطلوبة</th><th>الحالة</th></tr></thead><tbody>${rows}</tbody></table></div>
      <div class="settings-alert">تنبيه: هذه الطبقة تنظم الواجهة. القرار الأمني النهائي يجب أن يبقى دائمًا في Worker وD1.</div>
    </section>`;
  }
  window.openAccessControlCenter=function(){
    if(!requirePermissions(['users.manage','roles.manage','audit.view'],'هذه الشاشة مخصصة لمالك النظام أو مدير الصلاحيات.')) return;
    if(typeof closeSidebar==='function') closeSidebar();
    document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
    document.querySelector('[data-nav="access-control-center"]')?.classList.add('active');
    const v=document.getElementById('appView'); if(v) v.innerHTML=renderPermissionMatrix();
  };
  window.SandAccessGuard={ refresh:updateAuthShell, requirePermissions, hasAny, state:authState };
  window.addEventListener('sand:auth-session-updated', updateAuthShell);
  window.addEventListener('storage', updateAuthShell);
  document.addEventListener('DOMContentLoaded', ()=>setTimeout(updateAuthShell, 150));
})();
