/* =========================================================
   Phase 5.19 — Legal Content Management Center
   إدارة المحتوى القانوني من داخل المنصة
   ========================================================= */
(function(){
  'use strict';
  const STORAGE_KEY = 'sand_legal_content_center_v5_19';
  const AUDIT_KEY = 'sand_legal_content_audit_v5_19';
  const SETTINGS_KEY = 'sand_legal_content_settings_v5_19';

  const state = {
    filter: 'all',
    type: 'all',
    query: '',
    selectedLawId: null,
    selectedArticleId: null,
    tab: 'laws'
  };

  const defaultSettings = {
    requireReviewBeforePublish: true,
    allowLocalContentInSearch: true,
    autoBackup: true,
    syncMode: 'local-first',
    workerUrl: ''
  };

  function uid(prefix='lc'){
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,9)}`;
  }
  function now(){ return new Date().toISOString(); }
  function safe(v){ return (v || '').toString(); }
  function escapeHtml(v){
    return safe(v).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  }
  function currentUser(){
    try{
      if(window.SandAuth && typeof SandAuth.getCurrentUser === 'function') return SandAuth.getCurrentUser() || null;
      const raw = localStorage.getItem('sand_auth_session') || localStorage.getItem('sand_current_user');
      return raw ? JSON.parse(raw) : null;
    }catch(e){ return null; }
  }
  function isAdmin(){
    try{
      if(window.AccessControlGuard && typeof AccessControlGuard.hasAnyRole === 'function'){
        return AccessControlGuard.hasAnyRole(['owner','system_owner','admin','content_admin','manager']);
      }
    }catch(e){}
    const u = currentUser();
    const role = safe(u && (u.role || u.userRole || u.accountRole)).toLowerCase();
    return ['owner','system_owner','admin','content_admin','manager'].some(r => role.includes(r));
  }
  function canManage(){ return isAdmin(); }

  function baseData(){
    const modules = Array.isArray(window.LAW_MODULES) ? window.LAW_MODULES : [];
    return modules.map(mod => ({
      id: mod.id,
      title: mod.title || mod.name || 'قانون بدون اسم',
      number: mod.number || '',
      year: (mod.number || '').match(/\d{4}/)?.[0] || '',
      category: mod.moduleType || 'law',
      description: mod.shortDescription || '',
      status: 'published',
      source: 'system',
      createdAt: now(),
      updatedAt: now(),
      articles: (mod.articles || []).slice(0, 99999).map((a, idx) => normalizeArticle(a, mod, idx))
    }));
  }
  function normalizeArticle(a, mod, idx){
    return {
      id: a.id || `${mod.id || 'law'}_${a.articleNumber || a.number || idx}`,
      lawId: mod.id,
      number: a.articleNumber || a.number || a.article_no || `${idx+1}`,
      title: a.shortTitle || a.title || a.topic || `المادة ${a.articleNumber || idx+1}`,
      officialText: a.officialText || a.text || a.articleText || '',
      practicalExplanation: a.practicalExplanation || a.explanation || a.summary || '',
      prosecutionPoints: Array.isArray(a.executivePoints) ? a.executivePoints.join('\n') : (a.executivePoints || a.prosecutionPoints || ''),
      examples: Array.isArray(a.hypotheticalExamples) ? a.hypotheticalExamples.join('\n') : (a.hypotheticalExamples || a.examples || ''),
      commonErrors: Array.isArray(a.commonErrors) ? a.commonErrors.join('\n') : (a.commonErrors || ''),
      keywords: Array.isArray(a.keywords) ? a.keywords.join(', ') : (a.keywords || a.topic || ''),
      linkedArticles: Array.isArray(a.linkedArticles) ? a.linkedArticles.join(', ') : (a.linkedArticles || ''),
      status: 'published',
      source: 'system',
      createdAt: now(),
      updatedAt: now()
    };
  }
  function loadStore(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(raw) return JSON.parse(raw);
    }catch(e){}
    const data = { version:'5.19', laws: [], drafts: [], reviews: [], templates: [], keywords: [], updatedAt: now() };
    saveStore(data);
    return data;
  }
  function saveStore(data){
    data.updatedAt = now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    refreshLawModulesOverlay(data);
  }
  function loadSettings(){
    try{ return { ...defaultSettings, ...(JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'))}; }catch(e){ return { ...defaultSettings }; }
  }
  function saveSettings(settings){ localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }
  function audit(action, details){
    const u = currentUser();
    const item = { id: uid('audit'), action, details, user: u?.name || u?.displayName || u?.email || 'local-user', at: now() };
    const list = JSON.parse(localStorage.getItem(AUDIT_KEY) || '[]');
    list.unshift(item);
    localStorage.setItem(AUDIT_KEY, JSON.stringify(list.slice(0, 500)));
    try{
      if(window.NotificationsCenter && typeof NotificationsCenter.addNotification === 'function'){
        NotificationsCenter.addNotification({ title:'تحديث في المحتوى القانوني', message: details || action, category:'content', priority:'normal', action:'openLegalContentManager' });
      }
    }catch(e){}
  }
  function allLaws(){
    const store = loadStore();
    const system = baseData();
    const local = store.laws || [];
    const map = new Map();
    system.forEach(l => map.set(l.id, l));
    local.forEach(l => map.set(l.id, { ...map.get(l.id), ...l, articles: l.articles || (map.get(l.id)?.articles || []) }));
    return Array.from(map.values());
  }
  function getLaw(id){ return allLaws().find(l => l.id === id); }
  function refreshLawModulesOverlay(store){
    const settings = loadSettings();
    if(!settings.allowLocalContentInSearch) return;
    const local = (store?.laws || []).filter(l => l.status === 'published');
    if(!local.length) return;
    window.SAND_LOCAL_CONTENT_LAWS = local;
  }

  function setMain(html){
    const main = document.getElementById('mainContent') || document.querySelector('main') || document.querySelector('.content') || document.body;
    main.innerHTML = html;
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.nav === 'legal-content-manager'));
    window.scrollTo({top:0, behavior:'smooth'});
  }
  function pill(status){
    const map = {draft:'مسودة', review:'قيد المراجعة', published:'منشور', archived:'مؤرشف'};
    return `<span class="lcm-pill lcm-${status}">${map[status] || status || 'غير محدد'}</span>`;
  }
  function statusOptions(selected='draft'){
    return ['draft','review','published','archived'].map(v => `<option value="${v}" ${v===selected?'selected':''}>${{draft:'مسودة',review:'قيد المراجعة',published:'منشور',archived:'مؤرشف'}[v]}</option>`).join('');
  }

  function openLegalContentManager(){
    if(!canManage()){
      setMain(`<section class="lcm-page"><div class="lcm-hero"><h2>🧩 مركز إدارة المحتوى القانوني</h2><p>هذه الشاشة مخصصة لأصحاب صلاحيات إدارة ومراجعة ونشر المحتوى القانوني.</p><button class="lcm-btn" onclick="goHome && goHome()">العودة لمركز القيادة</button></div></section>`);
      return;
    }
    renderHome();
  }

  function renderHome(){
    const laws = allLaws();
    const store = loadStore();
    const auditList = JSON.parse(localStorage.getItem(AUDIT_KEY) || '[]');
    const stats = {
      laws: laws.length,
      articles: laws.reduce((s,l)=>s+(l.articles?.length||0),0),
      drafts: laws.reduce((s,l)=>s+(l.articles||[]).filter(a=>a.status==='draft').length,0) + laws.filter(l=>l.status==='draft').length,
      review: laws.reduce((s,l)=>s+(l.articles||[]).filter(a=>a.status==='review').length,0) + laws.filter(l=>l.status==='review').length,
    };
    setMain(`
      <section class="lcm-page">
        <div class="lcm-hero">
          <div>
            <span class="lcm-kicker">المرحلة 5.19</span>
            <h2>مركز إدارة المحتوى القانوني</h2>
            <p>إضافة وتعديل ومراجعة ونشر القوانين والمواد والشروح والتعليمات والنماذج من داخل المنصة، مع سجل تدقيق وحالات نشر مؤسسية.</p>
          </div>
          <div class="lcm-hero-actions">
            <button class="lcm-btn primary" onclick="LegalContentManager.openLawForm()">➕ إضافة قانون</button>
            <button class="lcm-btn" onclick="LegalContentManager.openArticleForm()">➕ إضافة مادة</button>
            <button class="lcm-btn" onclick="LegalContentManager.openImportExport()">📦 استيراد / تصدير</button>
          </div>
        </div>
        <div class="lcm-stats">
          <div><b>${stats.laws}</b><span>قوانين</span></div>
          <div><b>${stats.articles}</b><span>مواد</span></div>
          <div><b>${stats.drafts}</b><span>مسودات</span></div>
          <div><b>${stats.review}</b><span>قيد المراجعة</span></div>
        </div>
        <div class="lcm-tabs">
          <button class="active" onclick="LegalContentManager.renderHome()">القوانين والمواد</button>
          <button onclick="LegalContentManager.renderReviewQueue()">طابور المراجعة</button>
          <button onclick="LegalContentManager.renderTemplates()">النماذج والكلمات المفتاحية</button>
          <button onclick="LegalContentManager.renderAudit()">سجل التدقيق</button>
          <button onclick="LegalContentManager.renderSettings()">الإعدادات والربط</button>
        </div>
        <div class="lcm-toolbar">
          <input id="lcmSearch" placeholder="ابحث باسم القانون أو رقم المادة أو كلمة مفتاحية..." value="${escapeHtml(state.query)}" oninput="LegalContentManager.setQuery(this.value)">
          <select id="lcmStatus" onchange="LegalContentManager.setFilter(this.value)">
            <option value="all" ${state.filter==='all'?'selected':''}>كل الحالات</option>
            <option value="draft" ${state.filter==='draft'?'selected':''}>مسودة</option>
            <option value="review" ${state.filter==='review'?'selected':''}>قيد المراجعة</option>
            <option value="published" ${state.filter==='published'?'selected':''}>منشور</option>
            <option value="archived" ${state.filter==='archived'?'selected':''}>مؤرشف</option>
          </select>
        </div>
        <div class="lcm-grid">
          <div class="lcm-panel laws-panel">
            <div class="lcm-panel-head"><h3>القوانين</h3><small>${laws.length} سجل</small></div>
            <div class="lcm-list">${laws.map(renderLawCard).join('') || '<p class="lcm-empty">لا توجد قوانين.</p>'}</div>
          </div>
          <div class="lcm-panel articles-panel" id="lcmArticlesPanel">${renderArticlesPanel()}</div>
        </div>
        <div class="lcm-panel lcm-wide"><div class="lcm-panel-head"><h3>آخر عمليات الإدارة</h3></div>${auditList.slice(0,6).map(a=>`<div class="lcm-audit"><b>${escapeHtml(a.action)}</b><span>${escapeHtml(a.details)}</span><small>${new Date(a.at).toLocaleString('ar-EG')}</small></div>`).join('') || '<p class="lcm-empty">لا توجد عمليات بعد.</p>'}</div>
      </section>`);
  }

  function renderLawCard(law){
    const q = state.query.trim();
    const match = !q || [law.title, law.number, law.description, law.category].join(' ').includes(q) || (law.articles||[]).some(a => [a.number,a.title,a.officialText,a.keywords].join(' ').includes(q));
    const statusMatch = state.filter === 'all' || law.status === state.filter || (law.articles||[]).some(a => a.status === state.filter);
    if(!match || !statusMatch) return '';
    const selected = state.selectedLawId === law.id;
    return `<article class="lcm-law-card ${selected?'selected':''}" onclick="LegalContentManager.selectLaw('${law.id}')">
      <div><h4>${escapeHtml(law.title)}</h4><p>${escapeHtml(law.number || law.category || '')}</p></div>
      <div class="lcm-law-meta">${pill(law.status)}<span>${law.articles?.length || 0} مادة</span></div>
      <div class="lcm-card-actions" onclick="event.stopPropagation()">
        <button onclick="LegalContentManager.openLawForm('${law.id}')">تعديل</button>
        <button onclick="LegalContentManager.duplicateLaw('${law.id}')">نسخ</button>
      </div>
    </article>`;
  }
  function renderArticlesPanel(){
    const law = state.selectedLawId ? getLaw(state.selectedLawId) : allLaws()[0];
    if(!state.selectedLawId && law) state.selectedLawId = law.id;
    if(!law) return '<p class="lcm-empty">اختر قانونًا لعرض مواده.</p>';
    const q = state.query.trim();
    const articles = (law.articles || []).filter(a => {
      const hit = !q || [a.number,a.title,a.officialText,a.practicalExplanation,a.prosecutionPoints,a.keywords].join(' ').includes(q);
      const st = state.filter === 'all' || a.status === state.filter;
      return hit && st;
    });
    return `<div class="lcm-panel-head"><div><h3>مواد: ${escapeHtml(law.title)}</h3><small>${articles.length} من ${law.articles?.length || 0}</small></div><button class="lcm-btn mini" onclick="LegalContentManager.openArticleForm(null,'${law.id}')">➕ مادة</button></div>
    <div class="lcm-article-list">${articles.slice(0,120).map(a => `<article class="lcm-article-card" onclick="LegalContentManager.openArticleView('${law.id}','${a.id}')">
      <div class="lcm-article-num">${escapeHtml(a.number)}</div>
      <div><h4>${escapeHtml(a.title || 'مادة بدون عنوان')}</h4><p>${escapeHtml((a.officialText || a.practicalExplanation || '').slice(0,180))}</p><div class="lcm-tags">${pill(a.status)}<span>${escapeHtml(a.keywords || '')}</span></div></div>
      <div class="lcm-card-actions" onclick="event.stopPropagation()"><button onclick="LegalContentManager.openArticleForm('${a.id}','${law.id}')">تعديل</button><button onclick="LegalContentManager.setArticleStatus('${law.id}','${a.id}','review')">مراجعة</button></div>
    </article>`).join('') || '<p class="lcm-empty">لا توجد مواد مطابقة.</p>'}</div>`;
  }

  function selectLaw(id){ state.selectedLawId = id; const panel = document.getElementById('lcmArticlesPanel'); if(panel) panel.innerHTML = renderArticlesPanel(); document.querySelectorAll('.lcm-law-card').forEach(c=>c.classList.remove('selected')); }
  function setQuery(v){ state.query = v; renderHome(); }
  function setFilter(v){ state.filter = v; renderHome(); }

  function openLawForm(id){
    const law = id ? getLaw(id) : { id:'', title:'', number:'', year:'', category:'', description:'', status:'draft', articles:[] };
    modal(`
      <h3>${id?'تعديل قانون':'إضافة قانون جديد'}</h3>
      <div class="lcm-form">
        <label>اسم القانون<input id="lawTitle" value="${escapeHtml(law.title)}"></label>
        <label>رقم القانون / السنة<input id="lawNumber" value="${escapeHtml(law.number)}"></label>
        <label>التصنيف<input id="lawCategory" value="${escapeHtml(law.category)}" placeholder="إجراءات جنائية / عقوبات / تعليمات..."></label>
        <label>حالة النشر<select id="lawStatus">${statusOptions(law.status)}</select></label>
        <label class="full">وصف مختصر<textarea id="lawDescription">${escapeHtml(law.description)}</textarea></label>
      </div>
      <div class="lcm-modal-actions"><button class="lcm-btn primary" onclick="LegalContentManager.saveLaw('${id||''}')">حفظ</button><button class="lcm-btn" onclick="LegalContentManager.closeModal()">إلغاء</button></div>`);
  }
  function saveLaw(id){
    const store = loadStore();
    const laws = store.laws || [];
    const existing = id ? (laws.find(l => l.id === id) || getLaw(id) || {}) : null;
    const item = {
      ...(existing || {}),
      id: id || uid('law'),
      title: document.getElementById('lawTitle').value.trim(),
      number: document.getElementById('lawNumber').value.trim(),
      category: document.getElementById('lawCategory').value.trim(),
      description: document.getElementById('lawDescription').value.trim(),
      status: document.getElementById('lawStatus').value,
      source: existing?.source === 'system' ? 'local-override' : 'local',
      articles: existing?.articles || [],
      createdAt: existing?.createdAt || now(),
      updatedAt: now()
    };
    const idx = laws.findIndex(l => l.id === item.id);
    if(idx >= 0) laws[idx] = item; else laws.push(item);
    store.laws = laws; saveStore(store); audit(id?'تعديل قانون':'إضافة قانون', item.title); closeModal(); renderHome();
  }
  function duplicateLaw(id){
    const store = loadStore();
    const law = getLaw(id); if(!law) return;
    const copy = { ...JSON.parse(JSON.stringify(law)), id: uid('law'), title: law.title + ' — نسخة', status:'draft', source:'local', createdAt:now(), updatedAt:now() };
    copy.articles = (copy.articles || []).map(a => ({...a, id:uid('art'), lawId:copy.id, status:'draft', source:'local'}));
    store.laws = store.laws || []; store.laws.push(copy); saveStore(store); audit('نسخ قانون', copy.title); renderHome();
  }

  function openArticleForm(articleId, lawId){
    const law = lawId ? getLaw(lawId) : getLaw(state.selectedLawId) || allLaws()[0];
    const article = articleId && law ? (law.articles || []).find(a => a.id === articleId) : { id:'', number:'', title:'', officialText:'', practicalExplanation:'', prosecutionPoints:'', examples:'', commonErrors:'', keywords:'', linkedArticles:'', status:'draft' };
    modal(`
      <h3>${articleId?'تعديل مادة':'إضافة مادة قانونية'}</h3>
      <div class="lcm-form">
        <label>القانون<select id="articleLawId">${allLaws().map(l=>`<option value="${l.id}" ${l.id===law?.id?'selected':''}>${escapeHtml(l.title)}</option>`).join('')}</select></label>
        <label>رقم المادة<input id="articleNumber" value="${escapeHtml(article.number)}"></label>
        <label>عنوان / موضوع المادة<input id="articleTitle" value="${escapeHtml(article.title)}"></label>
        <label>الحالة<select id="articleStatus">${statusOptions(article.status)}</select></label>
        <label class="full">النص الرسمي<textarea id="articleOfficial">${escapeHtml(article.officialText)}</textarea></label>
        <label class="full">الشرح التنفيذي العملي<textarea id="articleExplanation">${escapeHtml(article.practicalExplanation)}</textarea></label>
        <label class="full">نقاط النيابة العامة<textarea id="articlePoints">${escapeHtml(article.prosecutionPoints)}</textarea></label>
        <label class="full">أمثلة تنفيذية<textarea id="articleExamples">${escapeHtml(article.examples)}</textarea></label>
        <label class="full">أخطاء شائعة<textarea id="articleErrors">${escapeHtml(article.commonErrors)}</textarea></label>
        <label>كلمات مفتاحية<input id="articleKeywords" value="${escapeHtml(article.keywords)}"></label>
        <label>مواد مرتبطة<input id="articleLinks" value="${escapeHtml(article.linkedArticles)}"></label>
      </div>
      <div class="lcm-modal-actions"><button class="lcm-btn primary" onclick="LegalContentManager.saveArticle('${articleId||''}')">حفظ المادة</button><button class="lcm-btn" onclick="LegalContentManager.closeModal()">إلغاء</button></div>`);
  }
  function ensureLocalLaw(store, lawId){
    store.laws = store.laws || [];
    let law = store.laws.find(l => l.id === lawId);
    if(!law){
      const base = getLaw(lawId);
      law = { ...JSON.parse(JSON.stringify(base || {id:lawId,title:'قانون محلي',status:'draft'})), source:'local-override', articles: JSON.parse(JSON.stringify(base?.articles || [])) };
      store.laws.push(law);
    }
    law.articles = law.articles || [];
    return law;
  }
  function saveArticle(articleId){
    const store = loadStore();
    const lawId = document.getElementById('articleLawId').value;
    const law = ensureLocalLaw(store, lawId);
    const existing = articleId ? (law.articles || []).find(a => a.id === articleId) : null;
    const item = {
      ...(existing || {}),
      id: articleId || uid('art'), lawId,
      number: document.getElementById('articleNumber').value.trim(),
      title: document.getElementById('articleTitle').value.trim(),
      officialText: document.getElementById('articleOfficial').value.trim(),
      practicalExplanation: document.getElementById('articleExplanation').value.trim(),
      prosecutionPoints: document.getElementById('articlePoints').value.trim(),
      examples: document.getElementById('articleExamples').value.trim(),
      commonErrors: document.getElementById('articleErrors').value.trim(),
      keywords: document.getElementById('articleKeywords').value.trim(),
      linkedArticles: document.getElementById('articleLinks').value.trim(),
      status: document.getElementById('articleStatus').value,
      source: existing?.source === 'system' ? 'local-override' : 'local',
      createdAt: existing?.createdAt || now(), updatedAt: now()
    };
    const idx = law.articles.findIndex(a => a.id === item.id);
    if(idx >= 0) law.articles[idx] = item; else law.articles.push(item);
    saveStore(store); audit(articleId?'تعديل مادة':'إضافة مادة', `${law.title} — مادة ${item.number}`); closeModal(); state.selectedLawId = lawId; renderHome();
  }
  function setArticleStatus(lawId, articleId, status){
    const store = loadStore(); const law = ensureLocalLaw(store, lawId); const art = law.articles.find(a=>a.id===articleId); if(!art) return;
    art.status = status; art.updatedAt = now(); saveStore(store); audit('تغيير حالة مادة', `مادة ${art.number} إلى ${status}`); renderHome();
  }
  function openArticleView(lawId, articleId){
    const law = getLaw(lawId); const art = law?.articles?.find(a=>a.id===articleId); if(!art) return;
    modal(`<h3>${escapeHtml(law.title)} — مادة ${escapeHtml(art.number)}</h3>
      <div class="lcm-view">
        <div>${pill(art.status)} <span>${escapeHtml(art.keywords||'')}</span></div>
        <h4>${escapeHtml(art.title || '')}</h4>
        <h5>النص الرسمي</h5><p>${escapeHtml(art.officialText || '—')}</p>
        <h5>الشرح العملي</h5><p>${escapeHtml(art.practicalExplanation || '—')}</p>
        <h5>نقاط النيابة</h5><p>${escapeHtml(art.prosecutionPoints || '—')}</p>
        <h5>الأمثلة والأخطاء</h5><p>${escapeHtml(art.examples || '—')}</p><p>${escapeHtml(art.commonErrors || '')}</p>
      </div>
      <div class="lcm-modal-actions"><button class="lcm-btn primary" onclick="LegalContentManager.openArticleForm('${art.id}','${law.id}')">تعديل</button><button class="lcm-btn" onclick="LegalContentManager.closeModal()">إغلاق</button></div>`);
  }

  function renderReviewQueue(){
    const rows = allLaws().flatMap(l => [{type:'law', law:l, item:l}, ...(l.articles||[]).map(a=>({type:'article', law:l, item:a}))]).filter(x => x.item.status === 'review');
    setMain(`<section class="lcm-page"><div class="lcm-hero"><h2>طابور مراجعة المحتوى</h2><p>مراجعة التعديلات قبل النشر للحفاظ على موثوقية المحتوى القانوني.</p></div><div class="lcm-tabs"><button onclick="LegalContentManager.renderHome()">رجوع للمركز</button><button class="active">طابور المراجعة</button></div><div class="lcm-panel lcm-wide">${rows.map(r=>`<article class="lcm-review-row"><div><b>${r.type==='law'?'قانون':'مادة'}: ${escapeHtml(r.type==='law'?r.item.title:('مادة '+r.item.number+' — '+r.law.title))}</b><p>${escapeHtml((r.item.description||r.item.officialText||'').slice(0,220))}</p></div><button onclick="LegalContentManager.publishItem('${r.type}','${r.law.id}','${r.item.id}')">نشر</button><button onclick="LegalContentManager.returnDraft('${r.type}','${r.law.id}','${r.item.id}')">إعادة لمسودة</button></article>`).join('') || '<p class="lcm-empty">لا يوجد محتوى قيد المراجعة.</p>'}</div></section>`);
  }
  function publishItem(type, lawId, itemId){ if(type==='law'){ updateLawStatus(lawId,'published'); } else setArticleStatus(lawId,itemId,'published'); renderReviewQueue(); }
  function returnDraft(type, lawId, itemId){ if(type==='law'){ updateLawStatus(lawId,'draft'); } else setArticleStatus(lawId,itemId,'draft'); renderReviewQueue(); }
  function updateLawStatus(lawId,status){ const store=loadStore(); const law=ensureLocalLaw(store,lawId); law.status=status; law.updatedAt=now(); saveStore(store); audit('تغيير حالة قانون', `${law.title} إلى ${status}`); }

  function renderTemplates(){
    const store = loadStore();
    setMain(`<section class="lcm-page"><div class="lcm-hero"><h2>النماذج والكلمات المفتاحية</h2><p>إدارة قوالب المحتوى والكلمات المفتاحية والروابط الموضوعية.</p></div><div class="lcm-tabs"><button onclick="LegalContentManager.renderHome()">رجوع للمركز</button><button class="active">النماذج والكلمات</button></div><div class="lcm-grid two"><div class="lcm-panel"><div class="lcm-panel-head"><h3>قالب شرح مادة</h3></div><textarea id="lcmTemplate" class="lcm-big-text" placeholder="اكتب قالبًا استرشاديًا لإعداد شرح المواد...">${escapeHtml(store.defaultTemplate || 'النص الرسمي:\nالشرح العملي:\nنقاط النيابة العامة:\nأمثلة تنفيذية:\nأخطاء شائعة:\nمواد مرتبطة:')}</textarea><button class="lcm-btn primary" onclick="LegalContentManager.saveTemplate()">حفظ القالب</button></div><div class="lcm-panel"><div class="lcm-panel-head"><h3>كلمات مفتاحية مؤسسية</h3></div><textarea id="lcmKeywords" class="lcm-big-text" placeholder="كلمة في كل سطر">${escapeHtml((store.keywords||[]).join('\n'))}</textarea><button class="lcm-btn primary" onclick="LegalContentManager.saveKeywords()">حفظ الكلمات</button></div></div></section>`);
  }
  function saveTemplate(){ const store=loadStore(); store.defaultTemplate=document.getElementById('lcmTemplate').value; saveStore(store); audit('تحديث قالب المحتوى','تم حفظ قالب شرح المواد'); renderTemplates(); }
  function saveKeywords(){ const store=loadStore(); store.keywords=document.getElementById('lcmKeywords').value.split('\n').map(x=>x.trim()).filter(Boolean); saveStore(store); audit('تحديث الكلمات المفتاحية','تم حفظ قائمة الكلمات المؤسسية'); renderTemplates(); }

  function renderAudit(){
    const list = JSON.parse(localStorage.getItem(AUDIT_KEY) || '[]');
    setMain(`<section class="lcm-page"><div class="lcm-hero"><h2>سجل تدقيق المحتوى القانوني</h2><p>سجل محلي لكل عمليات الإضافة والتعديل والنشر والمراجعة.</p></div><div class="lcm-tabs"><button onclick="LegalContentManager.renderHome()">رجوع للمركز</button><button class="active">سجل التدقيق</button></div><div class="lcm-panel lcm-wide">${list.map(a=>`<div class="lcm-audit"><b>${escapeHtml(a.action)}</b><span>${escapeHtml(a.details)}</span><small>${escapeHtml(a.user)} — ${new Date(a.at).toLocaleString('ar-EG')}</small></div>`).join('') || '<p class="lcm-empty">لا توجد عمليات.</p>'}</div></section>`);
  }
  function renderSettings(){
    const s = loadSettings();
    setMain(`<section class="lcm-page"><div class="lcm-hero"><h2>إعدادات إدارة المحتوى والربط</h2><p>تخزين محلي أولًا مع تجهيز للربط المؤسسي عبر Worker + D1.</p></div><div class="lcm-tabs"><button onclick="LegalContentManager.renderHome()">رجوع للمركز</button><button class="active">الإعدادات</button></div><div class="lcm-panel lcm-wide"><div class="lcm-form"><label>وضع المزامنة<select id="lcmSyncMode"><option value="local-first" ${s.syncMode==='local-first'?'selected':''}>محلي أولًا</option><option value="cloud-sync" ${s.syncMode==='cloud-sync'?'selected':''}>مزامنة مؤسسية</option></select></label><label>رابط Worker<input id="lcmWorkerUrl" value="${escapeHtml(s.workerUrl)}" placeholder="https://..."></label><label><input type="checkbox" id="lcmReview" ${s.requireReviewBeforePublish?'checked':''}> إلزام المراجعة قبل النشر</label><label><input type="checkbox" id="lcmSearchOverlay" ${s.allowLocalContentInSearch?'checked':''}> إدراج المحتوى المحلي المنشور في البحث</label></div><div class="lcm-modal-actions"><button class="lcm-btn primary" onclick="LegalContentManager.saveSettingsFromUi()">حفظ الإعدادات</button><button class="lcm-btn" onclick="LegalContentManager.testSync()">اختبار الاتصال</button></div></div></section>`);
  }
  function saveSettingsFromUi(){ const s=loadSettings(); s.syncMode=document.getElementById('lcmSyncMode').value; s.workerUrl=document.getElementById('lcmWorkerUrl').value.trim(); s.requireReviewBeforePublish=document.getElementById('lcmReview').checked; s.allowLocalContentInSearch=document.getElementById('lcmSearchOverlay').checked; saveSettings(s); audit('تحديث إعدادات المحتوى','تم حفظ إعدادات الربط والمراجعة'); renderSettings(); }
  async function testSync(){ const s=loadSettings(); if(!s.workerUrl) return alert('ضع رابط Worker أولًا.'); try{ const res=await fetch(s.workerUrl.replace(/\/$/,'')+'/health'); alert(res.ok?'الاتصال ناجح':'تعذر الاتصال: '+res.status); }catch(e){ alert('تعذر الاتصال بالـ Worker.'); } }

  function openImportExport(){
    const store = loadStore();
    modal(`<h3>استيراد / تصدير المحتوى</h3><p class="lcm-hint">استخدم التصدير لحفظ نسخة احتياطية من المحتوى المحلي، أو الاستيراد لإضافة محتوى سبق تصديره.</p><textarea id="lcmImportBox" class="lcm-big-text">${escapeHtml(JSON.stringify(store,null,2))}</textarea><div class="lcm-modal-actions"><button class="lcm-btn primary" onclick="LegalContentManager.exportJson()">نسخ التصدير</button><button class="lcm-btn" onclick="LegalContentManager.importJson()">استيراد من النص</button><button class="lcm-btn" onclick="LegalContentManager.closeModal()">إغلاق</button></div>`);
  }
  function exportJson(){ navigator.clipboard?.writeText(document.getElementById('lcmImportBox').value); alert('تم نسخ بيانات التصدير.'); }
  function importJson(){ try{ const data=JSON.parse(document.getElementById('lcmImportBox').value); saveStore(data); audit('استيراد محتوى','تم استيراد بيانات إدارة المحتوى'); closeModal(); renderHome(); }catch(e){ alert('صيغة JSON غير صحيحة.'); } }

  function modal(html){
    let wrap = document.getElementById('lcmModal');
    if(!wrap){ wrap = document.createElement('div'); wrap.id='lcmModal'; wrap.className='lcm-modal-wrap'; document.body.appendChild(wrap); }
    wrap.innerHTML = `<div class="lcm-modal-back" onclick="LegalContentManager.closeModal()"></div><div class="lcm-modal">${html}</div>`;
  }
  function closeModal(){ const m=document.getElementById('lcmModal'); if(m) m.remove(); }

  function injectStyles(){
    if(document.getElementById('lcmStyles')) return;
    const css = `
    .lcm-page{direction:rtl;padding:24px;color:#f8f1dc;font-family:Cairo,Arial,sans-serif}.lcm-hero{display:flex;justify-content:space-between;gap:20px;align-items:center;background:radial-gradient(circle at top right,rgba(212,175,55,.25),transparent 35%),linear-gradient(135deg,#080808,#17120a);border:1px solid rgba(212,175,55,.35);border-radius:26px;padding:26px;box-shadow:0 22px 60px rgba(0,0,0,.35)}.lcm-kicker{color:#d4af37;font-weight:800}.lcm-hero h2{margin:8px 0;font-size:30px}.lcm-hero p{color:#d8ccb0;max-width:850px;line-height:1.9}.lcm-hero-actions{display:flex;flex-wrap:wrap;gap:10px}.lcm-btn{border:1px solid rgba(212,175,55,.38);background:rgba(255,255,255,.06);color:#f8f1dc;border-radius:14px;padding:10px 15px;cursor:pointer;font-weight:800}.lcm-btn.primary{background:linear-gradient(135deg,#d4af37,#8a6d1f);color:#120d04}.lcm-btn.mini{padding:7px 10px;font-size:12px}.lcm-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:16px 0}.lcm-stats div{background:rgba(10,10,10,.78);border:1px solid rgba(212,175,55,.22);border-radius:20px;padding:18px;text-align:center}.lcm-stats b{font-size:28px;color:#d4af37;display:block}.lcm-stats span{color:#cfc2a6}.lcm-tabs{display:flex;flex-wrap:wrap;gap:8px;margin:16px 0}.lcm-tabs button{border:1px solid rgba(212,175,55,.25);background:rgba(0,0,0,.45);color:#f8f1dc;border-radius:999px;padding:10px 14px;cursor:pointer}.lcm-tabs button.active{background:#d4af37;color:#141006}.lcm-toolbar{display:flex;gap:10px;margin:15px 0}.lcm-toolbar input,.lcm-toolbar select,.lcm-form input,.lcm-form select,.lcm-form textarea{width:100%;box-sizing:border-box;border:1px solid rgba(212,175,55,.28);background:#090909;color:#f8f1dc;border-radius:14px;padding:11px;font-family:inherit}.lcm-toolbar input{flex:1}.lcm-grid{display:grid;grid-template-columns:minmax(310px,.85fr) minmax(420px,1.4fr);gap:16px}.lcm-grid.two{grid-template-columns:1fr 1fr}.lcm-panel{background:linear-gradient(180deg,rgba(20,17,10,.96),rgba(8,8,8,.98));border:1px solid rgba(212,175,55,.24);border-radius:24px;padding:18px;box-shadow:0 18px 45px rgba(0,0,0,.28)}.lcm-wide{margin-top:16px}.lcm-panel-head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:12px}.lcm-panel-head h3{margin:0;color:#f8e8b0}.lcm-panel-head small{color:#b7a989}.lcm-list,.lcm-article-list{display:flex;flex-direction:column;gap:10px;max-height:660px;overflow:auto;padding-left:4px}.lcm-law-card,.lcm-article-card,.lcm-review-row{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;background:rgba(255,255,255,.045);border:1px solid rgba(212,175,55,.16);border-radius:18px;padding:14px;cursor:pointer}.lcm-law-card.selected{border-color:#d4af37;box-shadow:0 0 0 2px rgba(212,175,55,.16)}.lcm-law-card h4,.lcm-article-card h4{margin:0;color:#fff}.lcm-law-card p,.lcm-article-card p{margin:6px 0 0;color:#c9bea4;line-height:1.7}.lcm-law-meta,.lcm-tags{display:flex;gap:7px;flex-wrap:wrap;align-items:center}.lcm-pill{border-radius:999px;padding:4px 9px;font-size:12px;border:1px solid rgba(255,255,255,.18)}.lcm-draft{background:rgba(120,120,120,.2)}.lcm-review{background:rgba(255,193,7,.16);color:#ffe4a0}.lcm-published{background:rgba(46,204,113,.15);color:#b8ffd2}.lcm-archived{background:rgba(120,120,120,.15);color:#bbb}.lcm-card-actions{display:flex;gap:6px}.lcm-card-actions button,.lcm-review-row button{border:1px solid rgba(212,175,55,.28);background:rgba(0,0,0,.35);color:#f8f1dc;border-radius:10px;padding:7px 9px;cursor:pointer}.lcm-article-card{grid-template-columns:70px 1fr auto}.lcm-article-num{width:52px;height:52px;display:grid;place-items:center;border-radius:16px;background:rgba(212,175,55,.16);color:#f8e8b0;font-weight:900}.lcm-empty{color:#b7a989;text-align:center;padding:20px}.lcm-form{display:grid;grid-template-columns:1fr 1fr;gap:12px}.lcm-form label{display:flex;flex-direction:column;gap:7px;color:#e8d8ac;font-weight:800}.lcm-form label.full{grid-column:1/-1}.lcm-form textarea{min-height:95px;resize:vertical}.lcm-big-text{width:100%;min-height:260px;background:#070707;color:#f8f1dc;border:1px solid rgba(212,175,55,.25);border-radius:16px;padding:14px;box-sizing:border-box;font-family:Cairo,monospace}.lcm-modal-wrap{position:fixed;inset:0;z-index:9999;display:grid;place-items:center}.lcm-modal-back{position:absolute;inset:0;background:rgba(0,0,0,.72);backdrop-filter:blur(5px)}.lcm-modal{position:relative;width:min(980px,94vw);max-height:88vh;overflow:auto;background:#111;border:1px solid rgba(212,175,55,.45);border-radius:24px;padding:22px;color:#f8f1dc;box-shadow:0 28px 100px rgba(0,0,0,.6);direction:rtl}.lcm-modal h3{margin-top:0;color:#f8e8b0}.lcm-modal-actions{display:flex;gap:10px;justify-content:flex-start;margin-top:14px;flex-wrap:wrap}.lcm-view h5{color:#d4af37;margin:16px 0 5px}.lcm-view p{white-space:pre-wrap;line-height:1.9;color:#e2d6b8}.lcm-audit{display:grid;grid-template-columns:190px 1fr auto;gap:10px;border-bottom:1px solid rgba(212,175,55,.12);padding:10px}.lcm-audit small{color:#a99d83}.lcm-hint{color:#c9bea4;line-height:1.8}@media(max-width:900px){.lcm-hero{flex-direction:column;align-items:stretch}.lcm-stats,.lcm-grid,.lcm-grid.two{grid-template-columns:1fr}.lcm-toolbar{flex-direction:column}.lcm-article-card{grid-template-columns:1fr}.lcm-form{grid-template-columns:1fr}.lcm-audit{grid-template-columns:1fr}}`;
    const style=document.createElement('style'); style.id='lcmStyles'; style.textContent=css; document.head.appendChild(style);
  }

  window.LegalContentManager = { openLegalContentManager, renderHome, selectLaw, setQuery, setFilter, openLawForm, saveLaw, duplicateLaw, openArticleForm, saveArticle, setArticleStatus, openArticleView, renderReviewQueue, publishItem, returnDraft, renderTemplates, saveTemplate, saveKeywords, renderAudit, renderSettings, saveSettingsFromUi, testSync, openImportExport, exportJson, importJson, closeModal };
  window.openLegalContentManager = function(){ injectStyles(); openLegalContentManager(); };
  document.addEventListener('DOMContentLoaded', injectStyles);
})();
