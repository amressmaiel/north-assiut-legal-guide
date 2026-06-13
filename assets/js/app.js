/* Main application views, unified search and navigation */
function setActiveNav(name){
  document.querySelectorAll(".nav-btn[data-nav]").forEach(btn=>btn.classList.toggle("active",btn.dataset.nav===name));
}
function page(content){
  closeMobileMenu();
  document.getElementById("appView").innerHTML = `<div class="page">${content}</div>`;
  window.scrollTo({top:0,behavior:"smooth"});
}
function updateLawAwareNavigation(){
  const law=activeLaw();
  const specialized=law && law.moduleType==="executive-law";
  document.querySelectorAll('[data-executive-only="true"]').forEach(btn=>btn.style.display=specialized?"":"none");
  const badge=document.getElementById("activeLawSidebarBadge");
  if(badge && law) badge.innerHTML=`<b>${esc(law.title)}</b><span>${esc(law.number||"")}</span>`;
}
function lawStatsMarkup(law,m){
  if(law && law.moduleType==="reference-law"){
    return `
      <div class="stat-card"><span>إجمالي السجلات القانونية</span><strong>${m.totalArticles||0}</strong></div>
      <div class="stat-card"><span>عدد الكتب</span><strong>${m.booksCount||0}</strong></div>
      <div class="stat-card"><span>عدد الأبواب</span><strong>${m.chaptersCount||0}</strong></div>
      <div class="stat-card"><span>بدء العمل بالقانون</span><strong style="font-size:16px">${esc(m.effectiveDate||"")}</strong></div>`;
  }
  return `
    <div class="stat-card"><span>إجمالي المواد المتاحة</span><strong>${m.totalArticles||0}</strong></div>
    <div class="stat-card"><span>المواد المعدلة أو المعاد تنظيمها</span><strong>${m.modifiedArticles||0}</strong></div>
    <div class="stat-card"><span>المواد المستحدثة بالكامل</span><strong>${m.introducedArticles||0}</strong></div>
    <div class="stat-card"><span>تاريخ بدء العمل بالقانون</span><strong style="font-size:18px">${esc(m.effectiveDate || "2026/10/01")}</strong></div>`;
}
function homePortalMarkup(law,m){
  if(law && law.moduleType==="reference-law"){
    return `
      ${portalCard("📚","جميع مواد قانون العقوبات",m.totalArticles||0,"استعراض النصوص الرسمية والشرح العملي والأمثلة والتنبيهات.","openArticleList('all')")}
      ${portalCard("🗂️","الأبواب والموضوعات",new Set(appData().map(a=>a.topic)).size,"انتقل للمواد من خلال الكتاب أو الباب أو الموضوع.","openTopics()")}
      ${portalCard("🔎","البحث الموحّد","ALL","ابحث في جميع القوانين المحملة من شاشة واحدة.","openUnifiedSearch()")}
      ${portalCard("🤖","اسأل سَنَد","AI","اطرح سؤالك وسَنَد يبحث في جميع القوانين المتاحة.","toggleChat(true)")}`;
  }
  return `
    ${portalCard("📚","جميع المواد",m.totalArticles||0,"استعراض كامل المواد المرتبة رقميًا مع البحث والتصفية.","openArticleList('all')")}
    ${portalCard("📝","المواد المعدلة",m.modifiedArticles||0,"المواد التي أعيد تنظيمها أو تطويرها مقارنة بالتنظيم السابق.","openArticleList('modified')")}
    ${portalCard("✨","المواد المستحدثة بالكامل",m.introducedArticles||0,"المسارات التشريعية الجديدة الواضحة داخل القانون الجديد.","openArticleList('introduced')")}
    ${portalCard("🔎","البحث الموحّد","ALL","ابحث في جميع القوانين المحملة من شاشة واحدة.","openUnifiedSearch()")}`;
}

