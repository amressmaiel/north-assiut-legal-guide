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
        <div class="opm-hero-text"><span class="opm-kicker">المرحلة 5.25 — وضع العرض الرسمي</span><h2>مسار العرض التنفيذي للمنصة القضائية الذكية</h2><p>واجهة Presentation Mode منظمة لتقديم قيمة المنصة في عرض رسمي احترافي، بدون تشتيت أو رسائل تقنية غير لازمة.</p><div class="opm-hero-actions"><button class="opm-gold" onclick="OfficialPresentationMode.openStep(0)">ابدأ العرض من البداية</button><button class="opm-soft" onclick="OfficialPresentationMode.toggleDemoData()">تفعيل/إيقاف بيانات العرض</button><button class="opm-soft" onclick="OfficialPresentationMode.exportOutline()">تصدير سيناريو العرض</button><button class="opm-soft" onclick="OfficialPresentationMode.exit()">خروج من وضع العرض</button></div></div>
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
