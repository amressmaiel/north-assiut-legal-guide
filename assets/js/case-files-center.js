/* Phase 5.17 — Smart Case Files and Judicial Analysis Workspace */
(function(){
  const STORAGE_KEY = 'sand_case_files_v1';
  const SETTINGS_KEY = 'sand_case_files_settings_v1';
  const STATUS = {
    studying: 'تحت الدراسة',
    needs_completion: 'يحتاج استيفاء',
    ready: 'جاهز للتصرف',
    disposed: 'تم التصرف',
    archived: 'مؤرشف'
  };
  const PRIORITY = { normal:'عادي', important:'هام', urgent:'عاجل' };
  const TYPE_OPTIONS = ['جنحة','جناية','مخالفة','اقتصادي','أسرة/طفل','مضبوطات وأحراز','أدلة رقمية','أخرى'];
  const $ = (id)=>document.getElementById(id);
  const esc = window.esc || ((s)=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])));
  const toast = (msg)=> window.showToast ? showToast(msg) : alert(msg);
  function now(){ return new Date().toISOString(); }
  function userId(){
    try{ const u=window.SandAuthApi?.currentUser?.(); return u?.id || u?.userId || u?.email || u?.username || 'local-user'; }catch{return 'local-user';}
  }
  function read(){ try{ return JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]'); }catch{return [];} }
  function write(list){ localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }
  function settings(){
    try{return Object.assign({saveMode:'manual',syncMode:'local_first',maxActiveFiles:500,detailsLazy:true,attachmentsPolicy:'metadata_only'}, JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}'));}catch{return {saveMode:'manual',syncMode:'local_first',maxActiveFiles:500,detailsLazy:true,attachmentsPolicy:'metadata_only'};}
  }
  function saveSettings(v){ localStorage.setItem(SETTINGS_KEY, JSON.stringify(Object.assign(settings(), v||{}))); }
  function id(){ return 'casefile-'+Date.now()+'-'+Math.random().toString(16).slice(2,8); }
  function normalizeFile(raw){
    return Object.assign({
      id:id(), ownerUserId:userId(), title:'ملف واقعة جديد', caseNumber:'', caseYear:'', prosecutionName:'', incidentType:'أخرى',
      status:'studying', priority:'normal', createdAt:now(), updatedAt:now(), archived:false,
      factsSummary:'', originalFacts:'', closestCharge:'', relatedArticles:[], legalQualifications:[], investigationPlan:[], missingPoints:[], warnings:[], suggestedActions:[],
      drafts:[], deadlines:[], notes:[], activity:[], shares:[], attachments:[]
    }, raw||{});
  }
  function listMine(includeArchived=false){
    const uid=userId();
    return read().map(normalizeFile).filter(f=>f.ownerUserId===uid || f.ownerUserId==='local-user').filter(f=>includeArchived || !f.archived).sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)));
  }
  function put(file){
    file=normalizeFile(file); file.updatedAt=now();
    const all=read().filter(x=>x.id!==file.id); all.unshift(file); write(all); return file;
  }
  function get(fileId){ return read().map(normalizeFile).find(f=>f.id===fileId); }
  function remove(fileId){ write(read().filter(f=>f.id!==fileId)); }
  function addActivity(file, text){ file.activity=file.activity||[]; file.activity.unshift({id:id(), at:now(), by:userId(), text}); file.activity=file.activity.slice(0,80); return file; }
  function short(text, n=160){ text=String(text||''); return text.length>n?text.slice(0,n)+'…':text; }
  function unique(arr){ const out=[], seen=new Set(); (arr||[]).forEach(v=>{const t=typeof v==='string'?v:(v?.articleNumber?`${v.lawName||''} ${v.articleNumber}`:JSON.stringify(v)); const k=t.trim(); if(k&&!seen.has(k)){seen.add(k); out.push(v);}}); return out; }
  function fileStats(){ const l=listMine(true); return {total:l.length, active:l.filter(f=>!f.archived).length, needs:l.filter(f=>f.status==='needs_completion').length, ready:l.filter(f=>f.status==='ready').length, archived:l.filter(f=>f.archived).length}; }
  function setNav(){ if(typeof setActiveNav==='function') setActiveNav('case-files-center'); }
  function view(html){
    if(typeof page==='function') page(html); else { const el=$('appView'); if(el) el.innerHTML=`<div class="page">${html}</div>`; }
  }
  function statusPill(f){ return `<span class="case-file-status ${esc(f.status)}">${esc(STATUS[f.status]||f.status)}</span>`; }
  function priorityPill(f){ return `<span class="case-file-priority ${esc(f.priority)}">${esc(PRIORITY[f.priority]||f.priority)}</span>`; }
  function headerMarkup(active='list'){
    const st=fileStats();
    return `<section class="case-files-hero">
      <div><span class="institutional-kicker">مساحة عمل قضائية محفوظة بنظام تخزين ذكي</span><h1>📁 مركز ملفات الوقائع والتحليلات القضائية</h1><p>حوّل نتائج تحليل سَنَد إلى ملفات منظمة: واقعة، تكييفات، استيفاءات، مسودات، مواعيد، ملاحظات، وسجل متابعة — مع حفظ يدوي خفيف وتخزين محلي أولًا.</p></div>
      <div class="case-files-hero-actions"><button class="gold-btn" onclick="openCaseFileForm()">➕ ملف واقعة جديد</button><button class="soft-btn" onclick="openCaseAnalysisRoom?.()">⚖️ تحليل واقعة</button><button class="soft-btn" onclick="openCaseFilesSettings()">⚙️ سياسة التخزين</button></div>
    </section>
    <section class="case-files-stats"><article><span>إجمالي الملفات</span><b>${st.total}</b></article><article><span>نشطة</span><b>${st.active}</b></article><article><span>تحتاج استيفاء</span><b>${st.needs}</b></article><article><span>جاهزة للتصرف</span><b>${st.ready}</b></article><article><span>مؤرشفة</span><b>${st.archived}</b></article></section>
    <nav class="case-files-tabs"><button class="${active==='list'?'active':''}" onclick="openCaseFilesCenter()">الملفات</button><button class="${active==='settings'?'active':''}" onclick="openCaseFilesSettings()">سياسة التخزين</button><button onclick="openCaseAnalysisRoom?.()">غرفة التحليل</button></nav>`;
  }
  function openCaseFilesCenter(){
    setNav(); const all=listMine(true); const q=($('caseFileSearch')?.value||'').trim();
    const status=($('caseFileStatusFilter')?.value||'active');
    let items=all.filter(f=>status==='all'?true:status==='archived'?f.archived:status==='active'?!f.archived:f.status===status);
    if(q){ const n=q.toLowerCase(); items=items.filter(f=>[f.title,f.caseNumber,f.caseYear,f.prosecutionName,f.incidentType,f.factsSummary,f.closestCharge].join(' ').toLowerCase().includes(n)); }
    view(`${headerMarkup('list')}
      <section class="case-files-toolbar"><div class="search-wrap inline"><span class="search-icon">🔎</span><input id="caseFileSearch" value="${esc(q)}" placeholder="ابحث بعنوان الواقعة أو رقم المحضر أو النيابة أو التكييف..." oninput="openCaseFilesCenter()"></div><select id="caseFileStatusFilter" onchange="openCaseFilesCenter()"><option value="active" ${status==='active'?'selected':''}>الملفات النشطة</option><option value="all" ${status==='all'?'selected':''}>كل الملفات</option>${Object.entries(STATUS).map(([k,v])=>`<option value="${k}" ${status===k?'selected':''}>${v}</option>`).join('')}<option value="archived" ${status==='archived'?'selected':''}>المؤرشفة</option></select></section>
      <section class="case-files-grid">${items.length?items.map(fileCard).join(''):`<div class="empty wide">لا توجد ملفات مطابقة. ابدأ بإنشاء ملف جديد أو احفظ نتيجة من غرفة تحليل الوقائع.</div>`}</section>`);
  }
  function fileCard(f){
    return `<article class="case-file-card ${f.archived?'archived':''}"><div class="case-file-card-head"><div><h3>${esc(f.title)}</h3><small>${esc(f.prosecutionName||'لم تحدد النيابة')} ${f.caseNumber?`— محضر ${esc(f.caseNumber)}/${esc(f.caseYear||'')}`:''}</small></div><div>${statusPill(f)}${priorityPill(f)}</div></div><p>${esc(short(f.factsSummary||f.originalFacts||'لا يوجد ملخص محفوظ بعد.'))}</p><div class="case-file-card-meta"><span>النوع: ${esc(f.incidentType||'أخرى')}</span><span>آخر تحديث: ${esc(new Date(f.updatedAt).toLocaleString('ar-EG'))}</span><span>مسودات: ${(f.drafts||[]).length}</span><span>مواعيد: ${(f.deadlines||[]).length}</span></div><div class="case-file-card-actions"><button onclick="openCaseFileDetails('${esc(f.id)}')">فتح الملف</button><button onclick="openCaseFileForm('${esc(f.id)}')">تعديل</button><button onclick="toggleCaseFileArchive('${esc(f.id)}')">${f.archived?'استعادة':'أرشفة'}</button></div></article>`;
  }
  function openCaseFileForm(fileId){
    setNav(); const f=fileId?get(fileId):normalizeFile({title:'', incidentType:'جنحة'}); if(!f) return toast('لم يتم العثور على الملف.');
    view(`${headerMarkup('list')}<section class="case-file-form-panel"><div class="panel-heading"><span>${fileId?'تعديل ملف واقعة':'إنشاء ملف واقعة جديد'}</span><button onclick="openCaseFilesCenter()">رجوع</button></div>
      <div class="case-file-form-grid">
        <label>عنوان الواقعة<input id="cfTitle" value="${esc(f.title)}" placeholder="مثال: واقعة سرقة مخزن..."></label>
        <label>رقم المحضر / القضية<input id="cfCaseNumber" value="${esc(f.caseNumber)}"></label>
        <label>السنة<input id="cfCaseYear" value="${esc(f.caseYear)}" inputmode="numeric"></label>
        <label>النيابة المختصة<input id="cfProsecution" value="${esc(f.prosecutionName)}"></label>
        <label>نوع الواقعة<select id="cfIncidentType">${TYPE_OPTIONS.map(t=>`<option ${f.incidentType===t?'selected':''}>${esc(t)}</option>`).join('')}</select></label>
        <label>الأولوية<select id="cfPriority">${Object.entries(PRIORITY).map(([k,v])=>`<option value="${k}" ${f.priority===k?'selected':''}>${v}</option>`).join('')}</select></label>
        <label>الحالة<select id="cfStatus">${Object.entries(STATUS).map(([k,v])=>`<option value="${k}" ${f.status===k?'selected':''}>${v}</option>`).join('')}</select></label>
      </div>
      <label class="wide-label">وصف الواقعة / الملخص الأولي<textarea id="cfFacts" rows="7" placeholder="اكتب ملخص الواقعة بدون بيانات حساسة...">${esc(f.factsSummary||f.originalFacts)}</textarea></label>
      <label class="wide-label">ملاحظات أولية<textarea id="cfNote" rows="4" placeholder="ملاحظات داخلية اختيارية..."></textarea></label>
      <div class="case-file-form-actions"><button class="gold-btn" onclick="saveCaseFileFromForm('${esc(f.id)}','${fileId?'edit':'new'}')">حفظ الملف</button>${fileId?`<button class="danger-soft-btn" onclick="deleteCaseFile('${esc(f.id)}')">حذف</button>`:''}</div>
    </section>`);
  }
  function saveCaseFileFromForm(fileId, mode){
    const old=mode==='edit'?get(fileId):null; let f=old||normalizeFile({id:fileId||id(), createdAt:now(), ownerUserId:userId()});
    f.title=$('cfTitle')?.value?.trim()||'ملف واقعة بدون عنوان'; f.caseNumber=$('cfCaseNumber')?.value?.trim()||''; f.caseYear=$('cfCaseYear')?.value?.trim()||'';
    f.prosecutionName=$('cfProsecution')?.value?.trim()||''; f.incidentType=$('cfIncidentType')?.value||'أخرى'; f.priority=$('cfPriority')?.value||'normal'; f.status=$('cfStatus')?.value||'studying';
    f.factsSummary=$('cfFacts')?.value?.trim()||''; const note=$('cfNote')?.value?.trim(); if(note){ f.notes=f.notes||[]; f.notes.unshift({id:id(), text:note, at:now(), by:userId()}); }
    addActivity(f, mode==='edit'?'تعديل بيانات ملف الواقعة.':'إنشاء ملف واقعة جديد.'); put(f); toast('تم حفظ ملف الواقعة.'); openCaseFileDetails(f.id);
  }
  function openCaseFileDetails(fileId){
    setNav(); const f=get(fileId); if(!f) return toast('لم يتم العثور على الملف.');
    const quals=(f.legalQualifications||[]).map(q=>typeof q==='string'?`<li>${esc(q)}</li>`:`<li><b>${esc(q.title||q.closestCharge||'تكييف محتمل')}</b><small>${esc((q.reasons||[]).join(' — '))}</small></li>`).join('');
    const arts=unique(f.relatedArticles||[]).map(a=>typeof a==='string'?`<li>${esc(a)}</li>`:`<li>${esc(a.lawName||'')} ${esc(a.articleNumber||a.id||'')} — ${esc(a.shortTitle||'')}</li>`).join('');
    view(`${headerMarkup('list')}<section class="case-file-details">
      <header><div><span>ملف واقعة</span><h2>${esc(f.title)}</h2><p>${esc(f.prosecutionName||'')} ${f.caseNumber?`— رقم ${esc(f.caseNumber)}/${esc(f.caseYear||'')}`:''}</p></div><div>${statusPill(f)}${priorityPill(f)}</div></header>
      <div class="case-file-detail-actions"><button onclick="openCaseFileForm('${esc(f.id)}')">تعديل البيانات</button><button class="gold-soft-btn" onclick="openCaseFileShareModal('${esc(f.id)}')">مشاركة الملف</button><button onclick="addCaseFileReviewPrompt('${esc(f.id)}')">ملاحظة مراجعة</button><button onclick="addCaseFileNotePrompt('${esc(f.id)}')">إضافة ملاحظة</button><button onclick="changeCaseFileStatusPrompt('${esc(f.id)}')">تغيير الحالة</button><button onclick="exportCaseFileReport('${esc(f.id)}')">نسخ تقرير الملف</button><button onclick="openCaseFileShareLog('${esc(f.id)}')">سجل المشاركة</button><button onclick="openSecureCommunicationCenter?.()">مركز التواصل</button></div>
      <section class="case-file-detail-grid">
        <article class="span-2"><h3>ملخص الواقعة</h3><p>${esc(f.factsSummary||f.originalFacts||'لم يحفظ ملخص بعد.')}</p></article>
        <article><h3>التكييف الأقرب</h3><p>${esc(f.closestCharge||'لم يتم حفظ تكييف بعد.')}</p></article>
        <article><h3>المواد المرتبطة</h3><ul>${arts||'<li>لا توجد مواد محفوظة.</li>'}</ul></article>
        <article><h3>التكييفات المحتملة</h3><ul>${quals||'<li>لا توجد تكييفات محفوظة.</li>'}</ul></article>
        <article><h3>نقاط الاستيفاء</h3><ul>${(f.missingPoints||[]).map(x=>`<li>${esc(x)}</li>`).join('')||'<li>لا توجد نقاط محفوظة.</li>'}</ul></article>
        <article><h3>خطة التحقيق</h3><ul>${(f.investigationPlan||[]).map(x=>`<li>${esc(x)}</li>`).join('')||'<li>لا توجد خطة محفوظة.</li>'}</ul></article>
        <article><h3>التنبيهات</h3><ul>${(f.warnings||[]).map(x=>`<li>${esc(x)}</li>`).join('')||'<li>لا توجد تنبيهات.</li>'}</ul></article>
        <article><h3>الملاحظات</h3><ul>${(f.notes||[]).map(n=>`<li>${esc(n.text)}<small>${esc(new Date(n.at).toLocaleString('ar-EG'))}</small></li>`).join('')||'<li>لا توجد ملاحظات.</li>'}</ul></article>
        <article><h3>ملاحظات المراجعة</h3><ul>${(f.reviews||[]).map(r=>`<li><b>${esc(r.reviewerName||'مراجع')}</b>: ${esc(r.text)}<small>${esc(new Date(r.at).toLocaleString('ar-EG'))} — ${esc(r.status==='accepted'?'تم الأخذ بها':r.status==='rejected'?'مرفوضة':'قيد النظر')}</small>${r.status==='pending'?`<div class="case-review-actions"><button onclick="resolveCaseFileReview('${esc(f.id)}','${esc(r.id)}','accepted')">اعتماد</button><button onclick="resolveCaseFileReview('${esc(f.id)}','${esc(r.id)}','rejected')">رفض</button></div>`:''}</li>`).join('')||'<li>لا توجد مراجعات بعد.</li>'}</ul></article>
        <article><h3>المشاركات النشطة</h3><ul>${(f.shares||[]).filter(s=>s.status!=='revoked').map(s=>`<li>${esc(s.toName||s.toId)}<small>${esc(permissionLabel(s.permission))} — ${s.expiresAt?('ينتهي: '+esc(new Date(s.expiresAt).toLocaleDateString('ar-EG'))):'بدون انتهاء'}</small></li>`).join('')||'<li>لا توجد مشاركات نشطة.</li>'}</ul></article>
        <article><h3>المسودات</h3><ul>${(f.drafts||[]).map(d=>`<li>${esc(d.title||d.draft_type||'مسودة')}<small>${esc(d.type||'')}</small></li>`).join('')||'<li>لا توجد مسودات مرتبطة.</li>'}</ul></article>
        <article><h3>المواعيد</h3><ul>${(f.deadlines||[]).map(d=>`<li>${esc(d.title||d.deadline_type||'ميعاد')} — ${esc(d.dueDate||d.due_date||'')}</li>`).join('')||'<li>لا توجد مواعيد مرتبطة.</li>'}</ul></article>
        <article class="span-2"><h3>سجل المتابعة</h3><ul class="case-file-activity">${(f.activity||[]).map(a=>`<li><span>${esc(new Date(a.at).toLocaleString('ar-EG'))}</span>${esc(a.text)}</li>`).join('')||'<li>لا توجد حركة بعد.</li>'}</ul></article>
      </section>
    </section>`);
  }
  function snapshotToFile(snapshot){
    snapshot=snapshot||{}; const r=snapshot.result||{};
    const f=normalizeFile({title: short(r.closestCharge||r.summary||'ملف واقعة من تحليل سَنَد',90), factsSummary:r.summary||snapshot.factsText||'', originalFacts:snapshot.factsText||'', closestCharge:r.closestCharge||'', status:(r.status==='needs_clarification'?'needs_completion':'studying'), priority:'important', incidentType:'أخرى', createdAt:now(), ownerUserId:userId(), analysisSessionId:snapshot.sessionId});
    f.relatedArticles=unique(r.sources||snapshot.sources||[]); f.legalQualifications=r.classifications||[]; f.investigationPlan=r.investigationChecklist||r.investigationPlan||[]; f.missingPoints=r.missingPoints||r.clarifyingQuestions||[]; f.warnings=r.warnings||[]; f.suggestedActions=r.suggestedActions||[];
    if(snapshot.report) f.drafts=[];
    addActivity(f, 'إنشاء الملف من نتيجة غرفة تحليل الوقائع.'); return f;
  }
  function openCaseFileCreateFromCurrentAnalysis(){
    if(!window.getCurrentCaseAnalysisSnapshot) return toast('غرفة التحليل الحالية لا توفر بيانات للحفظ.');
    const snap=window.getCurrentCaseAnalysisSnapshot(); if(!snap?.result && !snap?.factsText) return toast('لا توجد نتيجة أو واقعة محفوظة للحفظ في ملف.');
    const f=put(snapshotToFile(snap)); toast('تم إنشاء ملف واقعة من التحليل الحالي.'); openCaseFileDetails(f.id);
  }
  function addCaseFileNotePrompt(fileId){ const f=get(fileId); if(!f)return; const text=prompt('اكتب الملاحظة الجديدة:'); if(!text)return; f.notes=f.notes||[]; f.notes.unshift({id:id(), text, at:now(), by:userId()}); addActivity(f,'إضافة ملاحظة جديدة.'); put(f); openCaseFileDetails(fileId); }
  function changeCaseFileStatusPrompt(fileId){ const f=get(fileId); if(!f)return; const value=prompt('اكتب الحالة: studying / needs_completion / ready / disposed / archived', f.status); if(!value||!STATUS[value])return toast('حالة غير صحيحة.'); f.status=value; f.archived=value==='archived'; addActivity(f, 'تغيير حالة الملف إلى: '+(STATUS[value]||value)); put(f); openCaseFileDetails(fileId); }
  function toggleCaseFileArchive(fileId){ const f=get(fileId); if(!f)return; f.archived=!f.archived; if(f.archived)f.status='archived'; else if(f.status==='archived')f.status='studying'; addActivity(f, f.archived?'أرشفة الملف.':'استعادة الملف من الأرشيف.'); put(f); openCaseFilesCenter(); }
  function deleteCaseFile(fileId){ if(!confirm('حذف ملف الواقعة نهائيًا من التخزين المحلي؟'))return; remove(fileId); toast('تم حذف الملف.'); openCaseFilesCenter(); }
  function report(f){
    return `مركز ملفات الوقائع والتحليلات القضائية\n\nالعنوان: ${f.title}\nرقم المحضر/القضية: ${f.caseNumber||'-'} / ${f.caseYear||'-'}\nالنيابة: ${f.prosecutionName||'-'}\nالحالة: ${STATUS[f.status]||f.status}\nالأولوية: ${PRIORITY[f.priority]||f.priority}\n\nملخص الواقعة:\n${f.factsSummary||f.originalFacts||'-'}\n\nالتكييف الأقرب:\n${f.closestCharge||'-'}\n\nنقاط الاستيفاء:\n${(f.missingPoints||[]).map(x=>'- '+x).join('\n')||'-'}\n\nخطة التحقيق:\n${(f.investigationPlan||[]).map(x=>'- '+x).join('\n')||'-'}\n\nتنبيهات:\n${(f.warnings||[]).map(x=>'- '+x).join('\n')||'-'}\n\nآخر تحديث: ${new Date(f.updatedAt).toLocaleString('ar-EG')}`;
  }
  function exportCaseFileReport(fileId){ const f=get(fileId); if(!f)return; navigator.clipboard?.writeText(report(f)).then(()=>toast('تم نسخ تقرير الملف.')); }
  function openCaseFilesSettings(){
    setNav(); const s=settings();
    view(`${headerMarkup('settings')}<section class="case-files-settings"><div class="panel-heading"><span>سياسة التخزين الذكي</span><button onclick="openCaseFilesCenter()">رجوع للملفات</button></div>
      <div class="settings-grid">
        <label>طريقة الحفظ<select id="cfsSaveMode"><option value="manual" ${s.saveMode==='manual'?'selected':''}>يدوي فقط — لا تحفظ محادثات سند تلقائيًا</option><option value="semi" ${s.saveMode==='semi'?'selected':''}>شبه تلقائي — حفظ النتائج المعتمدة فقط</option></select></label>
        <label>وضع المزامنة<select id="cfsSyncMode"><option value="local_first" ${s.syncMode==='local_first'?'selected':''}>محلي أولًا ثم مزامنة لاحقًا</option><option value="local_only" ${s.syncMode==='local_only'?'selected':''}>محلي فقط</option></select></label>
        <label>حد الملفات النشطة<input id="cfsMaxActive" type="number" value="${esc(s.maxActiveFiles)}"></label>
        <label>سياسة المرفقات<select id="cfsAttachments"><option value="metadata_only" ${s.attachmentsPolicy==='metadata_only'?'selected':''}>بيانات المرفق فقط — بدون تخزين الملف داخل القاعدة</option><option value="external_storage" ${s.attachmentsPolicy==='external_storage'?'selected':''}>تخزين خارجي لاحقًا R2/مجلد</option></select></label>
      </div>
      <div class="case-storage-policy"><h3>ضوابط منع تضخم قاعدة البيانات</h3><ul><li>لا يتم حفظ محادثة سَنَد كاملة تلقائيًا.</li><li>يحفظ الملف النتائج المنظمة فقط: الملخص، التكييف، الاستيفاء، التنبيهات، والمسودات المختارة.</li><li>المرفقات الكبيرة لا تحفظ داخل قاعدة البيانات؛ يحفظ الرابط أو المفتاح فقط.</li><li>القائمة تحمل فهرسًا مختصرًا، والتفاصيل تظهر عند فتح الملف.</li></ul></div>
      <button class="gold-btn" onclick="saveCaseFilesSettings()">حفظ سياسة التخزين</button>
    </section>`);
  }
  function saveCaseFilesSettings(){ saveSettings({saveMode:$('cfsSaveMode')?.value, syncMode:$('cfsSyncMode')?.value, maxActiveFiles:Number($('cfsMaxActive')?.value||500), attachmentsPolicy:$('cfsAttachments')?.value}); toast('تم حفظ سياسة التخزين.'); openCaseFilesSettings(); }

  function readCommJson(k,f){ try{return JSON.parse(localStorage.getItem(k)||'null')??f;}catch{return f;} }
  function writeCommJson(k,v){ try{localStorage.setItem(k,JSON.stringify(v));}catch{} }
  function commMembers(){
    const list=readCommJson('sand_comm_members_v1',[]);
    const trustedIds=trustedColleagues().map(x=>String(x.id));
    return list.filter(m=>m&&m.id&&trustedIds.includes(String(m.id)) && String(m.id)!==String(userId()));
  }
  function trustedColleagues(){
    const uid=userId();
    const members=readCommJson('sand_comm_members_v1',[]);
    const conns=readCommJson('sand_comm_connections_v1',[]).filter(c=>c.status==='accepted'&&(String(c.a)===String(uid)||String(c.b)===String(uid)));
    return conns.map(c=>members.find(m=>String(m.id)===String(c.a===uid?c.b:c.a))).filter(Boolean);
  }
  function permissionLabel(v){ return ({read:'قراءة فقط',comment:'قراءة وتعليق',review:'مراجعة قانونية',edit:'تحرير مشترك'})[v]||v||'قراءة فقط'; }
  function expiryDate(days){ if(!days||days==='none') return ''; const d=new Date(); d.setDate(d.getDate()+Number(days)); return d.toISOString(); }
  function canAccessSharedCaseFile(file){
    const uid=userId(); if(!file) return false;
    if(file.ownerUserId===uid || file.ownerUserId==='local-user') return true;
    return (file.shares||[]).some(s=>String(s.toId)===String(uid)&&s.status!=='revoked'&&(!s.expiresAt||new Date(s.expiresAt)>new Date()));
  }
  function openCaseFileShareModal(fileId){
    const f=get(fileId); if(!f) return toast('لم يتم العثور على الملف.');
    const colleagues=commMembers();
    const options=colleagues.map(m=>`<option value="${esc(m.id)}">${esc(m.name||m.id)} — ${esc(m.role||'عضو')}</option>`).join('');
    const html=`<div class="review-modal-backdrop" onclick="this.remove()"><div class="review-modal case-share-modal" onclick="event.stopPropagation()"><button class="review-modal-close" onclick="this.closest('.review-modal-backdrop').remove()">×</button><span class="institutional-kicker">🤝 تعاون قضائي آمن</span><h3>مشاركة ملف الواقعة</h3><p class="share-help">المشاركة تتم كرابط داخلي آمن داخل المنصة، ولا تمنح إلا الصلاحية المحددة. الضيوف لا يمكنهم الوصول إلى ملفات الوقائع.</p><label>الزميل الموثوق<select id="caseShareMember">${options||'<option value="">لا توجد قائمة زملاء موثوقين بعد</option>'}</select></label><label>مستوى الصلاحية<select id="caseSharePermission"><option value="read">قراءة فقط</option><option value="comment">قراءة وتعليق</option><option value="review">مراجعة قانونية</option><option value="edit">تحرير مشترك — تجريبي</option></select></label><label>مدة المشاركة<select id="caseShareExpiry"><option value="7">أسبوع</option><option value="1">يوم واحد</option><option value="30">شهر</option><option value="none">بدون انتهاء</option></select></label><label>رسالة مرافقة<textarea id="caseShareMessage" rows="4" placeholder="مثال: برجاء مراجعة التكييف ونقاط الاستيفاء..."></textarea></label><div class="comm-actions"><button class="comm-btn gold" onclick="shareCaseFile('${esc(fileId)}');this.closest('.review-modal-backdrop').remove()">إرسال المشاركة</button><button class="comm-btn" onclick="this.closest('.review-modal-backdrop').remove()">إلغاء</button></div></div></div>`;
    document.body.insertAdjacentHTML('beforeend',html);
  }
  function shareCaseFile(fileId){
    const f=get(fileId); if(!f) return toast('لم يتم العثور على الملف.');
    const toId=$('caseShareMember')?.value; if(!toId) return toast('اختر زميلًا موثوقًا أولًا.');
    const members=readCommJson('sand_comm_members_v1',[]); const to=members.find(m=>String(m.id)===String(toId))||{id:toId,name:toId};
    const permission=$('caseSharePermission')?.value||'read'; const expiresAt=expiryDate($('caseShareExpiry')?.value); const msg=($('caseShareMessage')?.value||'').trim();
    const share={id:id(), fileId:f.id, fromId:userId(), fromName:(window.SandAuthApi?.currentUser?.()?.fullName||window.SandAuthApi?.currentUser?.()?.name||'مستخدم المنصة'), toId, toName:to.name||toId, permission, message:msg, createdAt:now(), expiresAt, status:'active', lastViewedAt:''};
    f.shares=f.shares||[]; f.shares.unshift(share); addActivity(f, 'مشاركة الملف مع: '+(to.name||toId)+' — '+permissionLabel(permission)); put(f);
    sendCaseShareToCommunication(f, share);
    try{ window.SandNotifications?.create?.({category:'admin',priority:'high',title:'تمت مشاركة ملف واقعة',body:`تمت مشاركة ملف: ${f.title} مع ${to.name||toId}.`,source:'case-files-sharing',action:`openCaseFileDetails && openCaseFileDetails('${f.id}')`}); }catch{}
    toast('تمت مشاركة الملف وإرسال إشعار داخلي.'); openCaseFileDetails(fileId);
  }
  function sendCaseShareToCommunication(f, share){
    const uid=userId(); const threadId=['direct',String(uid),String(share.toId)].sort().join('__');
    const ms=readCommJson('sand_comm_messages_v1',[]);
    const text=`📁 تمت مشاركة ملف واقعة معك\n\nالعنوان: ${f.title}\nالصلاحية: ${permissionLabel(share.permission)}\n${share.expiresAt?('انتهاء المشاركة: '+new Date(share.expiresAt).toLocaleDateString('ar-EG')+'\n'):''}${share.message?('\nرسالة المرسل: '+share.message+'\n'):''}\nافتح الملف من مركز ملفات الوقائع والتحليلات.`;
    ms.push({id:id(),threadId,senderId:uid,senderName:share.fromName,text,at:now(),readBy:[uid],kind:'case_share',caseFileId:f.id,shareId:share.id});
    writeCommJson('sand_comm_messages_v1',ms);
  }
  function openCaseFileShareLog(fileId){
    const f=get(fileId); if(!f) return toast('لم يتم العثور على الملف.');
    const rows=(f.shares||[]).map(s=>`<tr><td>${esc(s.toName||s.toId)}</td><td>${esc(permissionLabel(s.permission))}</td><td>${esc(new Date(s.createdAt).toLocaleString('ar-EG'))}</td><td>${s.expiresAt?esc(new Date(s.expiresAt).toLocaleDateString('ar-EG')):'بدون انتهاء'}</td><td>${esc(s.status==='revoked'?'ملغاة':'نشطة')}</td><td>${s.status!=='revoked'?`<button onclick="revokeCaseFileShare('${esc(fileId)}','${esc(s.id)}')">إلغاء</button>`:'—'}</td></tr>`).join('');
    view(`${headerMarkup('list')}<section class="case-file-form-panel"><div class="panel-heading"><span>سجل مشاركة الملف</span><button onclick="openCaseFileDetails('${esc(fileId)}')">رجوع للملف</button></div><h2>${esc(f.title)}</h2><div class="case-share-table-wrap"><table class="case-share-table"><thead><tr><th>المستلم</th><th>الصلاحية</th><th>تاريخ المشاركة</th><th>الانتهاء</th><th>الحالة</th><th>إجراء</th></tr></thead><tbody>${rows||'<tr><td colspan="6">لا توجد مشاركات بعد.</td></tr>'}</tbody></table></div><div class="case-storage-policy"><h3>قاعدة المشاركة الآمنة</h3><ul><li>المشاركة لا ترسل محتوى الملف كاملًا داخل الدردشة، بل ترسل رابطًا داخليًا وصلاحية محددة.</li><li>يمكن إلغاء المشاركة في أي وقت.</li><li>كل مشاركة تسجل في سجل متابعة الملف.</li></ul></div></section>`);
  }
  function revokeCaseFileShare(fileId, shareId){
    const f=get(fileId); if(!f) return; const s=(f.shares||[]).find(x=>x.id===shareId); if(!s) return;
    s.status='revoked'; s.revokedAt=now(); addActivity(f,'إلغاء مشاركة الملف مع: '+(s.toName||s.toId)); put(f); toast('تم إلغاء المشاركة.'); openCaseFileShareLog(fileId);
  }
  function addCaseFileReviewPrompt(fileId){
    const f=get(fileId); if(!f) return; const text=prompt('اكتب ملاحظة المراجعة القانونية:'); if(!text) return;
    f.reviews=f.reviews||[]; f.reviews.unshift({id:id(),text,reviewerId:userId(),reviewerName:(window.SandAuthApi?.currentUser?.()?.fullName||window.SandAuthApi?.currentUser?.()?.name||'مراجع'),at:now(),status:'pending'}); addActivity(f,'إضافة ملاحظة مراجعة قانونية.'); put(f); openCaseFileDetails(fileId);
  }
  function resolveCaseFileReview(fileId, reviewId, status){
    const f=get(fileId); if(!f) return; const r=(f.reviews||[]).find(x=>x.id===reviewId); if(!r) return;
    r.status=status; r.resolvedAt=now(); addActivity(f,(status==='accepted'?'اعتماد':'رفض')+' ملاحظة مراجعة.'); put(f); openCaseFileDetails(fileId);
  }

  Object.assign(window,{openCaseFilesCenter,openCaseFileForm,saveCaseFileFromForm,openCaseFileDetails,openCaseFileCreateFromCurrentAnalysis,addCaseFileNotePrompt,changeCaseFileStatusPrompt,toggleCaseFileArchive,deleteCaseFile,exportCaseFileReport,openCaseFilesSettings,saveCaseFilesSettings,openCaseFileShareModal,shareCaseFile,openCaseFileShareLog,revokeCaseFileShare,addCaseFileReviewPrompt,resolveCaseFileReview,permissionLabel});
})();
