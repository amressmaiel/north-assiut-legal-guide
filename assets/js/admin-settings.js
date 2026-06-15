/**
 * admin-settings.js — Phase 5.24
 * مركز الإعدادات العامة المتقدم للمنصة القضائية.
 * Local-first, no frontend secrets. يربط الهوية، الخدمات، السياسات، الواجهة، الضيوف، التدريب، التواصل، التخزين.
 */
(function(){
  const SETTINGS_KEY = 'northAssiutLegalGuide.settings.v1';
  const ADVANCED_AUDIT_KEY = 'sand_advanced_settings_audit_v524';
  const CONNECTION_TEST_KEY = 'sand_settings_last_connection_tests_v524';
  const workerFields = [
    ['backend.proxyUrl','setProxyUrl','Worker سَنَد / Gemini','sand_ai_proxy_url'],
    ['backend.authApiUrl','setAuthApiUrl','Auth API','sand_auth_api_url'],
    ['backend.communicationApiUrl','setCommApiUrl','Realtime Communication','sand_comm_realtime_api_url'],
    ['backend.caseFilesApiUrl','setCaseFilesApiUrl','Case Files','sand_case_files_api_url'],
    ['backend.caseSharingApiUrl','setCaseSharingApiUrl','Case Sharing','sand_case_files_sharing_api_url'],
    ['backend.legalContentApiUrl','setLegalContentApiUrl','Legal Content','sand_legal_content_api_url'],
    ['backend.reportsApiUrl','setReportsApiUrl','Institutional Reports','sand_reports_api_url'],
    ['backend.backupApiUrl','setBackupApiUrl','Backup & Restore','sand_backup_api_url'],
    ['backend.maintenanceSecurityApiUrl','setMaintenanceApiUrl','Maintenance / Security','sand_maintenance_security_api_url']
  ];

  function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}
  function byId(id){return document.getElementById(id);}
  function toast(msg){ if(typeof judicialToast==='function') judicialToast(msg); else alert(msg); }
  function baseCfg(){return window.SAND_APP_CONFIG || window.SAND_DEFAULT_APP_CONFIG || {};}
  function currentUser(){
    try{ if(window.SandAuthApi?.currentUser) return window.SandAuthApi.currentUser() || null; }catch(_){ }
    try{ return JSON.parse(localStorage.getItem('sand_auth_user')||localStorage.getItem('sand_current_user')||localStorage.getItem('sand_auth_session')||'null'); }catch(_){ return null; }
  }
  function hasPerm(p){ try{return !!window.SandAuthApi?.hasPermission?.(p);}catch(_){return false;} }
  function isAdmin(){
    const u=currentUser()||{};
    const role=String(u.role||u.accountRole||u.userRole||'').toLowerCase();
    return !!(u.isSuperOwner||u.is_super_owner||u.isOwner||['owner','system_owner','super_owner','admin','manager'].some(x=>role.includes(x))) || hasPerm('settings.manage') || hasPerm('platform.settings.manage') || hasPerm('users.manage');
  }
  function deepMerge(base, extra){
    if(!extra || typeof extra !== 'object') return base;
    const out = Array.isArray(base) ? [...base] : {...(base||{})};
    Object.keys(extra).forEach(k=>{
      const bv=out[k], ev=extra[k];
      if(ev && typeof ev==='object' && !Array.isArray(ev) && bv && typeof bv==='object' && !Array.isArray(bv)) out[k]=deepMerge(bv,ev);
      else out[k]=ev;
    });
    return out;
  }
  function cfg(){ return deepMerge(window.SAND_DEFAULT_APP_CONFIG||{}, readLocal()); }
  function readLocal(){ try{return JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}')||{};}catch(_){return {};} }
  function saveLocal(patch){
    const next = deepMerge(readLocal(), patch||{});
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    if(window.SandConfig?.saveLocal) window.SandConfig.saveLocal(patch||{});
    else {
      window.SAND_APP_CONFIG = deepMerge(window.SAND_DEFAULT_APP_CONFIG||{}, next);
      window.dispatchEvent(new CustomEvent('sand:config-updated',{detail:{config:window.SAND_APP_CONFIG}}));
    }
    mirrorCompatibilitySettings(next);
    return cfg();
  }
  function get(path, fallback=''){
    const val = path.split('.').reduce((o,k)=>o&&o[k], cfg());
    return val ?? fallback;
  }
  function bool(path, fallback=false){ const v=get(path, fallback); return v===true || v==='true' || v===1 || v==='1'; }
  function readJson(k,f){ try{ const raw=localStorage.getItem(k); return raw?JSON.parse(raw):f; }catch(_){ return f; } }
  function writeJson(k,v){ localStorage.setItem(k, JSON.stringify(v)); }
  function log(action, details){
    const arr = readJson(ADVANCED_AUDIT_KEY, []);
    const u=currentUser()||{};
    arr.unshift({id:'set_'+Date.now(), action, details, at:new Date().toISOString(), by:u.name||u.displayName||u.username||'local-admin'});
    writeJson(ADVANCED_AUDIT_KEY, arr.slice(0,150));
  }
  function setIf(id, fn){ const el=byId(id); return el ? fn(el) : undefined; }
  function val(id, fallback=''){ return byId(id)?.value?.trim() ?? fallback; }
  function checked(id){ return !!byId(id)?.checked; }
  function num(id, fallback){ const n=Number(byId(id)?.value); return Number.isFinite(n)?n:fallback; }

  function patchFromForm(){
    const features = {};
    document.querySelectorAll('[data-setting-feature]').forEach(ch=>features[ch.dataset.settingFeature]=!!ch.checked);
    return {
      app:{
        name: val('setAppName', get('app.name')),
        shortName: val('setShortName', get('app.shortName')),
        assistantName: val('setAssistantName', get('app.assistantName','سَنَد')),
        splashDurationMs: num('setSplashDuration', get('app.splashDurationMs',7000)),
        presentationMode: checked('setPresentationMode'),
        demoMode: checked('setDemoMode'),
        maintenanceBanner: val('setMaintenanceBanner','')
      },
      institutionalIdentity:{
        guidance: val('setGuidance',''),
        supervision: val('setSupervision',''),
        preparation: val('setPreparation',''),
        development: val('setDevelopment',''),
        office: val('setOffice',''),
        footerCredit: val('setFooterCredit','')
      },
      assets:{
        logo: val('setLogoPath', get('assets.logo','assets/images/logo.png')),
        sandAvatar: val('setSandAvatarPath', get('assets.sandAvatar','assets/images/avatar-3d.png')),
        attorneyGeneral: val('setAttorneyGeneralPath', get('assets.attorneyGeneral','assets/images/attorney-general.PNG')),
        platformIcon: val('setPlatformIconPath', get('assets.platformIcon','assets/images/logo.png'))
      },
      backend:{
        provider: val('setBackendProvider','cloudflare-worker'),
        proxyUrl: val('setProxyUrl',''),
        liveTokenPath: val('setLiveTokenPath','/live-token'),
        authApiUrl: val('setAuthApiUrl',''),
        communicationApiUrl: val('setCommApiUrl',''),
        caseFilesApiUrl: val('setCaseFilesApiUrl',''),
        caseSharingApiUrl: val('setCaseSharingApiUrl',''),
        legalContentApiUrl: val('setLegalContentApiUrl',''),
        reportsApiUrl: val('setReportsApiUrl',''),
        backupApiUrl: val('setBackupApiUrl',''),
        maintenanceSecurityApiUrl: val('setMaintenanceApiUrl',''),
        requestTimeoutMs: num('setRequestTimeout', 25000),
        retryCount: num('setRetryCount', 1)
      },
      sand:{
        defaultVoice: val('setDefaultVoice','Charon'),
        defaultAnswerMode: val('setAnswerMode','executive'),
        defaultInteractionMode: val('setInteractionMode','ptt'),
        maxHistoryMessages: num('setMaxHistory',6),
        safetyNote: val('setSafetyNote',''),
        autoSuggestQuestions: checked('setAutoSuggestQuestions'),
        professionalDisclaimerVisible: checked('setProfessionalDisclaimer')
      },
      ui:{
        theme: val('setTheme','judicial-dark-gold'),
        density: val('setDensity','comfortable'),
        animationLevel: val('setAnimationLevel','balanced'),
        showCommandCenterAfterLogin: checked('setCommandCenterAfterLogin'),
        sidebarAutoHide: checked('setSidebarAutoHide'),
        guestPrestigeMode: checked('setGuestPrestigeMode')
      },
      storage:{
        mode: val('setStorageMode','local-first'),
        syncPolicy: val('setSyncPolicy','manual'),
        smartCleanupDays: num('setCleanupDays',60),
        maxLocalCaseFiles: num('setMaxCaseFiles',500),
        attachmentsPolicy: val('setAttachmentsPolicy','metadata_only'),
        backupReminderDays: num('setBackupReminderDays',7)
      },
      training:{
        allowGuestLinks: checked('setAllowGuestLinks'),
        defaultMeetingProvider: val('setMeetingProvider','jitsi'),
        guestLinkExpiryHours: num('setGuestExpiryHours',24),
        requireAttendanceName: checked('setRequireGuestName'),
        recordAttendance: checked('setRecordAttendance')
      },
      communication:{
        realtimeMode: val('setCommRealtimeMode','local-first'),
        autoSyncMinutes: num('setCommSyncMinutes',5),
        requireTrustedColleague: checked('setRequireTrustedColleague'),
        allowOfficialAnnouncements: checked('setOfficialAnnouncements'),
        allowAttachmentsMetadata: checked('setCommAttachments')
      },
      notifications:{
        enabled: checked('setNotificationsEnabled'),
        soundEnabled: checked('setNotificationSound'),
        showTopbarBadge: checked('setTopbarBadge'),
        seedOperationalAlerts: checked('setOperationalAlerts')
      },
      security:{
        guestIsolation: checked('setGuestIsolation'),
        hideAdminForUnauthorized: checked('setHideAdminForUnauthorized'),
        auditImportantActions: checked('setAuditImportantActions'),
        requireReviewForLegalContent: checked('setRequireContentReview'),
        safeMode: checked('setSafeMode'),
        preventSecretsInFrontend: true
      },
      features
    };
  }

  function mirrorCompatibilitySettings(settings){
    const merged = deepMerge(window.SAND_DEFAULT_APP_CONFIG||{}, settings||{});
    const b=merged.backend||{};
    if(b.authApiUrl) localStorage.setItem('sand_auth_api_url', b.authApiUrl);
    if(b.communicationApiUrl) localStorage.setItem('sand_comm_realtime_api_url', b.communicationApiUrl);
    if(b.proxyUrl){ localStorage.setItem('sand_ai_proxy_url', b.proxyUrl); window.AI_PROXY_URL=b.proxyUrl; }
    if(b.caseFilesApiUrl) localStorage.setItem('sand_case_files_api_url', b.caseFilesApiUrl);
    if(b.legalContentApiUrl) localStorage.setItem('sand_legal_content_api_url', b.legalContentApiUrl);
    if(merged.sand?.defaultAnswerMode) localStorage.setItem('sand_answer_mode', merged.sand.defaultAnswerMode);
    try{ localStorage.setItem('sand_case_files_settings_v517', JSON.stringify({
      syncMode: merged.storage?.mode==='cloud-sync'?'cloud_sync':'local_first',
      maxActiveFiles: merged.storage?.maxLocalCaseFiles || 500,
      attachmentsPolicy: merged.storage?.attachmentsPolicy || 'metadata_only',
      detailsLazy: true
    })); }catch(_){ }
  }

  function applyVisibleConfig(){
    const c = cfg();
    document.title = c.app?.name || document.title;
    document.querySelectorAll('.brand h1').forEach(el=>el.textContent = c.app?.shortName || c.app?.name || el.textContent);
    document.querySelectorAll('.brand p,.splash-subtitle').forEach(el=>el.textContent = c.institutionalIdentity?.office || el.textContent);
    document.querySelectorAll('.splash-title').forEach(el=>el.textContent = c.app?.name || el.textContent);
    document.querySelectorAll('.splash-ai-name').forEach(el=>el.textContent = `${c.app?.assistantName||'سَنَد'} — المساعد القضائي الذكي`);
    document.querySelectorAll('.splash-supervision-line').forEach(el=>el.textContent = c.institutionalIdentity?.guidance || el.textContent);
    document.querySelectorAll('.footer').forEach(el=>el.textContent = c.institutionalIdentity?.footerCredit || c.institutionalIdentity?.development || el.textContent);
    document.querySelectorAll('.brand-mark img,.splash-logo').forEach(img=>{ if(c.assets?.logo) img.src = c.assets.logo; });
    document.querySelectorAll('.splash-supervisor-photo').forEach(img=>{ if(c.assets?.attorneyGeneral) img.src = c.assets.attorneyGeneral; });
    document.body.classList.toggle('presentation-mode-enabled', !!c.app?.presentationMode);
    document.body.dataset.uiDensity = c.ui?.density || 'comfortable';
    document.body.dataset.animationLevel = c.ui?.animationLevel || 'balanced';
    if(c.backend?.proxyUrl){ window.AI_PROXY_URL = c.backend.proxyUrl; }
  }

  function sectionBtn(id,title,active){ return `<button class="adv-tab ${active?'active':''}" onclick="AdvancedPlatformSettings.switchTab('${id}')">${title}</button>`; }
  function tabs(active){
    const items=[['identity','الهوية'],['workers','الربط والخدمات'],['policies','السياسات'],['modules','الوحدات'],['security','الأمان'],['tools','أدوات الإدارة']];
    return `<div class="adv-tabs">${items.map(x=>sectionBtn(x[0],x[1],active===x[0])).join('')}</div>`;
  }
  function input(id,label,path,extra='') { return `<label>${label}<input id="${id}" value="${esc(get(path,''))}" ${extra}></label>`; }
  function area(id,label,path) { return `<label>${label}<textarea id="${id}">${esc(get(path,''))}</textarea></label>`; }
  function select(id,label,options,value){ return `<label>${label}<select id="${id}">${options.map(o=>`<option value="${esc(o[0])}" ${String(value)===String(o[0])?'selected':''}>${esc(o[1])}</option>`).join('')}</select></label>`; }
  function check(id,label,path,def=false){ return `<label class="switch-line advanced-switch"><input id="${id}" type="checkbox" ${bool(path,def)?'checked':''}> <span>${label}</span></label>`; }

  function renderIdentity(){
    return `<div class="settings-grid advanced-settings-grid">
      <article class="settings-card advanced-settings-card"><h3>هوية المنصة الرسمية</h3>
        ${input('setAppName','اسم المنصة الكامل','app.name')}
        ${input('setShortName','الاسم المختصر في القائمة','app.shortName')}
        ${input('setAssistantName','اسم المساعد الذكي','app.assistantName')}
        ${input('setOffice','الجهة / النيابة','institutionalIdentity.office')}
        ${input('setFooterCredit','نص التذييل السفلي','institutionalIdentity.footerCredit')}
      </article>
      <article class="settings-card advanced-settings-card"><h3>التوجيه والإشراف والاعتماد</h3>
        ${area('setGuidance','سطر التوجيه','institutionalIdentity.guidance')}
        ${area('setSupervision','سطر الإشراف','institutionalIdentity.supervision')}
        ${area('setPreparation','سطر الإعداد القانوني','institutionalIdentity.preparation')}
        ${area('setDevelopment','سطر البرمجة والتطوير','institutionalIdentity.development')}
      </article>
      <article class="settings-card advanced-settings-card"><h3>الشعارات والصور</h3>
        ${input('setLogoPath','مسار شعار المنصة','assets.logo','dir="ltr"')}
        ${input('setSandAvatarPath','مسار صورة سَنَد','assets.sandAvatar','dir="ltr"')}
        ${input('setAttorneyGeneralPath','مسار صورة السيد المستشار','assets.attorneyGeneral','dir="ltr"')}
        ${input('setPlatformIconPath','مسار أيقونة المنصة','assets.platformIcon','dir="ltr"')}
        <div class="advanced-preview-strip"><img src="${esc(get('assets.logo','assets/images/logo.png'))}" onerror="this.style.display='none'"><span>${esc(get('app.shortName','المنصة القضائية'))}</span></div>
      </article>
    </div>`;
  }
  function renderWorkers(){
    return `<div class="settings-grid advanced-settings-grid">
      <article class="settings-card advanced-settings-card advanced-wide"><h3>روابط خدمات Cloudflare Workers</h3><p class="muted-text">يتم حفظ الروابط فقط في الواجهة. أي مفاتيح API أو Secrets تظل داخل Cloudflare ولا توضع داخل ملفات المنصة.</p>
        <div class="worker-url-grid">
          ${input('setProxyUrl','Worker سَنَد / Gemini','backend.proxyUrl','dir="ltr"')}
          ${input('setAuthApiUrl','Worker العضويات Auth API','backend.authApiUrl','dir="ltr"')}
          ${input('setCommApiUrl','Worker التواصل الحقيقي','backend.communicationApiUrl','dir="ltr"')}
          ${input('setCaseFilesApiUrl','Worker ملفات الوقائع','backend.caseFilesApiUrl','dir="ltr"')}
          ${input('setCaseSharingApiUrl','Worker مشاركة الملفات','backend.caseSharingApiUrl','dir="ltr"')}
          ${input('setLegalContentApiUrl','Worker إدارة المحتوى القانوني','backend.legalContentApiUrl','dir="ltr"')}
          ${input('setReportsApiUrl','Worker التقارير المؤسسية','backend.reportsApiUrl','dir="ltr"')}
          ${input('setBackupApiUrl','Worker النسخ الاحتياطي','backend.backupApiUrl','dir="ltr"')}
          ${input('setMaintenanceApiUrl','Worker الصيانة والأمان','backend.maintenanceSecurityApiUrl','dir="ltr"')}
        </div>
        <div class="settings-actions inline"><button class="soft-btn" onclick="AdvancedPlatformSettings.testAllWorkers()">🔌 اختبار الروابط</button><button class="soft-btn" onclick="AdvancedPlatformSettings.copyWorkerSummary()">📋 نسخ ملخص الربط</button></div>
      </article>
      <article class="settings-card advanced-settings-card"><h3>إعدادات الاتصال</h3>
        ${select('setBackendProvider','مزود الخدمات', [['cloudflare-worker','Cloudflare Workers'],['local-only','محلي فقط'],['custom-api','API مخصص']], get('backend.provider','cloudflare-worker'))}
        ${input('setLiveTokenPath','مسار live-token','backend.liveTokenPath','dir="ltr"')}
        <label>مهلة الطلب بالمللي ثانية<input id="setRequestTimeout" type="number" min="5000" max="120000" value="${esc(get('backend.requestTimeoutMs',25000))}"></label>
        <label>عدد محاولات الإعادة<input id="setRetryCount" type="number" min="0" max="5" value="${esc(get('backend.retryCount',1))}"></label>
        <div id="workerTestResults" class="connection-test-results">لم يتم اختبار الروابط بعد.</div>
      </article>
    </div>`;
  }
  function renderPolicies(){
    return `<div class="settings-grid advanced-settings-grid">
      <article class="settings-card advanced-settings-card"><h3>سياسات التخزين والملفات</h3>
        ${select('setStorageMode','وضع التخزين', [['local-first','محلي أولًا'],['cloud-sync','مزامنة مؤسسية'],['local-only','محلي فقط']], get('storage.mode','local-first'))}
        ${select('setSyncPolicy','سياسة المزامنة', [['manual','يدوية'],['interval','كل فترة'],['on-change','عند التغيير']], get('storage.syncPolicy','manual'))}
        <label>الاحتفاظ بالبيانات المؤقتة بالأيام<input id="setCleanupDays" type="number" min="7" max="365" value="${esc(get('storage.smartCleanupDays',60))}"></label>
        <label>أقصى عدد ملفات وقائع محلية<input id="setMaxCaseFiles" type="number" min="50" max="5000" value="${esc(get('storage.maxLocalCaseFiles',500))}"></label>
        ${select('setAttachmentsPolicy','سياسة المرفقات', [['metadata_only','بيانات المرفق فقط'],['external-storage','تخزين خارجي لاحقًا'],['disabled','منع المرفقات']], get('storage.attachmentsPolicy','metadata_only'))}
        <label>تذكير النسخ الاحتياطي بالأيام<input id="setBackupReminderDays" type="number" min="1" max="90" value="${esc(get('storage.backupReminderDays',7))}"></label>
      </article>
      <article class="settings-card advanced-settings-card"><h3>التدريب والاجتماعات والضيوف</h3>
        ${check('setAllowGuestLinks','السماح بروابط حضور الضيوف','training.allowGuestLinks',true)}
        ${select('setMeetingProvider','مزود الاجتماع الافتراضي', [['jitsi','Jitsi'],['meet','Google Meet'],['teams','Microsoft Teams'],['zoom','Zoom'],['external','رابط خارجي']], get('training.defaultMeetingProvider','jitsi'))}
        <label>مدة صلاحية رابط الضيف بالساعات<input id="setGuestExpiryHours" type="number" min="1" max="720" value="${esc(get('training.guestLinkExpiryHours',24))}"></label>
        ${check('setRequireGuestName','طلب اسم الضيف قبل الدخول','training.requireAttendanceName',true)}
        ${check('setRecordAttendance','تسجيل الحضور والانصراف','training.recordAttendance',true)}
      </article>
      <article class="settings-card advanced-settings-card"><h3>سَنَد والواجهة</h3>
        ${select('setAnswerMode','نمط إجابة سَنَد', [['brief','مختصر'],['executive','تنفيذي'],['detailed','تفصيلي'],['educational','تعليمي']], get('sand.defaultAnswerMode','executive'))}
        ${select('setInteractionMode','الحوار الصوتي', [['ptt','اضغط مطولًا للتحدث'],['auto','محادثة تلقائية']], get('sand.defaultInteractionMode','ptt'))}
        ${select('setDefaultVoice','صوت سَنَد', (get('sand.voiceOptions',['Charon','Orus','Gacrux','Alnilam','Iapetus'])||[]).map(v=>[v,v]), get('sand.defaultVoice','Charon'))}
        <label>عدد رسائل الذاكرة<input id="setMaxHistory" type="number" min="2" max="20" value="${esc(get('sand.maxHistoryMessages',6))}"></label>
        ${area('setSafetyNote','تنبيه سَنَد المهني','sand.safetyNote')}
        ${check('setAutoSuggestQuestions','اقتراح أسئلة متابعة ذكية','sand.autoSuggestQuestions',true)}
        ${check('setProfessionalDisclaimer','إظهار التنبيه المهني دائمًا','sand.professionalDisclaimerVisible',true)}
      </article>
    </div>`;
  }
  function renderModules(){
    const featureNames = [
      ['lawsLibrary','مكتبة القوانين'],['sandAssistant','مساعد سَنَد النصي'],['liveVoice','الحوار الصوتي'],['caseAnalysisRoom','غرفة تحليل الواقعة'],['caseFilesCenter','ملفات الوقائع والتحليلات'],['caseFileSharing','مشاركة ملفات الوقائع'],['visualTrainingCenter','مركز التدريب المرئي'],['trainingAdmin','إدارة التدريب'],['notificationsCenter','مركز الإشعارات'],['secureCommunicationCenter','مركز التواصل القضائي'],['legalContentManager','إدارة المحتوى القانوني'],['institutionalReports','التقارير والتحليلات'],['backupRestore','النسخ الاحتياطي'],['maintenanceCenter','الصيانة وتحسين الأداء'],['securityAudit','المراجعة الأمنية'],['exportWordHtmlPrintPdf','التصدير والطباعة']
    ];
    return `<div class="settings-grid advanced-settings-grid">
      <article class="settings-card advanced-settings-card advanced-wide"><h3>تشغيل وإيقاف الوحدات</h3><p class="muted-text">الإيقاف هنا إخفاء تشغيلي من الواجهة وليس حذفًا للملفات. الصلاحيات تظل هي خط الدفاع الأساسي.</p><div class="feature-switches advanced-feature-grid">${featureNames.map(([k,t])=>`<label class="switch-line advanced-switch"><input type="checkbox" data-setting-feature="${k}" ${bool('features.'+k,true)?'checked':''}> <span>${t}</span></label>`).join('')}</div></article>
      <article class="settings-card advanced-settings-card"><h3>سلوك الواجهة</h3>
        ${select('setTheme','الثيم البصري', [['judicial-dark-gold','أسود / ذهبي قضائي'],['classic-light','فاتح كلاسيكي'],['high-contrast','تباين عالٍ']], get('ui.theme','judicial-dark-gold'))}
        ${select('setDensity','كثافة العرض', [['comfortable','مريحة'],['compact','مضغوطة'],['spacious','واسعة']], get('ui.density','comfortable'))}
        ${select('setAnimationLevel','مستوى الحركة', [['none','بدون'],['reduced','مخففة'],['balanced','متوازنة'],['cinematic','فخمة']], get('ui.animationLevel','balanced'))}
        ${check('setCommandCenterAfterLogin','فتح مركز القيادة بعد تسجيل الدخول','ui.showCommandCenterAfterLogin',true)}
        ${check('setSidebarAutoHide','إخفاء القائمة الجانبية تلقائيًا','ui.sidebarAutoHide',true)}
        ${check('setGuestPrestigeMode','بوابة الضيوف المؤسسية الفخمة','ui.guestPrestigeMode',true)}
        ${check('setPresentationMode','تفعيل وضع العرض الرسمي','app.presentationMode',false)}
        ${check('setDemoMode','بيانات عرض تجريبية عند الحاجة','app.demoMode',false)}
        <label>رسالة تنبيه أعلى المنصة<input id="setMaintenanceBanner" value="${esc(get('app.maintenanceBanner',''))}"></label>
        <label>مدة شاشة البداية<input id="setSplashDuration" type="number" min="1000" max="15000" step="500" value="${esc(get('app.splashDurationMs',7000))}"></label>
      </article>
    </div>`;
  }
  function renderSecurity(){
    return `<div class="settings-grid advanced-settings-grid">
      <article class="settings-card advanced-settings-card"><h3>الحماية العامة</h3>
        ${check('setGuestIsolation','عزل صفحة الضيوف تمامًا','security.guestIsolation',true)}
        ${check('setHideAdminForUnauthorized','إخفاء أدوات الإدارة عن غير المصرح','security.hideAdminForUnauthorized',true)}
        ${check('setAuditImportantActions','تسجيل الأحداث الحساسة في Audit Log','security.auditImportantActions',true)}
        ${check('setRequireContentReview','إلزام مراجعة المحتوى القانوني قبل النشر','security.requireReviewForLegalContent',true)}
        ${check('setSafeMode','وضع الأمان قبل العرض الرسمي','security.safeMode',true)}
        <div class="settings-alert">ممنوع وضع أي مفاتيح API أو Tokens داخل هذه الشاشة. يتم حفظ روابط الخدمات فقط.</div>
      </article>
      <article class="settings-card advanced-settings-card"><h3>التواصل والخصوصية</h3>
        ${select('setCommRealtimeMode','وضع التواصل', [['local-first','محلي أولًا مع مزامنة'],['realtime','Realtime عند الاتصال'],['local-only','محلي فقط']], get('communication.realtimeMode','local-first'))}
        <label>المزامنة كل كام دقيقة<input id="setCommSyncMinutes" type="number" min="1" max="120" value="${esc(get('communication.autoSyncMinutes',5))}"></label>
        ${check('setRequireTrustedColleague','منع المحادثة إلا بين الزملاء الموثوقين','communication.requireTrustedColleague',true)}
        ${check('setOfficialAnnouncements','السماح بإعلانات الإدارة الرسمية','communication.allowOfficialAnnouncements',true)}
        ${check('setCommAttachments','السماح ببيانات المرفقات داخل الرسائل','communication.allowAttachmentsMetadata',true)}
      </article>
      <article class="settings-card advanced-settings-card"><h3>الإشعارات</h3>
        ${check('setNotificationsEnabled','تشغيل مركز الإشعارات','notifications.enabled',true)}
        ${check('setNotificationSound','صوت تنبيه اختياري','notifications.soundEnabled',false)}
        ${check('setTopbarBadge','إظهار عداد الجرس في الشريط العلوي','notifications.showTopbarBadge',true)}
        ${check('setOperationalAlerts','توليد التنبيهات التشغيلية تلقائيًا','notifications.seedOperationalAlerts',true)}
      </article>
    </div>`;
  }
  function renderTools(){
    const audit = readJson(ADVANCED_AUDIT_KEY, []).slice(0,10);
    const tests = readJson(CONNECTION_TEST_KEY, {});
    return `<div class="settings-grid advanced-settings-grid">
      <article class="settings-card advanced-settings-card"><h3>أدوات الإعدادات</h3>
        <button class="gold-btn full" onclick="saveSandSettingsFromPanel()">💾 حفظ كل الإعدادات</button>
        <button class="soft-btn full" onclick="exportSandSettings()">📤 تصدير الإعدادات</button>
        <button class="soft-btn full" onclick="importSandSettings()">📥 استيراد إعدادات</button>
        <button class="soft-btn full" onclick="AdvancedPlatformSettings.exportFullSnapshot()">🧾 تصدير لقطة إعدادات كاملة</button>
        <button class="danger-soft-btn full" onclick="resetSandSettings()">↩️ استعادة الافتراضي</button>
      </article>
      <article class="settings-card advanced-settings-card"><h3>آخر نتائج اختبار الربط</h3>
        <div class="connection-test-results">${Object.keys(tests).length?Object.entries(tests).map(([k,v])=>`<div class="test-line ${v.ok?'ok':'fail'}"><b>${esc(k)}</b><span>${v.ok?'متاح':'غير متاح/غير مضبوط'}</span><small>${esc(v.at||'')}</small></div>`).join(''):'لم يتم اختبار الروابط بعد.'}</div>
      </article>
      <article class="settings-card advanced-settings-card advanced-wide"><h3>سجل تعديل الإعدادات</h3>
        <div class="advanced-audit-list">${audit.length?audit.map(x=>`<div class="adv-audit-row"><b>${esc(x.action)}</b><span>${esc(x.details)}</span><small>${new Date(x.at).toLocaleString('ar-EG')} — ${esc(x.by)}</small></div>`).join(''):'<p class="muted-text">لا يوجد سجل إعدادات بعد.</p>'}</div>
      </article>
    </div><input type="file" id="sandSettingsImportInput" accept="application/json" style="display:none" onchange="handleSandSettingsImportFile(this.files&&this.files[0])">`;
  }

  let activeTab = 'identity';
  function renderSettingsView(tab){
    const c=cfg(); activeTab=tab||activeTab||'identity';
    const storageMode = get('storage.mode','local-first');
    const workersConfigured = workerFields.filter(([path])=>!!get(path,'')).length;
    const featureCount = Object.values(c.features||{}).filter(Boolean).length;
    const safeMode = bool('security.safeMode',true);
    return `<section class="admin-settings-page advanced-platform-settings-page">
      <div class="advanced-settings-hero">
        <div><span class="eyebrow">المرحلة 5.24</span><h2>⚙️ مركز الإعدادات العامة المتقدم</h2><p>مركز واحد لإدارة هوية المنصة، روابط الخدمات، السياسات، الواجهة، التدريب، التواصل، التخزين والأمان بدون تعديل الكود.</p></div>
        <div class="advanced-settings-score"><b>${workersConfigured}/${workerFields.length}</b><span>خدمات مضبوطة</span></div>
      </div>
      <div class="advanced-status-row">
        <div><b>${esc(get('app.shortName','المنصة'))}</b><span>الاسم المختصر</span></div>
        <div><b>${esc(storageMode)}</b><span>سياسة التخزين</span></div>
        <div><b>${featureCount}</b><span>وحدة مفعلة</span></div>
        <div><b>${safeMode?'مفعل':'غير مفعل'}</b><span>وضع الأمان</span></div>
      </div>
      <div class="settings-alert">🔐 لا تحفظ هنا أي مفاتيح سرية. مفاتيح Gemini وTokens تظل داخل Cloudflare Secrets فقط، وهذه الشاشة تحفظ روابط وخيارات تشغيل محلية/مؤسسية.</div>
      ${tabs(activeTab)}
      <div id="advancedSettingsBody">${activeTab==='identity'?renderIdentity():activeTab==='workers'?renderWorkers():activeTab==='policies'?renderPolicies():activeTab==='modules'?renderModules():activeTab==='security'?renderSecurity():renderTools()}</div>
      <div class="settings-actions sticky-actions"><button class="gold-btn" onclick="saveSandSettingsFromPanel()">💾 حفظ الإعدادات</button><button class="soft-btn" onclick="exportSandSettings()">📤 تصدير</button><button class="soft-btn" onclick="importSandSettings()">📥 استيراد</button><button class="danger-soft-btn" onclick="resetSandSettings()">↩️ افتراضي</button></div>
      <input type="file" id="sandSettingsImportInput" accept="application/json" style="display:none" onchange="handleSandSettingsImportFile(this.files&&this.files[0])">
    </section>`;
  }

  function setMain(html){ const view=byId('appView'); if(view) view.innerHTML=html; }
  function openSettings(tab){
    if(!isAdmin() && window.SandAuthApi?.isLoggedIn?.()){
      setMain(`<section class="admin-settings-page advanced-platform-settings-page"><div class="advanced-settings-hero"><div><span class="eyebrow">إعدادات المنصة</span><h2>غير مصرح</h2><p>هذه الشاشة مخصصة لمالك النظام أو أصحاب صلاحية إدارة الإعدادات.</p></div></div></section>`);
      return;
    }
    document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
    const btn=document.querySelector('[data-nav="institutional-settings"]'); if(btn) btn.classList.add('active');
    setMain(renderSettingsView(tab||activeTab));
    if(typeof closeSidebar==='function') closeSidebar();
  }

  async function testUrl(label, url){
    if(!url) return {ok:false, label, reason:'غير مضبوط'};
    try{
      const controller = new AbortController();
      const t=setTimeout(()=>controller.abort(), 5000);
      let res;
      try{ res = await fetch(url.replace(/\/$/,'') + '/health', {method:'GET', signal:controller.signal}); }
      catch(_){ res = await fetch(url, {method:'GET', mode:'no-cors', signal:controller.signal}); }
      clearTimeout(t);
      return {ok: !!res, label, reason:'تمت محاولة الاتصال'};
    }catch(e){ return {ok:false, label, reason:e.name==='AbortError'?'انتهت المهلة':'تعذر الاتصال'}; }
  }
  async function testAllWorkers(){
    const resultsEl=byId('workerTestResults'); if(resultsEl) resultsEl.innerHTML='جارِ اختبار الروابط...';
    const items = workerFields.map(([path,id,label])=>({label,url:byId(id)?.value?.trim() || get(path,'')}));
    const out = {};
    for(const item of items){ const r=await testUrl(item.label,item.url); out[item.label]={ok:r.ok, reason:r.reason, at:new Date().toISOString()}; }
    writeJson(CONNECTION_TEST_KEY, out);
    log('اختبار الروابط', `تم اختبار ${items.length} خدمة`);
    if(resultsEl) resultsEl.innerHTML = Object.entries(out).map(([k,v])=>`<div class="test-line ${v.ok?'ok':'fail'}"><b>${esc(k)}</b><span>${v.ok?'متاح/تمت محاولة الاتصال':'غير متاح'} — ${esc(v.reason)}</span></div>`).join('');
    toast('تم اختبار روابط الخدمات. راجع النتائج داخل الشاشة.');
  }
  function copyWorkerSummary(){
    const lines = workerFields.map(([path,,label])=>`${label}: ${get(path,'غير مضبوط')}`).join('\n');
    navigator.clipboard?.writeText(lines); toast('تم نسخ ملخص روابط الخدمات.');
  }
  function exportFullSnapshot(){
    const data = {meta:{phase:'5.24',generatedAt:new Date().toISOString(),type:'advanced-platform-settings-snapshot'}, settings:cfg(), localPatch:readLocal(), tests:readJson(CONNECTION_TEST_KEY,{})};
    downloadJson(data, 'sand-advanced-platform-settings-snapshot.json');
  }
  function downloadJson(data, filename){
    const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json;charset=utf-8'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; a.click(); URL.revokeObjectURL(a.href);
  }

  window.openInstitutionalSettings = function(){ openSettings('identity'); };
  window.saveSandSettingsFromPanel = function(){
    const patch=patchFromForm(); saveLocal(patch); applyVisibleConfig(); log('حفظ الإعدادات','تم حفظ مركز الإعدادات العامة المتقدم'); toast('تم حفظ إعدادات المنصة وتطبيق ما يمكن تطبيقه فورًا.'); openSettings(activeTab);
  };
  window.resetSandSettings = function(){
    if(!confirm('استعادة الإعدادات الافتراضية؟ سيتم حذف التخصيصات المحلية الخاصة بالإعدادات فقط.')) return;
    if(window.SandConfig?.resetLocal) window.SandConfig.resetLocal(); else localStorage.removeItem(SETTINGS_KEY);
    log('استعادة الافتراضي','تمت استعادة إعدادات المنصة الافتراضية'); applyVisibleConfig(); openSettings('identity'); toast('تمت استعادة الإعدادات الافتراضية.');
  };
  window.exportSandSettings = function(){ downloadJson(readLocal(), 'sand-platform-settings-local-patch.json'); log('تصدير الإعدادات','تم تصدير إعدادات المنصة المحلية'); };
  window.importSandSettings = function(){ byId('sandSettingsImportInput')?.click(); };
  window.handleSandSettingsImportFile = async function(file){
    if(!file) return;
    try{
      const data = JSON.parse(await file.text());
      const patch = data.settings ? data.localPatch || data.settings : data;
      saveLocal(patch); applyVisibleConfig(); log('استيراد الإعدادات','تم استيراد ملف إعدادات'); openSettings(activeTab); toast('تم استيراد الإعدادات.');
    }catch(e){ toast('تعذر قراءة ملف الإعدادات.'); }
  };
  window.AdvancedPlatformSettings = { switchTab:function(tab){ activeTab=tab; openSettings(tab); }, testAllWorkers, copyWorkerSummary, exportFullSnapshot, applyVisibleConfig, readLocal, cfg };
  window.addEventListener('sand:config-updated', applyVisibleConfig);
  document.addEventListener('DOMContentLoaded', ()=>{ mirrorCompatibilitySettings(readLocal()); applyVisibleConfig(); });
})();
