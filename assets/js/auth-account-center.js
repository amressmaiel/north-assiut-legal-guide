/* Phase 5.12 — My Account, Password and Session Center
   واجهة حساب المستخدم: بيانات العضوية، تغيير كلمة المرور، الجلسات والأجهزة الخاصة بالمستخدم. */
(function(){
  const byId = id => document.getElementById(id);
  const esc = window.esc || (v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])));
  const fmt = v => v ? new Date(v).toLocaleString('ar-EG', { dateStyle:'medium', timeStyle:'short' }) : '—';
  const dateOnly = v => v ? String(v).slice(0,10) : '—';
  function ensureView(){
    if (typeof closeMobileMenu === 'function') closeMobileMenu();
    const app = byId('appView');
    if (!app) return null;
    window.scrollTo({ top:0, behavior:'smooth' });
    document.querySelectorAll('.nav-btn[data-nav]').forEach(btn=>btn.classList.toggle('active', btn.dataset.nav==='my-account'));
    return app;
  }
  function api(){ return window.SandAuthApi; }
  function hasApi(){ return !!api()?.isConfigured?.(); }
  function currentUser(){ return api()?.currentUser?.() || null; }
  function perms(){ return api()?.permissions?.() || []; }
  function statusLabel(s){
    return ({active:'نشط', pending_approval:'بانتظار الموافقة', suspended:'موقوف', expired:'منتهي', blocked:'محظور', rejected:'مرفوض'}[s] || s || 'غير محدد');
  }
  function statusBadge(s){ return `<span class="auth-status auth-${esc(s||'unknown')}">${esc(statusLabel(s))}</span>`; }
  function membershipRemaining(user){
    if (!user?.validUntil) return 'غير محدد';
    const end = new Date(user.validUntil).getTime();
    const days = Math.ceil((end - Date.now()) / 86400000);
    if (days < 0) return `منتهية منذ ${Math.abs(days)} يوم`;
    if (days === 0) return 'تنتهي اليوم';
    return `${days} يوم متبقٍ`;
  }
  function renderPermissionChips(list){
    if (!Array.isArray(list) || !list.length) return '<span class="muted">لا توجد صلاحيات تفصيلية ظاهرة.</span>';
    return list.slice(0,80).map(p=>`<span class="permission-chip">${esc(p)}</span>`).join('');
  }
  function renderSessions(rows){
    if (!rows?.length) return '<div class="empty-note">لا توجد جلسات مسجلة.</div>';
    return `<div class="table-wrap"><table class="institutional-table"><thead><tr><th>الجهاز</th><th>الحالة</th><th>بداية الجلسة</th><th>آخر نشاط</th><th>انتهاء الجلسة</th></tr></thead><tbody>${rows.map(s=>`<tr><td><b>${esc(s.device_label||'جهاز غير مسمى')}</b><br><small dir="ltr">${esc((s.id||'').slice(0,10))}</small></td><td>${s.revoked_at?'<span class="auth-status auth-suspended">منتهية</span>':'<span class="auth-status auth-active">نشطة</span>'}</td><td>${fmt(s.created_at)}</td><td>${fmt(s.last_seen_at)}</td><td>${fmt(s.expires_at)}</td></tr>`).join('')}</tbody></table></div>`;
  }
  function renderDevices(rows){
    if (!rows?.length) return '<div class="empty-note">لا توجد أجهزة مسجلة لهذا الحساب.</div>';
    return `<div class="device-mini-grid">${rows.map(d=>`<article class="mini-device-card"><div><b>${esc(d.device_label||'جهاز غير مسمى')}</b><span>${statusBadge(d.status)}</span></div><small>أول استخدام: ${fmt(d.first_seen_at)}</small><small>آخر استخدام: ${fmt(d.last_seen_at)}</small></article>`).join('')}</div>`;
  }
  function shell(title, subtitle, body, tools=''){
    return `<div class="page"><section class="admin-settings-page account-center-page"><div class="page-title-row"><div><span class="eyebrow">مركز الحساب</span><h2>${title}</h2><p>${subtitle}</p></div><div class="admin-toolbar">${tools}</div></div>${body}</section></div>`;
  }
  function renderLoginNeeded(){
    return shell('🔐 تسجيل الدخول مطلوب','مركز الحساب الشخصي متاح بعد تسجيل الدخول فقط.', `<div class="settings-card login-required-card"><h3>لم يتم تسجيل الدخول</h3><p>يرجى تسجيل الدخول لمراجعة بيانات العضوية والجلسات وتغيير كلمة المرور.</p><button class="gold-btn" onclick="openSandAuthLogin && openSandAuthLogin()">تسجيل الدخول</button></div>`);
  }
  function renderNoApi(){
    return shell('تعذر فتح مركز الحساب','لم يتم ضبط رابط Auth API بعد.', `<div class="settings-alert"><b>رابط Auth API غير مضبوط.</b><br>يجب ضبط رابط Worker الخاص بالعضويات من إعدادات المنصة.</div><button class="gold-btn" onclick="openAdminSettings && openAdminSettings()">فتح إعدادات المنصة</button>`);
  }
  async function renderAccount(){
    const view = ensureView(); if(!view) return;
    if (!hasApi()) { view.innerHTML = renderNoApi(); return; }
    let user = currentUser();
    if (!user) { view.innerHTML = renderLoginNeeded(); return; }
    view.innerHTML = shell('👤 حسابي وعضويتي','مراجعة بيانات الحساب والجلسة وتغيير كلمة المرور وإدارة الجهاز الحالي.', '<div class="loading-card">جاري تحميل بيانات الحساب...</div>');
    try {
      const me = await api().me();
      user = me.user || currentUser();
      const permissions = me.permissions || perms();
      let sessions = [], devices = [];
      try { sessions = (await api().mySessions()).sessions || []; } catch(_) {}
      try { devices = (await api().myDevices()).devices || []; } catch(_) {}
      const mustChange = !!(user.mustChangePassword || user.must_change_password);
      view.innerHTML = shell('👤 حسابي وعضويتي','مركز مراجعة بيانات العضوية والجلسات الخاصة بالمستخدم الحالي.', `
        ${mustChange?`<div class="settings-alert danger"><b>يلزم تغيير كلمة المرور.</b><br>حسابك مضبوط على تغيير كلمة المرور عند أول دخول أو بعد إجراء إداري.</div>`:''}
        <div class="account-overview-grid">
          <article class="settings-card account-main-card">
            <div class="account-avatar-large">${user.avatar?`<img src="${esc(user.avatar)}" alt="صورة المستخدم">`:'👤'}</div>
            <div><h3>${esc(user.fullName || user.full_name || user.username)}</h3><p dir="ltr">${esc(user.username)}</p>${statusBadge(user.status)}</div>
          </article>
          <article class="settings-card"><h3>الدور والصلاحية</h3><p>${esc(user.roleDisplayName || user.role_display_name || user.roleName || user.role_name || '—')}</p><small>${user.isSuperOwner||user.is_super_owner?'مالك النظام — صلاحيات كاملة':'تظهر الأدوات حسب الصلاحيات الممنوحة.'}</small></article>
          <article class="settings-card"><h3>مدة العضوية</h3><p>${dateOnly(user.validFrom || user.valid_from)} ← ${dateOnly(user.validUntil || user.valid_until)}</p><small>${esc(membershipRemaining({validUntil:user.validUntil || user.valid_until}))}</small></article>
          <article class="settings-card"><h3>الجهاز الحالي</h3><p>${esc(navigator.platform || 'Browser')}</p><small dir="ltr">${esc(api().getDeviceFingerprint().slice(0,28))}...</small></article>
        </div>
        <div class="account-center-layout">
          <section class="settings-card password-change-card">
            <h3>🔑 تغيير كلمة المرور</h3>
            <p>استخدم كلمة مرور قوية. بعد التغيير يمكن إنهاء الجلسات الأخرى اختياريًا.</p>
            <form id="changePasswordForm" class="account-form">
              <label>كلمة المرور الحالية<input id="currentPassword" type="password" autocomplete="current-password"></label>
              <label>كلمة المرور الجديدة<input id="newPassword" type="password" autocomplete="new-password"></label>
              <label>تأكيد كلمة المرور الجديدة<input id="confirmNewPassword" type="password" autocomplete="new-password"></label>
              <label class="checkbox-label"><input id="revokeOtherSessions" type="checkbox" checked><span>إنهاء الجلسات الأخرى بعد تغيير كلمة المرور</span></label>
              <div class="form-error" id="changePasswordError"></div><div class="form-info" id="changePasswordInfo"></div>
              <button class="gold-btn" type="submit">تغيير كلمة المرور</button>
            </form>
          </section>
          <section class="settings-card"><h3>🔐 الصلاحيات الحالية</h3><div class="permission-chip-wrap">${renderPermissionChips(permissions)}</div></section>
        </div>
        <section class="settings-card"><h3>🕘 جلساتي</h3>${renderSessions(sessions)}</section>
        <section class="settings-card"><h3>🖥️ أجهزتي المسجلة</h3>${renderDevices(devices)}</section>
      `, `<button class="soft-btn" onclick="openMyAccountCenter()">تحديث</button><button class="danger-soft-btn" onclick="logoutFromAuthApi && logoutFromAuthApi()">تسجيل خروج</button>`);
      mountPasswordForm();
    } catch (e) {
      view.innerHTML = shell('تعذر تحميل الحساب','حدث خطأ أثناء التواصل مع Auth API.', `<div class="settings-alert danger">${esc(e.message || e)}</div><button class="soft-btn" onclick="openMyAccountCenter()">إعادة المحاولة</button>`);
    }
  }
  function mountPasswordForm(){
    byId('changePasswordForm')?.addEventListener('submit', async (ev)=>{
      ev.preventDefault();
      const err = byId('changePasswordError'), info = byId('changePasswordInfo');
      if(err) err.textContent=''; if(info) info.textContent='';
      const currentPassword = byId('currentPassword')?.value || '';
      const newPassword = byId('newPassword')?.value || '';
      const confirm = byId('confirmNewPassword')?.value || '';
      if (newPassword !== confirm) { if(err) err.textContent='كلمة المرور الجديدة غير متطابقة.'; return; }
      try {
        await api().changePassword({ currentPassword, newPassword, revokeOtherSessions: !!byId('revokeOtherSessions')?.checked });
        if(info) info.textContent='تم تغيير كلمة المرور بنجاح.';
        byId('currentPassword').value=''; byId('newPassword').value=''; byId('confirmNewPassword').value='';
        setTimeout(()=>renderAccount(), 800);
      } catch(e) { if(err) err.textContent = e.message || 'تعذر تغيير كلمة المرور.'; }
    });
  }
  window.openMyAccountCenter = renderAccount;
  window.addEventListener('sand:auth-session-updated', ()=>{
    const active = document.querySelector('.nav-btn[data-nav="my-account"].active');
    if(active) renderAccount();
  });
})();