function goHome(){
  state.view="home"; state.query=""; state.searchLawFilter="all";
  const search=document.getElementById("globalSearch"); if(search) search.value="";
  setActiveNav("home"); updateLawAwareNavigation();
  const m=meta(); const law=activeLaw();
  page(`
    <section class="hero">
      <div class="platform-title-band">
        <div class="platform-logo-shell" aria-label="شعار المنصة">
          <div class="platform-logo-orbit"></div>
          <img src="./assets/images/logo.png" alt="شعار المنصة القضائية الذكية" class="platform-main-logo" onerror="this.style.display='none'; this.parentElement.classList.add('logo-fallback');">
        </div>
        <div class="platform-title-copy">
          <span class="platform-title-kicker">المنصة القضائية الرقمية المتكاملة</span>
          <h2 class="platform-main-title">الدليل القضائي الذكي لأعضاء النيابة العامة</h2>
        </div>
      </div>
      <div class="hero-intro-stack">
        <div class="eyebrow hero-wide-band hero-purpose-band">⚖️ منصة قضائية رقمية متكاملة لدعم العمل القانوني والإجرائي لأعضاء النيابة العامة</div>
        <div class="hero-wide-band hero-summary-band">منظومة معرفية تنفيذية قابلة للتطوير المستمر، تجمع الأدلة القانونية والإجرائية في واجهة واحدة، وتسهّل الوصول إلى النصوص والتحليلات العملية والتصرفات الصحيحة والتنبيهات المهمة — مع مساعد قضائي ذكي يربط السؤال بالمعلومة الأقرب تلقائيًا.</div>
        <div class="active-law-strip"><div><span>القانون المعروض حاليًا</span><b>${esc(law.title)}</b><small>${esc(law.number||"")}</small></div><button onclick="openLawLibrary()">🏛️ تغيير القانون</button></div>
      </div>
      <div class="hero-grid">
        <div>
          <section class="leadership-panel" aria-label="بيانات التوجيه والإشراف والإعداد">
            <div class="leadership-heading">✦ التوجيه والإشراف والإعداد</div>
            <div class="leadership-grid">
              <div class="leadership-card supervision"><span class="leadership-label">بتوجيه وإشراف معالي السيد الأستاذ المستشار</span><strong class="leadership-name">أحمد فاروق المحامي العام لنيابة شمال أسيوط الكلية</strong><span class="leadership-sub">إشراف قضائي على إعداد الدليل التنفيذي والمنصة التفاعلية</span></div>
              <div class="leadership-card preparation"><span class="leadership-label">إعداد المحتوى القانوني والإشراف التنفيذي</span><strong class="leadership-name">أحمد علي عبد العال</strong><span class="leadership-sub">رئيس النيابة بنيابة شمال أسيوط الكلية</span></div>
              <div class="leadership-card development"><span class="leadership-label">تصميم وبرمجة وتطوير المنصة</span><strong class="leadership-name">عمرو إسماعيل</strong><span class="leadership-sub">منظومة رقمية تفاعلية لخدمة العمل القضائي</span></div>
            </div>
          </section>
          <div class="stats-grid stats-grid-under-leadership">${lawStatsMarkup(law,m)}</div>
        </div>
        <div class="sand-hero-zone" aria-label="سَنَد — المساعد القضائي الذكي">
          <div class="sand-energy-ring ring-one"></div><div class="sand-energy-ring ring-two"></div><div class="sand-ground-shadow"></div>
          <img src="./assets/images/avatar-3d.png" alt="صورة سَنَد — المساعد القضائي الذكي" class="sand-hero-avatar" onerror="this.style.display='none'; document.getElementById('sandHeroError').style.display='block';">
          <div id="sandHeroError" class="logo-error-note" style="display:none;">تعذر تحميل ملف avatar-3d.png</div>
          <div class="sand-hero-caption"><strong>أنا سَنَد</strong><span>المساعد القضائي الذكي — تحت أمرك في أي استفسار</span></div>
        </div>
      </div>
    </section>
    <div class="section-title"><div><h3>بوابات الانتقال السريع</h3><p>القانون الحالي: ${esc(law.title)} — ويمكن تغييره من مكتبة القوانين.</p></div></div>
    <div class="card-grid">${homePortalMarkup(law,m)}</div>
    <div class="section-title"><div><h3>سَنَد في صميم المنصة</h3><p>سَنَد يبحث تلقائيًا في جميع القوانين المحملة داخل المنصة، ويعرض المواد التي استند إليها مع كل إجابة.</p></div></div>
    <div class="ai-feature"><div><h4>🤖 سَنَد — مساعد قضائي تفاعلي داخل المكتبة القانونية</h4><p>يمكنك اختيار نمط الإجابة المناسب، وفتح المادة من داخل رد سَنَد، أو سؤال المساعد مباشرة عن المادة المفتوحة.</p></div><button class="ai-badge" onclick="toggleChat(true)">اسأل سَنَد الآن</button></div>
  `);
}

