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
  function canManageMemberships(){ return !!api()?.hasPermission?.('users.manage') || !!api()?.hasPermission?.('roles.manage') || !!api()?.hasPermission?.('licenses.manage'); }
  function routeAfterLogin(){
    try {
      if (canManageMemberships()) { window.openMembershipAdmin && window.openMembershipAdmin(); return; }
      if (typeof goHome === 'function') { goHome(); return; }
    } catch(_) {}
    const v = appView();
    if (v) v.innerHTML = shell('✅ تم تسجيل الدخول','تم تفعيل الجلسة بنجاح. يمكنك الآن استخدام الأدوات المصرح بها لحسابك.', `<div class="settings-card success-card"><h3>مرحبًا بك</h3><p>تم تسجيل الدخول، وتظهر لك الأدوات وفق الصلاحيات المعتمدة لحسابك.</p><button class="gold-btn" onclick="goHome && goHome()">الانتقال للرئيسية</button></div>`, '', false);
  }
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

  function shell(title, subtitle, body, tools='', showNotice=true){
    return `<section class="admin-settings-page auth-admin-page"><div class="page-title-row"><div><span class="eyebrow">العضويات والصلاحيات</span><h2>${title}</h2><p>${subtitle}</p></div><div class="admin-toolbar">${tools}</div></div>${showNotice ? apiNotice() : ''}${body}</section>`;
  }

  function passwordStrength(p){
    let score=0; if((p||'').length>=8)score++; if(/[A-Z]/.test(p))score++; if(/[a-z]/.test(p))score++; if(/\d/.test(p))score++; if(/[^A-Za-z0-9]/.test(p))score++;
    const label = score<=2?'ضعيفة':score===3?'متوسطة':score===4?'قوية':'قوية جدًا';
    const level = score<=2?'weak':score===3?'medium':score===4?'strong':'very-strong';
    return {score,label,level,width:Math.max(20,score*20)};
  }

  function renderRegisterApi(){
    return shell('📝 طلب عضوية قضائية جديدة','شاشة تسجيل احترافية مخصصة للتحقق من صفة طالب العضوية قبل التفعيل. الطلب يُحفظ في D1 بحالة انتظار موافقة الإدارة.', `<div class="auth-signup-public-shell"><form id="sandApiRegisterForm" class="settings-card auth-form-card professional-signup-card"><div class="signup-hero"><div><span class="eyebrow">طلب عضوية مؤسسي</span><h3>بيانات طالب العضوية</h3><p>املأ البيانات بدقة حتى يمكن للإدارة مراجعة الصفة القضائية وتحديد مدة العضوية والصلاحيات المناسبة.</p></div><div class="signup-lock-badge">🔐 مراجعة يدوية قبل التفعيل</div></div>

      <div class="signup-section"><h4>أولًا — بيانات الحساب الأساسية</h4><div class="signup-grid two-cols">
        <label>الاسم الكامل <span class="required">*</span><input id="regFullName" autocomplete="name" placeholder="الاسم كما يفضل ظهوره داخل المنصة"></label>
        <label>اسم المستخدم <span class="required">*</span><input id="regUsername" autocomplete="username" dir="ltr" placeholder="username"></label>
        <label>البريد الإلكتروني<input id="regEmail" type="email" autocomplete="email" dir="ltr" placeholder="example@domain.com"></label>
        <label>رقم الهاتف للتواصل الإداري<input id="regPhone" type="tel" dir="ltr" placeholder="اختياري — رقم للتواصل عند مراجعة الطلب"></label>
      </div><div class="form-info" id="regUsernameInfo"></div><div class="form-error" id="regFullNameError"></div><div class="form-error" id="regUsernameError"></div><div class="form-error" id="regEmailError"></div></div>

      <div class="signup-section signup-photo-section"><h4>ثانيًا — صورة العضو للتحقق الإداري <span class="required">*</span></h4><p class="muted-text">أرفق صورة شخصية واضحة وحديثة. لا ترفع صورة بطاقة أو مستند رسمي في هذه المرحلة.</p><div class="member-photo-upload professional-editor"><div id="regAvatarPreview" class="member-photo-preview editor-preview"><span>👤</span><small>لم يتم اختيار صورة</small></div><div class="member-photo-tools professional"><input id="regAvatar" type="file" accept="image/png,image/jpeg,image/webp" hidden><div class="photo-main-actions"><button type="button" class="gold-btn" onclick="document.getElementById('regAvatar').click()">اختيار وضبط الصورة</button><button type="button" class="soft-btn" id="regAvatarChange" style="display:none" onclick="document.getElementById('regAvatar').click()">تغيير الصورة</button><button type="button" class="danger-soft-btn" id="regAvatarRemove" style="display:none">إزالة الصورة</button></div><div class="form-info">سيتم فتح محرر الصورة: اسحب الصورة داخل الإطار، اضبط التكبير، ثم اضغط اعتماد الصورة. تُحفظ نسخة موحدة ونسخة مصغرة تلقائيًا.</div><div class="form-error" id="regAvatarError"></div></div></div></div>

      <div class="signup-section"><h4>ثالثًا — البيانات القضائية للتحقق من الصفة</h4><div class="signup-grid two-cols">
        <label>الصفة / الدرجة القضائية <span class="required">*</span><select id="regJudicialTitle"><option value="">اختر الصفة</option><option>معاون نيابة</option><option>مساعد نيابة</option><option>وكيل نيابة</option><option>رئيس نيابة</option><option>مدير نيابة</option><option>باحث قانوني / إداري مصرح له</option><option>أخرى</option></select></label>
        <label>النيابة التابع لها <span class="required">*</span><input id="regProsecutionOffice" placeholder="مثال: نيابة منفلوط الجزئية"></label>
        <label>النيابة الكلية / الجهة الأعلى<input id="regParentProsecution" placeholder="مثال: نيابة شمال أسيوط الكلية"></label>
        <label>المحافظة / الدائرة<input id="regJudicialDistrict" placeholder="مثال: أسيوط"></label>
        <label>الرقم الوظيفي أو الكود الداخلي — إن وجد<input id="regEmployeeCode" dir="ltr" placeholder="اختياري"></label>
        <label>البريد الرسمي أو بريد العمل — إن وجد<input id="regOfficialEmail" type="email" dir="ltr" placeholder="اختياري"></label>
      </div><div class="form-error" id="regJudicialError"></div></div>

      <div class="signup-section"><h4>رابعًا — بيانات تساعد الإدارة في المراجعة</h4><div class="signup-grid two-cols">
        <label>سبب طلب العضوية <span class="required">*</span><select id="regRequestReason"><option value="">اختر السبب</option><option>استخدام سَنَد في تحليل الوقائع</option><option>مراجعة القوانين والمواعيد</option><option>إعداد التقارير والمسودات</option><option>إدارة محتوى المنصة</option><option>تجربة مبدئية بإذن الإدارة</option></select></label>
        <label>نوع العضوية المطلوبة<select id="regRequestedAccess"><option value="member">عضو مستخدم</option><option value="reviewer">مراجع</option><option value="content_manager">إدارة محتوى</option><option value="trial">تجربة محدودة</option></select></label>
        <label>اسم مسؤول أو مرجع يمكن التحقق منه<input id="regReferenceName" placeholder="اختياري — الاسم والصفة"></label>
        <label>وسيلة تحقق إضافية<input id="regVerificationContact" placeholder="اختياري — هاتف مكتب / بريد رسمي / ملاحظة"></label>
      </div><label>ملاحظات إضافية<textarea id="regNotes" rows="3" placeholder="أي تفاصيل تساعد الإدارة في التحقق من صفتك أو تحديد الصلاحيات المناسبة"></textarea></label><div class="form-error" id="regReasonError"></div></div>

      <div class="signup-section"><h4>خامسًا — كلمة المرور</h4><div class="signup-grid two-cols">
        <label>كلمة المرور <span class="required">*</span><div class="password-input-wrapper"><input id="regPassword" type="password" autocomplete="new-password" placeholder="كلمة مرور قوية"><button type="button" class="password-toggle" onclick="toggleAuthPasswordField('regPassword')">👁</button></div></label>
        <label>تأكيد كلمة المرور <span class="required">*</span><div class="password-input-wrapper"><input id="regConfirmPassword" type="password" autocomplete="new-password" placeholder="أعد كلمة المرور"><button type="button" class="password-toggle" onclick="toggleAuthPasswordField('regConfirmPassword')">👁</button></div></label>
      </div><div class="password-strength" id="regPasswordStrength"></div><div class="form-error" id="regPasswordError"></div><div class="form-error" id="regConfirmPasswordError"></div></div>

      <div class="signup-section signup-ack"><label class="checkbox-label"><input id="regDataAccuracy" type="checkbox"> <span>أقر بصحة البيانات المقدمة وبأنها لغرض مراجعة طلب العضوية فقط.</span></label><label class="checkbox-label"><input id="regTerms" type="checkbox"> <span>أقر بأن الحساب لا يتفعل إلا بعد موافقة الإدارة وتحديد المدة والصلاحيات وعدد الأجهزة.</span></label><div class="form-error" id="regTermsError"></div></div>

      <div class="form-actions"><button class="gold-btn" id="regSubmitBtn" type="submit">إرسال طلب العضوية للمراجعة</button><button class="soft-btn" type="button" onclick="openSandAuthLogin()">لدي حساب</button></div>
    </form><aside class="settings-card signup-review-card"><h3>ما الذي ستراجعه الإدارة؟</h3><ul class="quality-list"><li>مطابقة الاسم والصفة والنيابة التابعة.</li><li>مدى الحاجة إلى الصلاحيات المطلوبة.</li><li>مدة العضوية المناسبة وعدد الأجهزة.</li><li>تحديد الدور: عضو، مراجع، إدارة محتوى، تجربة.</li><li>تسجيل كل قبول أو رفض في Audit Log.</li></ul><div class="settings-alert">لا ترفع صور بطاقات أو مستندات حساسة داخل هذه المرحلة. يتم التحقق الإداري من خلال البيانات والاتصال المباشر عند الحاجة.</div></aside></div>`, '', false);
  }
  function mountRegisterApi(){
    const username=byId('regUsername'), pass=byId('regPassword'), form=byId('sandApiRegisterForm'); let timer=null; let selectedAvatar=null; let selectedAvatarThumb=null;
    username?.addEventListener('input',()=>{ clearTimeout(timer); const v=username.value.trim(); byId('regUsernameInfo').textContent=''; byId('regUsernameError').textContent=''; if(v.length<3) return; byId('regUsernameInfo').textContent='جاري التحقق من السيرفر...'; timer=setTimeout(async()=>{ try{ const r=await api().checkUsername(v); byId('regUsernameInfo').textContent = r.exists ? '' : '✓ اسم المستخدم متاح'; byId('regUsernameError').textContent = r.exists ? 'اسم المستخدم مستخدم بالفعل' : ''; }catch(e){ byId('regUsernameInfo').textContent=''; byId('regUsernameError').textContent=e.message; } }, 450); });
    pass?.addEventListener('input',()=>{ const s=passwordStrength(pass.value); byId('regPasswordStrength').innerHTML=`<div class="strength-bar"><div class="strength-fill strength-${s.level}" style="width:${s.width}%"></div></div><span class="strength-label">${s.label}</span>`; });

    function updateAvatarPreview(imageDataUrl, thumbDataUrl){
      selectedAvatar=imageDataUrl || null;
      selectedAvatarThumb=thumbDataUrl || imageDataUrl || null;
      const prev=byId('regAvatarPreview');
      if(prev){
        prev.innerHTML = selectedAvatar
          ? `<img src="${selectedAvatarThumb || selectedAvatar}" alt="صورة العضو"><small>تم اعتماد الصورة</small>`
          : '<span>👤</span><small>لم يتم اختيار صورة</small>';
      }
      const rm=byId('regAvatarRemove'), ch=byId('regAvatarChange');
      if(rm) rm.style.display = selectedAvatar ? 'inline-flex' : 'none';
      if(ch) ch.style.display = selectedAvatar ? 'inline-flex' : 'none';
    }

    byId('regAvatar')?.addEventListener('change', async (e)=>{
      const file=e.target.files?.[0]; const err=byId('regAvatarError'); if(err) err.textContent='';
      if(!file) return;
      try{
        if(!window.NovAvatarEditor?.editFile) throw new Error('محرر الصورة غير محمل. حدّث الصفحة ثم حاول مرة أخرى.');
        const result = await window.NovAvatarEditor.editFile(file);
        if(result?.imageDataUrl){
          updateAvatarPreview(result.imageDataUrl, result.thumbnailDataUrl);
        } else {
          e.target.value='';
        }
      }catch(ex){
        updateAvatarPreview(null,null);
        if(err) err.textContent = ex.message || 'تعذر ضبط الصورة المختارة';
        e.target.value='';
      }
    });

    byId('regAvatarRemove')?.addEventListener('click',()=>{
      updateAvatarPreview(null,null);
      const inp=byId('regAvatar'); if(inp) inp.value='';
      const err=byId('regAvatarError'); if(err) err.textContent='';
    });
    updateAvatarPreview(null,null);
    form?.addEventListener('submit',async e=>{ e.preventDefault(); document.querySelectorAll('.form-error').forEach(x=>x.textContent='');
      const fullName=byId('regFullName').value.trim();
      const usernameVal=byId('regUsername').value.trim();
      const email=byId('regEmail').value.trim();
      const phone=byId('regPhone').value.trim();
      const judicialTitle=byId('regJudicialTitle').value.trim();
      const prosecutionOffice=byId('regProsecutionOffice').value.trim();
      const parentProsecution=byId('regParentProsecution').value.trim();
      const judicialDistrict=byId('regJudicialDistrict').value.trim();
      const employeeCode=byId('regEmployeeCode').value.trim();
      const officialEmail=byId('regOfficialEmail').value.trim();
      const requestReason=byId('regRequestReason').value.trim();
      const requestedAccess=byId('regRequestedAccess').value.trim();
      const referenceName=byId('regReferenceName').value.trim();
      const verificationContact=byId('regVerificationContact').value.trim();
      const notes=byId('regNotes').value.trim();
      const password=byId('regPassword').value, confirm=byId('regConfirmPassword').value;
      let bad=false;
      if(!fullName){byId('regFullNameError').textContent='الاسم الكامل مطلوب';bad=true;}
      if(!selectedAvatar){byId('regAvatarError').textContent='صورة العضو الشخصية مطلوبة لمراجعة طلب العضوية';bad=true;}
      if(!/^[a-zA-Z0-9_.-]{3,32}$/.test(usernameVal)){byId('regUsernameError').textContent='اسم المستخدم يجب أن يكون 3 إلى 32 حرفًا بالإنجليزية أو الأرقام أو _ . -';bad=true;}
      if(email&&!/^\S+@\S+\.\S+$/.test(email)){byId('regEmailError').textContent='البريد الإلكتروني غير صحيح';bad=true;}
      if(officialEmail&&!/^\S+@\S+\.\S+$/.test(officialEmail)){byId('regJudicialError').textContent='البريد الرسمي غير صحيح';bad=true;}
      if(!judicialTitle || !prosecutionOffice){byId('regJudicialError').textContent='الصفة القضائية والنيابة التابع لها بيانات أساسية للمراجعة';bad=true;}
      if(!requestReason){byId('regReasonError').textContent='اختر سبب طلب العضوية';bad=true;}
      if(password.length<8){byId('regPasswordError').textContent='كلمة المرور يجب ألا تقل عن 8 أحرف';bad=true;}
      if(password!==confirm){byId('regConfirmPasswordError').textContent='كلمتا المرور غير متطابقتين';bad=true;}
      if(!byId('regDataAccuracy').checked || !byId('regTerms').checked){byId('regTermsError').textContent='يجب الإقرار بصحة البيانات وسياسة العضوية';bad=true;}
      if(bad) return;
      const judicialProfile = {
        phone, judicialTitle, prosecutionOffice, parentProsecution, judicialDistrict,
        employeeCode, officialEmail, requestReason, requestedAccess, referenceName,
        verificationContact, notes, memberPhoto: selectedAvatar, memberPhotoThumb: selectedAvatarThumb, memberPhotoSubmitted: true, submittedAt: new Date().toISOString()
      };
      const btn=byId('regSubmitBtn'); btn.disabled=true; btn.textContent='جاري إرسال الطلب...';
      try{ const res=await api().register({ fullName, username:usernameVal, email:email||null, organization: prosecutionOffice, judicialProfile, password, termsAccepted:true, dataAccuracyAccepted:true });
        appView().innerHTML=shell('✅ تم إرسال طلب العضوية','طلبك الآن في انتظار مراجعة الإدارة والتحقق من الصفة القضائية.',`<div class="settings-card success-card"><h3>تم تسجيل طلب العضوية بنجاح</h3><p>${esc(res.message || 'تم تسجيل طلب العضوية وهو الآن بانتظار موافقة الإدارة.')}</p><p>لن يتم تفعيل الحساب إلا بعد مراجعة البيانات القضائية، وتحديد الدور، ومدة العضوية، وعدد الأجهزة، والصلاحيات المسموح بها.</p><button class="gold-btn" onclick="openSandAuthLogin()">الانتقال إلى تسجيل الدخول</button></div>`);
      }catch(e){ toast(e.message,'error'); btn.disabled=false; btn.textContent='إرسال طلب العضوية للمراجعة'; }
    });
  }
  function renderLoginApi(){
    const u = api()?.currentUser?.();
    return shell('🔐 تسجيل الدخول','بوابة دخول مؤسسية للأعضاء المصرح لهم فقط.', `<div class="auth-login-gateway"><form id="sandApiLoginForm" class="settings-card auth-form-card login-gateway-card"><h3>دخول مستخدم مصرح له</h3>${u?`<div class="settings-alert">أنت مسجل حاليًا باسم: <strong>${esc(u.fullName || u.full_name || u.username)}</strong></div>`:''}<label>اسم المستخدم<input id="loginUsername" autocomplete="username" placeholder="اسم المستخدم"></label><label>كلمة المرور<div class="password-input-wrapper"><input id="loginPassword" type="password" autocomplete="current-password" placeholder="كلمة المرور"><button type="button" class="password-toggle" onclick="toggleAuthPasswordField('loginPassword')">👁</button></div></label><div class="form-error" id="loginError"></div><div class="form-actions"><button class="gold-btn" id="loginBtn" type="submit">دخول</button>${u?'<button class="danger-soft-btn" type="button" onclick="logoutFromAuthApi()">تسجيل خروج</button>':''}</div><div class="login-secondary-link"><span>لا تملك حسابًا مفعلًا؟</span><button class="link-btn" type="button" onclick="openSandRegister()">تقديم طلب عضوية للمراجعة</button></div></form><aside class="settings-card login-policy-card"><h3>سياسة الدخول</h3><ul class="quality-list"><li>الدخول متاح فقط للحسابات المفعلة إداريًا.</li><li>طلبات العضوية لا تمنح أي صلاحية قبل المراجعة.</li><li>مدة العضوية وعدد الأجهزة والصلاحيات يحددها المالك أو المدير المخول.</li><li>الجلسات والأجهزة وسجل العمليات تتم مراجعتها من لوحة الإدارة.</li></ul></aside></div>`, '', false);
  }
  function mountLoginApi(){
    byId('sandApiLoginForm')?.addEventListener('submit', async e=>{ e.preventDefault(); byId('loginError').textContent=''; const btn=byId('loginBtn'); btn.disabled=true; btn.textContent='جاري الدخول...';
      try{ const res=await api().login(byId('loginUsername').value.trim(), byId('loginPassword').value); toast('تم تسجيل الدخول بنجاح.'); routeAfterLogin(); }
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
  function parseProfile(u){
    try { return typeof u.judicial_profile_json === 'string' ? JSON.parse(u.judicial_profile_json || '{}') : (u.judicialProfile || u.profile || {}); }
    catch(_) { return {}; }
  }
  function profileLine(label, value){ return value ? `<div><span>${label}</span><strong>${esc(value)}</strong></div>` : ''; }
  function membershipReviewScore(profile){
    const checks = [
      profile.memberPhoto || profile.memberPhotoThumb,
      profile.judicialTitle,
      profile.prosecutionOffice,
      profile.parentProsecution,
      profile.judicialDistrict,
      profile.phone,
      profile.officialEmail,
      profile.requestReason,
      profile.referenceName || profile.verificationContact
    ];
    const score = Math.round(checks.filter(Boolean).length / checks.length * 100);
    return score;
  }
  function reviewBadge(score){
    const label = score >= 80 ? 'بيانات قوية' : score >= 55 ? 'تحتاج مراجعة' : 'بيانات ناقصة';
    const cls = score >= 80 ? 'strong' : score >= 55 ? 'medium' : 'weak';
    return `<span class="review-score ${cls}">${score}% — ${label}</span>`;
  }
  function buildPendingCard(u, roles){
    const p = parseProfile(u);
    const score = membershipReviewScore(p);
    const roleOptions=roles.map(r=>`<option value="${esc(r.id)}">${esc(roleLabel(r))}</option>`).join('') || '<option value="role_member">عضو</option>';
    const created = (u.created_at || '').replace('T',' ').slice(0,19) || '—';
    return `<article class="membership-request-card pro-review-card" id="request_${esc(u.id)}">
      <div class="request-head pro-review-head">
        <div class="request-member-head">
          ${p.memberPhotoThumb || p.memberPhoto ? `<img class="request-member-photo" src="${esc(p.memberPhotoThumb || p.memberPhoto)}" alt="صورة العضو">` : '<div class="request-member-photo placeholder">👤</div>'}
          <div>
            <h4>${esc(u.full_name)}</h4>
            <small dir="ltr">${esc(u.username)} — ${esc(u.email||'بدون بريد')}</small>
            <div class="review-meta-line"><span>تاريخ الطلب: ${esc(created)}</span>${reviewBadge(score)}</div>
          </div>
        </div>
        <span class="auth-status auth-pending_approval">بانتظار المراجعة</span>
      </div>
      <div class="judicial-profile-grid compact-profile-grid">
        ${profileLine('الصفة القضائية',p.judicialTitle)}${profileLine('النيابة التابع لها',p.prosecutionOffice)}${profileLine('النيابة الكلية / الجهة الأعلى',p.parentProsecution)}${profileLine('المحافظة / الدائرة',p.judicialDistrict)}${profileLine('الهاتف',p.phone)}${profileLine('البريد الرسمي',p.officialEmail)}${profileLine('الكود الداخلي',p.employeeCode)}${profileLine('سبب الطلب',p.requestReason)}${profileLine('نوع العضوية',p.requestedAccess)}${profileLine('مرجع للتحقق',p.referenceName)}${profileLine('وسيلة تحقق إضافية',p.verificationContact)}
      </div>
      ${p.notes?`<div class="request-notes"><strong>ملاحظات الطالب:</strong><br>${esc(p.notes)}</div>`:''}
      <div class="review-actions-row">
        <button class="gold-btn" onclick="openMembershipReviewDialog('${esc(u.id)}')">فتح بطاقة المراجعة</button>
        <button class="soft-btn" onclick="copyMembershipRequestData('${esc(u.id)}')">نسخ البيانات</button>
        <button class="danger-soft-btn" onclick="rejectApiUserProfessional('${esc(u.id)}')">رفض</button>
      </div>
      <div class="approval-box professional-approval quick-approval-box">
        <label>الدور<select id="role_${esc(u.id)}">${roleOptions}</select></label>
        <label>بداية العضوية<input id="from_${esc(u.id)}" type="date" value="${new Date().toISOString().slice(0,10)}"></label>
        <label>نهاية العضوية<input id="valid_${esc(u.id)}" type="date" value="${new Date(Date.now()+365*864e5).toISOString().slice(0,10)}"></label>
        <label>عدد الأجهزة<input id="dev_${esc(u.id)}" type="number" min="1" max="10" value="1"></label>
        <label class="checkbox-label inline-check"><input id="must_${esc(u.id)}" type="checkbox" checked> <span>إلزام تغيير كلمة المرور عند أول دخول</span></label>
        <button class="gold-btn" onclick="approveApiUserProfessional('${esc(u.id)}')">قبول وتفعيل</button>
        <button class="soft-btn" onclick="requestMembershipCompletion('${esc(u.id)}')">طلب استكمال بيانات</button>
      </div>
    </article>`;
  }
  function renderPending(list, roles){
    const strong=list.filter(u=>membershipReviewScore(parseProfile(u))>=80).length;
    const mid=list.filter(u=>{const s=membershipReviewScore(parseProfile(u)); return s>=55&&s<80}).length;
    const weak=list.length-strong-mid;
    return `<div class="auth-panel active" data-api-panel="pending">
      <div class="settings-card membership-review-dashboard">
        <div class="review-board-head">
          <div><h3>لوحة مراجعة طلبات العضوية القضائية</h3><p class="muted-text">مركز مراجعة احترافي للطلبات قبل التفعيل، مع صورة العضو والبيانات القضائية وقرار القبول أو الرفض أو طلب الاستكمال.</p></div>
          <div class="review-stats"><span>الإجمالي <b>${list.length}</b></span><span>قوية <b>${strong}</b></span><span>مراجعة <b>${mid}</b></span><span>ناقصة <b>${weak}</b></span></div>
        </div>
        ${list.length?`<div class="membership-request-list professional-review-list">${list.map(u=>buildPendingCard(u, roles)).join('')}</div>`:'<div class="empty-state"><h4>لا توجد طلبات عضوية معلقة</h4><p>عند تقديم طلب عضوية جديد سيظهر هنا للمراجعة قبل التفعيل.</p></div>'}
      </div>
    </div>`;
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
    if(!canManageMemberships()) { v.innerHTML=shell('⛔ غير مصرح','هذه اللوحة مخصصة لمالك النظام أو مدير العضويات فقط.', `<div class="settings-card"><p>حسابك مفعل، لكن لا يملك صلاحية إدارة العضويات والصلاحيات.</p><button class="gold-btn" onclick="goHome && goHome()">العودة للرئيسية</button></div>`, '', false); return; }
    v.innerHTML=shell('👥 العضويات والصلاحيات','إدارة فعلية من Cloudflare D1 عبر Worker Auth API.', `<div class="loading-card">جاري تحميل بيانات العضويات من السيرفر...</div>`);
    try{ const data=await fetchAdminData();
      v.innerHTML=shell('👥 العضويات والصلاحيات','إدارة فعلية من Cloudflare D1 عبر Worker Auth API.', `${data.errors.length?`<div class="settings-alert danger-soft">${data.errors.map(esc).join('<br>')}</div>`:''}${tabs(active)}<div class="auth-panels">${renderPending(data.pending,data.roles)}${renderUsers(data.users)}${renderDevices(data.devices)}${renderAudit(data.audit)}${renderBootstrap()}</div>`);
      setAuthApiTab(active);
    }catch(e){ v.innerHTML=shell('👥 العضويات والصلاحيات','تعذر تحميل لوحة الإدارة.', `<div class="settings-card"><p class="form-error">${esc(e.message)}</p><button class="gold-btn" onclick="openSandAuthLogin()">تسجيل الدخول</button><button class="soft-btn" onclick="openMembershipAdmin()">إعادة المحاولة</button></div>`); }
  }
  function findPendingUser(userId){
    const el = document.getElementById('request_'+userId);
    return { el };
  }
  window.openMembershipReviewDialog=function(userId){
    // يعاد تحميل أحدث بيانات الطلب من اللوحة المعروضة؛ فتح البطاقة التفصيلية من DOM كحل واجهة آمن.
    const card=document.getElementById('request_'+userId);
    if(!card) return;
    const html = card.cloneNode(true);
    html.querySelectorAll('.quick-approval-box,.review-actions-row').forEach(x=>x.remove());
    const modal=document.createElement('div');
    modal.className='review-modal-backdrop';
    modal.innerHTML=`<div class="review-modal"><button class="review-modal-close" onclick="this.closest('.review-modal-backdrop').remove()">×</button><h3>بطاقة مراجعة طلب العضوية</h3><div class="review-modal-body">${html.outerHTML}</div><div class="approval-box modal-approval-box"><label>الدور<select id="modal_role_${esc(userId)}">${document.getElementById('role_'+userId)?.innerHTML||''}</select></label><label>بداية العضوية<input id="modal_from_${esc(userId)}" type="date" value="${document.getElementById('from_'+userId)?.value||new Date().toISOString().slice(0,10)}"></label><label>نهاية العضوية<input id="modal_valid_${esc(userId)}" type="date" value="${document.getElementById('valid_'+userId)?.value||''}"></label><label>عدد الأجهزة<input id="modal_dev_${esc(userId)}" type="number" min="1" max="10" value="${document.getElementById('dev_'+userId)?.value||1}"></label><textarea id="modal_note_${esc(userId)}" placeholder="ملاحظات المراجعة الداخلية / سبب القرار"></textarea><div class="form-actions"><button class="gold-btn" onclick="approveApiUserProfessional('${esc(userId)}', true)">قبول وتفعيل</button><button class="soft-btn" onclick="requestMembershipCompletion('${esc(userId)}', true)">طلب استكمال</button><button class="danger-soft-btn" onclick="rejectApiUserProfessional('${esc(userId)}', true)">رفض الطلب</button></div></div></div>`;
    document.body.appendChild(modal);
  };
  window.copyMembershipRequestData=function(userId){
    const card=document.getElementById('request_'+userId);
    if(!card) return;
    const text=card.innerText.replace(/\n{3,}/g,'\n\n');
    navigator.clipboard?.writeText(text).then(()=>toast('تم نسخ بيانات الطلب.')).catch(()=>toast(text));
  };
  window.approveApiUserProfessional=async function(userId, fromModal=false){
    try{
      const prefix=fromModal?'modal_':'';
      const roleId=byId(prefix+'role_'+userId)?.value || byId('role_'+userId)?.value || 'role_member';
      const validFrom=byId(prefix+'from_'+userId)?.value || byId('from_'+userId)?.value || new Date().toISOString().slice(0,10);
      const validUntil=byId(prefix+'valid_'+userId)?.value || byId('valid_'+userId)?.value;
      const maxDevices=Number(byId(prefix+'dev_'+userId)?.value || byId('dev_'+userId)?.value || 1);
      const reviewNote=byId(prefix+'note_'+userId)?.value || '';
      if(!validUntil) return toast('حدد تاريخ نهاية العضوية أولًا.','error');
      if(!confirm('تأكيد قبول وتفعيل العضوية بهذه الصلاحيات والمدة؟')) return;
      await api().approveUser({ userId, roleId, validFrom, validUntil, maxDevices, reviewNote, mustChangePassword:true });
      toast('تم قبول العضوية وتفعيل الحساب.');
      document.querySelector('.review-modal-backdrop')?.remove();
      renderAdminApi('pending');
    }catch(e){ toast(e.message,'error'); }
  };
  window.rejectApiUserProfessional=async function(userId, fromModal=false){
    try{
      const reason = fromModal ? (byId('modal_note_'+userId)?.value || '') : (prompt('اكتب سبب الرفض:') || '');
      if(!reason.trim()) return toast('سبب الرفض مطلوب لتسجيل القرار في سجل العمليات.','error');
      if(!confirm('تأكيد رفض طلب العضوية؟')) return;
      await api().rejectUser({ userId, reason });
      toast('تم رفض الطلب وتسجيل السبب.');
      document.querySelector('.review-modal-backdrop')?.remove();
      renderAdminApi('pending');
    }catch(e){ toast(e.message,'error'); }
  };
  window.requestMembershipCompletion=async function(userId, fromModal=false){
    try{
      const reason = fromModal ? (byId('modal_note_'+userId)?.value || '') : (prompt('ما البيانات المطلوب استكمالها؟') || '');
      if(!reason.trim()) return toast('اكتب البيانات المطلوب استكمالها.','error');
      if(api().requestCompletion) await api().requestCompletion({ userId, reason });
      else await api().rejectUser({ userId, reason:'طلب استكمال بيانات: '+reason });
      toast('تم تسجيل طلب استكمال البيانات في سجل العمليات.');
      document.querySelector('.review-modal-backdrop')?.remove();
      renderAdminApi('pending');
    }catch(e){ toast(e.message,'error'); }
  };
  window.setAuthApiTab=function(tab){ document.querySelectorAll('[data-api-tab]').forEach(b=>b.classList.toggle('active',b.dataset.apiTab===tab)); document.querySelectorAll('[data-api-panel]').forEach(p=>p.classList.toggle('active',p.dataset.apiPanel===tab)); };
  window.approveApiUser=function(userId){ return window.approveApiUserProfessional(userId); };
  window.rejectApiUser=function(userId){ return window.rejectApiUserProfessional(userId); };
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
