/* =========================================================
   المرحلة 5.14.2 — إنشاء الاجتماعات وروابط حضور الضيوف
   امتداد للمرحلة 5.14.1: إنشاء قاعة Jitsi تلقائيًا + اجتماع فوري + رابط حضور لغير الأعضاء
   ========================================================= */
(function(){
  const PROGRESS_KEY = 'sand_training_center_v1';
  const MEETINGS_KEY = 'sand_training_meetings_v1';
  const COURSES_KEY = 'sand_training_courses_v2';

  const SEED_COURSES = [
    {
      id:'platform-orientation', icon:'🎓', level:'أساسي', category:'استخدام المنصة', status:'منشور', featured:true,
      title:'دورة استخدام منصة سند القضائية',
      description:'تدريب سريع على واجهة المنصة، البحث، تحليل الواقعة، حاسبة المواعيد، والمسودات.',
      lessons:[
        {id:'p1', title:'التعرف على واجهة المنصة ومراكز العمل', duration:8, type:'video', videoUrl:''},
        {id:'p2', title:'استخدام البحث القانوني وسَنَد داخل المواد', duration:10, type:'video', videoUrl:''},
        {id:'p3', title:'تحليل واقعة وحفظ تقرير مبدئي', duration:14, type:'scenario', videoUrl:''}
      ],
      attachments:[{title:'دليل تشغيل مختصر', kind:'PDF', url:''}, {title:'قائمة مراجعة استخدام سند', kind:'Checklist', url:''}],
      quiz:[
        {q:'ما الغرض الأساسي من غرفة تحليل الواقعة؟', a:'المساعدة في التكييف المبدئي وخطة التحقيق والمسودات دون أن تحل محل التقدير القضائي.'},
        {q:'هل مخرجات سند ملزمة؟', a:'لا، هي مخرجات مساعدة للمراجعة القانونية فقط.'}
      ]
    },
    {
      id:'criminal-procedure-174', icon:'⚖️', level:'متوسط', category:'قانون الإجراءات الجنائية', status:'منشور', featured:true,
      title:'قانون الإجراءات الجنائية الجديد — التطبيق العملي',
      description:'عرض عملي لأهم التعديلات وآثارها التنفيذية على عمل النيابة العامة.',
      lessons:[
        {id:'c1', title:'أهم فلسفة التعديل وأثرها العملي', duration:16, type:'video', videoUrl:''},
        {id:'c2', title:'الأوامر الجنائية ورفع الدعوى وإعلانها', duration:18, type:'video', videoUrl:''},
        {id:'c3', title:'الطعن في الأحكام والمواعيد المرتبطة', duration:15, type:'video', videoUrl:''}
      ],
      attachments:[{title:'ملخص تنفيذي للتعديلات', kind:'PDF', url:''}, {title:'جدول مواعيد مختصر', kind:'Sheet', url:''}],
      quiz:[{q:'لماذا يلزم ربط التدريب بالمواعيد القانونية؟', a:'لأن الخطأ في الميعاد قد يؤثر مباشرة على سلامة الإجراء أو الحق في الطعن.'}]
    },
    {
      id:'disposition-drafts', icon:'🧾', level:'متقدم', category:'التصرف في القضايا', status:'منشور', featured:false,
      title:'التصرف في القضايا وصياغة المسودات',
      description:'تدريب تطبيقي على الحفظ، الإحالة، الأمر الجنائي، الاستيفاء، ومراجعة المسودات.',
      lessons:[
        {id:'d1', title:'متى يكون الحفظ أو الاستيفاء أو الإحالة؟', duration:20, type:'video', videoUrl:''},
        {id:'d2', title:'صياغة أمر جنائي ومسودة إحالة', duration:22, type:'workshop', videoUrl:''},
        {id:'d3', title:'الأخطاء التنفيذية الشائعة قبل التصرف', duration:12, type:'video', videoUrl:''}
      ],
      attachments:[{title:'نماذج مسودات قابلة للمراجعة', kind:'Templates', url:''}, {title:'أخطاء شائعة', kind:'Checklist', url:''}],
      quiz:[{q:'ما فائدة مسودة التصرف داخل المنصة؟', a:'توحيد البناء الأولي للتصرف ومساعدة عضو النيابة على المراجعة قبل الاعتماد النهائي.'}]
    },
    {
      id:'seized-evidence', icon:'📦', level:'متوسط', category:'الأدلة والمضبوطات', status:'منشور', featured:false,
      title:'المضبوطات والأحراز والأدلة المادية',
      description:'محاضرات عملية عن التحريز، العرض، الإرسال للمعمل، والتصرف النهائي في المضبوطات.',
      lessons:[
        {id:'e1', title:'قواعد التحريز والتوصيف والبيانات الجوهرية', duration:17, type:'video', videoUrl:''},
        {id:'e2', title:'إرسال المضبوطات للجهات الفنية ومتابعة النتائج', duration:13, type:'video', videoUrl:''},
        {id:'e3', title:'سيناريوهات فقد أو تلف أو اختلاف الحرز', duration:16, type:'scenario', videoUrl:''}
      ],
      attachments:[{title:'قائمة مراجعة الأحراز', kind:'Checklist', url:''}],
      quiz:[{q:'لماذا تعد بيانات الحرز جوهرية؟', a:'لضمان سلامة الدليل واستمرار صلته بالواقعة والمتهم والإجراء.'}]
    }
  ];

  const DEFAULT_MEETINGS = [
    {id:'m1', title:'اجتماع تعريفي بمركز التدريب المرئي', speaker:'إدارة المنصة', date:'2026-06-20', time:'19:00', status:'قادم', link:'', attachments:'خطة التدريب'},
    {id:'m2', title:'ورشة تطبيقية: تحليل واقعة باستخدام سند', speaker:'مشرف التدريب', date:'2026-06-22', time:'20:00', status:'قادم', link:'', attachments:'أمثلة عملية'},
    {id:'m3', title:'جلسة مراجعة: حاسبة المواعيد والتنبيهات', speaker:'إدارة المحتوى', date:'2026-06-25', time:'18:30', status:'قادم', link:'', attachments:'جدول مواعيد'}
  ];

  function safeEsc(value){
    if(typeof window.esc==='function') return window.esc(value);
    return String(value??'').replace(/[&<>'"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));
  }
  function safeAttr(value){ return safeEsc(value).replace(/`/g,'&#096;'); }
  function uid(prefix){ return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
  function setNav(){ if(typeof window.setActiveNav==='function') window.setActiveNav('training-center'); }
  function show(content){
    if(typeof window.page==='function') window.page(content);
    else document.getElementById('appView').innerHTML = `<div class="page">${content}</div>`;
  }
  function readProgress(){ try{return JSON.parse(localStorage.getItem(PROGRESS_KEY)||'{}')||{};}catch{return {};} }
  function writeProgress(data){ localStorage.setItem(PROGRESS_KEY, JSON.stringify(data||{})); }
  function readCourses(){
    try{
      const stored=JSON.parse(localStorage.getItem(COURSES_KEY)||'null');
      if(Array.isArray(stored) && stored.length) return stored;
    }catch{}
    return SEED_COURSES.map(c=>({...c, lessons:[...(c.lessons||[])], attachments:[...(c.attachments||[])], quiz:[...(c.quiz||[])]}));
  }
  function writeCourses(items){ localStorage.setItem(COURSES_KEY, JSON.stringify(items||[])); }
  function resetCourses(){ if(confirm('استعادة الدورات الافتراضية؟ سيتم استبدال الدورات المعدلة محليًا.')){ localStorage.removeItem(COURSES_KEY); openTrainingAdmin('courses'); } }
  function readMeetings(){ try{const stored=JSON.parse(localStorage.getItem(MEETINGS_KEY)||'null');return Array.isArray(stored)?stored:DEFAULT_MEETINGS;}catch{return DEFAULT_MEETINGS;} }
  function writeMeetings(items){localStorage.setItem(MEETINGS_KEY, JSON.stringify(items||[]));}
  function courseById(id){ return readCourses().find(c=>c.id===id); }
  function publishedCourses(){ return readCourses().filter(c => (c.status||'منشور') === 'منشور'); }
  function courseProgress(course){
    const progress=readProgress()[course.id]||{};
    const lessons=course.lessons||[];
    const done=lessons.filter(l=>progress[l.id]).length;
    const total=lessons.length||1;
    return {done,total,percent:Math.round(done*100/total)};
  }
  function totalStats(){
    const courses=publishedCourses();
    const lessons=courses.reduce((s,c)=>s+(c.lessons||[]).length,0);
    const minutes=courses.reduce((s,c)=>s+(c.lessons||[]).reduce((x,l)=>x+(Number(l.duration)||0),0),0);
    const done=courses.reduce((s,c)=>s+courseProgress(c).done,0);
    return {courses:courses.length, lessons, minutes, done, meetings:readMeetings().length, percent:lessons?Math.round(done*100/lessons):0};
  }
  function currentUserName(){
    const user=window.SandAuthApi && SandAuthApi.currentUser ? SandAuthApi.currentUser() : null;
    return user ? (user.fullName || user.full_name || user.username || 'مستخدم') : 'زائر';
  }
  function canManageTraining(){
    return !!(window.SandAuthApi && (SandAuthApi.hasPermission?.('training.manage') || SandAuthApi.hasPermission?.('training.create') || SandAuthApi.hasPermission?.('users.manage') || SandAuthApi.hasPermission?.('roles.manage') || SandAuthApi.hasPermission?.('licenses.manage')));
  }

  function renderCourseCard(course){
    const p=courseProgress(course);
    const status=(course.status||'منشور')==='منشور'?'':'<b class="draft-badge">مسودة</b>';
    return `<article class="training-course-card" onclick="openTrainingCourse('${safeAttr(course.id)}')">
      <div class="training-card-top"><span class="training-icon">${safeEsc(course.icon||'🎓')}</span><span>${safeEsc(course.level||'عام')}</span>${status}</div>
      <h3>${safeEsc(course.title)}</h3>
      <p>${safeEsc(course.description)}</p>
      <div class="training-tags"><b>${safeEsc(course.category||'عام')}</b><b>${(course.lessons||[]).length} محاضرات</b><b>${(course.lessons||[]).reduce((s,l)=>s+(Number(l.duration)||0),0)} دقيقة</b></div>
      <div class="training-progress"><span style="width:${p.percent}%"></span></div>
      <small>نسبة الإنجاز: ${p.percent}% — ${p.done}/${p.total}</small>
    </article>`;
  }
  function meetingProvider(link){
    const u=String(link||'').toLowerCase();
    if(!u) return {name:'غير محدد', icon:'🔗', embeddable:false};
    if(u.includes('meet.google.')) return {name:'Google Meet', icon:'🟢', embeddable:false};
    if(u.includes('teams.microsoft.')||u.includes('teams.live.')) return {name:'Microsoft Teams', icon:'🟣', embeddable:false};
    if(u.includes('zoom.us')) return {name:'Zoom', icon:'🔵', embeddable:false};
    if(u.includes('jitsi')||u.includes('8x8.vc')) return {name:'Jitsi Meet', icon:'🧩', embeddable:true};
    return {name:'رابط خارجي', icon:'🔗', embeddable:false};
  }
  function meetingStatus(m){
    if((m.status||'')==='مغلق' || (m.status||'')==='مؤجل') return m.status;
    const d=String(m.date||''); const t=String(m.time||'00:00');
    const start=new Date(`${d}T${t}:00`);
    if(isNaN(start.getTime())) return m.status||'قادم';
    const now=new Date(); const diff=start.getTime()-now.getTime();
    if(diff<=0 && diff>-3*60*60*1000) return 'مباشر الآن';
    if(diff< -3*60*60*1000) return 'انتهى';
    return m.status||'قادم';
  }
  function safeMeetingLink(link){
    const v=String(link||'').trim();
    if(!v) return '';
    if(/^https?:\/\//i.test(v)) return v;
    return 'https://'+v;
  }

  function normalizeRoomSlug(text){
    return String(text||'training')
      .toLowerCase()
      .replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي')
      .replace(/[^a-z0-9\u0600-\u06ff]+/g,'-').replace(/^-+|-+$/g,'').slice(0,70) || 'training';
  }
  function makeJitsiLink(title,date,time){
    const stamp=(date||new Date().toISOString().slice(0,10)).replace(/-/g,'')+'-'+String(time||'now').replace(':','');
    const token=Math.random().toString(36).slice(2,8);
    return `https://meet.jit.si/sand-north-assiut-${normalizeRoomSlug(title)}-${stamp}-${token}`;
  }
  function encodeGuestPayload(obj){
    try{return btoa(unescape(encodeURIComponent(JSON.stringify(obj)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}catch{return '';}
  }
  function decodeGuestPayload(value){
    try{let s=String(value||'').replace(/-/g,'+').replace(/_/g,'/'); while(s.length%4)s+='='; return JSON.parse(decodeURIComponent(escape(atob(s))));}catch{return null;}
  }
  function guestAttendanceUrlForMeeting(id){
    const m=readMeetings().find(x=>x.id===id); if(!m) return '';
    const payload={type:'training_guest', id:m.id, title:m.title, speaker:m.speaker, date:m.date, time:m.time, link:safeMeetingLink(m.link), attachments:m.attachments, token:m.guestToken||uid('guest_'), createdAt:new Date().toISOString()};
    if(!m.guestToken){ const meetings=readMeetings(); const item=meetings.find(x=>x.id===id); if(item){ item.guestToken=payload.token; writeMeetings(meetings); } }
    const clean=location.href.split('#')[0];
    return clean + '#training-guest=' + encodeGuestPayload(payload);
  }
  function copyTrainingGuestAttendanceLink(id){
    const url=guestAttendanceUrlForMeeting(id);
    if(!url){alert('تعذر إنشاء رابط حضور الضيوف لهذا الاجتماع.');return;}
    if(navigator.clipboard) navigator.clipboard.writeText(url).then(()=>alert('تم نسخ رابط حضور الضيوف. يمكن إرساله لغير الأعضاء لحضور التدريب فقط.')).catch(()=>prompt('انسخ رابط حضور الضيوف:',url));
    else prompt('انسخ رابط حضور الضيوف:',url);
  }
  function shareTrainingGuestAttendanceLink(id){
    const url=guestAttendanceUrlForMeeting(id);
    const m=readMeetings().find(x=>x.id===id);
    if(!url||!m)return;
    const text=`دعوة حضور تدريب مرئي\n${m.title}\nالموعد: ${m.date} الساعة ${m.time}\nرابط الحضور: ${url}`;
    if(navigator.share) navigator.share({title:m.title,text,url}).catch(()=>copyTrainingGuestAttendanceLink(id));
    else { prompt('انسخ نص الدعوة:', text); }
  }
  function openTrainingGuestAttendance(payload){
    const m=payload||{}; const provider=meetingProvider(m.link);
    const title=safeEsc(m.title||'تدريب مرئي مباشر');
    const speaker=safeEsc(m.speaker||'مشرف التدريب');
    const date=safeEsc(m.date||'');
    const time=safeEsc(m.time||'');
    const attachments=safeEsc(m.attachments||'');
    show(`<section class="training-guest-prestige-page" aria-label="بوابة حضور التدريب المرئي للضيوف">
      <div class="guest-prestige-bg"><span></span><span></span><span></span></div>
      <header class="guest-prestige-header">
        <div class="guest-prestige-brand">
          <div class="guest-prestige-logo"><img src="./assets/images/logo.png" alt="شعار المنصة" onerror="this.style.display='none'"></div>
          <div>
            <b>الدليل القضائي الذكي لأعضاء النيابة العامة</b>
            <small>مركز التدريب المرئي القضائي</small>
          </div>
        </div>
        <div class="guest-prestige-badge">دعوة حضور ضيف</div>
      </header>
      <main class="guest-prestige-shell">
        <aside class="guest-prestige-visual">
          <div class="guest-prestige-emblem">
            <span class="emblem-orbit one"></span><span class="emblem-orbit two"></span>
            <img src="./assets/images/logo.png" alt="شعار النيابة العامة" onerror="this.style.display='none'">
          </div>
          <h3>بوابة حضور رسمية</h3>
          <p>هذه الصفحة مخصصة للحضور التدريبي فقط، وتعرض هوية المنصة دون منح الضيف أي صلاحيات داخلية.</p>
          <div class="guest-prestige-mini-stats">
            <article><b>🔒</b><span>دخول محدود</span></article>
            <article><b>🎥</b><span>تدريب مباشر</span></article>
            <article><b>⚖️</b><span>طابع قضائي</span></article>
          </div>
        </aside>
        <section class="guest-prestige-content">
          <span class="institutional-kicker">رابط حضور تدريبي للضيوف</span>
          <h1>${title}</h1>
          <p class="guest-prestige-lead">مرحبًا بحضرتك في قاعة التدريب المرئي الخاصة بالمنصة. تم تجهيز هذه البوابة للحضور الخارجي بصورة مؤسسية، مع الحفاظ الكامل على خصوصية أدوات وبيانات المنصة.</p>
          <div class="guest-prestige-card">
            <div><small>المحاضر</small><b>${speaker}</b></div>
            <div><small>الموعد</small><b>${date || 'غير محدد'} ${time? '— '+time : ''}</b></div>
            <div><small>منصة الاجتماع</small><b>${provider.icon} ${safeEsc(provider.name)}</b></div>
            ${attachments?`<div class="wide"><small>ملاحظات / مرفقات</small><b>${attachments}</b></div>`:''}
          </div>
          <label class="guest-prestige-name-label" for="guest_attendee_name">اسم الحاضر</label>
          <input id="guest_attendee_name" placeholder="اكتب اسمك لتسجيل الحضور — اختياري">
          <div class="guest-prestige-actions">
            <button class="gold-btn large-action" onclick="joinTrainingAsGuestFromPayload()">دخول القاعة الآن</button>
            <button class="soft-btn large-action" onclick="goHome && goHome()">العودة للبوابة الرئيسية</button>
          </div>
          <div class="guest-prestige-notice">تنبيه: رابط الضيف يفتح قاعة التدريب فقط، ولا يتيح تصفح القوانين أو أدوات سند أو بيانات الأعضاء أو لوحات الإدارة.</div>
        </section>
      </main>
      <footer class="guest-prestige-footer">
        <span>بتوجيه من معالي السيد الأستاذ المستشار / أحمد فاروق المحامي العام لنيابة شمال أسيوط الكلية</span>
        <b>برمجة وتطوير / Amr Essmaiel — 2026</b>
      </footer>
    </section>`);
    window.__trainingGuestPayload=m;
  }
  function joinTrainingAsGuestFromPayload(){
    const m=window.__trainingGuestPayload||{}; const link=safeMeetingLink(m.link);
    if(!link){alert('رابط القاعة غير مضبوط في دعوة الحضور.');return;}
    const name=(document.getElementById('guest_attendee_name')?.value||'ضيف تدريب').trim();
    const progress=readProgress(); progress.__guestAttendance=progress.__guestAttendance||[];
    progress.__guestAttendance.unshift({id:m.id||'guest', title:m.title||'', name, joinedAt:new Date().toISOString(), date:new Date().toISOString(), mode:'guest-public-link'});
    writeProgress(progress);
    window.open(link,'_blank');
  }
  function handleTrainingGuestHash(){
    const match=String(location.hash||'').match(/^#training-guest=(.+)$/);
    if(!match) return false;
    const payload=decodeGuestPayload(match[1]);
    if(!payload || payload.type!=='training_guest'){return false;}
    openTrainingGuestAttendance(payload);
    return true;
  }
  function renderMeetingRow(m){
    const provider=meetingProvider(m.link);
    const st=meetingStatus(m);
    const linkBtn=m.link?`<button onclick="event.stopPropagation();openTrainingMeetingRoom('${safeAttr(m.id)}')">دخول القاعة</button>`:`<button onclick="event.stopPropagation();alert('لم يتم ضبط رابط الاجتماع بعد. يمكن إضافته من لوحة إدارة التدريب.')">رابط غير مضبوط</button>`;
    return `<article class="training-meeting-row ${st==='مباشر الآن'?'is-live':''}">
      <div><span class="meeting-status">${safeEsc(st)}</span><span class="meeting-provider">${provider.icon} ${safeEsc(provider.name)}</span><h4>${safeEsc(m.title)}</h4><p>${safeEsc(m.date)} — ${safeEsc(m.time)} • ${safeEsc(m.speaker||'')}</p><small>${safeEsc(m.attachments||'')}</small></div>
      <div class="meeting-actions">${linkBtn}<button onclick="openTrainingMeetingDetails('${safeAttr(m.id)}')">تفاصيل</button></div>
    </article>`;
  }

  function openTrainingCenter(){
    setNav();
    const s=totalStats();
    const meetings=readMeetings();
    const next=meetings[0];
    const courses=publishedCourses();
    show(`<section class="training-hero">
      <div class="training-hero-content">
        <span class="institutional-kicker">المرحلة 5.14.2 — مركز التدريب المرئي القضائي</span>
        <h2>مركز التدريب المرئي القضائي</h2>
        <p>قاعة رقمية داخل المنصة للمحاضرات، الدورات، الاجتماعات التدريبية، المرفقات، الاختبارات القصيرة، وسجل الإنجاز التدريبي لكل مستخدم.</p>
        <div class="training-hero-actions">
          <button class="gold-btn large-action" onclick="openTrainingCourse('${courses[0]?safeAttr(courses[0].id):''}')">ابدأ التدريب الآن</button>
          <button class="soft-btn large-action" onclick="openTrainingRecord()">📊 سجلي التدريبي</button>
          <button class="soft-btn large-action" onclick="openTrainingMeetingDetails('${next?safeAttr(next.id):''}')">📹 الاجتماع القادم</button>
          ${canManageTraining()?`<button class="soft-btn large-action" onclick="openTrainingAdmin('courses')">⚙️ إدارة التدريب</button>`:''}
        </div>
      </div>
      <aside class="training-live-card">
        <b>اجتماع قادم</b>
        <h3>${safeEsc(next?next.title:'لا توجد اجتماعات')}</h3>
        <p>${next?`${safeEsc(next.date)} — ${safeEsc(next.time)} • ${safeEsc(next.speaker)}`:'يمكن إضافة اجتماع تدريبي من لوحة الإدارة.'}</p>
        <button class="gold-btn" onclick="openTrainingMeetingDetails('${next?safeAttr(next.id):''}')">عرض التفاصيل</button>
      </aside>
    </section>
    <section class="training-stats-grid">
      <article><span>الدورات</span><strong>${s.courses}</strong></article><article><span>المحاضرات</span><strong>${s.lessons}</strong></article><article><span>دقائق تدريبية</span><strong>${s.minutes}</strong></article><article><span>الاجتماعات</span><strong>${s.meetings}</strong></article><article><span>إنجازك</span><strong>${s.percent}%</strong></article>
    </section>
    <div class="section-title institutional-section-title"><div><h3>الدورات المرئية</h3><p>الدورات المنشورة من لوحة إدارة التدريب، مع حفظ تقدم المستخدم محليًا.</p></div></div>
    <div class="training-course-grid">${courses.length?courses.map(renderCourseCard).join(''):'<div class="empty">لا توجد دورات منشورة حاليًا.</div>'}</div>
    <section class="training-split-grid"><div class="training-panel"><div class="panel-heading"><span>الاجتماعات المباشرة</span><button onclick="openTrainingMeetings()">عرض الكل</button></div><div class="training-meeting-list">${meetings.slice(0,3).map(renderMeetingRow).join('')}</div></div>
    <div class="training-panel sand-training-panel"><div class="sand-mini-visual"><img src="./assets/images/avatar-3d.png" alt="سند" onerror="this.style.display='none'"></div><h3>اسأل سَنَد عن التدريب</h3><p>اطلب تلخيص محاضرة، إنشاء اختبار، استخراج الأخطاء العملية، أو ربط موضوع التدريب بالمواد القانونية داخل المنصة.</p><button class="gold-btn" onclick="askSandAboutTraining()">🤖 اسأل سند</button></div></section>`);
  }

  function openTrainingCourse(id){
    const course=courseById(id)||publishedCourses()[0]; if(!course){ openTrainingCenter(); return; }
    setNav(); const p=courseProgress(course);
    show(`<div class="breadcrumb">الرئيسية / مركز التدريب المرئي / <b>${safeEsc(course.title)}</b></div>
      <section class="training-course-head"><div><span class="training-icon big">${safeEsc(course.icon||'🎓')}</span><h2>${safeEsc(course.title)}</h2><p>${safeEsc(course.description)}</p></div><aside><b>${p.percent}%</b><span>نسبة الإكمال</span><div class="training-progress"><span style="width:${p.percent}%"></span></div></aside></section>
      <section class="training-split-grid"><div class="training-panel span-2"><div class="panel-heading"><span>محاضرات الدورة</span><button onclick="markCourseDone('${safeAttr(course.id)}')">تعليم الكل كمكتمل</button></div><div class="lesson-list">${(course.lessons||[]).map(l=>lessonRow(course,l)).join('')||'<div class="empty">لا توجد دروس داخل هذه الدورة.</div>'}</div></div>
      <div class="training-panel"><h3>مرفقات التدريب</h3><div class="training-attachments">${(course.attachments||[]).map(a=>`<span>${safeEsc(a.kind)} — ${safeEsc(a.title)} ${a.url?`<button onclick="window.open('${safeAttr(a.url)}','_blank')">فتح</button>`:''}</span>`).join('')||'<div class="empty">لا توجد مرفقات.</div>'}</div><h3>اختبار قصير</h3><p>اختبار مراجعة سريع محفوظ محليًا داخل سجل التدريب.</p><button class="gold-btn" onclick="openTrainingQuiz('${safeAttr(course.id)}')">بدء الاختبار</button><button class="soft-btn" onclick="askSandAboutCourse('${safeAttr(course.id)}')">اسأل سند عن هذه الدورة</button>${canManageTraining()?`<button class="soft-btn" onclick="openTrainingCourseEditor('${safeAttr(course.id)}')">تعديل الدورة</button>`:''}</div></section>`);
  }
  function lessonRow(course,lesson){
    const progress=readProgress()[course.id]||{}; const done=!!progress[lesson.id];
    return `<article class="lesson-row ${done?'done':''}"><div><span>${done?'✅':'▶️'} ${safeEsc(lesson.type||'video')}</span><h4>${safeEsc(lesson.title)}</h4><p>${Number(lesson.duration)||0} دقيقة</p></div><div><button onclick="openTrainingLesson('${safeAttr(course.id)}','${safeAttr(lesson.id)}')">فتح</button><button onclick="toggleTrainingLesson('${safeAttr(course.id)}','${safeAttr(lesson.id)}')">${done?'إلغاء الإكمال':'تمت المشاهدة'}</button></div></article>`;
  }
  function openTrainingLesson(courseId, lessonId){
    const course=courseById(courseId); const lesson=course&&(course.lessons||[]).find(l=>l.id===lessonId); if(!lesson)return openTrainingCourse(courseId);
    setNav();
    show(`<div class="breadcrumb">مركز التدريب / ${safeEsc(course.title)} / <b>${safeEsc(lesson.title)}</b></div><section class="training-watch-layout"><div class="training-video-box">${lesson.videoUrl?`<iframe src="${safeAttr(lesson.videoUrl)}" allowfullscreen></iframe>`:`<div class="video-placeholder"><span>🎥</span><h3>مكان الفيديو التدريبي</h3><p>يمكن ضبط رابط الفيديو من لوحة إدارة التدريب: YouTube غير مدرج، Google Drive، Teams Stream، Jitsi Recording، أو أي رابط آمن.</p></div>`}</div><aside class="training-watch-side"><h2>${safeEsc(lesson.title)}</h2><p>${safeEsc(course.title)}</p><button class="gold-btn" onclick="toggleTrainingLesson('${safeAttr(course.id)}','${safeAttr(lesson.id)}',true);openTrainingCourse('${safeAttr(course.id)}')">تسجيل الدرس كمكتمل</button><button class="soft-btn" onclick="askSandAboutLesson('${safeAttr(course.id)}','${safeAttr(lesson.id)}')">🤖 اسأل سند عن الدرس</button><button class="soft-btn" onclick="openTrainingCourse('${safeAttr(course.id)}')">رجوع للدورة</button></aside></section>`);
  }
  function toggleTrainingLesson(courseId, lessonId, forceDone){
    const progress=readProgress(); progress[courseId]=progress[courseId]||{};
    progress[courseId][lessonId]=typeof forceDone==='boolean'?forceDone:!progress[courseId][lessonId];
    if(!progress[courseId][lessonId]) delete progress[courseId][lessonId]; writeProgress(progress); openTrainingCourse(courseId);
  }
  function markCourseDone(courseId){ const course=courseById(courseId); if(!course)return; const progress=readProgress(); progress[courseId]=progress[courseId]||{}; (course.lessons||[]).forEach(l=>progress[courseId][l.id]=true); writeProgress(progress); openTrainingCourse(courseId); }
  function openTrainingQuiz(courseId){
    const course=courseById(courseId); if(!course)return;
    setNav();
    show(`<div class="breadcrumb">مركز التدريب / ${safeEsc(course.title)} / <b>الاختبار القصير</b></div><section class="training-panel training-quiz-panel"><h2>اختبار قصير — ${safeEsc(course.title)}</h2>${(course.quiz||[]).map((q,i)=>`<article class="quiz-item"><b>س${i+1}: ${safeEsc(q.q)}</b><textarea id="quiz_${i}" placeholder="اكتب إجابتك أو ملاحظتك التدريبية..."></textarea><small>الإجابة الاسترشادية: ${safeEsc(q.a)}</small></article>`).join('')||'<div class="empty">لا توجد أسئلة بعد. يمكن إضافتها من لوحة الإدارة.</div>'}<button class="gold-btn" onclick="saveTrainingQuiz('${safeAttr(course.id)}')">حفظ الاختبار في السجل</button><button class="soft-btn" onclick="openTrainingCourse('${safeAttr(course.id)}')">رجوع</button></section>`);
  }
  function saveTrainingQuiz(courseId){ const progress=readProgress(); progress.__quizzes=progress.__quizzes||[]; progress.__quizzes.unshift({courseId, date:new Date().toISOString(), user:currentUserName()}); writeProgress(progress); alert('تم حفظ نتيجة الاختبار داخل السجل التدريبي المحلي.'); openTrainingRecord(); }
  function openTrainingMeetings(){ setNav(); const meetings=readMeetings(); show(`<div class="breadcrumb">الرئيسية / مركز التدريب المرئي / <b>الاجتماعات المباشرة</b></div><section class="workspace-head"><div><h2>📹 الاجتماعات المباشرة</h2><p>جدول الاجتماعات والتدريبات المرئية. النسخة الحالية تعتمد روابط خارجية آمنة قابلة للفتح من داخل المنصة.</p></div>${canManageTraining()?`<button onclick="openTrainingAdmin('meetings')">إدارة الاجتماعات</button>`:''}</section><div class="training-meeting-list wide">${meetings.map(renderMeetingRow).join('')}</div>`); }
  function openTrainingMeetingDetails(id){
    const meeting=readMeetings().find(m=>m.id===id); if(!meeting){openTrainingMeetings();return;}
    const provider=meetingProvider(meeting.link); const st=meetingStatus(meeting);
    setNav();
    show(`<div class="breadcrumb">مركز التدريب / الاجتماعات / <b>${safeEsc(meeting.title)}</b></div><section class="training-meeting-details"><div><span class="meeting-status">${safeEsc(st)}</span><span class="meeting-provider">${provider.icon} ${safeEsc(provider.name)}</span><h2>${safeEsc(meeting.title)}</h2><p>المحاضر: ${safeEsc(meeting.speaker)} — الموعد: ${safeEsc(meeting.date)} الساعة ${safeEsc(meeting.time)}</p><p>المرفقات / الملاحظات: ${safeEsc(meeting.attachments||'لا توجد مرفقات مسجلة.')}</p><div class="meeting-help">يمكن دخول الأعضاء من داخل المنصة، ويمكن للإدارة إصدار رابط حضور للضيوف يفتح القاعة التدريبية فقط دون أي صلاحيات داخلية.</div></div><aside><button class="gold-btn" onclick="openTrainingMeetingRoom('${safeAttr(meeting.id)}')">دخول القاعة</button><button class="soft-btn" onclick="copyTrainingMeetingLink('${safeAttr(meeting.id)}')">نسخ رابط القاعة</button>${canManageTraining()?`<button class="soft-btn" onclick="copyTrainingGuestAttendanceLink('${safeAttr(meeting.id)}')">نسخ رابط حضور الضيوف</button><button class="soft-btn" onclick="shareTrainingGuestAttendanceLink('${safeAttr(meeting.id)}')">مشاركة دعوة الحضور</button>`:''}<button class="soft-btn" onclick="downloadTrainingMeetingIcs('${safeAttr(meeting.id)}')">إضافة للتقويم</button><button class="soft-btn" onclick="recordMeetingAttendance('${safeAttr(meeting.id)}','manual')">تسجيل حضور يدوي</button><button class="soft-btn" onclick="openTrainingMeetings()">رجوع للاجتماعات</button></aside></section>`);
  }
  function openTrainingMeetingRoom(id){
    const meeting=readMeetings().find(m=>m.id===id); if(!meeting) return openTrainingMeetings();
    const provider=meetingProvider(meeting.link); const link=safeMeetingLink(meeting.link);
    if(!link){ alert('لم يتم ضبط رابط الاجتماع بعد.'); return; }
    recordMeetingAttendance(id,'join',true);
    setNav();
    const frame=provider.embeddable?`<iframe src="${safeAttr(link)}" allow="camera; microphone; fullscreen; display-capture" allowfullscreen></iframe>`:`<div class="meeting-open-placeholder"><span>${provider.icon}</span><h3>${safeEsc(provider.name)}</h3><p>بعض خدمات الاجتماعات لا تسمح بالفتح داخل iframe لأسباب أمان، لذلك يتم فتح القاعة في تبويب خارجي.</p><button class="gold-btn" onclick="window.open('${safeAttr(link)}','_blank')">فتح القاعة الآن</button></div>`;
    show(`<div class="breadcrumb">مركز التدريب / القاعة المباشرة / <b>${safeEsc(meeting.title)}</b></div><section class="training-room-layout"><div class="training-room-frame">${frame}</div><aside class="training-room-side"><span class="meeting-status">${safeEsc(meetingStatus(meeting))}</span><h2>${safeEsc(meeting.title)}</h2><p>${safeEsc(meeting.date)} — ${safeEsc(meeting.time)}</p><p>المحاضر: ${safeEsc(meeting.speaker||'')}</p><button class="soft-btn" onclick="copyTrainingMeetingLink('${safeAttr(meeting.id)}')">نسخ الرابط</button><button class="soft-btn" onclick="recordMeetingExit('${safeAttr(meeting.id)}')">تسجيل خروج من التدريب</button><button class="soft-btn" onclick="openTrainingMeetingDetails('${safeAttr(meeting.id)}')">تفاصيل الاجتماع</button></aside></section>`);
  }
  function recordMeetingAttendance(id,mode='manual',silent=false){
    const progress=readProgress(); progress.__attendance=progress.__attendance||[];
    progress.__attendance.unshift({id, mode, joinedAt:new Date().toISOString(), date:new Date().toISOString(), user:currentUserName()});
    writeProgress(progress);
    if(!silent){ alert('تم تسجيل الحضور في السجل التدريبي المحلي.'); openTrainingRecord(); }
  }
  function recordMeetingExit(id){
    const progress=readProgress(); progress.__attendance=progress.__attendance||[];
    const item=progress.__attendance.find(a=>a.id===id && !a.leftAt);
    if(item) item.leftAt=new Date().toISOString();
    writeProgress(progress); alert('تم تسجيل الخروج من التدريب.'); openTrainingRecord();
  }
  function copyTrainingMeetingLink(id){
    const meeting=readMeetings().find(m=>m.id===id); const link=safeMeetingLink(meeting&&meeting.link);
    if(!link){alert('لا يوجد رابط مضبوط لهذا الاجتماع.');return;}
    if(navigator.clipboard) navigator.clipboard.writeText(link).then(()=>alert('تم نسخ رابط القاعة.')).catch(()=>prompt('انسخ الرابط:',link));
    else prompt('انسخ الرابط:',link);
  }
  function downloadTrainingMeetingIcs(id){
    const m=readMeetings().find(x=>x.id===id); if(!m)return;
    const dt=(String(m.date||'').replace(/-/g,'')+'T'+String(m.time||'00:00').replace(':','')+'00');
    const link=safeMeetingLink(m.link);
    const body=['BEGIN:VCALENDAR','VERSION:2.0','BEGIN:VEVENT',`DTSTART:${dt}`,`SUMMARY:${String(m.title||'اجتماع تدريبي').replace(/\n/g,' ')}`,`DESCRIPTION:${String((m.attachments||'')+' '+link).replace(/\n/g,' ')}`,'END:VEVENT','END:VCALENDAR'].join('\n');
    const blob=new Blob([body],{type:'text/calendar;charset=utf-8'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=(m.title||'training-meeting')+'.ics'; a.click(); URL.revokeObjectURL(a.href);
  }
  function openTrainingRecord(){ setNav(); const s=totalStats(); const progress=readProgress(); const quizzes=progress.__quizzes||[]; const attendance=progress.__attendance||[]; show(`<div class="breadcrumb">الرئيسية / مركز التدريب المرئي / <b>سجلي التدريبي</b></div><section class="training-record-hero"><div><h2>📊 السجل التدريبي</h2><p>السجل المحلي للمستخدم: ${safeEsc(currentUserName())}. يحفظ تقدم المحاضرات، الاختبارات، وحضور الاجتماعات على الجهاز الحالي.</p></div><strong>${s.percent}%</strong></section><div class="training-course-grid">${publishedCourses().map(renderCourseCard).join('')}</div><section class="training-split-grid"><div class="training-panel"><h3>الاختبارات المحفوظة</h3>${quizzes.length?quizzes.map(q=>`<p>✅ ${safeEsc(q.courseId)} — ${new Date(q.date).toLocaleString('ar-EG')}</p>`).join(''):'<div class="empty">لا توجد اختبارات محفوظة بعد.</div>'}</div><div class="training-panel"><h3>حضور الاجتماعات</h3>${attendance.length?attendance.map(a=>`<p>📹 ${safeEsc(a.id)} — ${new Date(a.date).toLocaleString('ar-EG')}</p>`).join(''):'<div class="empty">لا يوجد حضور مسجل بعد.</div>'}</div></section>`); }

  function adminTabs(active){
    return `<div class="training-admin-tabs"><button class="${active==='courses'?'active':''}" onclick="openTrainingAdmin('courses')">الدورات</button><button class="${active==='meetings'?'active':''}" onclick="openTrainingAdmin('meetings')">الاجتماعات</button><button class="${active==='reports'?'active':''}" onclick="openTrainingAdmin('reports')">تقارير التدريب</button><button class="${active==='settings'?'active':''}" onclick="openTrainingAdmin('settings')">إعدادات</button></div>`;
  }
  function openTrainingAdmin(tab='courses'){
    if(!canManageTraining()){ alert('هذه اللوحة مخصصة لمن يملك صلاحيات إدارة التدريب.'); return openTrainingCenter(); }
    setNav();
    if(tab==='meetings') return openTrainingAdminMeetings();
    if(tab==='reports') return openTrainingAdminReports();
    if(tab==='settings') return openTrainingAdminSettings();
    const courses=readCourses();
    show(`<div class="breadcrumb">الرئيسية / مركز التدريب المرئي / <b>لوحة إدارة التدريب</b></div><section class="training-panel training-admin-panel"><h2>⚙️ لوحة إدارة مركز التدريب المرئي</h2><p>إدارة الدورات والدروس والمرفقات والاختبارات وحالة النشر من داخل المنصة، بدون تعديل ملفات الكود.</p>${adminTabs('courses')}<div class="training-admin-actions"><button class="gold-btn" onclick="openTrainingCourseEditor()">➕ إنشاء دورة جديدة</button><button class="soft-btn" onclick="openTrainingCenter()">معاينة المركز</button><button class="danger-soft-btn" onclick="resetCourses()">استعادة الافتراضي</button></div><div class="training-admin-course-list">${courses.map(adminCourseRow).join('')}</div></section>`);
  }
  function adminCourseRow(c){
    return `<article class="training-admin-course-row"><div><span class="training-icon">${safeEsc(c.icon||'🎓')}</span><h3>${safeEsc(c.title)}</h3><p>${safeEsc(c.category||'عام')} • ${safeEsc(c.level||'عام')} • ${(c.lessons||[]).length} درس • ${(c.quiz||[]).length} سؤال • <b>${safeEsc(c.status||'منشور')}</b></p></div><div><button onclick="openTrainingCourseEditor('${safeAttr(c.id)}')">تعديل</button><button onclick="duplicateTrainingCourse('${safeAttr(c.id)}')">نسخ</button><button onclick="toggleTrainingCourseStatus('${safeAttr(c.id)}')">${(c.status||'منشور')==='منشور'?'تحويل لمسودة':'نشر'}</button><button class="danger-soft-btn" onclick="deleteTrainingCourse('${safeAttr(c.id)}')">حذف</button></div></article>`;
  }
  function openTrainingCourseEditor(courseId){
    if(!canManageTraining()) return openTrainingCenter();
    const c=courseById(courseId)||{id:'', icon:'🎓', level:'أساسي', category:'', status:'مسودة', title:'', description:'', lessons:[], attachments:[], quiz:[]};
    show(`<div class="breadcrumb">إدارة التدريب / <b>${courseId?'تعديل دورة':'إنشاء دورة'}</b></div><section class="training-panel training-admin-panel"><h2>${courseId?'تعديل دورة تدريبية':'إنشاء دورة تدريبية جديدة'}</h2><div class="training-admin-form training-course-form"><input id="tc_icon" placeholder="الأيقونة" value="${safeAttr(c.icon||'🎓')}"><input id="tc_title" placeholder="عنوان الدورة" value="${safeAttr(c.title)}"><input id="tc_category" placeholder="التصنيف" value="${safeAttr(c.category)}"><select id="tc_level"><option ${c.level==='أساسي'?'selected':''}>أساسي</option><option ${c.level==='متوسط'?'selected':''}>متوسط</option><option ${c.level==='متقدم'?'selected':''}>متقدم</option></select><select id="tc_status"><option ${c.status==='منشور'?'selected':''}>منشور</option><option ${c.status==='مسودة'?'selected':''}>مسودة</option></select><textarea id="tc_desc" placeholder="وصف الدورة">${safeEsc(c.description)}</textarea><button class="gold-btn" onclick="saveTrainingCourse('${safeAttr(c.id)}')">حفظ بيانات الدورة</button><button class="soft-btn" onclick="openTrainingAdmin('courses')">رجوع</button></div>${courseId?`<section class="training-admin-nested"><h3>الدروس</h3><div class="training-admin-form"><input id="tl_title" placeholder="عنوان الدرس"><input id="tl_duration" type="number" placeholder="المدة بالدقائق"><select id="tl_type"><option value="video">video</option><option value="scenario">scenario</option><option value="workshop">workshop</option></select><input id="tl_video" placeholder="رابط الفيديو أو التسجيل"><button onclick="addTrainingLessonAdmin('${safeAttr(c.id)}')">إضافة درس</button></div>${(c.lessons||[]).map(l=>adminLessonRow(c,l)).join('')||'<div class="empty">لا توجد دروس بعد.</div>'}<h3>المرفقات</h3><div class="training-admin-form"><input id="ta_title" placeholder="عنوان المرفق"><input id="ta_kind" placeholder="نوع المرفق PDF / Word / Checklist"><input id="ta_url" placeholder="رابط اختياري"><button onclick="addTrainingAttachmentAdmin('${safeAttr(c.id)}')">إضافة مرفق</button></div>${(c.attachments||[]).map(a=>adminAttachmentRow(c,a)).join('')||'<div class="empty">لا توجد مرفقات بعد.</div>'}<h3>أسئلة الاختبار</h3><div class="training-admin-form"><input id="tq_q" placeholder="السؤال"><input id="tq_a" placeholder="الإجابة الاسترشادية"><button onclick="addTrainingQuizAdmin('${safeAttr(c.id)}')">إضافة سؤال</button></div>${(c.quiz||[]).map((q,i)=>adminQuizRow(c,q,i)).join('')||'<div class="empty">لا توجد أسئلة بعد.</div>'}</section>`:'<div class="empty">احفظ بيانات الدورة أولًا، وبعدها أضف الدروس والمرفقات والاختبارات. خطوة خطوة يا باشا… حتى سند نفسه بيحب النظام.</div>'}</section>`);
  }
  function adminLessonRow(c,l){ return `<article class="training-admin-mini-row"><div><b>${safeEsc(l.title)}</b><small>${safeEsc(l.type)} • ${Number(l.duration)||0} دقيقة ${l.videoUrl?'• فيديو مربوط':''}</small></div><div><button onclick="moveTrainingLesson('${safeAttr(c.id)}','${safeAttr(l.id)}',-1)">↑</button><button onclick="moveTrainingLesson('${safeAttr(c.id)}','${safeAttr(l.id)}',1)">↓</button><button onclick="deleteTrainingLessonAdmin('${safeAttr(c.id)}','${safeAttr(l.id)}')" class="danger-soft-btn">حذف</button></div></article>`; }
  function adminAttachmentRow(c,a){ return `<article class="training-admin-mini-row"><div><b>${safeEsc(a.title)}</b><small>${safeEsc(a.kind)} ${a.url?'• رابط موجود':''}</small></div><button onclick="deleteTrainingAttachmentAdmin('${safeAttr(c.id)}','${safeAttr(a.id||a.title)}')" class="danger-soft-btn">حذف</button></article>`; }
  function adminQuizRow(c,q,i){ return `<article class="training-admin-mini-row"><div><b>${safeEsc(q.q)}</b><small>${safeEsc(q.a)}</small></div><button onclick="deleteTrainingQuizAdmin('${safeAttr(c.id)}',${i})" class="danger-soft-btn">حذف</button></article>`; }
  function saveTrainingCourse(existingId){
    const courses=readCourses(); const id=existingId||uid('course_'); const idx=courses.findIndex(c=>c.id===id);
    const base=idx>=0?courses[idx]:{id, lessons:[], attachments:[], quiz:[]};
    const item={...base, id, icon:document.getElementById('tc_icon').value||'🎓', title:document.getElementById('tc_title').value||'دورة تدريبية جديدة', category:document.getElementById('tc_category').value||'عام', level:document.getElementById('tc_level').value||'أساسي', status:document.getElementById('tc_status').value||'مسودة', description:document.getElementById('tc_desc').value||''};
    if(idx>=0) courses[idx]=item; else courses.unshift(item); writeCourses(courses); openTrainingCourseEditor(id);
  }
  function mutateCourse(id, fn){ const courses=readCourses(); const idx=courses.findIndex(c=>c.id===id); if(idx<0)return; fn(courses[idx]); writeCourses(courses); openTrainingCourseEditor(id); }
  function addTrainingLessonAdmin(id){ mutateCourse(id,c=>{c.lessons=c.lessons||[]; c.lessons.push({id:uid('lesson_'), title:document.getElementById('tl_title').value||'درس جديد', duration:Number(document.getElementById('tl_duration').value)||0, type:document.getElementById('tl_type').value||'video', videoUrl:document.getElementById('tl_video').value||''});}); }
  function deleteTrainingLessonAdmin(id,lid){ if(confirm('حذف الدرس؟')) mutateCourse(id,c=>{c.lessons=(c.lessons||[]).filter(l=>l.id!==lid);}); }
  function moveTrainingLesson(id,lid,dir){ mutateCourse(id,c=>{const arr=c.lessons||[]; const i=arr.findIndex(l=>l.id===lid); const j=i+dir; if(i>=0&&j>=0&&j<arr.length){[arr[i],arr[j]]=[arr[j],arr[i]];}}); }
  function addTrainingAttachmentAdmin(id){ mutateCourse(id,c=>{c.attachments=c.attachments||[]; c.attachments.push({id:uid('att_'), title:document.getElementById('ta_title').value||'مرفق تدريبي', kind:document.getElementById('ta_kind').value||'File', url:document.getElementById('ta_url').value||''});}); }
  function deleteTrainingAttachmentAdmin(id,aid){ if(confirm('حذف المرفق؟')) mutateCourse(id,c=>{c.attachments=(c.attachments||[]).filter(a=>(a.id||a.title)!==aid);}); }
  function addTrainingQuizAdmin(id){ mutateCourse(id,c=>{c.quiz=c.quiz||[]; c.quiz.push({q:document.getElementById('tq_q').value||'سؤال تدريبي', a:document.getElementById('tq_a').value||'إجابة استرشادية'});}); }
  function deleteTrainingQuizAdmin(id,index){ if(confirm('حذف السؤال؟')) mutateCourse(id,c=>{(c.quiz||[]).splice(index,1);}); }
  function deleteTrainingCourse(id){ if(confirm('حذف الدورة بالكامل؟')){ writeCourses(readCourses().filter(c=>c.id!==id)); openTrainingAdmin('courses'); } }
  function duplicateTrainingCourse(id){ const c=courseById(id); if(!c)return; const copy=JSON.parse(JSON.stringify(c)); copy.id=uid('course_'); copy.title='نسخة من '+copy.title; copy.status='مسودة'; writeCourses([copy,...readCourses()]); openTrainingAdmin('courses'); }
  function toggleTrainingCourseStatus(id){ const courses=readCourses(); const c=courses.find(x=>x.id===id); if(c){c.status=(c.status||'منشور')==='منشور'?'مسودة':'منشور'; writeCourses(courses);} openTrainingAdmin('courses'); }

  function openTrainingAdminMeetings(){ const meetings=readMeetings(); show(`<div class="breadcrumb">إدارة التدريب / <b>الاجتماعات</b></div><section class="training-panel training-admin-panel"><h2>📹 إدارة الاجتماعات المباشرة</h2>${adminTabs('meetings')}<div class="training-admin-form"><input id="mtitle" placeholder="عنوان الاجتماع"><input id="mspeaker" placeholder="المحاضر"><input id="mdate" type="date"><input id="mtime" type="time"><select id="mstatus"><option>قادم</option><option>مباشر الآن</option><option>مغلق</option><option>مؤجل</option></select><select id="mmode"><option value="external">رابط خارجي جاهز</option><option value="jitsi">إنشاء قاعة Jitsi تلقائيًا</option></select><input id="mlink" placeholder="رابط القاعة: Google Meet / Teams / Zoom / Jitsi — اختياري عند إنشاء Jitsi"><input id="mattach" placeholder="مرفقات أو ملاحظات أو رابط ملف تدريبي"><button class="gold-btn" onclick="addTrainingMeeting()">إضافة اجتماع مباشر</button><button class="soft-btn" onclick="createInstantTrainingMeeting()">⚡ إنشاء اجتماع فوري الآن</button><p class="admin-note inline">يمكن إنشاء قاعة Jitsi تلقائيًا من داخل المنصة، أو إضافة رابط خارجي جاهز. بعد الحفظ تستطيع الإدارة نسخ رابط حضور خاص بغير الأعضاء للدخول إلى التدريب فقط.</p></div><div class="training-meeting-list wide">${meetings.map(m=>`${renderMeetingRow(m)}<div class="training-admin-meeting-actions"><button class="soft-btn" onclick="copyTrainingGuestAttendanceLink('${safeAttr(m.id)}')">رابط حضور الضيوف</button><button class="soft-btn" onclick="shareTrainingGuestAttendanceLink('${safeAttr(m.id)}')">مشاركة</button><button class="danger-soft-btn training-delete-meeting" onclick="deleteTrainingMeeting('${safeAttr(m.id)}')">حذف الاجتماع</button></div>`).join('')}</div></section>`); }
  function addTrainingMeeting(){ const title=document.getElementById('mtitle').value||'اجتماع تدريبي'; const date=document.getElementById('mdate').value||new Date().toISOString().slice(0,10); const time=document.getElementById('mtime').value||'19:00'; const mode=document.getElementById('mmode')?.value||'external'; let link=document.getElementById('mlink').value||''; if(mode==='jitsi' || !link) link=makeJitsiLink(title,date,time); const item={id:'m'+Date.now(), title, speaker:document.getElementById('mspeaker').value||'مشرف التدريب', date, time, link, attachments:document.getElementById('mattach').value||'', status:document.getElementById('mstatus')?.value||'قادم', source:mode==='jitsi'?'auto-jitsi':'external'}; const meetings=readMeetings(); meetings.unshift(item); writeMeetings(meetings); openTrainingAdmin('meetings'); }
  function createInstantTrainingMeeting(){ const now=new Date(); const date=now.toISOString().slice(0,10); const time=now.toTimeString().slice(0,5); const title=document.getElementById('mtitle')?.value||'اجتماع تدريبي مباشر فوري'; const item={id:'m'+Date.now(), title, speaker:document.getElementById('mspeaker')?.value||'مشرف التدريب', date, time, link:makeJitsiLink(title,date,time), attachments:document.getElementById('mattach')?.value||'اجتماع تم إنشاؤه فوريًا من لوحة الإدارة', status:'مباشر الآن', source:'instant-jitsi'}; const meetings=readMeetings(); meetings.unshift(item); writeMeetings(meetings); openTrainingMeetingDetails(item.id); }
  function deleteTrainingMeeting(id){ if(!confirm('حذف الاجتماع من جدول التدريب؟'))return; writeMeetings(readMeetings().filter(m=>m.id!==id)); openTrainingAdmin('meetings'); }
  function openTrainingAdminReports(){ const s=totalStats(); const progress=readProgress(); show(`<div class="breadcrumb">إدارة التدريب / <b>تقارير التدريب</b></div><section class="training-panel training-admin-panel"><h2>📊 تقارير مركز التدريب</h2>${adminTabs('reports')}<section class="training-stats-grid"><article><span>الدورات المنشورة</span><strong>${s.courses}</strong></article><article><span>الدروس</span><strong>${s.lessons}</strong></article><article><span>الإنجاز المحلي</span><strong>${s.percent}%</strong></article><article><span>اختبارات محفوظة</span><strong>${(progress.__quizzes||[]).length}</strong></article><article><span>حضور اجتماعات</span><strong>${(progress.__attendance||[]).length}</strong></article></section><p class="admin-note">هذه التقارير محلية على الجهاز الحالي. عند ربط المركز بقاعدة بيانات مركزية يمكن استخراج تقارير مستخدمين وجهات وإدارات.</p></section>`); }
  function openTrainingAdminSettings(){ show(`<div class="breadcrumb">إدارة التدريب / <b>إعدادات</b></div><section class="training-panel training-admin-panel"><h2>🛠️ إعدادات مركز التدريب</h2>${adminTabs('settings')}<div class="training-admin-actions"><button class="soft-btn" onclick="localStorage.removeItem('${PROGRESS_KEY}');alert('تم مسح سجل التدريب المحلي.');openTrainingAdmin('settings')">مسح سجل التدريب المحلي</button><button class="danger-soft-btn" onclick="resetCourses()">استعادة الدورات الافتراضية</button><button class="soft-btn" onclick="openTrainingCenter()">معاينة المركز</button></div><p class="admin-note">المرحلة 5.14 تعتمد التخزين المحلي الآمن داخل المتصفح. المرحلة التالية يمكن أن تنقل الدورات والتقارير إلى Worker + D1 للمزامنة بين الأجهزة والمستخدمين.</p></section>`); }

  function askSandAboutTraining(){ if(typeof window.toggleChat==='function') window.toggleChat(true); const input=document.getElementById('chatInput'); if(input){input.value='اقترح لي خطة تدريب قضائي عملية من مركز التدريب المرئي، مع أهم المحاضرات والاختبارات المرتبطة بها.'; input.focus();} }
  function askSandAboutCourse(courseId){ const course=courseById(courseId); if(typeof window.toggleChat==='function') window.toggleChat(true); const input=document.getElementById('chatInput'); if(input&&course){input.value=`لخص لي دورة: ${course.title}، واقترح أسئلة اختبار وحالات عملية مرتبطة بها.`; input.focus();} }
  function askSandAboutLesson(courseId, lessonId){ const course=courseById(courseId); const lesson=course&&(course.lessons||[]).find(l=>l.id===lessonId); if(typeof window.toggleChat==='function') window.toggleChat(true); const input=document.getElementById('chatInput'); if(input&&lesson){input.value=`اشرح لي درس: ${lesson.title} من دورة ${course.title}، مع مثال عملي وأخطاء شائعة.`; input.focus();} }

  document.addEventListener('DOMContentLoaded',()=>{ setTimeout(()=>{ if(location.hash && location.hash.startsWith('#training-guest=')) handleTrainingGuestHash(); }, 80); });
  window.addEventListener('hashchange',()=>{ if(location.hash && location.hash.startsWith('#training-guest=')) handleTrainingGuestHash(); });

  Object.assign(window,{openTrainingCenter,openTrainingCourse,openTrainingLesson,toggleTrainingLesson,markCourseDone,openTrainingQuiz,saveTrainingQuiz,openTrainingMeetings,openTrainingMeetingDetails,recordMeetingAttendance,recordMeetingExit,openTrainingMeetingRoom,copyTrainingMeetingLink,downloadTrainingMeetingIcs,openTrainingRecord,openTrainingAdmin,openTrainingCourseEditor,saveTrainingCourse,addTrainingLessonAdmin,deleteTrainingLessonAdmin,moveTrainingLesson,addTrainingAttachmentAdmin,deleteTrainingAttachmentAdmin,addTrainingQuizAdmin,deleteTrainingQuizAdmin,deleteTrainingCourse,duplicateTrainingCourse,toggleTrainingCourseStatus,addTrainingMeeting,createInstantTrainingMeeting,deleteTrainingMeeting,copyTrainingGuestAttendanceLink,shareTrainingGuestAttendanceLink,joinTrainingAsGuestFromPayload,handleTrainingGuestHash,resetCourses,askSandAboutTraining,askSandAboutCourse,askSandAboutLesson});
})();
