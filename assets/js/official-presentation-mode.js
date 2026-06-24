(function(){
  'use strict';
  const PHASE='5.25';
  const STATE_KEY='sand_official_presentation_state_v525';
  const DEMO_KEY='sand_official_presentation_demo_v525';
  function q(sel){return document.querySelector(sel)}
  function esc(s){return String(s??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));}
  function safeParse(raw,fallback){try{return JSON.parse(raw)}catch(e){return fallback}}
  function now(){return new Date().toISOString()}
  function isAdmin(){
    const u=(window.SAND_AUTH_STATE&&window.SAND_AUTH_STATE.account)||window.currentAuthUser||{};
    const role=String(u.role||u.accountRole||u.type||'').toLowerCase();
    return !u.role || ['owner','system_owner','admin','manager','auditor','presenter'].some(x=>role.includes(x));
  }
  function setMain(html){
    const el=document.getElementById('appView')||document.querySelector('main')||document.body;
    el.innerHTML=html;
    document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active', b.dataset.nav==='official-presentation-mode'));
    document.body.classList.add('official-presentation-active');
    window.scrollTo({top:0,behavior:'smooth'});
  }
  function clearPresentationClass(){document.body.classList.remove('official-presentation-active')}
  function toast(msg){try{window.showToast?window.showToast(msg):alert(msg)}catch(e){alert(msg)}}
  function saveState(patch){const old=safeParse(localStorage.getItem(STATE_KEY),'{}')||{}; const n=Object.assign({},old,patch,{updatedAt:now(),phase:PHASE}); localStorage.setItem(STATE_KEY,JSON.stringify(n)); return n;}
  function state(){return safeParse(localStorage.getItem(STATE_KEY),'{}')||{step:0};}
  const steps=[
    {id:'opening',icon:'⚖️',title:'الافتتاح الرسمي',subtitle:'هوية المنصة ورسالتها المؤسسية',duration:'دقيقة واحدة',focus:'إظهار الهيبة والهدف قبل الدخول في التفاصيل.',script:'نبدأ بعرض أن المنصة ليست مجرد دليل قانوني، بل بيئة قضائية ذكية متكاملة تجمع المعرفة، التحليل، التدريب، التواصل، والإدارة.',bullets:['هوية بصرية سوداء/ذهبية مناسبة للبيئة القضائية.','بيانات التوجيه والإشراف والإعداد والتطوير واضحة.','تقديم سَنَد كمساعد قضائي داعم لا بديل عن التقدير القضائي.'],actions:[['فتح مركز القيادة','openCommandCenterDashboard && openCommandCenterDashboard()'],['اسأل سَنَد','toggleChat(true)']]},
    {id:'dashboard',icon:'🏛️',title:'مركز القيادة المؤسسي',subtitle:'أول شاشة بعد تسجيل الدخول',duration:'دقيقتان',focus:'إثبات أن المنصة منظمة وليست مجموعة أزرار متفرقة.',script:'هنا نوضح أن كل مستخدم يرى مساحة عمله حسب الصلاحيات: الحساب، التدريب، الاجتماعات، الملفات، التنبيهات، والاختصارات التنفيذية.',bullets:['عرض حالة الحساب والجلسة والربط بالخدمات.','اختصارات للأدوات الأساسية حسب الصلاحيات.','مؤشرات سريعة للتدريب والملفات والتنبيهات.'],actions:[['مركز القيادة','openCommandCenterDashboard && openCommandCenterDashboard()'],['الإشعارات','openNotificationsCenter && openNotificationsCenter()']]},
    {id:'laws',icon:'📚',title:'مكتبة القوانين والبحث الموحد',subtitle:'الوصول السريع للنصوص والشروح',duration:'دقيقتان',focus:'إبراز قوة المحتوى القانوني وسهولة الوصول إليه.',script:'نستعرض مكتبة القوانين، فتح القانون مباشرة، البحث الموحد، المحاور، والانتقال من النص إلى الشرح التنفيذي العملي.',bullets:['مكتبة قوانين متعددة وليست قانونًا واحدًا.','بحث موحد عبر جميع القوانين المحملة.','مواد مرتبطة وشروح تنفيذية ونقاط عملية للنيابة.'],actions:[['مكتبة القوانين','openLawLibrary()'],['البحث الموحد','openUnifiedSearch()']]},
    {id:'sand',icon:'🤖',title:'سَنَد — المساعد القضائي الذكي',subtitle:'التفاعل القانوني الموجه',duration:'دقيقتان',focus:'تقديم الذكاء الاصطناعي كأداة مراجعة وتحليل لا كفتوى نهائية.',script:'نوضح أن سَنَد يساعد في الفهم، الترجيح المبدئي، استخراج النصوص، واقتراح خطوات الاستيفاء، مع بقاء القرار النهائي لعضو النيابة.',bullets:['أنماط إجابة متعددة: مختصر، تنفيذي، تفصيلي، تعليمي.','ربط بالإطار القانوني والمواد ذات الصلة.','تنبيه مهني دائم بأن المخرجات مساعدة وليست بديلًا للتقدير القضائي.'],actions:[['فتح سَنَد','toggleChat(true)'],['غرفة التحليل','openCaseAnalysisRoom()']]},
    {id:'analysis',icon:'⚖️',title:'غرفة تحليل الوقائع القضائية',subtitle:'مركز عمليات تحليل الواقعة',duration:'٤ دقائق',focus:'هذه لحظة العرض الأساسية: من واقعة إلى تكييف وخطة ومسودات.',script:'نستعرض إدخال الواقعة، مؤشرات اكتمال البيانات، التكييفات المحتملة، نقاط الاستيفاء، خطة التحقيق، والمسودات المقترحة.',bullets:['واجهة مركز عمليات وليست صندوق دردشة فقط.','خلاصة تنفيذية ومؤشرات جودة وتحليل.','ربط مباشر بالمسودات وحاسبة المواعيد وإدخال المستندات.'],actions:[['فتح غرفة التحليل','openCaseAnalysisRoom()'],['درع المراجعة','openProceduralShield()']]},
    {id:'caseFiles',icon:'📁',title:'ملفات الوقائع والتحليلات',subtitle:'تحويل التحليل إلى ملف قضائي محفوظ',duration:'٣ دقائق',focus:'إثبات أن المنصة تحفظ العمل وتسمح بالرجوع إليه.',script:'نوضح إنشاء ملف واقعة، حفظ نتيجة التحليل، الحالات، الأولويات، الملاحظات، المسودات، المواعيد، وسجل المتابعة.',bullets:['تخزين ذكي خفيف Local-first.','حالات ملف واضحة: تحت الدراسة، يحتاج استيفاء، جاهز، تم التصرف، مؤرشف.','عدم حفظ محادثات سَنَد كاملة تلقائيًا لتقليل الحجم وحماية الخصوصية.'],actions:[['ملفات الوقائع','openCaseFilesCenter && openCaseFilesCenter()'],['حاسبة المواعيد','openDeadlineCalculator()']]},
    {id:'collaboration',icon:'🤝',title:'المشاركة والتعاون القضائي الآمن',subtitle:'مراجعة ملف واقعة بصلاحيات محددة',duration:'دقيقتان',focus:'إظهار أن التعاون محكوم وليس عشوائيًا.',script:'نستعرض مشاركة ملف مع زميل موثوق أو جهة مراجعة، تحديد صلاحيات ومدة المشاركة، وإضافة ملاحظات مراجعة.',bullets:['مشاركة قراءة فقط أو تعليق أو مراجعة قانونية.','سجل مشاركة داخل الملف.','تنبيهات عند المشاركة أو إضافة ملاحظة.'],actions:[['مركز التواصل','openSecureCommunicationCenter && openSecureCommunicationCenter()'],['ملفات الوقائع','openCaseFilesCenter && openCaseFilesCenter()']]},
    {id:'training',icon:'🎥',title:'مركز التدريب المرئي',subtitle:'التدريب والاجتماعات والضيوف',duration:'٣ دقائق',focus:'إظهار أن المنصة أداة تطوير مؤسسي مستمر.',script:'نستعرض الدورات، الدروس، الاجتماعات المباشرة، إنشاء اجتماع فوري، ورابط حضور الضيوف ببوابة رسمية.',bullets:['دورات ومحاضرات واختبارات وسجل تدريبي.','اجتماعات Jitsi فورية وروابط خارجية لـ Meet/Teams/Zoom.','بوابة ضيوف بهوية المنصة بدون صلاحيات داخلية.'],actions:[['مركز التدريب','openTrainingCenter && openTrainingCenter()'],['لوحة إدارة التدريب','openTrainingAdmin && openTrainingAdmin()']]},
    {id:'communication',icon:'💬',title:'التواصل القضائي الآمن',subtitle:'زملاء موثوقون ومراسلة محكومة',duration:'دقيقتان',focus:'إظهار الخصوصية ومنع الفوضى.',script:'نوضح البحث عن الأعضاء، طلب التواصل، الموافقة المتبادلة، القنوات الرسمية، والمزامنة Realtime-ready عبر Worker.',bullets:['لا محادثة فردية إلا بعد موافقة الطرفين.','قنوات رسمية وإعلانات إدارية.','مزامنة حقيقية عند ضبط Worker مع استمرار العمل المحلي كاحتياطي.'],actions:[['مركز التواصل','openSecureCommunicationCenter && openSecureCommunicationCenter()'],['الإشعارات','openNotificationsCenter && openNotificationsCenter()']]},
    {id:'admin',icon:'📊',title:'الإدارة والتقارير والأمان',subtitle:'الرؤية المؤسسية الكاملة',duration:'٣ دقائق',focus:'طمأنة الإدارة أن المنصة قابلة للمتابعة والصيانة.',script:'نستعرض التقارير، النسخ الاحتياطي، الصيانة، المراجعة الأمنية، والإعدادات العامة المتقدمة.',bullets:['مؤشر سلامة التشغيل المؤسسي.','نسخ احتياطي واستعادة كاملة أو جزئية.','فحص أمني قبل العرض الرسمي وسياسات إعداد مركزية.'],actions:[['التقارير','openInstitutionalReportsCenter && openInstitutionalReportsCenter()'],['النسخ الاحتياطي','openBackupRestoreCenter && openBackupRestoreCenter()'],['الأمان','openSecurityAuditCenter && openSecurityAuditCenter()']]},
    {id:'closing',icon:'🏆',title:'الخاتمة ورسالة القيمة',subtitle:'لماذا تستحق المنصة الاعتماد والتطوير',duration:'دقيقة واحدة',focus:'إنهاء العرض بصورة قوية ومركزة.',script:'نختم بأن المنصة تجمع بين القانون، الذكاء، التدريب، التواصل، الإدارة، والتأمين في تجربة واحدة قابلة للتوسع.',bullets:['منصة معرفة وتشغيل وتدريب وتعاون في آن واحد.','قابلة للتخصيص والتوسع والربط المؤسسي.','مصممة لتقليل التشتت وتسريع الوصول إلى الإجراء الصحيح.'],actions:[['إعادة العرض','OfficialPresentationMode.openStep(0)'],['فتح الإعدادات','openInstitutionalSettings && openInstitutionalSettings()']]}
  ];
  function actionButtons(actions){return (actions||[]).map((a,i)=>`<button class="${i===0?'opm-gold':'opm-soft'}" onclick="${a[1]}">${esc(a[0])}</button>`).join('')}
  function miniSteps(active){return steps.map((s,i)=>`<button class="opm-step-dot ${i===active?'active':''}" onclick="OfficialPresentationMode.openStep(${i})"><span>${i+1}</span><b>${esc(s.title)}</b></button>`).join('')}
  function renderStep(index){
    const i=Math.max(0,Math.min(steps.length-1,Number(index)||0)); const s=steps[i]; saveState({step:i});
    if(!isAdmin()){setMain(`<section class="official-presentation-page"><div class="opm-denied"><h2>وضع العرض الرسمي</h2><p>هذه الشاشة مخصصة للإدارة أو مقدم العرض فقط.</p></div></section>`);return;}
    const progress=Math.round(((i+1)/steps.length)*100);
    setMain(`<section class="official-presentation-page">
      <div class="opm-hero">
        <div class="opm-glow"></div>
        <div class="opm-logo-card"><img src="./assets/images/logo.png" alt="شعار المنصة" onerror="this.style.display='none'"><span>⚖</span></div>
        <div class="opm-hero-text"><span class="opm-kicker">المرحلة 5.25 — وضع العرض الرسمي</span><h2>مسار العرض التنفيذي للمنصة القضائية الذكية</h2><p>واجهة Presentation Mode منظمة لتقديم قيمة المنصة في عرض رسمي احترافي، بدون تشتيت أو رسائل تقنية غير لازمة.</p><div class="opm-hero-actions"><button class="opm-gold" onclick="OfficialPresentationMode.openStep(0)">ابدأ العرض من البداية</button><button class="opm-soft" onclick="OfficialPresentationMode.toggleDemoData()">تفعيل/إيقاف بيانات العرض</button><button class="opm-gold opm-cinema-main-btn" onclick="CinematicOfficialPresentation.start()">بدء العرض السينمائي</button><button class="opm-soft" onclick="OfficialPresentationMode.exportOutline()">تصدير سيناريو العرض</button><button class="opm-soft" onclick="OfficialPresentationMode.exit()">خروج من وضع العرض</button></div></div>
        <div class="opm-progress-ring"><b>${progress}%</b><small>تقدم العرض</small></div>
      </div>
      <div class="opm-stage">
        <aside class="opm-route"><h3>مسار العرض</h3>${miniSteps(i)}<div class="opm-presenter-note"><b>قاعدة ذهبية</b><span>اعرض القيمة أولًا، ثم التفاصيل. لا تبدأ بالأكواد أو الإعدادات إلا عند سؤال فني مباشر.</span></div></aside>
        <main class="opm-current-slide">
          <div class="opm-slide-head"><div class="opm-slide-icon">${s.icon}</div><div><span>الخطوة ${i+1} من ${steps.length} — ${esc(s.duration)}</span><h1>${esc(s.title)}</h1><p>${esc(s.subtitle)}</p></div></div>
          <div class="opm-focus"><b>هدف هذه اللقطة</b><span>${esc(s.focus)}</span></div>
          <div class="opm-script-card"><h3>نص تقديم مقترح</h3><p>${esc(s.script)}</p></div>
          <div class="opm-bullets"><h3>النقاط التي يجب إبرازها</h3>${s.bullets.map(x=>`<div><span>✓</span><p>${esc(x)}</p></div>`).join('')}</div>
          <div class="opm-slide-actions"><div>${actionButtons(s.actions)}</div><div class="opm-nav"><button class="opm-soft" ${i===0?'disabled':''} onclick="OfficialPresentationMode.openStep(${i-1})">السابق</button><button class="opm-gold" ${i===steps.length-1?'disabled':''} onclick="OfficialPresentationMode.openStep(${i+1})">التالي</button></div></div>
        </main>
      </div>
      <section class="opm-demo-strip"><div><b>وضع البيانات التجريبية</b><span>${localStorage.getItem(DEMO_KEY)?'مفعّل — يتم استخدام بيانات عرض محدودة وآمنة داخل المتصفح.':'غير مفعّل — يمكن تشغيله لتجهيز سيناريو عرض بدون إدخال بيانات حقيقية.'}</span></div><button class="opm-soft" onclick="OfficialPresentationMode.clearDemoData()">مسح بيانات العرض</button></section>
    </section>`);
  }
  function open(){renderStep(Number(state().step||0));}
  function toggleDemoData(){
    if(localStorage.getItem(DEMO_KEY)){localStorage.removeItem(DEMO_KEY); toast('تم إيقاف بيانات العرض التجريبية.'); open(); return;}
    const payload={phase:PHASE,createdAt:now(),profile:'official-demo',items:{caseFile:'واقعة عرض تجريبية — ضبط مواد مخدرة',training:'تدريب مباشر على التصرف في الجنح',meeting:'اجتماع فوري تجريبي',report:'مؤشر سلامة التشغيل المؤسسي'}};
    localStorage.setItem(DEMO_KEY,JSON.stringify(payload)); toast('تم تفعيل بيانات العرض التجريبية.'); open();
  }
  function clearDemoData(){localStorage.removeItem(DEMO_KEY); toast('تم مسح بيانات العرض التجريبية.'); open();}
  function exportOutline(){
    const payload={phase:PHASE,title:'سيناريو العرض الرسمي للمنصة القضائية الذكية',createdAt:now(),steps:steps.map((s,i)=>({order:i+1,title:s.title,subtitle:s.subtitle,duration:s.duration,focus:s.focus,script:s.script,bullets:s.bullets}))};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json;charset=utf-8'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='official-presentation-outline-phase-5.25.json'; a.click(); URL.revokeObjectURL(a.href);
  }
  function exit(){clearPresentationClass(); if(typeof goHome==='function') goHome();}
  window.openOfficialPresentationMode=open;
  window.OfficialPresentationMode={open,openStep:renderStep,toggleDemoData,clearDemoData,exportOutline,exit,steps};
})();


