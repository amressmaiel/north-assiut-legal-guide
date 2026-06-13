/* Phase 3: Judicial operational tools — review aids, not binding legal determinations */
(function(){
  const STORAGE_KEY = "judicial_phase3_tool_drafts_v1";
  const DEADLINE_HISTORY_KEY = "judicial_deadline_history_v2";
  const PROCEDURES = {
    interrogation: {
      title: "استجواب متهم",
      icon: "🗣️",
      description: "مراجعة أولية لعناصر الاستجواب وضماناته قبل البدء أو قبل اعتماد المحضر.",
      checks: [
        "تحديد صفة القائم بالإجراء واختصاصه.",
        "إثبات بيانات المتهم والتحقق من شخصيته بصورة واضحة.",
        "إحاطة المتهم بالتهمة المنسوبة إليه في حدود ما يسمح به القانون.",
        "مراجعة مدى وجوب حضور محامٍ أو دعوته أو ندبه بحسب الحالة.",
        "إثبات وقت بدء الإجراء وانتهائه ومكان انعقاده.",
        "إثبات ما إذا كانت هناك إصابات ظاهرة أو شكاوى تستلزم إجراءً مستقلًا.",
        "مراجعة سلامة التوقيعات وإثبات الامتناع عند حصوله.",
        "مراجعة أي قيود خاصة مرتبطة بنوع الجريمة أو صفة المتهم."
      ],
      warnings: ["لا تعتمد على القائمة وحدها عند وجود نص خاص أو تعليمات أحدث.", "أي مساس بضمانات الدفاع يستلزم مراجعة فورية قبل الاستمرار."]
    },
    search: {
      title: "تفتيش",
      icon: "🔎",
      description: "مراجعة سند التفتيش وحدوده وطريقة إثباته بالأوراق.",
      checks: [
        "تحديد السند القانوني للتفتيش وسببه وحدوده.",
        "مراجعة الاختصاص المكاني والنوعي وصفة القائم بالتنفيذ.",
        "إثبات توقيت التنفيذ ومكانه بصورة دقيقة.",
        "مراجعة نطاق التفتيش وعدم تجاوزه للسند القائم.",
        "إثبات المضبوطات ووصفها وطريقة العثور عليها.",
        "مراجعة إجراءات التحريز وسلسلة التسليم والاستلام.",
        "إثبات حضور من يلزم حضوره أو سبب تعذر ذلك بحسب الحالة.",
        "مراجعة أي متطلبات خاصة بالأجهزة أو الأدلة الرقمية."
      ],
      warnings: ["تجاوز نطاق السند قد يثير منازعة جدية حول سلامة الإجراء.", "في الأدلة الرقمية راجع التحريز والندب الفني وسلسلة الحيازة بعناية."]
    },
    arrest: {
      title: "قبض وضبط",
      icon: "🛡️",
      description: "مراجعة سند القبض وتوثيق ظروفه وما ترتب عليه.",
      checks: [
        "تحديد السند القانوني للقبض أو الضبط.",
        "إثبات زمان ومكان القبض بصورة دقيقة.",
        "إثبات صفة القائم بالقبض واختصاصه.",
        "مراجعة سلامة التعامل مع المضبوطات المصاحبة.",
        "إثبات حالة المقبوض عليه وأي إصابات أو شكاوى.",
        "مراجعة المواعيد التالية على القبض وفق النص الواجب التطبيق.",
        "إثبات الإخطارات أو الإجراءات اللاحقة المطلوبة بحسب الحالة."
      ],
      warnings: ["راجع النص الخاص قبل الاعتماد، خصوصًا في الحالات الاستثنائية.", "أي تأخير مؤثر في الإجراءات التالية للقبض يستلزم مراجعة الميعاد بدقة."]
    },
    detention: {
      title: "حبس احتياطي وتجديد",
      icon: "⏳",
      description: "قائمة مراجعة مساندة للمدد والأسباب والبدائل والضمانات.",
      checks: [
        "تحديد النص والإطار الإجرائي الواجب التطبيق على الواقعة.",
        "حساب المدة السابقة بدقة وتحديد نقطة بداية الحساب.",
        "مراجعة الاختصاص بإصدار القرار أو طلب التجديد.",
        "إثبات الأسباب الواقعية والقانونية بصورة محددة.",
        "مراجعة مدى كفاية التدابير أو البدائل الأقل مساسًا بالحرية بحسب الحالة.",
        "مراجعة حضور الدفاع أو الإخطار المطلوب.",
        "إثبات تاريخ ووقت القرار ونهايته المتوقعة.",
        "ضبط تنبيه قبل الميعاد التالي وعدم الاكتفاء بالحساب الذهني."
      ],
      warnings: ["المواعيد الحتمية لا تحتمل التقريب؛ استخدم حاسبة المواعيد ثم راجع النص الرسمي.", "لا تستخدم القالب العام بدل تسبيب القرار بحسب وقائع الملف."]
    },
    reconciliation: {
      title: "صلح أو تصالح",
      icon: "🤝",
      description: "مراجعة الصفة والمستندات والأثر القانوني قبل إثبات التصرف.",
      checks: [
        "تحديد الوصف القانوني الدقيق للواقعة والنص المنظم للصلح أو التصالح.",
        "مراجعة صفة مقدم الطلب وسلطته في إجرائه.",
        "مراجعة المستندات المؤيدة للصفة والتوكيلات عند اللزوم.",
        "تحديد مرحلة الدعوى وأثرها على الإجراء.",
        "تمييز الصلح عن التصالح وعدم الخلط بين أثريهما.",
        "إثبات الطلب أو الإقرار بطريقة واضحة في الأوراق.",
        "مراجعة أثر الإجراء على الدعوى أو العقوبة أو التنفيذ وفق النص الخاص.",
        "مراجعة وجود أطراف أو ورثة أو جهات أخرى يلزم موقفهم بحسب الحالة."
      ],
      warnings: ["الأثر يختلف حسب نوع الجريمة والنص الخاص؛ لا تعمم نتيجة واحدة.", "راجع الصفة والتوكيلات والمستندات قبل ترتيب أي أثر قانوني."]
    },
    referral: {
      title: "إحالة وتصرف نهائي",
      icon: "📤",
      description: "فحص أولي قبل الإحالة أو التصرف لضمان اكتمال عناصر الملف.",
      checks: [
        "مراجعة الاختصاص النوعي والمكاني والشخصي.",
        "مراجعة وصف التهمة ومواد القيد والتطبيق.",
        "التأكد من اكتمال عناصر الإثبات الجوهرية.",
        "مراجعة القيود الإجرائية والمواعيد والطلبات اللازمة.",
        "مراجعة موقف المضبوطات والأحراز والتقارير الفنية.",
        "فحص بيانات الأطراف والإعلانات والعناوين.",
        "مراجعة الارتباط بين الجرائم وأثره على الإحالة.",
        "صياغة مذكرة أو قائمة مراجعة بالنقاط التي تحتاج استكمالًا قبل الاعتماد."
      ],
      warnings: ["وجود نقص جوهري لا يعالج بصياغة مطولة؛ استكمل العنصر نفسه.", "راجع النص الخاص والتعليمات المختصة قبل اعتماد التصرف النهائي."]
    },
    expert: {
      title: "ندب خبير أو فحص فني",
      icon: "🧪",
      description: "مراجعة نطاق المأمورية والأحراز والأسئلة الفنية.",
      checks: [
        "تحديد الجهة الفنية المختصة ونطاق المأمورية بدقة.",
        "صياغة أسئلة واضحة قابلة للإجابة الفنية.",
        "مراجعة وصف الأحراز وأرقامها وسلامة أختامها.",
        "إثبات سلسلة التسليم والاستلام.",
        "تحديد ما إذا كانت هناك عينة احتياطية أو متطلبات خاصة.",
        "مراجعة الميعاد المطلوب للتقرير عند وجود مقتضٍ.",
        "ربط التقرير الفني بالواقعة وعدم الاكتفاء بنتيجته المجردة."
      ],
      warnings: ["السؤال الفني الغامض يخرج تقريرًا غامضًا؛ صغ المأمورية بدقة.", "راجع سلامة التحريز قبل الإرسال للجهة الفنية."]
    }
  };

  const INVESTIGATION_TEMPLATES = {
    theft: {
      title: "سرقة",
      icon: "🔐",
      items: [
        "تحديد مكان وزمان الواقعة بدقة.", "بيان وصف المال محل الواقعة وملكيته وقيمته.", "سؤال المجني عليه عن ظروف اكتشاف الواقعة.",
        "فحص كاميرات المراقبة والشهود المحتملين.", "بيان كيفية اتصال المتهم بالمكان أو المال.", "مراجعة المضبوطات وطريقة العثور عليها وتحريزها.",
        "بحث الظروف المشددة المحتملة وفق الوقائع الثابتة.", "إثبات أي رد للمسروقات أو تصالح أو طلبات مدنية."
      ]
    },
    fraud: {
      title: "نصب أو احتيال",
      icon: "🧾",
      items: [
        "تحديد الوسيلة الاحتيالية أو المظهر الخارجي المستخدم.", "بيان المال أو المنفعة التي تم تسليمها وتاريخ التسليم.", "إثبات علاقة السببية بين الوسيلة والتسليم.",
        "مراجعة الرسائل والمحررات والإعلانات أو الحسابات المستخدمة.", "سؤال الشهود أو الوسطاء عند وجودهم.", "فحص التحويلات المالية والمستندات المؤيدة.",
        "تمييز النزاع المدني عن السلوك الجنائي من واقع الأدلة.", "مراجعة الجرائم المرتبطة مثل التزوير أو استعمال المحرر."
      ]
    },
    forgery: {
      title: "تزوير واستعمال محرر",
      icon: "🖋️",
      items: [
        "تحديد نوع المحرر وصفته والجهة المنسوب صدوره إليها.", "تحريز أصل المحرر أو بيان سبب عدم وجوده.", "تحديد موضع التغيير أو الاصطناع أو العبث المدعى به.",
        "سؤال من نُسب إليه التوقيع أو الإصدار.", "الندب للفحص الفني عند اللزوم مع صياغة مأمورية دقيقة.", "بحث واقعة الاستعمال والعلم بالتزوير بصورة مستقلة.",
        "مراجعة المستندات المقارنة الصالحة للفحص.", "فحص الارتباط بجرائم أخرى مثل النصب أو الاستيلاء."
      ]
    },
    assault: {
      title: "ضرب أو إصابة",
      icon: "🩺",
      items: [
        "تحديد وصف الإصابة وموضعها وتاريخ حدوثها.", "إرفاق التقرير الطبي وطلب الاستكمال عند الحاجة.", "تحديد الأداة المستخدمة وظروف استعمالها.",
        "سؤال الشهود وفحص مكان الواقعة.", "مراجعة وجود قصد خاص أو ظرف مشدد.", "بيان مدة العلاج أو العجز وفق التقرير المختص.",
        "مراجعة مدى الحاجة إلى عرض الطب الشرعي.", "فحص الصلح أو التنازل وأثره وفق النص الخاص."
      ]
    },
    homicide: {
      title: "قتل أو شروع في قتل",
      icon: "⚖️",
      items: [
        "معاينة مكان الواقعة وتوثيق مواضع الآثار.", "ندب الطب الشرعي وبيان سبب الوفاة أو طبيعة الإصابات.", "تحريز الأداة وفحص صلتها بالواقعة.",
        "بحث نية إزهاق الروح من ظروف الفعل والأداة وموضع الإصابات.", "فحص سبق الإصرار أو الترصد أو الاقتران أو الارتباط عند وجود مؤشرات.",
        "سؤال الشهود وفحص الكاميرات والاتصالات عند اللزوم.", "تحديد دور كل متهم في حالة التعدد.", "مراجعة موقف الصلح وأثره وفق النص الواجب التطبيق دون تعميم."
      ]
    },
    digital: {
      title: "دليل رقمي أو جهاز إلكتروني",
      icon: "📱",
      items: [
        "إثبات وصف الجهاز ورقمه التسلسلي وحالته وقت الضبط.", "توثيق مكان الضبط ومن قام به وتوقيته.", "عدم العبث بالمحتوى قبل الندب الفني.",
        "تحريز الجهاز أو الوسيط بطريقة مناسبة.", "إثبات سلسلة الحيازة والتسليم والاستلام.", "تحديد المطلوب فنيًا بصورة واضحة ومحددة.",
        "مراجعة الحاجة إلى نسخة جنائية أو بصمة رقمية وفق الإمكانات الفنية.", "ربط النتيجة الفنية بصاحب الجهاز والواقعة وعدم الاكتفاء بوجود المحتوى."
      ]
    }
  };

  const JURISDICTION_STEPS = [
    { id:"place", label:"مكان وقوع الجريمة أو الجزء الجوهري منها", options:["داخل دائرة النيابة", "خارج الدائرة", "أكثر من دائرة", "غير محدد بعد"] },
    { id:"crime", label:"طبيعة الجريمة", options:["جريمة عادية", "جريمة اقتصادية أو مالية خاصة", "جريمة إلكترونية", "جريمة عسكرية محتملة", "غير محددة"] },
    { id:"person", label:"صفة المتهم أو المجني عليه إن كانت مؤثرة", options:["لا توجد صفة خاصة ظاهرة", "موظف عام", "حدث", "عسكري", "صفة أخرى تحتاج مراجعة"] },
    { id:"link", label:"هل توجد جرائم مرتبطة؟", options:["لا", "نعم ارتباط بسيط", "نعم ارتباط قد لا يقبل التجزئة", "غير واضح"] }
  ];

  const DEADLINE_PRESETS = Array.isArray(window.LEGAL_DEADLINE_PRESETS) ? window.LEGAL_DEADLINE_PRESETS : [];

  function escLocal(value){ return typeof esc === "function" ? esc(value) : String(value ?? ""); }
  function showPage(content, nav){ if(typeof setActiveNav === "function") setActiveNav(nav); if(typeof page === "function") page(content); }
  function toast(msg){ if(typeof showJudicialToast === "function") showJudicialToast(msg); else alert(msg); }
  function dateToISO(date){ const y=date.getFullYear(); const m=String(date.getMonth()+1).padStart(2,"0"); const d=String(date.getDate()).padStart(2,"0"); return `${y}-${m}-${d}`; }
  function formatArabicDate(date){ return new Intl.DateTimeFormat("ar-EG-u-nu-arab",{year:"numeric",month:"long",day:"numeric",weekday:"long"}).format(date); }
  function addDays(start, days, excludeFridays, excludeSaturdays){
    const date=new Date(`${start}T12:00:00`); if(Number.isNaN(date.getTime())) return null;
    let remaining=Number(days); if(!Number.isFinite(remaining) || remaining<0) return null;
    while(remaining>0){ date.setDate(date.getDate()+1); const day=date.getDay(); if((excludeFridays&&day===5)||(excludeSaturdays&&day===6)) continue; remaining--; }
    return date;
  }
  function readChecked(selector){ return [...document.querySelectorAll(selector)].filter(item=>item.checked).map(item=>item.value); }
  function percent(done,total){ return total?Math.round((done/total)*100):0; }
  function scoreLabel(score){ return score>=90?"مراجعة أولية مكتملة":score>=65?"تحتاج استكمال بعض النقاط":"تحتاج مراجعة مركزة قبل الاعتماد"; }

  function openToolsHub(){
    showPage(`<div class="breadcrumb">الرئيسية / <b>أدوات التنفيذ القضائي</b></div>
      <section class="tools-hub-head"><div><span>المرحلة الثالثة</span><h2>🧰 أدوات التنفيذ والمراجعة الوقائية</h2><p>أدوات مساندة تساعد على ترتيب المراجعة واكتشاف النقاط الناقصة. لا تُغني عن الرجوع إلى النص الرسمي والتعليمات المختصة وتقدير عضو النيابة.</p></div></section>
      <div class="judicial-tools-grid">
        ${toolCard("🛡️","درع المراجعة الوقائية","راجع الإجراء قبل اعتماده من خلال قائمة فحص عملية وتحذيرات مركزة.","openProceduralShield()")}
        ${toolCard("⏱️","حاسبة المواعيد والتنبيهات","اختر الإجراء القانوني، أدخل تاريخ الواقعة المنشئة للميعاد، واعرف آخر يوم والمتبقي أو مقدار التأخير مع السند القانوني.","openDeadlineCalculator()")}
        ${toolCard("🧾","منشئ قوائم الاستيفاء","جهّز قائمة استيفاءات قابلة للتعليم والطباعة حسب نوع الواقعة.","openInvestigationChecklistBuilder()")}
        ${toolCard("🧭","مساعد مراجعة الاختصاص","رتّب عناصر الاختصاص والأسئلة التي تحتاج إجابة قبل تحديد المسار الصحيح.","openJurisdictionNavigator()")}
      </div><div class="tool-safety-note">⚠️ الأدوات دي للمراجعة المساندة فقط. النتيجة لا تُعد قرارًا أو رأيًا ملزمًا، ولازم تراجع النصوص الرسمية والتعليمات الأحدث قبل الاعتماد.</div>`,"tools");
  }
  function toolCard(icon,title,desc,action){ return `<article class="judicial-tool-card"><div class="judicial-tool-icon">${icon}</div><h3>${title}</h3><p>${desc}</p><button onclick="${action}">فتح الأداة</button></article>`; }

  function openProceduralShield(){
    showPage(`<div class="breadcrumb">أدوات التنفيذ / <b>درع المراجعة الوقائية</b></div>
      <section class="tool-page-head"><div><h2>🛡️ راجع الإجراء قبل اعتماده</h2><p>اختار الإجراء، وبعدها علّم على النقاط اللي تمت مراجعتها. القائمة مساعدة تنظيمية وليست بديلًا عن النص الخاص.</p></div><button onclick="openToolsHub()">العودة للأدوات</button></section>
      <div class="procedure-type-grid">${Object.entries(PROCEDURES).map(([id,item])=>`<button onclick="renderProcedureChecklist('${id}')"><span>${item.icon}</span><b>${item.title}</b></button>`).join("")}</div>
      <div id="procedureChecklistArea" class="tool-result-area"><div class="empty">اختار نوع الإجراء علشان تبدأ المراجعة.</div></div>`,"procedural-shield");
  }
  function renderProcedureChecklist(id){
    const item=PROCEDURES[id]; if(!item)return;
    const area=document.getElementById("procedureChecklistArea");
    area.innerHTML=`<section class="checklist-panel"><header><div><span>${item.icon}</span><h3>${item.title}</h3><p>${item.description}</p></div><b id="procedureScore">٠٪</b></header>
      <div class="checklist-items">${item.checks.map((text,index)=>`<label><input type="checkbox" data-procedure-check onchange="updateProcedureScore()"><span><b>${index+1}</b>${escLocal(text)}</span></label>`).join("")}</div>
      <div class="tool-warning-box"><b>⚠️ تنبيهات مهمة</b>${item.warnings.map(text=>`<p>${escLocal(text)}</p>`).join("")}</div>
      <div class="tool-actions"><button onclick="printToolArea('procedureChecklistArea','درع المراجعة الوقائية — ${escLocal(item.title)}')">🖨️ طباعة القائمة</button><button onclick="copyChecklistText('procedureChecklistArea')">📋 نسخ النص</button></div>
      <div id="procedureScoreLabel" class="tool-score-label">ابدأ تعليم عناصر المراجعة.</div></section>`;
  }
  function updateProcedureScore(){ const list=[...document.querySelectorAll("[data-procedure-check]")]; const score=percent(list.filter(x=>x.checked).length,list.length); const scoreEl=document.getElementById("procedureScore"); const label=document.getElementById("procedureScoreLabel"); if(scoreEl)scoreEl.textContent=`${score}%`; if(label)label.textContent=scoreLabel(score); }

  function getDeadlinePresets(){ return DEADLINE_PRESETS.length ? DEADLINE_PRESETS : [{id:"custom-manual",category:"حساب يدوي",title:"ميعاد مخصص — إدخال يدوي",duration:{value:null,unit:"days"},trigger:{label:"تاريخ بداية الحساب",excludeTriggerDay:true},calculationMode:"manual",legalBasis:{lawTitle:"",articleNumber:"",textSummary:""},warnings:["أدخل المدة بعد مراجعة النص الرسمي."],status:"manual"}]; }
  function deadlineCategories(){ return [...new Set(getDeadlinePresets().map(p=>p.category))]; }
  function selectedDeadlinePreset(){ const id=document.getElementById("deadlinePreset")?.value || "custom-manual"; return getDeadlinePresets().find(p=>p.id===id) || getDeadlinePresets()[0]; }
  function deadlineStatusBadge(status){ return status==="verified-current-law"?"✅ قالب قانوني موثق":status==="verified-current-law-with-review-note"?"🟡 قالب موثق مع ملاحظة مراجعة":status==="verified-new-law-partial-source"?"🟡 مستخرج من الجزء المرفوع من القانون الجديد":status==="advanced-review"?"⚠️ حساب استرشادي يحتاج مراجعة متقدمة":"📝 إدخال يدوي"; }
  function deadlineUnitLabel(unit,value){ const n=Number(value); if(unit==="hours") return `${n} ساعة`; if(unit==="months") return `${n} شهر`; if(unit==="years") return `${n} سنة`; return `${n} يوم`; }
  function addLegalDuration(startValue,duration,options={}){
    if(!startValue || !duration || duration.value===null || duration.value==="") return null;
    const hasTime=String(startValue).includes("T"); const date=new Date(hasTime?startValue:`${startValue}T12:00:00`); if(Number.isNaN(date.getTime())) return null;
    const value=Number(duration.value); if(!Number.isFinite(value)||value<0)return null;
    if(duration.unit==="hours") date.setHours(date.getHours()+value);
    else if(duration.unit==="months") date.setMonth(date.getMonth()+value);
    else if(duration.unit==="years") date.setFullYear(date.getFullYear()+value);
    else { let remaining=value; while(remaining>0){date.setDate(date.getDate()+1);remaining--;} }
    if(options.extendWeekend){ while(date.getDay()===5||date.getDay()===6) date.setDate(date.getDate()+1); }
    return date;
  }
  function deadlineDateTimeISO(date){ const base=dateToISO(date); return `${base}T${String(date.getHours()).padStart(2,"0")}:${String(date.getMinutes()).padStart(2,"0")}`; }
  function deadlineDisplayDate(date,includeTime=false){ return includeTime?`${formatArabicDate(date)} — ${new Intl.DateTimeFormat("ar-EG-u-nu-arab",{hour:"numeric",minute:"2-digit"}).format(date)}`:formatArabicDate(date); }
  function daysDifference(target){ const today=new Date();today.setHours(0,0,0,0); const date=new Date(target);date.setHours(0,0,0,0); return Math.ceil((date-today)/86400000); }
  function relativeDeadlineStatus(target){ const days=daysDifference(target); if(days<0)return {className:"expired",icon:"🔴",title:"المعاد انقضى",detail:`انتهى الميعاد منذ ${Math.abs(days)} يوم.`}; if(days===0)return {className:"urgent",icon:"🟠",title:"اليوم هو آخر ميعاد",detail:"يلزم المراجعة واتخاذ الإجراء فورًا بحسب الحالة."}; if(days<=3)return {className:"warning",icon:"🟡",title:"اقترب انتهاء الميعاد",detail:`متبقي ${days} يوم فقط.`}; return {className:"active",icon:"🟢",title:"الميعاد ما زال قائمًا",detail:`متبقي ${days} يوم.`}; }
  function renderDeadlinePresetOptions(category){ return getDeadlinePresets().filter(p=>!category||p.category===category).map(p=>`<option value="${escLocal(p.id)}">${escLocal(p.title)}</option>`).join(""); }
  function openDeadlineCalculator(){
    const categories=deadlineCategories();
    showPage(`<div class="breadcrumb">أدوات التنفيذ / <b>حاسبة المواعيد والتنبيهات القضائية</b></div>
      <section class="tool-page-head"><div><h2>⏱️ حاسبة المواعيد والتنبيهات القضائية</h2><p>اختار الإجراء، وأدخل تاريخ الواقعة المنشئة للميعاد، والمنصة تعرض آخر يوم قانوني والمتبقي أو مقدار التأخير مع طريقة الحساب والسند القانوني.</p></div><button onclick="openToolsHub()">العودة للأدوات</button></section>
      <section class="deadline-smart-layout">
        <div class="deadline-calculator-card deadline-smart-card">
          <div class="deadline-step-title"><b>١</b><div><h3>اختيار الإجراء القانوني</h3><p>اختار الفئة ثم الإجراء المطلوب حساب ميعاده.</p></div></div>
          <div class="tool-form-grid deadline-main-grid">
            <label><span>الفئة</span><select id="deadlineCategory" onchange="refreshDeadlinePresetList()">${categories.map(cat=>`<option>${escLocal(cat)}</option>`).join("")}</select></label>
            <label><span>الإجراء</span><select id="deadlinePreset" onchange="applyDeadlinePreset()">${renderDeadlinePresetOptions(categories[0])}</select></label>
          </div>
          <div id="deadlinePresetInfo" class="deadline-preset-info"></div>
          <div class="deadline-step-title"><b>٢</b><div><h3>بيانات الحساب</h3><p>أدخل التاريخ أو الوقت الذي يبدأ منه الحساب وفق القالب المختار.</p></div></div>
          <div class="tool-form-grid deadline-main-grid" id="deadlineDynamicInputs"></div>
          <div class="deadline-options">
            <label><input id="deadlineExtendWeekend" type="checkbox"> إذا وافق آخر يوم الجمعة أو السبت، انقله لأول يوم عمل تالٍ</label>
          </div>
          <label class="jurisdiction-notes"><span>ملاحظة داخلية اختيارية</span><textarea id="deadlineNotes" rows="2" placeholder="مثال: رقم القضية أو سبب المتابعة — دون إدخال بيانات حساسة"></textarea></label>
          <div class="tool-actions"><button onclick="calculateLegalDeadline()">احسب الميعاد</button><button onclick="resetDeadlineCalculator()">إعادة ضبط</button><button onclick="openDeadlineHistory()">🕘 الحسابات المحفوظة</button></div>
          <div id="deadlineResult" class="deadline-result"><p>اختار الإجراء وأدخل البيانات ثم اضغط «احسب الميعاد».</p></div>
        </div>
      </section>
      <div class="tool-safety-note">⚠️ الحاسبة أداة مساندة للمراجعة. راجع النص القانوني والتعليمات الأحدث وأي استثناءات أو قواعد امتداد أو انقطاع قبل الاعتماد المهني النهائي.</div>`,'deadlines');
    applyDeadlinePreset();
  }
  function refreshDeadlinePresetList(){ const category=document.getElementById("deadlineCategory")?.value||""; const select=document.getElementById("deadlinePreset"); if(!select)return; select.innerHTML=renderDeadlinePresetOptions(category); applyDeadlinePreset(); }
  function applyDeadlinePreset(){
    const preset=selectedDeadlinePreset(); const info=document.getElementById("deadlinePresetInfo"), inputs=document.getElementById("deadlineDynamicInputs"); if(!info||!inputs)return;
    const manual=preset.calculationMode==="manual"; const requiresTime=!!preset.trigger?.requiresTime;
    info.innerHTML=`<div class="deadline-preset-head"><div><span>${escLocal(deadlineStatusBadge(preset.status))}</span><h4>${escLocal(preset.title)}</h4><p>${escLocal(preset.description||"")}</p></div><b>${preset.duration?.value===null?"إدخال يدوي":escLocal(deadlineUnitLabel(preset.duration.unit,preset.duration.value))}</b></div>
      ${preset.legalBasis?.articleNumber?`<div class="deadline-legal-basis"><b>⚖️ السند القانوني:</b> ${escLocal(preset.legalBasis.lawTitle)} — ${escLocal(preset.legalBasis.articleNumber)}<small>${escLocal(preset.legalBasis.textSummary||"")}</small>${preset.effectiveFrom?`<small>📅 فترة السريان: من ${escLocal(preset.effectiveFrom)}${preset.effectiveTo?` حتى ${escLocal(preset.effectiveTo)}`:" فأحدث"}</small>`:""}</div>`:""}
      ${(preset.warnings||[]).length?`<div class="deadline-warning-list">${preset.warnings.map(w=>`<p>⚠️ ${escLocal(w)}</p>`).join("")}</div>`:""}`;
    inputs.innerHTML=`<label><span>${escLocal(preset.trigger?.label||"تاريخ بداية الحساب")}</span><input id="deadlineStart" type="${requiresTime?"datetime-local":"date"}" value="${requiresTime?deadlineDateTimeISO(new Date()).slice(0,16):dateToISO(new Date())}"></label>
      ${manual?`<label><span>عدد الوحدات</span><input id="deadlineManualValue" type="number" min="0" step="1" placeholder="أدخل المدة"></label><label><span>نوع الوحدة</span><select id="deadlineManualUnit"><option value="days">أيام</option><option value="hours">ساعات</option><option value="months">شهور</option><option value="years">سنوات</option></select></label>`:""}`;
    document.getElementById("deadlineResult").innerHTML="<p>أدخل البيانات ثم اضغط «احسب الميعاد».</p>";
  }
  function buildDeadlineTimeline(start,target,preset,status){ const includeTime=preset.duration.unit==="hours"; return `<div class="deadline-timeline"><div><i>📅</i><b>بداية الميعاد</b><small>${escLocal(deadlineDisplayDate(start,includeTime))}</small></div><span>←</span><div><i>${status.icon}</i><b>آخر يوم محسوب</b><small>${escLocal(deadlineDisplayDate(target,includeTime))}</small></div></div>`; }
  function calculateLegalDeadline(){
    const preset=selectedDeadlinePreset(); const startValue=document.getElementById("deadlineStart")?.value; const manual=preset.calculationMode==="manual"; const duration=manual?{value:Number(document.getElementById("deadlineManualValue")?.value),unit:document.getElementById("deadlineManualUnit")?.value||"days"}:preset.duration;
    const target=addLegalDuration(startValue,duration,{extendWeekend:!!document.getElementById("deadlineExtendWeekend")?.checked}); const result=document.getElementById("deadlineResult"); if(!target||!startValue||duration.value===null||!Number.isFinite(Number(duration.value))){result.innerHTML="<p>⚠️ راجع تاريخ البداية والمدة المطلوبة.</p>";return;}
    const start=new Date(String(startValue).includes("T")?startValue:`${startValue}T12:00:00`); const state=relativeDeadlineStatus(target); const notes=document.getElementById("deadlineNotes")?.value.trim()||""; const includeTime=duration.unit==="hours";
    const record={id:`deadline-${Date.now()}`,presetId:preset.id,title:preset.title,start:startValue,target:includeTime?deadlineDateTimeISO(target):dateToISO(target),duration,notes,createdAt:new Date().toISOString(),legalBasis:preset.legalBasis};
    window.__lastDeadlineRecord=record;
    result.innerHTML=`<section class="deadline-outcome ${state.className}"><header><div><span>${state.icon} ${escLocal(state.title)}</span><h3>${escLocal(deadlineDisplayDate(target,includeTime))}</h3><p>${escLocal(state.detail)}</p></div><b>${escLocal(deadlineUnitLabel(duration.unit,duration.value))}</b></header>
      ${buildDeadlineTimeline(start,target,{duration},state)}
      <div class="deadline-calculation-explain"><b>طريقة الحساب</b><p>بدأ الحساب من: ${escLocal(deadlineDisplayDate(start,includeTime))}</p><p>أضيفت مدة: ${escLocal(deadlineUnitLabel(duration.unit,duration.value))}</p>${document.getElementById("deadlineExtendWeekend")?.checked?"<p>تم تفعيل نقل آخر يوم إذا وافق الجمعة أو السبت.</p>":""}</div>
      ${preset.legalBasis?.articleNumber?`<div class="deadline-result-basis"><b>السند القانوني</b><p>${escLocal(preset.legalBasis.lawTitle)} — ${escLocal(preset.legalBasis.articleNumber)}</p><small>${escLocal(preset.legalBasis.textSummary||"")}</small></div>`:""}
      ${(preset.warnings||[]).length?`<div class="deadline-warning-list">${preset.warnings.map(w=>`<p>⚠️ ${escLocal(w)}</p>`).join("")}</div>`:""}
      <div class="tool-actions"><button onclick="saveLastDeadlineCalculation()">💾 حفظ الحساب</button><button onclick="copyDeadlineResult()">📋 نسخ النتيجة</button><button onclick="printToolArea('deadlineResult','نتيجة حاسبة المواعيد القضائية')">🖨️ طباعة</button><button onclick="askSandAboutDeadline()">🤖 اسأل سَنَد</button></div></section>`;
  }
  function calculateDeadline(){ return calculateLegalDeadline(); }
  function readDeadlineHistory(){ try{return JSON.parse(localStorage.getItem(DEADLINE_HISTORY_KEY)||"[]")}catch{return[]} }
  function writeDeadlineHistory(items){ localStorage.setItem(DEADLINE_HISTORY_KEY,JSON.stringify(items.slice(0,40))); }
  function saveLastDeadlineCalculation(){ const rec=window.__lastDeadlineRecord;if(!rec){toast("احسب الميعاد الأول.");return;} const list=readDeadlineHistory().filter(x=>x.id!==rec.id);list.unshift(rec);writeDeadlineHistory(list);toast("تم حفظ الحساب على الجهاز."); }
  function removeDeadlineHistoryItem(id){ writeDeadlineHistory(readDeadlineHistory().filter(x=>x.id!==id));openDeadlineHistory(); }
  function clearDeadlineHistory(){ if(confirm("مسح سجل الحسابات المحفوظة؟")){writeDeadlineHistory([]);openDeadlineHistory();} }
  function openDeadlineHistory(){ const items=readDeadlineHistory(); showPage(`<div class="breadcrumb">أدوات التنفيذ / حاسبة المواعيد / <b>الحسابات المحفوظة</b></div><section class="tool-page-head"><div><h2>🕘 الحسابات المحفوظة</h2><p>سجل محلي محفوظ على الجهاز فقط.</p></div><div class="tool-actions"><button onclick="openDeadlineCalculator()">حساب جديد</button><button onclick="clearDeadlineHistory()">مسح السجل</button></div></section><div class="deadline-history-list">${items.length?items.map(item=>`<article><div><h3>${escLocal(item.title)}</h3><p>البداية: ${escLocal(item.start)} — النهاية: ${escLocal(item.target)}</p>${item.notes?`<small>${escLocal(item.notes)}</small>`:""}</div><button onclick="removeDeadlineHistoryItem('${escLocal(item.id)}')">حذف</button></article>`).join(""):"<div class='empty'>لا توجد حسابات محفوظة حتى الآن.</div>"}</div>`,'deadlines'); }
  function copyDeadlineResult(){ const el=document.getElementById("deadlineResult");if(!el)return;navigator.clipboard?.writeText(el.innerText).then(()=>toast("تم نسخ نتيجة الحساب."),()=>toast("تعذر النسخ تلقائيًا.")); }
  function askSandAboutDeadline(){ const rec=window.__lastDeadlineRecord;if(!rec){toast("احسب الميعاد الأول.");return;} const question=`اشرح لي طريقة مراجعة هذا الميعاد القضائي: ${rec.title}. تاريخ البداية ${rec.start}، والنتيجة الحسابية ${rec.target}. وضح السند القانوني والتنبيهات التي يجب مراجعتها قبل الاعتماد.`; if(typeof toggleChat==="function")toggleChat(true); const input=document.getElementById("chatInput");if(input){input.value=question;input.focus();} }
  function resetDeadlineCalculator(){ openDeadlineCalculator(); }

  function openInvestigationChecklistBuilder(){
    showPage(`<div class="breadcrumb">أدوات التنفيذ / <b>منشئ قوائم الاستيفاء</b></div>
      <section class="tool-page-head"><div><h2>🧾 منشئ قوائم الاستيفاء</h2><p>اختار نوع الواقعة علشان تحصل على نقطة بداية عملية قابلة للتعديل والتعليم والطباعة.</p></div><button onclick="openToolsHub()">العودة للأدوات</button></section>
      <div class="investigation-template-grid">${Object.entries(INVESTIGATION_TEMPLATES).map(([id,item])=>`<button onclick="renderInvestigationChecklist('${id}')"><span>${item.icon}</span><b>${item.title}</b></button>`).join("")}</div>
      <div id="investigationChecklistArea" class="tool-result-area"><div class="empty">اختار نوع الواقعة علشان تظهر قائمة الاستيفاءات المقترحة.</div></div>`,"investigation-builder");
  }
  function renderInvestigationChecklist(id){
    const item=INVESTIGATION_TEMPLATES[id]; if(!item)return; const area=document.getElementById("investigationChecklistArea");
    area.innerHTML=`<section class="checklist-panel"><header><div><span>${item.icon}</span><h3>قائمة استيفاءات — ${escLocal(item.title)}</h3><p>راجع البنود، علّم على المنجز، وأضف أي نقاط خاصة بالملف.</p></div><b id="investigationScore">٠٪</b></header>
      <div class="checklist-items" id="investigationChecklistItems">${item.items.map((text,index)=>investigationChecklistRow(text,index)).join("")}</div>
      <div class="custom-checklist-add"><input id="customInvestigationItem" placeholder="أضف نقطة استيفاء خاصة بالملف"><button onclick="addCustomInvestigationItem()">+ إضافة</button></div>
      <div class="tool-actions"><button onclick="printToolArea('investigationChecklistArea','قائمة استيفاءات — ${escLocal(item.title)}')">🖨️ طباعة</button><button onclick="copyChecklistText('investigationChecklistArea')">📋 نسخ النص</button></div>
      <div id="investigationScoreLabel" class="tool-score-label">ابدأ تعليم عناصر الاستيفاء المنجزة.</div></section>`;
  }
  function investigationChecklistRow(text,index){ return `<label><input type="checkbox" data-investigation-check onchange="updateInvestigationScore()"><span><b>${Number(index)+1}</b>${escLocal(text)}</span></label>`; }
  function addCustomInvestigationItem(){ const input=document.getElementById("customInvestigationItem"); const value=input.value.trim();if(!value)return; const wrap=document.getElementById("investigationChecklistItems"); wrap.insertAdjacentHTML("beforeend",investigationChecklistRow(value,wrap.children.length)); input.value="";updateInvestigationScore(); }
  function updateInvestigationScore(){ const list=[...document.querySelectorAll("[data-investigation-check]")];const score=percent(list.filter(x=>x.checked).length,list.length); const scoreEl=document.getElementById("investigationScore");const label=document.getElementById("investigationScoreLabel");if(scoreEl)scoreEl.textContent=`${score}%`;if(label)label.textContent=scoreLabel(score); }

  function openJurisdictionNavigator(){
    showPage(`<div class="breadcrumb">أدوات التنفيذ / <b>مساعد مراجعة الاختصاص</b></div>
      <section class="tool-page-head"><div><h2>🧭 مساعد مراجعة الاختصاص</h2><p>الأداة ترتّب عناصر المراجعة وتعرض المسارات التي تحتاج فحصًا؛ لا تصدر حكمًا نهائيًا بالاختصاص.</p></div><button onclick="openToolsHub()">العودة للأدوات</button></section>
      <section class="jurisdiction-card"><div class="tool-form-grid jurisdiction-grid">${JURISDICTION_STEPS.map(step=>`<label><span>${escLocal(step.label)}</span><select id="jur-${step.id}">${step.options.map(option=>`<option>${escLocal(option)}</option>`).join("")}</select></label>`).join("")}</div>
      <label class="jurisdiction-notes"><span>ملاحظات إضافية عن الواقعة</span><textarea id="jur-notes" rows="4" placeholder="اكتب أي تفاصيل قد تؤثر في الاختصاص"></textarea></label>
      <div class="tool-actions"><button onclick="analyzeJurisdictionReview()">اعرض محاور المراجعة</button><button onclick="resetJurisdictionNavigator()">إعادة ضبط</button></div><div id="jurisdictionResult" class="jurisdiction-result"><p>أدخل البيانات ثم اضغط «اعرض محاور المراجعة».</p></div></section>
      <div class="tool-safety-note">⚠️ راجع قوانين الاختصاص والنصوص الخاصة وأثر الارتباط قبل اتخاذ أي قرار. الأداة لا تستبدل الفحص القانوني للملف.</div>`,"jurisdiction");
  }
  function analyzeJurisdictionReview(){
    const place=document.getElementById("jur-place").value, crime=document.getElementById("jur-crime").value, person=document.getElementById("jur-person").value, link=document.getElementById("jur-link").value, notes=document.getElementById("jur-notes").value.trim();
    const points=["ابدأ بتحديد النصوص التي تنظم الاختصاص النوعي والمكاني للواقعة.","راجع ما إذا كان هناك نص خاص يقدّم جهة أو محكمة بعينها."];
    if(place!=="داخل دائرة النيابة")points.push("المكان يحتاج فحصًا أدق: راجع موضع النشاط الإجرامي والنتيجة وأثر تعدد الدوائر.");
    if(crime.includes("اقتصادية"))points.push("راجع النصوص الخاصة بالجرائم الاقتصادية أو المالية ومدى اختصاص المحاكم أو النيابات المتخصصة.");
    if(crime.includes("إلكترونية"))points.push("راجع مكان ارتكاب السلوك الرقمي والنتيجة والاختصاص الخاص إن وجد.");
    if(crime.includes("عسكرية"))points.push("راجع صفة الأطراف وطبيعة الواقعة قبل استبعاد أو إثبات أي مسار اختصاص خاص.");
    if(person!=="لا توجد صفة خاصة ظاهرة")points.push(`صفة مؤثرة محتملة: «${person}». راجع النصوص الخاصة المرتبطة بها.`);
    if(link!=="لا")points.push("وجود ارتباط يقتضي فحص أثره على الاختصاص والإحالة، خصوصًا إذا كان قد لا يقبل التجزئة.");
    if(notes)points.push("راجع الملاحظات الإضافية المكتوبة واربط كل نقطة منها بالنص الخاص قبل اعتماد النتيجة.");
    document.getElementById("jurisdictionResult").innerHTML=`<span>محاور المراجعة المقترحة</span><ul>${points.map(p=>`<li>${escLocal(p)}</li>`).join("")}</ul><small>النتيجة تنظيمية ومساندة فقط، وليست تحديدًا نهائيًا للاختصاص.</small>`;
  }
  function resetJurisdictionNavigator(){ JURISDICTION_STEPS.forEach(step=>document.getElementById(`jur-${step.id}`).selectedIndex=0);document.getElementById("jur-notes").value="";document.getElementById("jurisdictionResult").innerHTML="<p>أدخل البيانات ثم اضغط «اعرض محاور المراجعة».</p>"; }

  function copyChecklistText(id){ const el=document.getElementById(id); if(!el)return; navigator.clipboard?.writeText(el.innerText).then(()=>toast("تم نسخ القائمة."),()=>toast("تعذر النسخ تلقائيًا. حدّد النص وانسخه يدويًا.")); }
  function printToolArea(id,title){ const el=document.getElementById(id);if(!el)return; const win=window.open("","_blank","width=900,height=800"); if(!win){toast("اسمح بفتح النوافذ المنبثقة للطباعة.");return;} win.document.write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>${escLocal(title)}</title><style>body{font-family:Arial,sans-serif;padding:28px;line-height:1.9;color:#111}h1{font-size:20px;border-bottom:2px solid #333;padding-bottom:8px}button,.tool-actions,.custom-checklist-add{display:none!important}label{display:block;margin:8px 0}input{margin-left:8px}.tool-warning-box{border:1px solid #999;padding:10px;margin-top:12px}</style></head><body><h1>${escLocal(title)}</h1>${el.innerHTML}<script>window.onload=()=>window.print()<\/script></body></html>`); win.document.close(); }

  window.openToolsHub=openToolsHub;
  window.openProceduralShield=openProceduralShield;
  window.renderProcedureChecklist=renderProcedureChecklist;
  window.updateProcedureScore=updateProcedureScore;
  window.openDeadlineCalculator=openDeadlineCalculator;
  window.refreshDeadlinePresetList=refreshDeadlinePresetList;
  window.applyDeadlinePreset=applyDeadlinePreset;
  window.calculateDeadline=calculateDeadline;
  window.calculateLegalDeadline=calculateLegalDeadline;
  window.resetDeadlineCalculator=resetDeadlineCalculator;
  window.openDeadlineHistory=openDeadlineHistory;
  window.saveLastDeadlineCalculation=saveLastDeadlineCalculation;
  window.removeDeadlineHistoryItem=removeDeadlineHistoryItem;
  window.clearDeadlineHistory=clearDeadlineHistory;
  window.copyDeadlineResult=copyDeadlineResult;
  window.askSandAboutDeadline=askSandAboutDeadline;
  window.openInvestigationChecklistBuilder=openInvestigationChecklistBuilder;
  window.renderInvestigationChecklist=renderInvestigationChecklist;
  window.addCustomInvestigationItem=addCustomInvestigationItem;
  window.updateInvestigationScore=updateInvestigationScore;
  window.openJurisdictionNavigator=openJurisdictionNavigator;
  window.analyzeJurisdictionReview=analyzeJurisdictionReview;
  window.resetJurisdictionNavigator=resetJurisdictionNavigator;
  window.copyChecklistText=copyChecklistText;
  window.printToolArea=printToolArea;
})();