function portalCard(icon,title,count,desc,action){return `<article class="portal-card" onclick="${action}"><div class="icon">${icon}</div><b>${count}</b><h4>${title}</h4><p>${desc}</p></article>`;}

function openLawLibrary(){
  state.view="library"; setActiveNav("library"); updateLawAwareNavigation();
  const active=activeLaw();
  page(`<div class="breadcrumb">الرئيسية / <b>مكتبة القوانين</b></div><div class="library-head"><div><h2>مكتبة القوانين</h2><p>اختر القانون المطلوب تصفحه. يظل سَنَد قادرًا على البحث في كل القوانين المحملة داخل المنصة تلقائيًا.</p></div><span>${modules().length} قوانين متاحة</span></div><div class="law-library-grid">${modules().map(law=>lawLibraryCard(law,active&&active.id===law.id)).join("")}</div>`);
}
function lawLibraryCard(law,isActive){
  const m=law.meta||{};
  return `<article class="law-library-card ${isActive?"active":""}"><div class="law-library-icon">${law.icon||"⚖️"}</div><div class="law-library-content"><span class="law-status">${isActive?"القانون المعروض حاليًا":"متاح للتصفح"}</span><h3>${esc(law.title)}</h3><b>${esc(law.number||"")}</b><p>${esc(law.shortDescription||"")}</p><div class="law-library-meta"><span>${m.totalArticles||0} مادة أو سجل</span>${m.booksCount?`<span>${m.booksCount} كتب</span>`:""}${m.chaptersCount?`<span>${m.chaptersCount} أبواب</span>`:""}</div><button onclick="selectLaw('${law.id}')">${isActive?"فتح القانون":"اختيار وتصفح القانون"}</button></div></article>`;
}
function selectLaw(id){
  if(typeof window.setActiveLawModule==="function" && window.setActiveLawModule(id)){
    state.listType="all";state.topic="all";state.query="";state.searchLawFilter="all";state.selectedArticleId=null;state.visibleFields=new Set(fields().map(f=>f.key));
    updateLawAwareNavigation();goHome();
  }
}

