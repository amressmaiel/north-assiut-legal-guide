/**
 * notifications-center.js — Phase 5.16
 * مركز الإشعارات والتنبيهات المؤسسي الكامل.
 */
(function(){
  const STORE_KEY='sand_notifications_center_v1';
  const SETTINGS_KEY='sand_notifications_settings_v1';
  const TRAINING_MEETINGS_KEY='sand_training_meetings_v1';
  const TRAINING_PROGRESS_KEY='sand_training_center_v1';
  const AUTH_AUDIT_KEY='sand_auth_audit_log_v1';
  const SECURITY_AUDIT_KEY='sand_security_audit_log_v1';
  const MEMBERSHIP_REQUESTS_KEY='sand_membership_requests_v1';
  const LICENSE_DEVICES_KEY='sand_license_devices_v1';

  const CATEGORIES={
    all:{label:'الكل',icon:'🔔'},
    security:{label:'الأمن والجلسات',icon:'🛡️'},
    training:{label:'التدريب والاجتماعات',icon:'🎥'},
    account:{label:'الحساب والعضوية',icon:'👤'},
    admin:{label:'الإدارة والصلاحيات',icon:'👥'},
    deadlines:{label:'المواعيد القانونية',icon:'⏱️'},
    content:{label:'المحتوى القانوني',icon:'📚'},
    system:{label:'النظام والربط',icon:'⚙️'}
  };
  const PRIORITIES={critical:'حرج',high:'هام',normal:'عادي',low:'معلومة'};
  const TYPE_ICONS={critical:'🚨',high:'⚠️',normal:'🔔',low:'ℹ️',success:'✅'};

  function e(v){ return typeof window.esc==='function' ? window.esc(v) : String(v??'').replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[m])); }
  function readJson(key,fallback){ try{ const v=JSON.parse(localStorage.getItem(key)||'null'); return v ?? fallback; }catch{ return fallback; } }
  function writeJson(key,val){ localStorage.setItem(key,JSON.stringify(val)); }
  function arr(v){ return Array.isArray(v)?v:[]; }
  function id(prefix='ntf'){ return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2,8)}`; }
  function nowIso(){ return new Date().toISOString(); }
  function fmt(iso){ try{return new Date(iso).toLocaleString('ar-EG-u-nu-arab',{dateStyle:'medium',timeStyle:'short'});}catch{return '—';} }
  function currentUser(){ return window.SandAuthApi?.currentUser?.() || null; }
  function isOwner(){ const u=currentUser(); return !!(u&&(u.isSuperOwner||u.is_super_owner||u.role==='owner'||u.role==='super_owner')); }
  function hasPerm(p){ return !!window.SandAuthApi?.hasPermission?.(p); }
  function canAdmin(){ return isOwner() || hasPerm('users.manage') || hasPerm('audit.view') || hasPerm('notifications.manage'); }
  function userLabel(){ const u=currentUser(); return u?(u.fullName||u.full_name||u.name||u.username||'مستخدم'):'زائر'; }
  function defaultSettings(){ return {desktop:false,sound:false,autoSeed:true,muted:{},density:'comfortable',digest:'daily'}; }
  function settings(){ return Object.assign(defaultSettings(),readJson(SETTINGS_KEY,{})); }
  function saveSettings(s){ writeJson(SETTINGS_KEY,Object.assign(settings(),s||{})); }
  function load(){ const data=readJson(STORE_KEY,null); if(data&&Array.isArray(data.items)) return data; return {version:'5.16',items:[],lastSeed:null}; }
  function save(data){ writeJson(STORE_KEY,data); refreshNotificationBadges(); }
  function normalizedPriority(p){ return ['critical','high','normal','low'].includes(p)?p:'normal'; }
  function upsertNotification(n){
    const s=settings(); if(s.muted&&s.muted[n.category]) return null;
    const data=load();
    const fingerprint=n.fingerprint||`${n.category}|${n.title}|${n.action||''}`;
    const existing=data.items.find(x=>x.fingerprint===fingerprint && !x.archived);
    const payload=Object.assign({id:id(),category:'system',priority:'normal',status:'unread',createdAt:nowIso(),updatedAt:nowIso(),source:'platform',actions:[]},n,{fingerprint,priority:normalizedPriority(n.priority)});
    if(existing){ Object.assign(existing,payload,{id:existing.id,createdAt:existing.createdAt,status:existing.status==='archived'?'unread':existing.status,updatedAt:nowIso()}); }
    else data.items.unshift(payload);
    data.items=data.items.slice(0,350);
    save(data);
    return payload;
  }

  function seedFromSystem(){
    const data=load(); const today=new Date().toISOString().slice(0,10);
    const last=(data.lastSeed||'').slice(0,10);
    if(last===today && data.items.length) return;
    const s=settings(); if(s.autoSeed===false) return;

    upsertNotification({category:'account',priority:'normal',title:'جلسة حساب مفعّلة',body:`أهلًا أستاذ / ${userLabel()}، تم تجهيز مركز الإشعارات لمتابعة الحساب والتدريب والأمن من مكان واحد.`,source:'account',action:'openMyAccountCenter && openMyAccountCenter()',actions:[{label:'فتح حسابي',action:'openMyAccountCenter && openMyAccountCenter()'}],fingerprint:'welcome-account-phase-516'});

    const authReady=!!window.SandAuthApi?.isConfigured?.();
    if(!authReady){ upsertNotification({category:'system',priority:'high',title:'يلزم ضبط رابط Auth API',body:'المنصة تعمل محليًا، لكن الربط المؤسسي الكامل يحتاج ضبط رابط Worker الخاص بالعضويات والتراخيص.',source:'auth-api',action:'openInstitutionalSettings && openInstitutionalSettings()',actions:[{label:'فتح الإعدادات',action:'openInstitutionalSettings && openInstitutionalSettings()'}],fingerprint:'auth-api-not-configured'}); }

    const meetings=arr(readJson(TRAINING_MEETINGS_KEY,[]));
    meetings.forEach(m=>{
      const t=new Date(`${m.date||''}T${m.time||'00:00'}`).getTime();
      const diff=t-Date.now();
      if(Number.isFinite(t) && diff>-60*60*1000 && diff<48*60*60*1000 && (m.status||'قادم')!=='مغلق'){
        upsertNotification({category:'training',priority:diff<2*60*60*1000?'high':'normal',title:`اجتماع تدريبي قادم: ${m.title||'تدريب مباشر'}`,body:`الموعد: ${m.date||'—'} ${m.time||''} — المحاضر: ${m.speaker||'مشرف التدريب'}.`,source:'training-meetings',action:`openTrainingMeetingDetails && openTrainingMeetingDetails('${m.id}')`,actions:[{label:'تفاصيل الاجتماع',action:`openTrainingMeetingDetails && openTrainingMeetingDetails('${m.id}')`},{label:'مركز التدريب',action:'openTrainingCenter && openTrainingCenter()'}],fingerprint:`training-meeting-${m.id}`});
      }
    });

    const progress=readJson(TRAINING_PROGRESS_KEY,{});
    if(arr(progress.__attendance).length){ upsertNotification({category:'training',priority:'low',title:'تم تحديث سجلك التدريبي',body:`عدد سجلات الحضور المحفوظة: ${arr(progress.__attendance).length}.`,source:'training-record',action:'openTrainingRecord && openTrainingRecord()',actions:[{label:'السجل التدريبي',action:'openTrainingRecord && openTrainingRecord()'}],fingerprint:'training-record-updated'}); }

    const membership=arr(readJson(MEMBERSHIP_REQUESTS_KEY,[]));
    const pending=membership.filter(x=>(x.status||'pending')==='pending'||(x.status||'')==='pending_company_review').length;
    if(canAdmin() && pending){ upsertNotification({category:'admin',priority:'high',title:`طلبات عضوية معلقة (${pending})`,body:'توجد طلبات عضوية تحتاج مراجعة أو اعتماد إداري.',source:'membership',action:'openMembershipAdmin && openMembershipAdmin()',actions:[{label:'مراجعة العضويات',action:'openMembershipAdmin && openMembershipAdmin()'}],fingerprint:'pending-membership-requests'}); }

    const audits=arr(readJson(AUTH_AUDIT_KEY,[])).concat(arr(readJson(SECURITY_AUDIT_KEY,[])));
    const severe=audits.filter(a=>String(a.severity||a.level||'').match(/danger|critical|warn|warning/i)).slice(0,3);
    if(canAdmin() && severe.length){ upsertNotification({category:'security',priority:'critical',title:'أحداث أمنية تحتاج مراجعة',body:`تم رصد ${severe.length} حدث أمني أو محاولة دخول تحتاج متابعة داخل مركز الأمن والسجل.`,source:'audit-log',action:'openSecurityAuditCenter && openSecurityAuditCenter()',actions:[{label:'فتح السجل الأمني',action:'openSecurityAuditCenter && openSecurityAuditCenter()'}],fingerprint:'security-audit-warnings'}); }

    const devices=arr(readJson(LICENSE_DEVICES_KEY,[]));
    const pendingDevices=devices.filter(d=>['pending','new','معلق'].includes(String(d.status||'').toLowerCase())).length;
    if(canAdmin() && pendingDevices){ upsertNotification({category:'admin',priority:'high',title:`أجهزة تحتاج مراجعة (${pendingDevices})`,body:'توجد أجهزة جديدة أو معلقة ضمن نظام التراخيص.',source:'license-devices',action:'openLicenseDeviceAdmin && openLicenseDeviceAdmin()',actions:[{label:'التراخيص والأجهزة',action:'openLicenseDeviceAdmin && openLicenseDeviceAdmin()'}],fingerprint:'pending-license-devices'}); }

    upsertNotification({category:'content',priority:'low',title:'اقتراح متابعة المحتوى القانوني',body:'يمكن لاحقًا ربط مركز الإشعارات بتحديثات القوانين والتعليمات القضائية عند تنفيذ إدارة المحتوى القانوني.',source:'content-roadmap',action:'openInstitutionalContentAdmin && openInstitutionalContentAdmin()',actions:[{label:'إدارة المحتوى',action:'openInstitutionalContentAdmin && openInstitutionalContentAdmin()'}],fingerprint:'content-notification-roadmap'});

    const fresh=load(); fresh.lastSeed=nowIso(); save(fresh);
  }

  function stats(){ const items=arr(load().items); return {total:items.filter(x=>!x.archived).length,unread:items.filter(x=>!x.archived&&x.status!=='read').length,critical:items.filter(x=>!x.archived&&x.priority==='critical').length,high:items.filter(x=>!x.archived&&x.priority==='high').length,archived:items.filter(x=>x.archived).length}; }
  function filteredItems(){
    const f=window.__sandNotifFilter || {cat:'all',state:'active',priority:'all',q:''};
    return arr(load().items).filter(n=>{
      if(f.state==='archived' ? !n.archived : n.archived) return false;
      if(f.state==='unread' && n.status==='read') return false;
      if(f.cat && f.cat!=='all' && n.category!==f.cat) return false;
      if(f.priority && f.priority!=='all' && n.priority!==f.priority) return false;
      const q=String(f.q||'').trim().toLowerCase();
      if(q && !`${n.title||''} ${n.body||''} ${n.source||''}`.toLowerCase().includes(q)) return false;
      return true;
    }).sort((a,b)=>{
      const pw={critical:4,high:3,normal:2,low:1};
      const p=(pw[b.priority]||0)-(pw[a.priority]||0); if(p) return p;
      return new Date(b.createdAt||0)-new Date(a.createdAt||0);
    });
  }

  function pill(priority){ return `<span class="ntf-priority ${e(priority)}">${e(PRIORITIES[priority]||priority)}</span>`; }
  function actionButtons(n){
    const acts=arr(n.actions).slice(0,3);
    return acts.map(a=>`<button class="soft-btn mini" onclick="${e(a.action||n.action||'')} ; markNotificationRead('${e(n.id)}')">${e(a.label||'فتح')}</button>`).join('') || (n.action?`<button class="gold-btn mini" onclick="${e(n.action)} ; markNotificationRead('${e(n.id)}')">فتح الإجراء</button>`:'');
  }
  function notificationCard(n){
    const cat=CATEGORIES[n.category]||CATEGORIES.system;
    const unread=n.status!=='read';
    return `<article class="ntf-card ${unread?'unread':''} ${e(n.priority)}" data-id="${e(n.id)}">
      <button class="ntf-open-area" onclick="openNotificationDetails('${e(n.id)}')" title="عرض التفاصيل">
        <span class="ntf-icon">${TYPE_ICONS[n.priority]||cat.icon}</span>
        <div class="ntf-body"><div class="ntf-card-head"><b>${e(n.title)}</b>${pill(n.priority)}</div><p>${e(n.body)}</p><div class="ntf-meta"><span>${cat.icon} ${e(cat.label)}</span><span>المصدر: ${e(n.source||'platform')}</span><span>${fmt(n.createdAt)}</span></div></div>
      </button>
      <div class="ntf-actions">${actionButtons(n)}<button class="soft-btn mini" onclick="toggleNotificationRead('${e(n.id)}')">${unread?'اعتبارها مقروءة':'غير مقروءة'}</button><button class="soft-btn mini" onclick="archiveNotification('${e(n.id)}')">أرشفة</button><button class="danger-soft-btn mini" onclick="deleteNotification('${e(n.id)}')">حذف</button></div>
    </article>`;
  }

  function centerMarkup(){
    seedFromSystem();
    const st=stats(); const f=window.__sandNotifFilter || {cat:'all',state:'active',priority:'all',q:''};
    const items=filteredItems();
    const categoryTabs=Object.entries(CATEGORIES).map(([k,v])=>`<button class="ntf-tab ${f.cat===k?'active':''}" onclick="setNotificationsFilter({cat:'${k}'})">${v.icon} ${v.label}</button>`).join('');
    const rows=items.length?items.map(notificationCard).join(''):'<div class="ntf-empty"><b>لا توجد إشعارات مطابقة</b><span>كل شيء هادئ… وده في الأنظمة المؤسسية شيء جميل مش مريب 😄</span></div>';
    const adminTools=canAdmin()?`<section class="ntf-admin-strip"><button class="soft-btn" onclick="createDemoNotification('security')">إنشاء تنبيه أمني تجريبي</button><button class="soft-btn" onclick="createDemoNotification('training')">تنبيه تدريب تجريبي</button><button class="soft-btn" onclick="createDemoNotification('deadline')">تنبيه موعد تجريبي</button><button class="danger-soft-btn" onclick="clearArchivedNotifications()">مسح المؤرشف</button></section>`:'';
    return `<section class="notifications-center-page">
      <section class="ntf-hero">
        <div><span class="institutional-kicker">Phase 5.16 — مركز الإشعارات والتنبيهات الكامل</span><h2>مركز الإشعارات المؤسسي</h2><p>مركز عمليات مصغّر يجمع تنبيهات الحساب، التدريب، الاجتماعات، الأمن، العضويات، المحتوى، والمواعيد مع فلترة وأولويات وإجراءات مباشرة.</p></div>
        <div class="ntf-hero-actions"><button class="gold-btn large-action" onclick="markAllNotificationsRead()">✅ تعليم الكل كمقروء</button><button class="soft-btn large-action" onclick="refreshNotificationsCenter()">🔄 تحديث</button><button class="soft-btn large-action" onclick="openNotificationSettings()">⚙️ إعدادات التنبيه</button></div>
      </section>
      <section class="ntf-stat-grid">
        <article><b>${st.unread}</b><span>غير مقروء</span></article><article><b>${st.critical}</b><span>حرج</span></article><article><b>${st.high}</b><span>هام</span></article><article><b>${st.total}</b><span>نشط</span></article><article><b>${st.archived}</b><span>مؤرشف</span></article>
      </section>
      <section class="ntf-tabs">${categoryTabs}</section>
      <section class="ntf-toolbar">
        <input id="ntfSearchInput" value="${e(f.q||'')}" placeholder="ابحث داخل الإشعارات..." oninput="setNotificationsFilter({q:this.value})">
        <select onchange="setNotificationsFilter({state:this.value})"><option value="active" ${f.state==='active'?'selected':''}>النشطة</option><option value="unread" ${f.state==='unread'?'selected':''}>غير المقروءة</option><option value="archived" ${f.state==='archived'?'selected':''}>المؤرشفة</option></select>
        <select onchange="setNotificationsFilter({priority:this.value})"><option value="all" ${f.priority==='all'?'selected':''}>كل الأولويات</option><option value="critical" ${f.priority==='critical'?'selected':''}>حرج</option><option value="high" ${f.priority==='high'?'selected':''}>هام</option><option value="normal" ${f.priority==='normal'?'selected':''}>عادي</option><option value="low" ${f.priority==='low'?'selected':''}>معلومة</option></select>
        <button class="soft-btn" onclick="archiveReadNotifications()">أرشفة المقروء</button>
      </section>
      ${adminTools}
      <section class="ntf-list">${rows}</section>
      <section class="institutional-assurance ntf-assurance"><div><b>تصنيف ذكي</b><span>كل إشعار له مصدر وتصنيف وأولوية قابلة للفلترة.</span></div><div><b>إجراءات مباشرة</b><span>كل تنبيه يوجهك للشاشة المناسبة فورًا.</span></div><div><b>جاهز للتوسع</b><span>مصمم لربطه لاحقًا بالسيرفر وPush Notifications.</span></div></section>
    </section>`;
  }

  function rerender(){ if(typeof page==='function') page(centerMarkup()); else { const v=document.getElementById('appView'); if(v) v.innerHTML=centerMarkup(); } }
  window.openNotificationsCenter=function(){ if(typeof closeSidebar==='function') closeSidebar(); if(typeof setActiveNav==='function') setActiveNav('notifications-center'); window.__sandNotifFilter=window.__sandNotifFilter||{cat:'all',state:'active',priority:'all',q:''}; rerender(); };
  window.refreshNotificationsCenter=function(){ const data=load(); data.lastSeed=null; save(data); seedFromSystem(); rerender(); };
  window.setNotificationsFilter=function(p){ window.__sandNotifFilter=Object.assign(window.__sandNotifFilter||{cat:'all',state:'active',priority:'all',q:''},p||{}); rerender(); };
  window.markNotificationRead=function(notificationId){ const data=load(); const n=data.items.find(x=>x.id===notificationId); if(n){n.status='read';n.readAt=nowIso();save(data);} };
  window.toggleNotificationRead=function(notificationId){ const data=load(); const n=data.items.find(x=>x.id===notificationId); if(n){n.status=n.status==='read'?'unread':'read';n.updatedAt=nowIso();save(data);rerender();} };
  window.archiveNotification=function(notificationId){ const data=load(); const n=data.items.find(x=>x.id===notificationId); if(n){n.archived=true;n.status='read';n.archivedAt=nowIso();save(data);rerender();} };
  window.deleteNotification=function(notificationId){ if(!confirm('حذف هذا الإشعار نهائيًا؟')) return; const data=load(); data.items=data.items.filter(x=>x.id!==notificationId); save(data); rerender(); };
  window.markAllNotificationsRead=function(){ const data=load(); data.items.forEach(n=>{ if(!n.archived){n.status='read';n.readAt=n.readAt||nowIso();} }); save(data); rerender(); };
  window.archiveReadNotifications=function(){ const data=load(); data.items.forEach(n=>{ if(n.status==='read'&&!n.archived){n.archived=true;n.archivedAt=nowIso();} }); save(data); rerender(); };
  window.clearArchivedNotifications=function(){ if(!confirm('مسح كل الإشعارات المؤرشفة؟')) return; const data=load(); data.items=data.items.filter(n=>!n.archived); save(data); rerender(); };
  window.openNotificationDetails=function(notificationId){ const n=arr(load().items).find(x=>x.id===notificationId); if(!n) return; window.markNotificationRead(notificationId); const cat=CATEGORIES[n.category]||CATEGORIES.system; const html=`<div class="review-modal-backdrop" onclick="this.remove()"><div class="review-modal notification-detail-modal" onclick="event.stopPropagation()"><button class="review-modal-close" onclick="this.closest('.review-modal-backdrop').remove()">×</button><span class="institutional-kicker">${cat.icon} ${e(cat.label)}</span><h3>${e(n.title)}</h3><div class="ntf-detail-priority">${pill(n.priority)} <span>${fmt(n.createdAt)}</span></div><p class="ntf-detail-body">${e(n.body)}</p><div class="ntf-detail-grid"><div><small>المصدر</small><b>${e(n.source||'platform')}</b></div><div><small>الحالة</small><b>${n.status==='read'?'مقروء':'غير مقروء'}</b></div><div><small>معرّف الإشعار</small><b>${e(n.id)}</b></div></div><div class="ntf-actions modal-actions">${actionButtons(n)}<button class="soft-btn" onclick="archiveNotification('${e(n.id)}');this.closest('.review-modal-backdrop').remove()">أرشفة</button></div></div></div>`; document.body.insertAdjacentHTML('beforeend',html); };
  window.openNotificationSettings=function(){ const s=settings(); const cats=Object.entries(CATEGORIES).filter(([k])=>k!=='all').map(([k,v])=>`<label class="ntf-switch"><input type="checkbox" ${s.muted?.[k]?'':'checked'} onchange="toggleNotificationCategory('${k}',this.checked)"><span>${v.icon} ${v.label}</span></label>`).join(''); const html=`<div class="review-modal-backdrop" onclick="this.remove()"><div class="review-modal notification-settings-modal" onclick="event.stopPropagation()"><button class="review-modal-close" onclick="this.closest('.review-modal-backdrop').remove()">×</button><span class="institutional-kicker">⚙️ إعدادات التنبيه</span><h3>تفضيلات مركز الإشعارات</h3><p class="ntf-detail-body">اختار أنواع التنبيهات التي تريد تفعيلها داخل المنصة. التنبيهات هنا داخلية ومحلية، وجاهزة لاحقًا للربط بسيرفر إشعارات.</p><div class="ntf-settings-grid">${cats}</div><div class="ntf-settings-options"><label><input type="checkbox" ${s.autoSeed!==false?'checked':''} onchange="saveNotificationSetting('autoSeed',this.checked)"> توليد تنبيهات تشغيلية تلقائية من حالة المنصة</label><label><input type="checkbox" ${s.sound?'checked':''} onchange="saveNotificationSetting('sound',this.checked)"> صوت تنبيه خفيف عند وصول إشعار جديد</label></div></div></div>`; document.body.insertAdjacentHTML('beforeend',html); };
  window.toggleNotificationCategory=function(cat,on){ const s=settings(); s.muted=s.muted||{}; s.muted[cat]=!on; saveSettings(s); };
  window.saveNotificationSetting=function(k,v){ const s=settings(); s[k]=v; saveSettings(s); };
  window.createDemoNotification=function(kind){ const map={security:{category:'security',priority:'critical',title:'تنبيه أمني تجريبي',body:'محاولة دخول أو تغيير صلاحية تحتاج مراجعة. هذا تنبيه تجريبي لاختبار المركز.',source:'demo-security',action:'openSecurityAuditCenter && openSecurityAuditCenter()'},training:{category:'training',priority:'high',title:'تدريب مباشر تجريبي',body:'تم إنشاء تنبيه تدريبي لاختبار ظهور الاجتماعات داخل مركز الإشعارات.',source:'demo-training',action:'openTrainingMeetings && openTrainingMeetings()'},deadline:{category:'deadlines',priority:'high',title:'موعد قانوني تجريبي',body:'تنبيه تجريبي يوضح شكل تنبيهات المواعيد القانونية عند الربط بحاسبة المواعيد.',source:'demo-deadline',action:'openDeadlineCalculator && openDeadlineCalculator()'}}; upsertNotification(Object.assign(map[kind]||map.training,{fingerprint:`demo-${kind}-${Date.now()}`})); rerender(); };
  window.SandNotifications={create:upsertNotification,stats,refresh:seedFromSystem,open:window.openNotificationsCenter};

  function refreshNotificationBadges(){
    const unread=stats().unread;
    document.querySelectorAll('[data-notification-badge]').forEach(el=>{ el.textContent=unread>99?'٩٩+':String(unread); el.style.display=unread?'inline-flex':'none'; });
    document.querySelectorAll('.notification-bell-btn').forEach(btn=>btn.classList.toggle('has-unread',!!unread));
  }
  window.refreshNotificationBadges=refreshNotificationBadges;
  function injectBell(){
    if(document.querySelector('.notification-bell-btn')) return;
    const toolbar=document.querySelector('.institutional-top-actions');
    if(toolbar){ toolbar.insertAdjacentHTML('afterbegin',`<button class="icon-btn notification-bell-btn" onclick="openNotificationsCenter && openNotificationsCenter()" title="مركز الإشعارات">🔔 <span data-notification-badge class="notification-badge" style="display:none">0</span></button>`); }
  }
  document.addEventListener('DOMContentLoaded',()=>{ injectBell(); setTimeout(()=>{ seedFromSystem(); refreshNotificationBadges(); },350); });
  setTimeout(()=>{ injectBell(); seedFromSystem(); refreshNotificationBadges(); },900);
})();
