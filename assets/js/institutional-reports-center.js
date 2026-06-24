/* =========================================================
   Phase 5.20 — Institutional Reports & Analytics Center
   مركز التقارير والتحليلات المؤسسية
   ========================================================= */
(function(){
  const STORAGE_KEY = 'sand_institutional_reports_settings_v520';
  const EXPORT_PREFIX = 'sand_report_export_';
  const state = { range:'30', section:'overview', query:'' };

  function safeJson(key, fallback){
    try{ const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }catch(e){ return fallback; }
  }
  function arr(key){ const v = safeJson(key, []); return Array.isArray(v) ? v : []; }
  function obj(key){ const v = safeJson(key, {}); return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; }
  function now(){ return new Date().toISOString(); }
  function escapeHtml(v){ return String(v ?? '').replace(/[&<>"]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s])); }
  function formatDate(v){ try{ return new Date(v).toLocaleString('ar-EG'); }catch(e){ return v || '—'; } }
  function pct(n,d){ if(!d) return 0; return Math.min(100, Math.round((n/d)*100)); }
  function uid(p='rpt'){ return p+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8); }
  function currentUser(){
    try{
      if(window.SandAuth && typeof SandAuth.getCurrentUser === 'function') return SandAuth.getCurrentUser() || null;
      const raw = localStorage.getItem('sand_auth_session') || localStorage.getItem('sand_current_user');
      return raw ? JSON.parse(raw) : null;
    }catch(e){ return null; }
  }
  function isAdmin(){
    try{ if(window.AccessControlGuard && typeof AccessControlGuard.hasAnyRole === 'function') return AccessControlGuard.hasAnyRole(['owner','system_owner','admin','manager','auditor','content_admin']); }catch(e){}
    const u = currentUser();
    const role = String(u?.role || u?.userRole || u?.accountRole || '').toLowerCase();
    return ['owner','system_owner','admin','manager','auditor','content_admin'].some(r => role.includes(r));
  }
  function setMain(html){
    const main = document.getElementById('appView') || document.getElementById('mainContent') || document.querySelector('main') || document.body;
    main.innerHTML = html;
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.nav === 'institutional-reports-center'));
    window.scrollTo({top:0, behavior:'smooth'});
  }

  function collect(){
    const modules = Array.isArray(window.LAW_MODULES) ? window.LAW_MODULES : [];
    const articles = modules.reduce((s,m)=>s+(m.articles?.length||0),0);
    const trainingCourses = arr('sand_training_courses_v514');
    const trainingMeetings = arr('sand_training_meetings_v514');
    const trainingProgress = obj('sand_training_progress_v513');
    const notifications = arr('sand_notifications_v516');
    const commMessages = arr('sand_secure_comm_messages_v5161');
    const commRequests = arr('sand_secure_comm_requests_v5161');
    const trusted = arr('sand_secure_comm_trusted_v5161');
    const caseFiles = arr('sand_case_files_v517');
    const caseShares = arr('sand_case_file_shares_v518');
    const contentStore = obj('sand_legal_content_store_v519');
    const localLaws = Array.isArray(contentStore.laws) ? contentStore.laws : [];
    const contentAudit = arr('sand_legal_content_audit_v519');
    const securityAudit = arr('sand_security_audit_log_v510')
      .concat(arr('sand_access_audit_log_v510'))
      .concat(arr('sand_auth_audit_log'));
    const memberships = arr('sand_membership_requests').concat(arr('sand_auth_membership_requests')).concat(arr('sand_pending_memberships'));
    const devices = arr('sand_registered_devices').concat(arr('sand_license_devices')).concat(arr('sand_pending_devices'));
    const nowDt = Date.now();
    const upcomingMeetings = trainingMeetings.filter(m => {
      const t = Date.parse(m.startAt || m.start || m.date || m.meetingDate || '');
      return t && t >= nowDt;
    });
    const completedLessons = Object.values(trainingProgress || {}).filter(v => v && (v.completed || v.progress >= 95)).length;
    const totalLessons = trainingCourses.reduce((s,c)=>s+(c.lessons?.length||0),0);
    const activeCases = caseFiles.filter(f => !['archived','deleted'].includes(f.status)).length;
    const reviewCases = caseFiles.filter(f => ['needs_review','needs_completion','review','needsCompletion','يحتاج استيفاء'].includes(f.status)).length;
    const sharedCases = caseShares.filter(s => !s.revoked && (!s.expiresAt || Date.parse(s.expiresAt)>nowDt)).length;
    const unreadNotifications = notifications.filter(n => !n.readAt && n.status !== 'read' && n.status !== 'archived' && !n.deletedAt).length;
    const criticalNotifications = notifications.filter(n => ['critical','حرج'].includes(n.priority)).length;
    const pendingContent = localLaws.reduce((s,l)=>s+((l.status==='review'||l.status==='draft')?1:0)+(l.articles||[]).filter(a=>['review','draft'].includes(a.status)).length,0);
    const publishedContent = localLaws.reduce((s,l)=>s+(l.status==='published'?1:0)+(l.articles||[]).filter(a=>a.status==='published').length,0);
    return {
      generatedAt: now(),
      user: currentUser(),
      laws:{ systemLaws:modules.length, systemArticles:articles, localLaws:localLaws.length, localArticles:localLaws.reduce((s,l)=>s+(l.articles?.length||0),0), pendingContent, publishedContent, contentAudit:contentAudit.length },
      training:{ courses:trainingCourses.length, lessons:totalLessons, completedLessons, completionRate:pct(completedLessons,totalLessons), meetings:trainingMeetings.length, upcomingMeetings:upcomingMeetings.length },
      notifications:{ total:notifications.length, unread:unreadNotifications, critical:criticalNotifications, archived:notifications.filter(n=>n.status==='archived').length },
      communication:{ messages:commMessages.length, requests:commRequests.length, trusted:trusted.length, groups:arr('sand_secure_comm_channels_v5161').length },
      cases:{ total:caseFiles.length, active:activeCases, review:reviewCases, archived:caseFiles.filter(f=>f.status==='archived').length, shared:sharedCases, urgent:caseFiles.filter(f=>['urgent','عاجل'].includes(f.priority)).length },
      access:{ membershipRequests:memberships.length, devices:devices.length, securityEvents:securityAudit.length, sessions:arr('sand_auth_sessions').length },
      recent:{ notifications:notifications.slice(0,6), cases:caseFiles.slice(0,6), audits:contentAudit.slice(0,6), security:securityAudit.slice(0,6), meetings:upcomingMeetings.slice(0,6) }
    };
  }

  function health(data){
    const scoreParts = [
      data.notifications.critical ? 55 : 90,
      data.cases.review ? Math.max(50, 95 - data.cases.review*5) : 95,
      data.training.completionRate || 20,
      data.laws.pendingContent ? Math.max(60, 95-data.laws.pendingContent*3) : 92,
      data.access.securityEvents ? Math.max(50, 95-data.access.securityEvents) : 95
    ];
    const score = Math.round(scoreParts.reduce((a,b)=>a+b,0)/scoreParts.length);
    let label = 'مستقر';
    if(score < 55) label = 'يحتاج تدخل'; else if(score < 75) label = 'تحت المتابعة'; else if(score > 88) label = 'ممتاز';
    return {score,label};
  }
  function kpi(title,value,sub,icon,cls=''){
    return `<div class="irc-kpi ${cls}"><div class="irc-kpi-icon">${icon}</div><div><b>${escapeHtml(value)}</b><span>${escapeHtml(title)}</span><small>${escapeHtml(sub||'')}</small></div></div>`;
  }
  function progress(label,value){ return `<div class="irc-progress"><div class="irc-progress-head"><span>${escapeHtml(label)}</span><b>${value}%</b></div><div class="irc-progress-track"><i style="width:${Math.max(0,Math.min(100,value))}%"></i></div></div>`; }
  function miniList(items, empty, mapper){ return items && items.length ? items.map(mapper).join('') : `<p class="irc-empty">${escapeHtml(empty)}</p>`; }

  function openInstitutionalReportsCenter(){
    if(!isAdmin()){
      setMain(`<section class="irc-page"><div class="irc-hero"><div><span class="irc-kicker">المرحلة 5.20</span><h2>مركز التقارير والتحليلات المؤسسية</h2><p>هذه الشاشة مخصصة للإدارة وأصحاب صلاحيات المتابعة والتحليل.</p></div><button class="irc-btn" onclick="goHome && goHome()">العودة لمركز القيادة</button></div></section>`);
      return;
    }
    render();
  }
  function render(){
    const data = collect();
    const h = health(data);
    setMain(`
      <section class="irc-page">
        <div class="irc-hero">
          <div>
            <span class="irc-kicker">المرحلة 5.20</span>
            <h2>مركز التقارير والتحليلات المؤسسية</h2>
            <p>غرفة متابعة شاملة تجمع مؤشرات العضويات، التدريب، الإشعارات، التواصل، ملفات الوقائع، والمحتوى القانوني في لوحة واحدة قابلة للطباعة والتصدير.</p>
          </div>
          <div class="irc-hero-actions">
            <button class="irc-btn primary" onclick="InstitutionalReportsCenter.exportJson()">⬇️ تصدير JSON</button>
            <button class="irc-btn" onclick="InstitutionalReportsCenter.printReport()">🖨️ طباعة التقرير</button>
            <button class="irc-btn" onclick="InstitutionalReportsCenter.render()">🔄 تحديث</button>
          </div>
        </div>
        <div class="irc-health-card">
          <div class="irc-health-ring" style="--p:${h.score}"><b>${h.score}%</b><span>${h.label}</span></div>
          <div class="irc-health-text"><h3>مؤشر سلامة التشغيل المؤسسي</h3><p>مؤشر تقديري محلي يعتمد على الإشعارات الحرجة، الملفات التي تحتاج متابعة، إكمال التدريب، المحتوى قيد المراجعة، والسجل الأمني.</p></div>
          <div class="irc-range"><label>نطاق التقرير</label><select onchange="InstitutionalReportsCenter.setRange(this.value)"><option value="7" ${state.range==='7'?'selected':''}>آخر 7 أيام</option><option value="30" ${state.range==='30'?'selected':''}>آخر 30 يوم</option><option value="90" ${state.range==='90'?'selected':''}>آخر 90 يوم</option><option value="all" ${state.range==='all'?'selected':''}>كل البيانات</option></select></div>
        </div>
        <div class="irc-kpi-grid">
          ${kpi('المواد القانونية', data.laws.systemArticles + data.laws.localArticles, `${data.laws.systemLaws + data.laws.localLaws} قانون`, '⚖️')}
          ${kpi('ملفات الوقائع', data.cases.total, `${data.cases.review} يحتاج متابعة`, '📁', data.cases.review?'warn':'')}
          ${kpi('مركز التدريب', data.training.courses, `${data.training.upcomingMeetings} اجتماع قادم`, '🎥')}
          ${kpi('الإشعارات غير المقروءة', data.notifications.unread, `${data.notifications.critical} حرج`, '🔔', data.notifications.critical?'danger':'')}
          ${kpi('رسائل التواصل', data.communication.messages, `${data.communication.requests} طلب تواصل`, '💬')}
          ${kpi('أحداث الأمن', data.access.securityEvents, `${data.access.devices} أجهزة`, '🛡️')}
        </div>
        <div class="irc-tabs">
          <button class="${state.section==='overview'?'active':''}" onclick="InstitutionalReportsCenter.setSection('overview')">نظرة عامة</button>
          <button class="${state.section==='training'?'active':''}" onclick="InstitutionalReportsCenter.setSection('training')">التدريب</button>
          <button class="${state.section==='cases'?'active':''}" onclick="InstitutionalReportsCenter.setSection('cases')">ملفات الوقائع</button>
          <button class="${state.section==='content'?'active':''}" onclick="InstitutionalReportsCenter.setSection('content')">المحتوى القانوني</button>
          <button class="${state.section==='security'?'active':''}" onclick="InstitutionalReportsCenter.setSection('security')">الأمن والتواصل</button>
        </div>
        <div class="irc-section">${renderSection(data)}</div>
      </section>`);
  }
  function renderSection(data){
    if(state.section==='training') return renderTraining(data);
    if(state.section==='cases') return renderCases(data);
    if(state.section==='content') return renderContent(data);
    if(state.section==='security') return renderSecurity(data);
    return renderOverview(data);
  }
  function renderOverview(data){
    return `<div class="irc-panels">
      <div class="irc-panel"><h3>مؤشرات الأداء السريعة</h3>${progress('إكمال التدريب', data.training.completionRate)}${progress('استقرار الإشعارات', data.notifications.critical?55:92)}${progress('جاهزية المحتوى', data.laws.pendingContent?Math.max(40,100-data.laws.pendingContent*4):96)}${progress('متابعة ملفات الوقائع', data.cases.review?Math.max(35,100-data.cases.review*8):94)}</div>
      <div class="irc-panel"><h3>تنبيهات تحتاج نظر</h3>${miniList(buildAlerts(data),'لا توجد تنبيهات مؤسسية حرجة حاليًا.', a=>`<div class="irc-row ${a.level}"><b>${a.title}</b><span>${a.text}</span><button onclick="${a.action||'void(0)'}">فتح</button></div>`)}</div>
      <div class="irc-panel"><h3>آخر الاجتماعات القادمة</h3>${miniList(data.recent.meetings,'لا توجد اجتماعات قادمة مسجلة.', m=>`<div class="irc-row"><b>${escapeHtml(m.title||m.name||'اجتماع تدريبي')}</b><span>${formatDate(m.startAt||m.start||m.date)}</span></div>`)}</div>
      <div class="irc-panel"><h3>آخر إشعارات</h3>${miniList(data.recent.notifications,'لا توجد إشعارات.', n=>`<div class="irc-row"><b>${escapeHtml(n.title||'إشعار')}</b><span>${escapeHtml(n.message||n.body||'')}</span></div>`)}</div>
    </div>`;
  }
  function renderTraining(data){
    return `<div class="irc-panels"><div class="irc-panel wide"><h3>تحليل التدريب المرئي</h3>${progress('نسبة إكمال الدروس', data.training.completionRate)}<div class="irc-matrix"><span>الدورات</span><b>${data.training.courses}</b><span>الدروس</span><b>${data.training.lessons}</b><span>الدروس المكتملة</span><b>${data.training.completedLessons}</b><span>الاجتماعات القادمة</span><b>${data.training.upcomingMeetings}</b></div></div><div class="irc-panel"><h3>توصيات التدريب</h3>${miniList(trainingRecommendations(data),'لا توجد توصيات تدريبية.', r=>`<div class="irc-row"><b>${r.title}</b><span>${r.text}</span></div>`)}</div></div>`;
  }
  function renderCases(data){
    return `<div class="irc-panels"><div class="irc-panel wide"><h3>ملفات الوقائع والتحليلات</h3><div class="irc-matrix"><span>إجمالي الملفات</span><b>${data.cases.total}</b><span>نشطة</span><b>${data.cases.active}</b><span>تحتاج استيفاء/مراجعة</span><b>${data.cases.review}</b><span>مشتركة</span><b>${data.cases.shared}</b><span>عاجلة</span><b>${data.cases.urgent}</b><span>مؤرشفة</span><b>${data.cases.archived}</b></div></div><div class="irc-panel"><h3>آخر الملفات</h3>${miniList(data.recent.cases,'لا توجد ملفات وقائع محفوظة.', f=>`<div class="irc-row"><b>${escapeHtml(f.title||f.caseTitle||'ملف واقعة')}</b><span>${escapeHtml(f.status||'تحت الدراسة')} — ${formatDate(f.updatedAt||f.createdAt)}</span></div>`)}</div></div>`;
  }
  function renderContent(data){
    return `<div class="irc-panels"><div class="irc-panel wide"><h3>المحتوى القانوني</h3><div class="irc-matrix"><span>قوانين النظام</span><b>${data.laws.systemLaws}</b><span>مواد النظام</span><b>${data.laws.systemArticles}</b><span>قوانين محلية</span><b>${data.laws.localLaws}</b><span>مواد محلية</span><b>${data.laws.localArticles}</b><span>قيد المراجعة/مسودة</span><b>${data.laws.pendingContent}</b><span>منشور محليًا</span><b>${data.laws.publishedContent}</b></div></div><div class="irc-panel"><h3>آخر عمليات المحتوى</h3>${miniList(data.recent.audits,'لا توجد عمليات محتوى حديثة.', a=>`<div class="irc-row"><b>${escapeHtml(a.action||'عملية')}</b><span>${escapeHtml(a.details||'')} — ${formatDate(a.at)}</span></div>`)}</div></div>`;
  }
  function renderSecurity(data){
    return `<div class="irc-panels"><div class="irc-panel wide"><h3>الأمن والتواصل</h3><div class="irc-matrix"><span>رسائل التواصل</span><b>${data.communication.messages}</b><span>طلبات التواصل</span><b>${data.communication.requests}</b><span>زملاء موثوقون</span><b>${data.communication.trusted}</b><span>قنوات/مجموعات</span><b>${data.communication.groups}</b><span>طلبات عضوية</span><b>${data.access.membershipRequests}</b><span>أحداث أمنية</span><b>${data.access.securityEvents}</b></div></div><div class="irc-panel"><h3>آخر أحداث الأمن</h3>${miniList(data.recent.security,'لا توجد أحداث أمنية مسجلة.', a=>`<div class="irc-row"><b>${escapeHtml(a.action||a.type||'حدث')}</b><span>${escapeHtml(a.details||a.message||'')} — ${formatDate(a.at||a.createdAt)}</span></div>`)}</div></div>`;
  }
  function buildAlerts(data){
    const out=[];
    if(data.notifications.critical) out.push({level:'danger',title:'إشعارات حرجة',text:`يوجد ${data.notifications.critical} إشعار حرج يحتاج متابعة.`,action:'openNotificationsCenter && openNotificationsCenter()'});
    if(data.cases.review) out.push({level:'warn',title:'ملفات تحتاج استيفاء',text:`يوجد ${data.cases.review} ملف واقعة يحتاج مراجعة أو استيفاء.`,action:'openCaseFilesCenter && openCaseFilesCenter()'});
    if(data.laws.pendingContent) out.push({level:'warn',title:'محتوى قيد المراجعة',text:`يوجد ${data.laws.pendingContent} عنصر قانوني في المسودة أو المراجعة.`,action:'openLegalContentManager && openLegalContentManager()'});
    if(data.training.upcomingMeetings) out.push({level:'info',title:'اجتماعات تدريب قادمة',text:`يوجد ${data.training.upcomingMeetings} اجتماع تدريبي قادم.`,action:'openTrainingCenter && openTrainingCenter()'});
    return out;
  }
  function trainingRecommendations(data){
    const rec=[];
    if(data.training.completionRate < 50) rec.push({title:'رفع معدل إكمال التدريب',text:'يفضل إبراز الدورات الأساسية في لوحة القيادة وإرسال تنبيه للأعضاء غير المكتملين.'});
    if(!data.training.upcomingMeetings) rec.push({title:'جدولة اجتماع تدريبي',text:'لا توجد اجتماعات قادمة، يمكن إنشاء تدريب مباشر سريع من مركز التدريب المرئي.'});
    if(data.training.courses && !data.training.lessons) rec.push({title:'استكمال الدروس',text:'توجد دورات بدون دروس كافية؛ يفضل استكمال المحتوى التدريبي.'});
    return rec;
  }
  function setSection(s){ state.section=s; render(); }
  function setRange(r){ state.range=r; render(); }
  function exportJson(){
    const data = collect();
    const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href=url; a.download = EXPORT_PREFIX + new Date().toISOString().slice(0,10)+'.json';
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    try{ localStorage.setItem('sand_last_institutional_report_export', data.generatedAt); }catch(e){}
  }
  function printReport(){ window.print(); }

  window.InstitutionalReportsCenter = { openInstitutionalReportsCenter, render, setSection, setRange, exportJson, printReport };
  window.openInstitutionalReportsCenter = openInstitutionalReportsCenter;
})();