function normalizeAppSearch(value){
  return String(value??"").toLowerCase().replace(/[أإآ]/g,"ا").replace(/ة/g,"ه").replace(/ى/g,"ي").replace(/[ًٌٍَُِّْـ]/g,"").replace(/\s+/g," ").trim();
}
function articleSearchHaystack(article){
  return normalizeAppSearch([article.lawName,article.lawNumber,article.articleNumber,article.shortTitle,article.topic,article.officialText,article.practicalExplanation,article.executivePoints,article.hypotheticalExamples,article.correctAction,article.commonErrors,article.searchText,(article.keywords||[]).join(" ")].join(" "));
}
function findModuleForArticle(article){
  return modules().find(module=>(module.articles||[]).some(item=>item.id===article.id))||null;
}
function activateModuleForArticle(article){
  const module=findModuleForArticle(article);
  if(module && typeof window.setActiveLawModule==="function" && module.id!==window.ACTIVE_LAW_ID){
    window.setActiveLawModule(module.id); state.visibleFields=new Set(fields().map(f=>f.key)); updateLawAwareNavigation();
  }
  return module;
}
function filterArticles(){
  const query=normalizeAppSearch(state.query);
  return appData().filter(article=>{
    const classOk=state.listType==="all"||article.classification===state.listType;
    const topicOk=state.topic==="all"||article.topic===state.topic;
    return classOk&&topicOk&&(!query||articleSearchHaystack(article).includes(query));
  });
}
function openArticleList(type="all",topic="all"){state.view="list";state.listType=type;state.topic=topic;setActiveNav(type==="all"?"all":type);updateLawAwareNavigation();renderArticleList();}
function renderArticleList(){
  const items=filterArticles(); const topics=[...new Set(appData().map(a=>a.topic))]; const law=activeLaw();
  page(`<div class="list-head"><div><div class="breadcrumb">الرئيسية / ${esc(law.title)} / <b>${esc(labels[state.listType]||"المواد")}</b></div><h2>${esc(labels[state.listType]||"المواد")}</h2><p class="list-law-name">${esc(law.title)} — ${esc(law.number||"")}</p></div><div class="filter-row"><button class="chip ${state.topic==="all"?"active":""}" onclick="state.topic='all';renderArticleList()">الكل</button>${topics.map(topic=>`<button class="chip ${state.topic===topic?"active":""}" onclick="state.topic=decodeURIComponent('${encodeURIComponent(topic)}');renderArticleList()">${esc(topic)}</button>`).join("")}</div></div>${items.length?`<div class="article-grid">${items.map(articleCard).join("")}</div>`:`<div class="empty">لا توجد مواد مطابقة للبحث أو التصفية الحالية.</div>`}`);
}
function articleCard(article){
  const favorite=window.JudicialWorkspace&&JudicialWorkspace.isFavorite(article.id);
  const compared=window.JudicialWorkspace&&JudicialWorkspace.isCompared(article.id);
  return `<article class="article-card" onclick="openArticleAcrossLaws('${article.id}')"><div class="article-card-actions"><button class="mini-action ${favorite?"active":""}" title="${favorite?"إزالة من المفضلة":"حفظ في المفضلة"}" onclick="event.stopPropagation();toggleArticleFavorite('${article.id}')">${favorite?"★":"☆"}</button><button class="mini-action ${compared?"active":""}" title="إضافة للمقارنة" onclick="event.stopPropagation();addArticleToCompare('${article.id}')">⚖️</button></div><div class="article-number"><strong>${esc(article.articleNumber)}</strong><span class="tag ${article.classification}">${esc(article.classificationLabel)}</span></div><h4>${esc(article.shortTitle)}</h4><p>${esc(article.topic)}</p></article>`;
}
function openArticleAcrossLaws(id){
  const article=allAppData().find(item=>item.id===id); if(!article)return;
  activateModuleForArticle(article); openArticle(id);
}
window.openArticleAcrossLaws=openArticleAcrossLaws;
function openArticle(id){
  const article=appData().find(item=>item.id===id)||allAppData().find(item=>item.id===id); if(!article)return;
  activateModuleForArticle(article);
  state.view="article";state.selectedArticleId=id;setActiveNav(article.classification); if(window.JudicialWorkspace)JudicialWorkspace.rememberRecentArticle(id); const visible=fields().filter(field=>state.visibleFields.has(field.key));
  const favorite=window.JudicialWorkspace&&JudicialWorkspace.isFavorite(article.id); const compared=window.JudicialWorkspace&&JudicialWorkspace.isCompared(article.id);
  page(`<div class="breadcrumb">الرئيسية / ${esc(article.lawName||activeLaw().title)} / <b>${esc(article.articleNumber)}</b></div><section class="detail-hero"><div class="detail-hero-heading"><span class="tag ${article.classification}">${esc(article.classificationLabel)}</span><div class="detail-primary-actions"><button class="detail-action-btn ${favorite?"active":""}" onclick="toggleArticleFavorite('${article.id}')">${favorite?"★ محفوظة":"☆ حفظ بالمفضلة"}</button><button class="detail-action-btn ${compared?"active":""}" onclick="addArticleToCompare('${article.id}')">⚖️ ${compared?"ضمن المقارنة":"إضافة للمقارنة"}</button><button class="detail-action-btn" onclick="toggleFocusMode(true)">◉ وضع القراءة المركزة</button><button class="ask-sand-article-btn" onclick="askSandAboutArticle('${article.id}')">🤖 اسأل سَنَد عن هذه المادة</button></div></div><h2>${esc(article.articleNumber)} — ${esc(article.shortTitle)}</h2><p>${esc(article.lawName||activeLaw().title)} • ${esc(article.topic)} • ${esc(article.sourceBatch||"")}</p></section><div class="focus-mode-exit"><button onclick="toggleFocusMode(false)">✕ الخروج من وضع التركيز</button></div><div class="detail-tools"><button class="toggle-btn" onclick="setAllSections(true)">إظهار الكل</button><button class="toggle-btn" onclick="setAllSections(false)">إخفاء الكل</button>${fields().map(field=>`<button class="toggle-btn ${state.visibleFields.has(field.key)?"on":""}" onclick="toggleField('${field.key}')">${field.icon} ${esc(field.label)}</button>`).join("")}</div><div id="detailSections">${visible.map(field=>detailSection(article,field)).join("")||`<div class="empty">تم إخفاء جميع الأقسام. استخدم أزرار العرض لإظهار البيان المطلوب.</div>`}</div><section class="detail-section notes-box"><h4>📝 ملاحظات عضو النيابة</h4><textarea id="articleNotes" placeholder="اكتب ملاحظاتك الخاصة على المادة..." oninput="saveArticleNote('${article.id}',this.value)">${esc(localStorage.getItem("article_note_"+article.id)||"")}</textarea></section>`);
}
function detailSection(article,field){return `<section class="detail-section ${field.tone}"><h4>${field.icon} ${esc(field.label)}</h4><p>${nl(article[field.key]||"لا توجد بيانات مسجلة.")}</p></section>`;}
function toggleField(key){state.visibleFields.has(key)?state.visibleFields.delete(key):state.visibleFields.add(key);openArticle(state.selectedArticleId)}
function setAllSections(show){state.visibleFields=new Set(show?fields().map(f=>f.key):[]);openArticle(state.selectedArticleId)}
function saveArticleNote(id,value){localStorage.setItem("article_note_"+id,value)}
function openTopics(){state.view="topics";setActiveNav("topics");updateLawAwareNavigation();const law=activeLaw();const grouped=[...new Set(appData().map(a=>a.topic))].map(topic=>({topic,count:appData().filter(a=>a.topic===topic).length}));page(`<div class="breadcrumb">الرئيسية / ${esc(law.title)} / <b>المحاور الموضوعية</b></div><h2>المحاور الموضوعية</h2><p class="list-law-name">${esc(law.title)} — ${esc(law.number||"")}</p><div class="topics-grid">${grouped.map(item=>`<article class="topic-card portal-card" onclick="openArticleList('all',decodeURIComponent('${encodeURIComponent(item.topic)}'))"><strong>${esc(item.topic)}</strong><span>${item.count} مادة</span></article>`).join("")}</div>`);}
function openGuide(){state.view="guide";setActiveNav("guide");const guide=Array.isArray(activeLaw().guide)?activeLaw().guide:[];page(`<div class="breadcrumb">الرئيسية / <b>الدليل الإجرائي المختصر</b></div><h2>المحاور الإجرائية المختصرة</h2>${guide.length?`<div class="guide-grid">${guide.map(item=>`<article class="topic-card"><strong>${esc(item.title)}</strong><span>${esc(item.chapter)}</span><p style="font-size:12px;line-height:1.8;color:#c7d2df">${esc(item.analysis)}</p></article>`).join("")}</div>`:`<div class="empty">لا توجد محاور إجرائية مختصرة مستقلة لهذا القانون حاليًا. استخدم تصفح المواد أو المحاور الموضوعية.</div>`}`);}

