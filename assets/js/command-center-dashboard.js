/**
 * command-center-dashboard.js — Phase 5.15
 * مركز القيادة المؤسسي الذكي بعد تسجيل الدخول.
 */
(function(){
  const TRAINING_COURSES_KEY='sand_training_courses_v2';
  const TRAINING_PROGRESS_KEY='sand_training_center_v1';
  const TRAINING_MEETINGS_KEY='sand_training_meetings_v1';
  const DEFAULT_TRAINING={courses:4, lessons:12, meetings:3, minutes:181};
  const CASES_KEY='sand_case_analysis_saved_sessions_v1';
  const DRAFTS_KEY='sand_smart_case_drafts_v1';

  function e(v){ return typeof window.esc==='function' ? window.esc(v) : String(v??'').replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[m])); }
  function readJson(key, fallback){ try{ const v=JSON.parse(localStorage.getItem(key)||'null'); return v ?? fallback; }catch{ return fallback; } }
  function arr(v){ return Array.isArray(v)?v:[]; }
  function nowTs(){ return new Date().getTime(); }
  function fmtDateTime(iso){
    if(!iso) return '—';
    try{ return new Date(iso).toLocaleString('ar-EG-u-nu-arab',{dateStyle:'medium',timeStyle:'short'}); }catch{return String(iso).slice(0,16).replace('T',' ');}
  }
  function auth(){ return window.SandAuthApi || null; }
  function currentUser(){ return auth()?.currentUser?.() || null; }
  function hasPerm(p){ return !!auth()?.hasPermission?.(p); }
  function isOwner(){ const u=currentUser(); return !!(u&&(u.isSuperOwner||u.is_super_owner||u.role==='owner'||u.role==='super_owner')); }
  function canManage(){ return isOwner() || hasPerm('users.manage') || hasPerm('roles.manage') || hasPerm('licenses.manage') || hasPerm('audit.view'); }
  function canManageTraining(){ return canManage() || hasPerm('training.manage') || hasPerm('training.create') || hasPerm('training.update'); }

  function trainingStats(){
    const storedCourses=readJson(TRAINING_COURSES_KEY,null);
    const courses=arr(storedCourses).filter(c=>(c.status||'منشور')==='منشور');
    const courseCount=storedCourses?courses.length:DEFAULT_TRAINING.courses;
    const lessons=storedCourses?courses.reduce((s,c)=>s+arr(c.lessons).length,0):DEFAULT_TRAINING.lessons;
    const minutes=storedCourses?courses.reduce((s,c)=>s+arr(c.lessons).reduce((x,l)=>x+(Number(l.duration)||0),0),0):DEFAULT_TRAINING.minutes;
    const progress=readJson(TRAINING_PROGRESS_KEY,{});
    const done=storedCourses?courses.reduce((s,c)=>{ const p=progress[c.id]||{}; return s+arr(c.lessons).filter(l=>p[l.id]).length; },0):0;
    const meetingsStored=readJson(TRAINING_MEETINGS_KEY,null);
    const meetings=meetingsStored?arr(meetingsStored):[];
    const meetingCount=meetingsStored?meetings.length:DEFAULT_TRAINING.meetings;
    const attendance=arr(progress.__attendance).length;
    const quizzes=arr(progress.__quizzes).length;
    const percent=lessons?Math.round(done*100/lessons):0;
    const upcoming=(meetingsStored?meetings:[]).filter(m=>{
      const t=new Date(`${m.date||''}T${m.time||'00:00'}`).getTime();
      return Number.isFinite(t) && t>=nowTs() && (m.status||'قادم')!=='مغلق';
    }).sort((a,b)=>new Date(`${a.date}T${a.time||'00:00'}`)-new Date(`${b.date}T${b.time||'00:00'}`)).slice(0,3);
    return {courseCount, lessons, minutes, done, percent, meetingCount, attendance, quizzes, upcoming};
  }

  function workspaceStats(){
    const recent=window.JudicialWorkspace?.getRecentArticles?.(4)||[];
    const favorites=window.JudicialWorkspace?.getFavorites?.('all')||[];
    const cases=arr(readJson(CASES_KEY,[]));
    const drafts=arr(readJson(DRAFTS_KEY,[]));
    return {recent, favoritesCount:favorites.length, cases, drafts};
  }

  function userName(user){ return user?(user.fullName||user.full_name||user.name||user.username||'مستخدم'):'زائر'; }
  function roleLabel(user){
    if(!user) return 'زائر';
    if(user.isSuperOwner||user.is_super_owner) return 'مالك النظام';
    if(user.role_name) return user.role_name;
    if(user.role) return user.role;
    return 'عضو منصة';
  }
  function expiryText(){
    const exp=auth()?.expiresAt?.() || '';
    if(!exp) return 'جلسة محلية نشطة';
    return `تنتهي الجلسة: ${fmtDateTime(exp)}`;
  }
  function authReadyText(){ return auth()?.isConfigured?.() ? 'Auth API متصل' : 'يلزم ضبط Auth API'; }

  function statCard(icon,label,value,desc,action,cls=''){
    return `<article class="cmd-stat ${cls}" ${action?`onclick="${action}"`:''}><span>${icon}</span><div><small>${e(label)}</small><b>${e(value)}</b><em>${e(desc||'')}</em></div></article>`;
  }
  function actionCard(icon,title,desc,action,badge=''){
    return `<article class="cmd-action-card" onclick="${action}"><div class="cmd-action-icon">${icon}</div><div><h4>${e(title)}</h4><p>${e(desc)}</p>${badge?`<span>${e(badge)}</span>`:''}</div></article>`;
  }
  function miniRow(icon,title,desc,action){ return `<button class="cmd-mini-row" onclick="${action}"><span>${icon}</span><div><b>${e(title)}</b><small>${e(desc)}</small></div></button>`; }

  function commandCenterMarkup(){
    const m=typeof meta==='function'?meta():{};
    const law=typeof activeLaw==='function'?activeLaw():{title:'القانون الحالي',number:''};
    const user=currentUser();
    const name=userName(user);
    const t=trainingStats();
    const w=workspaceStats();
    const ntf=window.SandNotifications?.stats?.() || {unread:0,critical:0,high:0,total:0};
    const admin=canManage();
    const trainingAdmin=canManageTraining();
    const recentRows=w.recent.length?w.recent.map(x=>miniRow('📄',`${x.article.articleNumber} — ${x.article.shortTitle}`,x.article.lawName||law.title,`openArticleAcrossLaws('${x.article.id}')`)).join(''):'<div class="cmd-empty">لسه مفيش مواد مفتوحة حديثًا.</div>';
    const meetingRows=t.upcoming.length?t.upcoming.map(x=>miniRow('📹',x.title,`${x.date||'—'} — ${x.time||'—'} / ${x.speaker||'مشرف التدريب'}`,`openTrainingMeetingDetails && openTrainingMeetingDetails('${x.id}')`)).join(''):'<div class="cmd-empty">لا توجد اجتماعات قادمة محفوظة محليًا.</div>';
    const draftRows=w.drafts.slice(0,3).map((d,i)=>miniRow('🧾',d.title||d.caseTitle||`مسودة رقم ${i+1}`,fmtDateTime(d.createdAt||d.updatedAt||d.date),`openCaseAnalysisRoom && openCaseAnalysisRoom()`)).join('') || '<div class="cmd-empty">لا توجد مسودات محفوظة بعد.</div>';
    const caseRows=w.cases.slice(0,3).map((c,i)=>miniRow('⚖️',c.title||c.caseTitle||`تحليل واقعة ${i+1}`,fmtDateTime(c.createdAt||c.updatedAt||c.date),`openCaseAnalysisRoom && openCaseAnalysisRoom()`)).join('') || '<div class="cmd-empty">لا توجد تحليلات محفوظة بعد.</div>';

    return `
    <section class="command-center-page">
      <section class="cmd-hero">
        <div class="cmd-hero-glow"></div>
        <div class="cmd-identity">
          <div class="cmd-logo-orb"><img src="./assets/images/logo.png" alt="شعار النيابة العامة" onerror="this.style.display='none';this.parentElement.classList.add('logo-fallback')"></div>
          <div>
            <span class="institutional-kicker">Phase 5.15 — مركز القيادة المؤسسي</span>
            <h2>أهلًا أستاذ / ${e(name)}</h2>
            <p>مكتبك الرقمي الموحّد داخل المنصة: حسابك، التدريب، الاجتماعات، أدوات سَنَد، المواد الحديثة، المسودات، والتنبيهات التشغيلية في شاشة واحدة.</p>
            <div class="cmd-hero-actions">
              <button class="gold-btn large-action" onclick="openCaseAnalysisRoom && openCaseAnalysisRoom()">⚖️ تحليل واقعة</button>
              <button class="soft-btn large-action" onclick="openTrainingCenter && openTrainingCenter()">🎥 مركز التدريب</button>
              <button class="soft-btn large-action" onclick="toggleChat && toggleChat(true)">🤖 اسأل سَنَد</button>
              <button class="soft-btn large-action" onclick="openMyAccountCenter && openMyAccountCenter()">👤 حسابي</button>
            </div>
          </div>
        </div>
        <aside class="cmd-session-card">
          <b>${e(roleLabel(user))}</b>
          <span class="auth-state-pill on">جلسة مفعلة</span>
          <p>${e(expiryText())}</p>
          <small>${e(authReadyText())}</small>
          <div><button class="soft-btn" onclick="openMyAccountCenter && openMyAccountCenter()">إدارة الحساب</button><button class="danger-soft-btn" onclick="logoutFromAuthApi && logoutFromAuthApi()">خروج</button></div>
        </aside>
      </section>

      <section class="cmd-stats-grid">
        ${statCard('🎓','التقدم التدريبي',`${t.percent}%`,`${t.done} من ${t.lessons} درس مكتمل`,'openTrainingRecord && openTrainingRecord()')}
        ${statCard('📹','الاجتماعات القادمة',t.upcoming.length||t.meetingCount,`${t.meetingCount} اجتماع داخل المركز`,'openTrainingMeetings && openTrainingMeetings()')}
        ${statCard('🔔','الإشعارات',ntf.unread,`${ntf.critical} حرج / ${ntf.high} هام`,'openNotificationsCenter && openNotificationsCenter()')}
        ${statCard('⭐','المفضلة',w.favoritesCount,'مواد محفوظة للرجوع السريع','openFavoritesCenter && openFavoritesCenter()')}
        ${statCard('🧾','المسودات',w.drafts.length,'مسودات وتصرفات محفوظة','openCaseAnalysisRoom && openCaseAnalysisRoom()')}
        ${statCard('⚖️','تحليلات الوقائع',w.cases.length,'جلسات تحليل محفوظة محليًا','openCaseAnalysisRoom && openCaseAnalysisRoom()')}
      </section>

      <section class="cmd-layout">
        <div class="cmd-main-col">
          <div class="cmd-section-head"><div><h3>استكمل عملك</h3><p>آخر ما تعاملت معه داخل المنصة.</p></div></div>
          <div class="cmd-work-grid">
            <article class="cmd-panel"><h4>📚 آخر المواد المفتوحة</h4>${recentRows}<button class="soft-btn" onclick="openRecentArticles && openRecentArticles()">فتح سجل المواد</button></article>
            <article class="cmd-panel"><h4>📹 الاجتماعات والتدريبات المباشرة</h4>${meetingRows}<button class="soft-btn" onclick="openTrainingMeetings && openTrainingMeetings()">كل الاجتماعات</button></article>
          </div>
          <div class="cmd-work-grid">
            <article class="cmd-panel"><h4>⚖️ تحليلات الوقائع</h4>${caseRows}<button class="gold-btn" onclick="openCaseAnalysisRoom && openCaseAnalysisRoom()">فتح غرفة التحليل</button></article>
            <article class="cmd-panel"><h4>🧾 المسودات</h4>${draftRows}<button class="soft-btn" onclick="openCaseAnalysisRoom && openCaseAnalysisRoom()">فتح المسودات</button></article>
          </div>
        </div>

        <aside class="cmd-side-col">
          <article class="cmd-panel cmd-law-panel">
            <span>القانون المعروض حاليًا</span>
            <h3>${e(law.title)}</h3>
            <p>${e(law.number||'')} — ${m.totalArticles||0} مادة/سجل متاح.</p>
            <div class="cmd-law-actions"><button class="soft-btn" onclick="openLawLibrary && openLawLibrary()">تغيير القانون</button><button class="gold-btn" onclick="openUnifiedSearch && openUnifiedSearch()">بحث موحد</button></div>
          </article>
          <article class="cmd-panel cmd-alerts">
            <h4>🔔 تنبيهات تشغيلية</h4>
            ${miniRow(ntf.unread?'🔔':'✅','مركز الإشعارات',ntf.unread?`${ntf.unread} إشعار غير مقروء`:'لا توجد إشعارات غير مقروءة','openNotificationsCenter && openNotificationsCenter()')}
            ${miniRow(auth()?.isConfigured?.()?'✅':'⚠️','حالة الربط المؤسسي',authReadyText(),'openInstitutionalSettings && openInstitutionalSettings()')}
            ${miniRow(t.upcoming.length?'📹':'ℹ️','التدريب المباشر',t.upcoming.length?`لديك ${t.upcoming.length} اجتماع قادم`:'لا توجد اجتماعات قريبة','openTrainingMeetings && openTrainingMeetings()')}
            ${miniRow('👤','حالة الحساب',roleLabel(user),'openMyAccountCenter && openMyAccountCenter()')}
          </article>
        </aside>
      </section>

      <section class="cmd-section-head"><div><h3>اختصارات القيادة</h3><p>أهم مراكز العمل حسب صلاحيات الحساب.</p></div></section>
      <section class="cmd-actions-grid">
        ${actionCard('⚖️','غرفة تحليل الواقعة','تحليل نصي أو صوتي، تكييفات محتملة، خطة تحقيق، ومسودات.','openCaseAnalysisRoom && openCaseAnalysisRoom()','سَنَد')}
        ${actionCard('⏱️','حاسبة المواعيد','حساب المدد القانونية والتنبيهات المرتبطة بالإجراءات.','openDeadlineCalculator && openDeadlineCalculator()','أداة تنفيذية')}
        ${actionCard('🛡️','درع المراجعة الوقائية','مراجعة المخاطر والأخطاء قبل التصرف أو الإجراء.','openProceduralShield && openProceduralShield()','مراجعة')}
        ${actionCard('🎥','مركز التدريب المرئي','دورات، محاضرات، اجتماعات مباشرة، سجل تدريبي واختبارات.','openTrainingCenter && openTrainingCenter()',`${t.courseCount} دورات`)}
        ${actionCard('🔔','مركز الإشعارات والتنبيهات','تصنيفات، أولويات، أرشفة، بحث، وإجراءات مباشرة لكل تنبيه.','openNotificationsCenter && openNotificationsCenter()',`${ntf.unread} غير مقروء`)}
        ${actionCard('💬','مركز التواصل القضائي','زملاء موثوقون، طلبات تواصل، قنوات رسمية، ومحادثات آمنة بين الأعضاء.','openSecureCommunicationCenter && openSecureCommunicationCenter()','خصوصية')}
        ${trainingAdmin?actionCard('🧑‍🏫','إدارة مركز التدريب','إضافة دورات ودروس وروابط اجتماعات وروابط حضور ضيوف.','openTrainingAdmin && openTrainingAdmin()','إدارة'):''}
        ${admin?actionCard('👥','العضويات والصلاحيات','مراجعة العضويات، الأدوار، التراخيص، الأجهزة، والسجل.','openMembershipAdmin && openMembershipAdmin()','مالك/إدارة'):''}
        ${admin?actionCard('🎫','التراخيص والأجهزة','إدارة مدد العضوية وعدد الأجهزة وحالات التفعيل.','openLicenseDeviceAdmin && openLicenseDeviceAdmin()','أمان'):''}
        ${admin?actionCard('📜','مركز الأمن والسجل','متابعة سجل العمليات ومحاولات الدخول والقرارات الإدارية.','openSecurityAuditCenter && openSecurityAuditCenter()','Audit'):''}
      </section>

      <section class="institutional-assurance cmd-assurance">
        <div><b>مركز قيادة واحد</b><span>الشاشة تجمع أهم بيانات الحساب والتدريب والعمل القضائي بدل التنقل بين شاشات كثيرة.</span></div>
        <div><b>حسب الصلاحيات</b><span>الكروت الإدارية تظهر لمالك النظام أو أصحاب الصلاحيات فقط.</span></div>
        <div><b>جاهز للتوسع</b><span>المرحلة التالية تضيف مركز إشعارات كامل بدل التنبيهات المبدئية.</span></div>
      </section>
    </section>`;
  }

  const originalGoHome=window.goHome;
  window.openCommandCenterDashboard=function(){
    if(typeof closeMobileMenu==='function') closeMobileMenu();
    if(typeof closeSidebar==='function') closeSidebar();
    if(typeof setActiveNav==='function') setActiveNav('home');
    if(typeof updateLawAwareNavigation==='function') updateLawAwareNavigation();
    if(typeof window.refreshInstitutionalAuthBar==='function') window.refreshInstitutionalAuthBar();
    if(typeof page==='function') page(commandCenterMarkup());
    else document.getElementById('appView').innerHTML=`<div class="page">${commandCenterMarkup()}</div>`;
  };
  window.goHome=function(){
    const u=currentUser();
    if(!u){ return originalGoHome ? originalGoHome() : null; }
    if(window.state){ state.view='home'; state.query=''; state.searchLawFilter='all'; }
    const search=document.getElementById('globalSearch'); if(search) search.value='';
    window.openCommandCenterDashboard();
  };
})();