/* =========================================================
   Phase 5.25.1 — Cinematic Screen Tour Layer
   ========================================================= */
(function(){
  'use strict';
  const CINEMA_STATE='sand_official_cinematic_state_v5251';
  let currentIndex=0, autoTimer=null, lastTarget=null;
  const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
  const $=(s)=>document.querySelector(s);
  const esc=(s)=>String(s??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
  function toast(msg){try{window.showToast?window.showToast(msg):console.log(msg)}catch(e){console.log(msg)}}
  function runAction(action){
    try{ if(typeof action==='function') return action(); if(action) return (new Function(action))(); }catch(e){ console.warn('Presentation action failed:',action,e); }
  }
  const scenes=[
    {id:'opening',title:'البداية الرسمية',screen:'الواجهة الافتتاحية',benefit:'تبدأ العرض بصورة مؤسسية قوية تشرح أن المنصة ليست مجرد موقع، بل بيئة عمل قضائي متكاملة.',action:'OfficialPresentationMode.openStep(0)',targets:['.opm-hero','.hero','.home-hero'],callout:'افتتاح منظم يثبت الهوية والقيمة قبل الدخول في التفاصيل.',duration:7600},
    {id:'dashboard',title:'مركز القيادة المؤسسي',screen:'لوحة القيادة',benefit:'يجمع حالة الحساب، التدريب، الملفات، التنبيهات، والاختصارات في شاشة واحدة حسب صلاحيات المستخدم.',action:'openCommandCenterDashboard && openCommandCenterDashboard()',targets:['.cmd-hero','.cmd-actions-grid','.cmd-stats-grid','.cmd-session-card'],callout:'هنا تظهر المنصة كمكتب قيادة رقمي لا كمجموعة أزرار متفرقة.',duration:8200},
    {id:'laws',title:'مكتبة القوانين والبحث',screen:'مكتبة القوانين',benefit:'الوصول السريع للنصوص القانونية والشروح التنفيذية والبحث الموحد بين القوانين.',action:'openLawLibrary && openLawLibrary()',targets:['.law-library-hero','.law-library-grid','.law-card','.laws-grid','[data-nav="law-library"]'],callout:'فتح القانون يجب أن يقود مباشرة إلى مواده، والبحث يختصر وقت الوصول للنص.',duration:7800},
    {id:'sand',title:'سَنَد المساعد القضائي',screen:'مساعد سند',benefit:'يوجه المستخدم للفهم والتحليل واستخراج النصوص والتكييفات المحتملة مع بقاء القرار النهائي للعضو.',action:'toggleChat && toggleChat(true)',targets:['.sand-chat-panel','#sandChat','.chat-panel','.chat-window','.assistant-dock'],callout:'الذكاء هنا داعم للتقدير القانوني وليس بديلًا عنه.',duration:7600},
    {id:'analysis',title:'غرفة تحليل الوقائع',screen:'غرفة تحليل الوقائع',benefit:'تحويل الواقعة إلى تكييفات محتملة، خطة تحقيق، نقاط استيفاء، ومسودات قابلة للحفظ.',action:'openCaseAnalysisRoom && openCaseAnalysisRoom()',targets:['.case-command-hero','.case-command-metrics','.case-command-room-layout','.case-command-sidepanel','.case-command-preview'],callout:'دي لحظة القوة الأساسية: الواقعة تدخل خام وتخرج منظمة قابلة للتصرف.',duration:9000},
    {id:'caseFiles',title:'ملفات الوقائع والتحليلات',screen:'مركز الملفات',benefit:'يحفظ نتائج التحليل داخل ملف قضائي منظم له حالة وأولوية وملاحظات ومسودات ومواعيد.',action:'openCaseFilesCenter && openCaseFilesCenter()',targets:['.case-files-hero','.case-files-list','.case-files-grid','.case-file-card','.case-files-tabs'],callout:'التحليل لا يضيع؛ يتحول إلى ملف عمل يمكن الرجوع إليه وتطويره.',duration:8200},
    {id:'sharing',title:'المشاركة والتعاون الآمن',screen:'مشاركة الملفات',benefit:'مشاركة ملف واقعة مع زميل موثوق أو جهة مراجعة بصلاحيات ومدة محددة وسجل مراجعة.',action:'openCaseFilesCenter && openCaseFilesCenter()',targets:['button[onclick*="share"]','.case-file-sharing-panel','.case-file-review-panel','.case-files-hero','.case-files-tabs'],callout:'التعاون هنا محكوم: قراءة، تعليق، مراجعة، أو مشاركة محددة بزمن.',duration:7600},
    {id:'training',title:'مركز التدريب المرئي',screen:'التدريب والاجتماعات',benefit:'دورات ومحاضرات واجتماعات مباشرة وروابط ضيوف، مع سجل تدريبي واختبارات.',action:'openTrainingCenter && openTrainingCenter()',targets:['.training-hero','.training-grid','.training-course-card','.training-meetings-panel','.training-panel'],callout:'المنصة لا تشرح القانون فقط؛ هي كمان تدرب وتتابع الحضور والتقدم.',duration:8200},
    {id:'communication',title:'التواصل القضائي الآمن',screen:'مركز التواصل',benefit:'مراسلة داخلية بين الأعضاء مع زملاء موثوقين وخصوصية ومزامنة حقيقية عند ضبط Worker.',action:'openSecureCommunicationCenter && openSecureCommunicationCenter()',targets:['.secure-comm-hero','.comm-layout','.comm-thread','.trusted-colleagues-panel','.communication-center'],callout:'لا توجد فوضى: طلب تواصل، موافقة، ثم محادثة محكومة.',duration:8200},
    {id:'notifications',title:'مركز الإشعارات',screen:'الإشعارات والتنبيهات',benefit:'غرفة عمليات مصغرة تجمع تنبيهات الأمن، التدريب، العضوية، الملفات، والمواعيد حسب الأولوية.',action:'openNotificationsCenter && openNotificationsCenter()',targets:['.notifications-hero','.notif-stats','.notifications-list','.notif-filters','.notification-card'],callout:'الإدارة والمستخدم لا يضيعوا وسط الأحداث؛ كل تنبيه له أولوية وإجراء.',duration:7600},
    {id:'reports',title:'التقارير والتحليلات المؤسسية',screen:'التقارير',benefit:'تعرض للإدارة صورة كاملة عن الاستخدام، التدريب، الملفات، الأمن، والتواصل.',action:'openInstitutionalReportsCenter && openInstitutionalReportsCenter()',targets:['.reports-hero','.institutional-reports-hero','.reports-grid','.analytics-tabs','.health-score'],callout:'هنا تظهر قيمة الإدارة: المنصة تقيس وتعرض وتوصي، مش مجرد تخزن بيانات.',duration:8200},
    {id:'settings',title:'الإعدادات العامة المتقدمة',screen:'مركز الإعدادات',benefit:'تغيير هوية المنصة وروابط الخدمات وسياسات التخزين والتدريب والضيوف من مكان واحد.',action:'openInstitutionalSettings && openInstitutionalSettings()',targets:['.advanced-settings-hero','.worker-url-grid','.advanced-status-row','.advanced-settings-grid','.settings-card'],callout:'المنصة قابلة للتخصيص والتوسع بدون تعديل الكود في كل مرة.',duration:7800},
    {id:'closing',title:'الخاتمة التنفيذية',screen:'رسالة القيمة',benefit:'تختتم العرض بتأكيد أن المنصة تجمع المعرفة والتحليل والتدريب والتواصل والإدارة في بيئة واحدة.',action:'OfficialPresentationMode.openStep(10)',targets:['.opm-current-slide','.opm-hero','.opm-focus'],callout:'النهاية لازم تسيب انطباع واضح: منصة قابلة للاعتماد والتوسع.',duration:7600}
  ];
  function findTarget(scene){
    for(const sel of (scene.targets||[])){
      const el=$(sel);
      if(el && el.offsetWidth>20 && el.offsetHeight>20) return el;
    }
    return document.getElementById('appView') || document.querySelector('main') || document.body;
  }
  function clearOverlay(){
    if(autoTimer) clearTimeout(autoTimer); autoTimer=null;
    document.querySelectorAll('.opm-cinema-overlay,.opm-cinema-focus-frame,.opm-cinema-progress').forEach(x=>x.remove());
    if(lastTarget){ lastTarget.classList.remove('opm-cinema-target-live'); lastTarget=null; }
    document.body.classList.remove('opm-cinematic-running');
  }
  function buildOverlay(scene,rect){
    const overlay=document.createElement('div'); overlay.className='opm-cinema-overlay';
    overlay.innerHTML=`
      <div class="opm-cinema-topbar">
        <div><span>وضع العرض السينمائي</span><b>${esc(scene.screen)}</b></div>
        <div class="opm-cinema-controls">
          <button onclick="CinematicOfficialPresentation.prev()">السابق</button>
          <button onclick="CinematicOfficialPresentation.next()">التالي</button>
          <button onclick="CinematicOfficialPresentation.pause()">إيقاف مؤقت</button>
          <button onclick="CinematicOfficialPresentation.stop()">إنهاء</button>
        </div>
      </div>
      <article class="opm-cinema-caption">
        <small>لقطة ${currentIndex+1} من ${scenes.length}</small>
        <h2>${esc(scene.title)}</h2>
        <p>${esc(scene.benefit)}</p>
        <div>${esc(scene.callout)}</div>
      </article>
      <div class="opm-cinema-hint">Zoom in → شرح الفائدة → Zoom out</div>`;
    const focus=document.createElement('div'); focus.className='opm-cinema-focus-frame';
    Object.assign(focus.style,{right:(window.innerWidth-rect.right-10)+'px',top:(rect.top-10)+'px',width:(rect.width+20)+'px',height:(rect.height+20)+'px'});
    const progress=document.createElement('div'); progress.className='opm-cinema-progress'; progress.style.setProperty('--cinema-progress',((currentIndex+1)/scenes.length*100)+'%');
    document.body.appendChild(overlay); document.body.appendChild(focus); document.body.appendChild(progress);
  }
  async function showScene(index,auto=true){
    clearOverlay();
    currentIndex=Math.max(0,Math.min(scenes.length-1,Number(index)||0));
    const scene=scenes[currentIndex];
    localStorage.setItem(CINEMA_STATE,JSON.stringify({index:currentIndex,updatedAt:new Date().toISOString()}));
    runAction(scene.action);
    await sleep(620);
    const target=findTarget(scene);
    target.scrollIntoView({behavior:'smooth',block:'center',inline:'nearest'});
    await sleep(520);
    const rect=target.getBoundingClientRect();
    lastTarget=target; target.classList.add('opm-cinema-target-live');
    document.body.classList.add('opm-cinematic-running');
    buildOverlay(scene,rect);
    if(auto && currentIndex<scenes.length-1){ autoTimer=setTimeout(()=>showScene(currentIndex+1,true),scene.duration||8000); }
  }
  function start(){ showScene(0,true); }
  function next(){ showScene(Math.min(currentIndex+1,scenes.length-1),true); }
  function prev(){ showScene(Math.max(currentIndex-1,0),false); }
  function pause(){ if(autoTimer) clearTimeout(autoTimer); autoTimer=null; toast('تم إيقاف الانتقال التلقائي مؤقتًا.'); }
  function stop(){ clearOverlay(); if(window.OfficialPresentationMode) OfficialPresentationMode.open(); }
  function resume(){ showScene(currentIndex,true); }
  window.CinematicOfficialPresentation={start,open:showScene,next,prev,pause,resume,stop,scenes};
  window.startCinematicOfficialPresentation=start;
})();
