// Phase 5.5.4 — Frontend bridge: registration/login/admin panels connected to Worker Auth API
(function(){
  const original = {
    openSandRegister: window.openSandRegister,
    openSandAuthLogin: window.openSandAuthLogin,
    openMembershipAdmin: window.openMembershipAdmin
  };
  function api(){ return window.SandAuthApi; }
  function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}
  function byId(id){return document.getElementById(id);}
  function appView(){return byId('appView');}
  function toast(msg,type='info'){
    if(typeof judicialToast==='function') judicialToast(msg);
    else if(window.showToast) window.showToast(msg,type);
    else alert(msg);
  }
  function closeNav(){ if(typeof closeSidebar==='function') closeSidebar(); }
  function updateNav(key){ document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active')); document.querySelector(`[data-nav="${key}"]`)?.classList.add('active'); }
  function configured(){ return !!api()?.isConfigured?.(); }
  function roleLabel(r){ return r?.display_name || r?.role_display_name || r?.name || r?.id || 'غير محدد'; }
  function statusLabel(s){ return ({active:'نشط',pending_approval:'بانتظار الموافقة',suspended:'موقوف',expired:'منتهي',blocked:'محظور',rejected:'مرفوض'})[s] || s || 'غير محدد'; }
  function statusBadge(s){ return `<span class="auth-status auth-${esc(s||'unknown')}">${esc(statusLabel(s))}</span>`; }
  function niceDate(v){ return v ? String(v).slice(0,10) : '—'; }
  function apiNotice(){
    const base = api()?.getBase?.() || '';
    return `<div class="settings-alert auth-api-alert"><strong>وضع التشغيل:</strong> ${base ? 'متصل بـ Worker Auth API' : 'لم يتم ضبط رابط Auth API بعد'} ${base ? `<br><code dir="ltr">${esc(base)}</code>` : '<br>اضبط الرابط من إعدادات المنصة أو من الخانة أدناه.'}</div>`;
  }
  function renderBaseConfigBox(){
    return `<article class="settings-card auth-api-config-box"><h3>رابط Auth API</h3><p>ضع رابط Cloudflare Worker الخاص بالعضويات والصلاحيات، وليس Worker سَنَد/Gemini.</p><div class="inline-form"><input id="authApiBaseInput" dir="ltr" placeholder="https://north-assiut-legal-auth-api.xxx.workers.dev" value="${esc(api()?.getBase?.()||'')}"><button class="gold-btn" onclick="saveAuthApiBaseFromPanel()">حفظ الرابط</button><button class="soft-btn" onclick="testAuthApiHealth()">اختبار الاتصال</button></div><div id="authApiHealthResult" class="form-info"></div></article>`;
  }
  window.saveAuthApiBaseFromPanel = function(){
    const base = byId('authApiBaseInput')?.value?.trim() || '';
    api()?.setBase?.(base);
    try {
      const patch = { backend:{ authApiUrl: base } };
      window.SandConfig?.saveLocal?.(patch);
    } catch(_) {}
    toast('تم حفظ رابط Auth API.');
  };
  window.testAuthApiHealth = async function(){
    const box = byId('authApiHealthResult');
    try {
      window.saveAuthApiBaseFromPanel?.();
      const res = await api().health();
      if(box) box.innerHTML = `✅ الاتصال ناجح — ${esc(res.service || 'auth-api')} / ${esc(res.phase || '')}`;
    } catch(e) {
      if(box) box.innerHTML = `❌ ${esc(e.message || e)}`;
    }
  };

  function shell(title, subtitle, body, tools=''){
    return `<section class="admin-settings-page auth-admin-page"><div class="page-title-row"><div><span class="eyebrow">العضويات والصلاحيات</span><h2>${title}</h2><p>${subtitle}</p></div><div class="admin-toolbar">${tools}</div></div>${apiNotice()}${body}</section>`;
  }

  function passwordStrength(p){
    let score=0; if((p||'').length>=8)score++; if(/[A-Z]/.test(p))score++; if(/[a-z]/.test(p))score++; if(/\d/.test(p))score++; if(/[^A-Za-z0-9]/.test(p))score++;
    const label = score<=2?'ضعيفة':score===3?'متوسطة':score===4?'قوية':'قوية جدًا';
    const level = score<=2?'weak':score===3?'medium':score===4?'strong':'very-strong';
    return {score,label,level,width:Math.max(20,score*20)};
  }

  function renderRegisterApi(){
    return shell('📝 تسجيل عضوية جديدة','طلب التسجيل يُرسل إلى Cloudflare Worker ويُحفظ في D1 بحالة انتظار موافقة الإدارة.', `<div class="auth-two-col">${renderBaseConfigBox()}<form id="sandApiRegisterForm" class="settings-card auth-form-card"><h3>بيانات طالب العضوية</h3>
      <label>الاسم الكامل <span class="required">*</span><input id="regFullName" autocomplete="name" placeholder="أدخل الاسم الكامل"></label><div class="form-error" id="regFullNameError"></div>
      <label>اسم المستخدم <span class="required">*</span><input id="regUsername" autocomplete="username" placeholder="اسم مستخدم فريد"></label><div class="form-info" id="regUsernameInfo"></div><div class="form-error" id="regUsernameError"></div>
      <label>البريد الإلكتروني<input id="regEmail" type="email" autocomplete="email" placeholder="example@domain.com"></label><div class="form-error" id="regEmailError"></div>
      <label>الصفة / الجهة<input id="regOrganization" placeholder="النيابة / الجهة / الصفة"></label>
      <label>كلمة المرور <span class="required">*</span><div class="password-input-wrapper"><input id="regPassword" type="password" autocomplete="new-password" placeholder="كلمة مرور قوية"><button type="button" class="password-toggle" onclick="toggleAuthPasswordField('regPassword')">👁</button></div></label><div class="password-strength" id="regPasswordStrength"></div><div class="form-error" id="regPasswordError"></div>
      <label>تأكيد كلمة المرور <span class="required">*</span><div class="password-input-wrapper"><input id="regConfirmPassword" type="password" autocomplete="new-password" placeholder="أعد كلمة المرور"><button type="button" class="password-toggle" onclick="toggleAuthPasswordField('regConfirmPassword')">👁</button></div></label><div class="form-error" id="regConfirmPasswordError"></div>
      <label class="checkbox-label"><input id="regTerms" type="checkbox"> <span>أقر بأن الحساب لا يتفعل إلا بعد موافقة الإدارة وتحديد المدة والصلاحيات.</span></label><div class="form-error" id="regTermsError"></div>
      <div class="form-actions"><button class="gold-btn" id="regSubmitBtn" type="submit">إرسال طلب التسجيل</button><button class="soft-btn" type="button" onclick="openSandAuthLogin()">لدي حساب</button></div>
    </form><aside class="settings-card"><h3>دورة العضوية الآمنة</h3><ul class="quality-list"><li>الطلب يُحفظ في D1 بحالة pending_approval.</li><li>لا توجد صلاحيات قبل موافقة المالك أو المدير المخوّل.</li><li>القبول يحدد الدور ومدة العضوية وعدد الأجهزة.</li><li>كل عملية تُسجل في Audit Log داخل الـBackend.</li></ul></aside></div>`);
  }
  function mountRegisterApi(){
    const username=byId('regUsername'), pass=byId('regPassword'), form=byId('sandApiRegisterForm'); let timer=null;
    username?.addEventListener('input',()=>{ clearTimeout(timer); const v=username.value.trim(); byId('regUsernameInfo').textContent=''; byId('regUsernameError').textContent=''; if(v.length<3) return; byId('regUsernameInfo').textContent='جاري التحقق من السيرفر...'; timer=setTimeout(async()=>{ try{ const r=await api().checkUsername(v); byId('regUsernameInfo').textContent = r.exists ? '' : '✓ اسم المستخدم متاح'; byId('regUsernameError').textContent = r.exists ? 'اسم المستخدم مستخدم بالفعل' : ''; }catch(e){ byId('regUsernameInfo').textContent=''; byId('regUsernameError').textContent=e.message; } }, 450); });
    pass?.addEventListener('input',()=>{ const s=passwordStrength(pass.value); byId('regPasswordStrength').innerHTML=`<div class="strength-bar"><div class="strength-fill strength-${s.level}" style="width:${s.width}%"></div></div><span class="strength-label">${s.label}</span>`; });
    form?.addEventListener('submit',async e=>{ e.preventDefault(); document.querySelectorAll('.form-error').forEach(x=>x.textContent='');
      const fullName=byId('regFullName').value.trim(), usernameVal=byId('regUsername').value.trim(), email=byId('regEmail').value.trim(), organization=byId('regOrganization').value.trim(), password=byId('regPassword').value, confirm=byId('regConfirmPassword').value;
      let bad=false; if(!fullName){byId('regFullNameError').textContent='الاسم الكامل مطلوب';bad=true;} if(!/^[a-zA-Z0-9_.-]{3,32}$/.test(usernameVal)){byId('regUsernameError').textContent='اسم المستخدم غير صحيح';bad=true;} if(email&&!/^\S+@\S+\.\S+$/.test(email)){byId('regEmailError').textContent='البريد الإلكتروني غير صحيح';bad=true;} if(password.length<8){byId('regPasswordError').textContent='كلمة المرور يجب ألا تقل عن 8 أحرف';bad=true;} if(password!==confirm){byId('regConfirmPasswordError').textContent='كلمتا المرور غير متطابقتين';bad=true;} if(!byId('regTerms').checked){byId('regTermsError').textContent='يجب الإقرار بسياسة العضوية';bad=true;} if(bad) return;
      const btn=byId('regSubmitBtn'); btn.disabled=true; btn.textContent='جاري إرسال الطلب...';
      try{ const res=await api().register({ fullName, username:usernameVal, email:email||null, organization, password, termsAccepted:true });
        appView().innerHTML=shell('✅ تم إرسال طلب التسجيل','طلبك الآن في انتظار موافقة الإدارة.',`<div class="settings-card success-card"><h3>تم تسجيل الطلب بنجاح</h3><p>${esc(res.message || 'تم تسجيل طلب العضوية وهو الآن بانتظار موافقة الإدارة.')}</p><p>لن تتمكن من الدخول إلا بعد قبول الطلب وتحديد الصلاحيات ومدة العضوية.</p><button class="gold-btn" onclick="openSandAuthLogin()">الانتقال إلى تسجيل الدخول</button></div>`);
      }catch(e){ toast(e.message,'error'); btn.disabled=false; btn.textContent='إرسال طلب التسجيل'; }
    });
  }

  function renderLoginApi(){
    const u = api()?.currentUser?.();
    return shell('🔐 تسجيل الدخول','الدخول يتم عبر Cloudflare Worker وجلسة محفوظة في D1.', `<div class="auth-two-col">${renderBaseConfigBox()}<form id="sandApiLoginForm" class="settings-card auth-form-card"><h3>بيانات الدخول</h3>${u?`<div class="settings-alert">أنت مسجل حاليًا باسم: <strong>${esc(u.fullName || u.full_name || u.username)}</strong></div>`:''}<label>اسم المستخدم<input id="loginUsername" autocomplete="username" placeholder="اسم المستخدم"></label><label>كلمة المرور<div class="password-input-wrapper"><input id="loginPassword" type="password" autocomplete="current-password" placeholder="كلمة المرور"><button type="button" class="password-toggle" onclick="toggleAuthPasswordField('loginPassword')">👁</button></div></label><div class="form-error" id="loginError"></div><div class="form-actions"><button class="gold-btn" id="loginBtn" type="submit">دخول</button><button class="soft-btn" type="button" onclick="openSandRegister()">تسجيل عضوية</button>${u?'<button class="danger-soft-btn" type="button" onclick="logoutFromAuthApi()">تسجيل خروج</button>':''}</div></form><aside class="settings-card"><h3>حماية الجلسة</h3><ul class="quality-list"><li>التوكن لا يُحفظ في D1؛ يتم حفظ Hash فقط.</li><li>تاريخ انتهاء الجلسة يُحدد من السيرفر.</li><li>الجهاز يُسجل ببصمة محلية عشوائية.</li><li>الحساب المنتهي أو غير المفعل لا يدخل.</li></ul></aside></div>`);
  }
  function mountLoginApi(){
    byId('sandApiLoginForm')?.addEventListener('submit', async e=>{ e.preventDefault(); byId('loginError').textContent=''; const btn=byId('loginBtn'); btn.disabled=true; btn.textContent='جاري الدخول...';
      try{ const res=await api().login(byId('loginUsername').value.trim(), byId('loginPassword').value); toast('تم تسجيل الدخول بنجاح.'); window.openMembershipAdmin(); }
      catch(err){ byId('loginError').textContent=err.message; btn.disabled=false; btn.textContent='دخول'; }
    });
  }
  window.logoutFromAuthApi = async function(){ try{ await api().logout(); toast('تم تسجيل الخروج.'); }catch(_){} window.openSandAuthLogin(); };
  window.toggleAuthPasswordField=function(id){ const x=byId(id); if(x)x.type=x.type==='password'?'text':'password'; };

  async function fetchAdminData(){
    const [users, pending, roles, devices, audit] = await Promise.allSettled([api().users(), api().pendingUsers(), api().roles(), api().devices(), api().audit(100)]);
    return {
      users: users.status==='fulfilled' ? (users.value.users || []) : [],
      pending: pending.status==='fulfilled' ? (pending.value.requests || []) : [],
      roles: roles.status==='fulfilled' ? (roles.value.roles || []) : [],
      devices: devices.status==='fulfilled' ? (devices.value.devices || []) : [],
      audit: audit.status==='fulfilled' ? (audit.value.logs || audit.value.audit || []) : [],
      errors: [users,pending,roles,devices,audit].filter(x=>x.status==='rejected').map(x=>x.reason?.message || String(x.reason))
    };
  }
  function tabs(active='pending'){
    const list=[['pending','طلبات العضوية'],['users','المستخدمون'],['devices','الأجهزة'],['audit','سجل العمليات'],['bootstrap','التهيئة الآمنة']];
    return `<div class="auth-admin-tabs">${list.map(([k,t])=>`<button data-api-tab="${k}" class="${k===active?'active':''}" onclick="setAuthApiTab('${k}')">${t}</button>`).join('')}</div>`;
  }
  function renderPending(list, roles){
    const roleOptions=roles.map(r=>`<option value="${esc(r.id)}">${esc(roleLabel(r))}</option>`).join('') || '<option value="role_member">عضو</option>';
    return `<div class="auth-panel active" data-api-panel="pending"><div class="settings-card"><h3>طلبات العضوية من D1</h3>${list.length?`<div class="table-wrap"><table class="admin-table"><thead><tr><th>الاسم</th><th>اسم المستخدم</th><th>البريد</th><th>تاريخ الطلب</th><th>الاعتماد</th></tr></thead><tbody>${list.map(u=>`<tr><td>${esc(u.full_name)}</td><td dir="ltr">${esc(u.username)}</td><td>${esc(u.email||'—')}</td><td>${niceDate(u.created_at)}</td><td><div class="approval-box"><select id="role_${esc(u.id)}">${roleOptions}</select><input id="valid_${esc(u.id)}" type="date" value="${new Date(Date.now()+365*864e5).toISOString().slice(0,10)}"><input id="dev_${esc(u.id)}" type="number" min="1" max="10" value="1"><button class="gold-btn" onclick="approveApiUser('${esc(u.id)}')">قبول</button><button class="danger-soft-btn" onclick="rejectApiUser('${esc(u.id)}')">رفض</button></div></td></tr>`).join('')}</tbody></table></div>`:'<p>لا توجد طلبات عضوية معلقة.</p>'}</div></div>`;
  }
  function renderUsers(list){
    return `<div class="auth-panel" data-api-panel="users"><div class="settings-card"><h3>المستخدمون النشطون والمسجلون</h3><div class="table-wrap"><table class="admin-table"><thead><tr><th>المستخدم</th><th>الدور</th><th>الحالة</th><th>الصلاحية</th><th>آخر دخول</th><th>إجراء</th></tr></thead><tbody>${list.map(u=>`<tr><td><strong>${esc(u.full_name||u.fullName)}</strong><br><small dir="ltr">${esc(u.username)}</small></td><td>${esc(roleLabel(u))}</td><td>${statusBadge(u.status)}</td><td>${niceDate(u.valid_until)}</td><td>${niceDate(u.last_login_at)}</td><td>${u.is_super_owner?'مالك النظام':`<button class="soft-btn" onclick="updateApiUserStatus('${esc(u.id)}','active')">تفعيل</button><button class="danger-soft-btn" onclick="updateApiUserStatus('${esc(u.id)}','suspended')">إيقاف</button>`}</td></tr>`).join('') || '<tr><td colspan="6">لا توجد بيانات.</td></tr>'}</tbody></table></div></div></div>`;
  }
  function renderDevices(list){
    return `<div class="auth-panel" data-api-panel="devices"><div class="settings-card"><h3>الأجهزة المفعلة</h3><div class="table-wrap"><table class="admin-table"><thead><tr><th>المستخدم</th><th>الجهاز</th><th>الحالة</th><th>آخر ظهور</th><th>إجراء</th></tr></thead><tbody>${list.map(d=>`<tr><td>${esc(d.username||d.user_id||'—')}</td><td>${esc(d.device_label||'جهاز غير مسمى')}</td><td>${statusBadge(d.status)}</td><td>${niceDate(d.last_seen_at)}</td><td><button class="soft-btn" onclick="updateApiDeviceStatus('${esc(d.id)}','active')">تفعيل</button><button class="danger-soft-btn" onclick="updateApiDeviceStatus('${esc(d.id)}','suspended')">إيقاف</button></td></tr>`).join('') || '<tr><td colspan="5">لا توجد أجهزة.</td></tr>'}</tbody></table></div></div></div>`;
  }
  function renderAudit(list){
    return `<div class="auth-panel" data-api-panel="audit"><div class="settings-card"><h3>سجل العمليات المركزي</h3><div class="table-wrap"><table class="admin-table"><thead><tr><th>الوقت</th><th>العملية</th><th>الخطورة</th><th>التفاصيل</th></tr></thead><tbody>${list.map(a=>`<tr><td>${esc((a.created_at||a.at||'').replace('T',' ').slice(0,19))}</td><td>${esc(a.action)}</td><td>${esc(a.severity)}</td><td><code>${esc(typeof a.details_json==='string'?a.details_json:JSON.stringify(a.details||{}))}</code></td></tr>`).join('') || '<tr><td colspan="4">لا توجد عمليات.</td></tr>'}</tbody></table></div></div></div>`;
  }
  function renderBootstrap(){
    return `<div class="auth-panel" data-api-panel="bootstrap"><div class="settings-card"><h3>التهيئة الآمنة Secure Bootstrap</h3><p>هذه الشاشة تتحقق من حالة أول مالك للنظام وتبدأ طلب Bootstrap عند الحاجة.</p><div class="form-actions"><button class="soft-btn" onclick="loadBootstrapApiStatus()">فحص الحالة</button><button class="gold-btn" onclick="createBootstrapApiRequest()">إنشاء طلب Bootstrap</button></div><pre id="bootstrapApiBox" class="code-box" dir="ltr"></pre></div></div>`;
  }
  async function renderAdminApi(active='pending'){
    const v=appView(); if(!v)return; updateNav('membership-admin'); closeNav();
    if(!configured()) { v.innerHTML=shell('👥 العضويات والصلاحيات','يلزم ضبط رابط Auth API قبل تشغيل الإدارة الإنتاجية.', `<div class="settings-grid">${renderBaseConfigBox()}<article class="settings-card"><h3>وضع محلي احتياطي</h3><p>يمكن الرجوع مؤقتًا لواجهة 5.5.1 المحلية، لكن الصلاحيات الحقيقية تعمل عبر Worker + D1.</p><button class="soft-btn" onclick="openLocalMembershipAdminFallback()">فتح الإدارة المحلية المؤقتة</button></article></div>`); return; }
    if(!api().isLoggedIn()) { v.innerHTML=shell('👥 العضويات والصلاحيات','تسجيل الدخول مطلوب للوصول إلى إدارة العضويات.', `<div class="settings-card"><p>سجّل الدخول بحساب مالك النظام أو مدير لديه صلاحية users.manage.</p><button class="gold-btn" onclick="openSandAuthLogin()">تسجيل الدخول</button></div>`); return; }
    v.innerHTML=shell('👥 العضويات والصلاحيات','إدارة فعلية من Cloudflare D1 عبر Worker Auth API.', `<div class="loading-card">جاري تحميل بيانات العضويات من السيرفر...</div>`);
    try{ const data=await fetchAdminData();
      v.innerHTML=shell('👥 العضويات والصلاحيات','إدارة فعلية من Cloudflare D1 عبر Worker Auth API.', `${data.errors.length?`<div class="settings-alert danger-soft">${data.errors.map(esc).join('<br>')}</div>`:''}${tabs(active)}<div class="auth-panels">${renderPending(data.pending,data.roles)}${renderUsers(data.users)}${renderDevices(data.devices)}${renderAudit(data.audit)}${renderBootstrap()}</div>`);
      setAuthApiTab(active);
    }catch(e){ v.innerHTML=shell('👥 العضويات والصلاحيات','تعذر تحميل لوحة الإدارة.', `<div class="settings-card"><p class="form-error">${esc(e.message)}</p><button class="gold-btn" onclick="openSandAuthLogin()">تسجيل الدخول</button><button class="soft-btn" onclick="openMembershipAdmin()">إعادة المحاولة</button></div>`); }
  }
  window.setAuthApiTab=function(tab){ document.querySelectorAll('[data-api-tab]').forEach(b=>b.classList.toggle('active',b.dataset.apiTab===tab)); document.querySelectorAll('[data-api-panel]').forEach(p=>p.classList.toggle('active',p.dataset.apiPanel===tab)); };
  window.approveApiUser=async function(userId){ try{ await api().approveUser({ userId, roleId:byId('role_'+userId)?.value || 'role_member', validUntil:byId('valid_'+userId)?.value, maxDevices:Number(byId('dev_'+userId)?.value||1) }); toast('تم قبول العضوية.'); renderAdminApi('pending'); }catch(e){ toast(e.message,'error'); } };
  window.rejectApiUser=async function(userId){ try{ const reason=prompt('سبب الرفض اختياري:') || ''; await api().rejectUser({ userId, reason }); toast('تم رفض الطلب.'); renderAdminApi('pending'); }catch(e){ toast(e.message,'error'); } };
  window.updateApiUserStatus=async function(userId,status){ try{ await api().updateUserStatus({ userId, status }); toast('تم تحديث حالة المستخدم.'); renderAdminApi('users'); }catch(e){ toast(e.message,'error'); } };
  window.updateApiDeviceStatus=async function(deviceId,status){ try{ await api().updateDeviceStatus({ deviceId, status }); toast('تم تحديث حالة الجهاز.'); renderAdminApi('devices'); }catch(e){ toast(e.message,'error'); } };
  window.loadBootstrapApiStatus=async function(){ try{ const r=await api().bootstrapStatus(); byId('bootstrapApiBox').textContent=JSON.stringify(r,null,2); }catch(e){ byId('bootstrapApiBox').textContent=e.message; } };
  window.createBootstrapApiRequest=async function(){ try{ const r=await api().bootstrapRequest(); byId('bootstrapApiBox').textContent=JSON.stringify(r,null,2); }catch(e){ byId('bootstrapApiBox').textContent=e.message; } };

  window.openLocalMembershipAdminFallback=function(){ original.openMembershipAdmin?.(); };
  window.openSandRegister=function(){ const v=appView(); if(!v)return; updateNav('auth-register'); closeNav(); v.innerHTML=renderRegisterApi(); mountRegisterApi(); };
  window.openSandAuthLogin=function(){ const v=appView(); if(!v)return; updateNav('auth-login'); closeNav(); v.innerHTML=renderLoginApi(); mountLoginApi(); };
  window.openMembershipAdmin=function(){ renderAdminApi('pending'); };

  // واجهة صلاحيات تمهيدية: تعطيل بعض الأزرار الإدارية عند عدم وجود صلاحية بعد تسجيل الدخول.
  window.SandAuthBridge = {
    original,
    openMembershipAdminApi: renderAdminApi,
    configured,
    currentUser: ()=>api()?.currentUser?.(),
    hasPermission: (p)=>api()?.hasPermission?.(p)
  };
})();