/* Unified search across all loaded laws */
function unifiedSearchResults(query=state.query){
  const normalized=normalizeAppSearch(query); if(normalized.length<2)return [];
  const tokens=normalized.split(" ").filter(Boolean);
  return allAppData().filter(article=>{
    const module=findModuleForArticle(article);
    const lawOk=state.searchLawFilter==="all"||(module&&module.id===state.searchLawFilter);
    const haystack=articleSearchHaystack(article);
    return lawOk&&tokens.every(token=>haystack.includes(token));
  });
}
function openUnifiedSearch(query=""){
  state.view="unified-search";state.query=String(query||state.query||"");state.searchLawFilter=state.searchLawFilter||"all";setActiveNav("search");
  const input=document.getElementById("globalSearch");if(input)input.value=state.query;
  renderUnifiedSearch();
}
window.openUnifiedSearch=openUnifiedSearch;
function setUnifiedLawFilter(id){state.searchLawFilter=id;renderUnifiedSearch();}
function unifiedResultCard(article){
  const module=findModuleForArticle(article);
  return `<article class="unified-result-card"><div class="unified-result-law"><span>${module?module.icon:"⚖️"}</span><b>${esc(module?module.title:(article.lawName||"قانون"))}</b><small>${esc(module?module.number:(article.lawNumber||""))}</small></div><div class="unified-result-body"><div class="article-number"><strong>${esc(article.articleNumber)}</strong><span class="tag ${article.classification}">${esc(article.classificationLabel)}</span></div><h4>${esc(article.shortTitle)}</h4><p>${esc(article.topic||"")}</p><button onclick="openArticleAcrossLaws('${article.id}')">فتح المادة</button></div></article>`;
}
function renderUnifiedSearch(){
  const query=state.query.trim();const results=unifiedSearchResults(query);
  const grouped=modules().map(module=>({module,items:results.filter(article=>(module.articles||[]).some(item=>item.id===article.id))})).filter(group=>group.items.length);
  page(`<div class="breadcrumb">الرئيسية / <b>البحث الموحّد</b></div><section class="unified-search-head"><div><h2>🔎 البحث الموحّد في مكتبة القوانين</h2><p>ابحث برقم المادة أو عنوانها أو كلمات من مضمونها، واعرض النتائج مجمعة حسب القانون.</p></div><span>${results.length} نتيجة</span></section><div class="unified-filter-row"><button class="chip ${state.searchLawFilter==="all"?"active":""}" onclick="setUnifiedLawFilter('all')">كل القوانين</button>${modules().map(module=>`<button class="chip ${state.searchLawFilter===module.id?"active":""}" onclick="setUnifiedLawFilter('${module.id}')">${module.icon||"⚖️"} ${esc(module.title)}</button>`).join("")}</div>${query.length<2?`<div class="empty">اكتب كلمتين على الأقل في شريط البحث أعلى الشاشة.</div>`:grouped.length?grouped.map(group=>`<section class="unified-law-group"><div class="unified-law-title"><div><span>${group.module.icon||"⚖️"}</span><h3>${esc(group.module.title)}</h3><small>${esc(group.module.number||"")}</small></div><b>${group.items.length} نتيجة</b></div><div class="unified-results-grid">${group.items.slice(0,120).map(unifiedResultCard).join("")}</div></section>`).join(""):`<div class="empty">لا توجد نتائج مطابقة في القوانين المحملة حاليًا.</div>`}`);
}
function handleGlobalSearch(value){state.query=value;state.searchLawFilter=state.searchLawFilter||"all";if(value.trim().length<2){if(state.view==="unified-search")renderUnifiedSearch();return;}openUnifiedSearch(value);}


/* =========================================================
   المرحلة الثانية — مساحة العمل الشخصية
   ========================================================= */
function workspace(){return window.JudicialWorkspace||null;}
function findArticleById(id){return allAppData().find(article=>article.id===id)||null;}
function formatOpenedAt(value){try{return new Date(value).toLocaleString("ar-EG",{dateStyle:"short",timeStyle:"short"});}catch{return "";}}
function toast(message){
  let el=document.getElementById("judicialToast");
  if(!el){el=document.createElement("div");el.id="judicialToast";el.className="judicial-toast";document.body.appendChild(el);}
  el.textContent=message;el.classList.add("show");clearTimeout(window.__judicialToastTimer);window.__judicialToastTimer=setTimeout(()=>el.classList.remove("show"),2600);
}
function toggleArticleFavorite(id){
  const ws=workspace();if(!ws)return;const isNowFavorite=ws.toggleFavorite(id);toast(isNowFavorite?"تم حفظ المادة في المفضلة العامة.":"تمت إزالة المادة من المفضلة.");
  if(state.view==="article")openArticle(id); else if(state.view==="favorites")renderFavoritesCenter(); else if(state.view==="list")renderArticleList(); else if(state.view==="unified-search")renderUnifiedSearch();
}
function askFavoriteCollection(id){
  const ws=workspace();if(!ws)return;const collections=ws.getCollections();
  const menu=collections.map((item,index)=>`${index+1}. ${item.name}`).join("\n");
  const answer=prompt(`اختار رقم المجموعة لحفظ المادة فيها:\n${menu}\n\nأو اكتب اسم مجموعة جديدة.`);
  if(!answer)return;
  const number=Number(answer);let collection=Number.isInteger(number)&&collections[number-1]?collections[number-1]:ws.createCollection(answer);
  if(!collection)return;ws.addFavorite(id,collection.id);toast(`تم حفظ المادة داخل مجموعة: ${collection.name}`);
  if(state.view==="article")openArticle(id);else if(state.view==="favorites")renderFavoritesCenter();
}
function addArticleToCompare(id){
  const ws=workspace();if(!ws)return;const result=ws.addToCompare(id);toast(result.message);
  if(state.view==="article")openArticle(id);else if(state.view==="compare")renderCompareCenter();else if(state.view==="list")renderArticleList();else if(state.view==="unified-search")renderUnifiedSearch();
}
function removeArticleFromCompare(id){const ws=workspace();if(!ws)return;ws.removeFromCompare(id);toast("تم حذف المادة من المقارنة.");renderCompareCenter();}
function clearArticleComparison(){const ws=workspace();if(!ws)return;ws.clearCompare();toast("تم تفريغ المقارنة.");renderCompareCenter();}
function toggleFocusMode(force){
  const enabled=typeof force==="boolean"?force:!document.body.classList.contains("focus-reading-mode");
  document.body.classList.toggle("focus-reading-mode",enabled);
  if(enabled)toast("تم تشغيل وضع القراءة المركزة.");
}
function createWorkspaceCollection(){const ws=workspace();if(!ws)return;const name=prompt("اكتب اسم المجموعة الجديدة:");if(!name)return;const item=ws.createCollection(name);if(item){toast(`تم إنشاء مجموعة: ${item.name}`);renderFavoritesCenter();}}
function renameWorkspaceCollection(id){const ws=workspace();if(!ws)return;const item=ws.getCollections().find(c=>c.id===id);if(!item)return;const name=prompt("اكتب الاسم الجديد للمجموعة:",item.name);if(ws.renameCollection(id,name)){toast("تم تعديل اسم المجموعة.");renderFavoritesCenter();}}
function deleteWorkspaceCollection(id){const ws=workspace();if(!ws||id==="general")return;if(confirm("حذف المجموعة؟ سيتم نقل المواد الموجودة فيها إلى المفضلة العامة.")){ws.deleteCollection(id);toast("تم حذف المجموعة ونقل المواد إلى المفضلة العامة.");renderFavoritesCenter();}}
function workspaceArticleCard(article,extra=""){
  if(!article)return "";const module=findModuleForArticle(article);const favorite=workspace()&&workspace().isFavorite(article.id);const compared=workspace()&&workspace().isCompared(article.id);
  return `<article class="workspace-article-card"><div class="workspace-card-top"><div><span>${module?module.icon:"⚖️"} ${esc(module?module.title:(article.lawName||"قانون"))}</span><strong>${esc(article.articleNumber)}</strong></div><div class="workspace-card-actions"><button title="فتح المادة" onclick="openArticleAcrossLaws('${article.id}')">فتح</button><button title="${favorite?"إزالة من المفضلة":"حفظ بالمفضلة"}" onclick="toggleArticleFavorite('${article.id}')">${favorite?"★":"☆"}</button><button title="إضافة للمقارنة" class="${compared?"active":""}" onclick="addArticleToCompare('${article.id}')">⚖️</button></div></div><h4>${esc(article.shortTitle)}</h4><p>${esc(article.topic||"")}</p>${extra}</article>`;
}
function openFavoritesCenter(){state.view="favorites";setActiveNav("favorites");renderFavoritesCenter();}
function renderFavoritesCenter(){
  const ws=workspace();if(!ws)return;const collections=ws.getCollections();const selected=state.favoriteCollection||"all";const items=ws.getFavorites(selected);
  page(`<div class="breadcrumb">الرئيسية / <b>المفضلة والمجموعات</b></div><section class="workspace-head"><div><h2>⭐ المفضلة والمجموعات الشخصية</h2><p>احتفظ بالمواد المهمة ورتبها في مجموعات خاصة محفوظة على جهازك الحالي.</p></div><button onclick="createWorkspaceCollection()">+ مجموعة جديدة</button></section><div class="collection-tabs"><button class="chip ${selected==="all"?"active":""}" onclick="state.favoriteCollection='all';renderFavoritesCenter()">كل المفضلة</button>${collections.map(item=>`<button class="chip ${selected===item.id?"active":""}" onclick="state.favoriteCollection='${item.id}';renderFavoritesCenter()">${esc(item.name)}</button>`).join("")}</div><div class="collections-manage">${collections.filter(item=>item.id!=="general").map(item=>`<span><b>${esc(item.name)}</b><button onclick="renameWorkspaceCollection('${item.id}')">✎</button><button onclick="deleteWorkspaceCollection('${item.id}')">✕</button></span>`).join("")}</div>${items.length?`<div class="workspace-grid">${items.map(item=>workspaceArticleCard(item.article,`<button class="save-to-collection" onclick="askFavoriteCollection('${item.article.id}')">📁 نقل إلى مجموعة</button>`)).join("")}</div>`:`<div class="empty">لسه ما حفظتش مواد في القسم ده. افتح أي مادة واضغط «حفظ بالمفضلة».</div>`}`);
}
function openRecentArticles(){state.view="recent";setActiveNav("recent");renderRecentArticles();}
function renderRecentArticles(){
  const ws=workspace();if(!ws)return;const items=ws.getRecentArticles(18);
  page(`<div class="breadcrumb">الرئيسية / <b>آخر المواد المفتوحة</b></div><section class="workspace-head"><div><h2>🕘 آخر المواد المفتوحة</h2><p>ارجع بسرعة للمواد اللي راجعتها مؤخرًا على الجهاز الحالي.</p></div>${items.length?`<button onclick="if(confirm('مسح السجل؟')){JudicialWorkspace.clearRecentArticles();renderRecentArticles()}">مسح السجل</button>`:""}</section>${items.length?`<div class="workspace-grid">${items.map(item=>workspaceArticleCard(item.article,`<small class="opened-at">آخر فتح: ${esc(formatOpenedAt(item.openedAt))}</small>`)).join("")}</div>`:`<div class="empty">لسه مفيش مواد مفتوحة مؤخرًا.</div>`}`);
}
function openCompareCenter(){state.view="compare";setActiveNav("compare");renderCompareCenter();}
function compareFieldMarkup(field,article){return `<section class="compare-field ${field.tone||""}"><h4>${field.icon||"📄"} ${esc(field.label)}</h4><p>${nl(article[field.key]||"لا توجد بيانات مسجلة.")}</p></section>`;}
function compareColumn(article){const module=findModuleForArticle(article);return `<article class="compare-column"><header><span>${module?module.icon:"⚖️"} ${esc(module?module.title:(article.lawName||"قانون"))}</span><h3>${esc(article.articleNumber)} — ${esc(article.shortTitle)}</h3><p>${esc(article.topic||"")}</p><div><button onclick="openArticleAcrossLaws('${article.id}')">فتح المادة</button><button onclick="removeArticleFromCompare('${article.id}')">حذف من المقارنة</button></div></header>${fieldsForArticle(article).map(field=>compareFieldMarkup(field,article)).join("")}</article>`;}
function fieldsForArticle(article){const module=findModuleForArticle(article);return module&&Array.isArray(module.fields)?module.fields:fields();}
function renderCompareCenter(){
  const ws=workspace();if(!ws)return;const selected=ws.getCompareArticles();
  page(`<div class="breadcrumb">الرئيسية / <b>مقارنة المواد</b></div><section class="workspace-head"><div><h2>⚖️ مقارنة مادتين جنب بعض</h2><p>اختار مادتين من أي قانونين علشان تقارن النصوص والشروح والتنبيهات بصورة عملية.</p></div>${selected.length?`<button onclick="clearArticleComparison()">تفريغ المقارنة</button>`:""}</section><div class="compare-selection">${selected.length?selected.map(article=>`<span>${esc(article.articleNumber)} — ${esc(article.shortTitle)} <button onclick="removeArticleFromCompare('${article.id}')">✕</button></span>`).join(""):"<p>لم يتم اختيار أي مادة حتى الآن.</p>"}</div>${selected.length===2?`<div class="compare-grid">${selected.map(compareColumn).join("")}</div>`:`<div class="empty">اختر ${selected.length?"مادة ثانية":"مادتين"} من بطاقات المواد أو من صفحة تفاصيل المادة، ثم ارجع إلى شاشة المقارنة.</div><div class="compare-helper-actions"><button onclick="openUnifiedSearch()">🔎 افتح البحث الموحّد</button><button onclick="openArticleList('all')">📚 تصفح مواد القانون الحالي</button></div>`}`);
}
