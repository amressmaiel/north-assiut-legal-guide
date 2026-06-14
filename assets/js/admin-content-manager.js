/**
 * admin-content-manager.js — Phase 5.3
 * لوحة إدارة مؤسسية للقوانين والقوالب وشخصية سَنَد.
 * تعمل محليًا عبر localStorage تمهيدًا لربطها لاحقًا بقاعدة بيانات/Backend.
 */
(function(){
  const STORE_KEY = 'sand.institutionalContent.v1';
  function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}
  function byId(id){return document.getElementById(id);}
  function toast(msg){ if(typeof judicialToast==='function') judicialToast(msg); else alert(msg); }
  function read(){
    try { return JSON.parse(localStorage.getItem(STORE_KEY)||'{}') || {}; } catch(e){ return {}; }
  }
  function save(data){ localStorage.setItem(STORE_KEY, JSON.stringify(data||{}, null, 2)); window.dispatchEvent(new CustomEvent('sand:content-updated',{detail:data||{}})); }
  function getNativeLaws(){
    const laws=[];
    if(Array.isArray(window.LAWS_INDEX)) laws.push(...window.LAWS_INDEX.map(l=>({id:l.id||l.key||'', title:l.title||l.name||'', type:'index', count:l.count||l.articlesCount||''})));
    if(window.CRIMINAL_PROCEDURE_174_2025) laws.push({id:'criminal-procedure-174-2025', title:'قانون الإجراءات الجنائية رقم 174 لسنة 2025', type:'loaded', count:Array.isArray(window.CRIMINAL_PROCEDURE_174_2025)?window.CRIMINAL_PROCEDURE_174_2025.length:70});
    if(window.PENAL_CODE_58_1937) laws.push({id:'penal-code-58-1937', title:'قانون العقوبات المصري رقم 58 لسنة 1937', type:'loaded', count:Array.isArray(window.PENAL_CODE_58_1937)?window.PENAL_CODE_58_1937.length:525});
    const seen=new Set(); return laws.filter(l=>{const k=l.id||l.title; if(seen.has(k)) return false; seen.add(k); return true;});
  }
  function defaultDraftTemplates(){
    return [
      {id:'inquiries', title:'طلب تحريات', group:'استيفاءات وتحريات', active:true, body:''},
      {id:'medical-report', title:'أمر استعجال تقرير طبي', group:'تقارير وفحوص فنية', active:true, body:''},
      {id:'camera-review', title:'طلب فحص كاميرات / تسجيلات', group:'أدلة رقمية', active:true, body:''},
      {id:'witness-summons', title:'استدعاء شاهد / سماع أقوال', group:'شهود وأطراف', active:true, body:''},
      {id:'chemical-lab', title:'طلب معمل كيماوي / تحليل مادة', group:'تقارير وفحوص فنية', active:true, body:''},
      {id:'release-note', title:'مسودة إخلاء سبيل / ضمانات حضور', group:'تصرفات قضائية', active:true},
      {id:'referral-note', title:'مذكرة إحالة مبدئية', group:'تصرفات قضائية', active:true},
      {id:'archive-note', title:'مذكرة حفظ مبدئية', group:'تصرفات قضائية', active:true}
    ];
  }
  function merged(){
    const local=read();
    return {
      laws: local.laws || [],
      disabledNativeLaws: local.disabledNativeLaws || {},
      templates: local.templates || defaultDraftTemplates(),
      sandProfile: Object.assign({tone:'رصين وودود', strictness:'balanced', defaultLegalConfidence:'ترجيح مبدئي غير ملزم', extraInstructions:''}, local.sandProfile || {}),
      reviewNotes: local.reviewNotes || []
    };
  }
  function setActiveTab(tab){
    document.querySelectorAll('.admin-content-tab').forEach(b=>b.classList.toggle('active', b.dataset.tab===tab));
    document.querySelectorAll('.admin-content-panel').forEach(p=>p.classList.toggle('active', p.dataset.panel===tab));
  }
  function render(){
    const data=merged();
    const nativeLaws=getNativeLaws();
    const lawRows = nativeLaws.map(l=>`<tr><td>${esc(l.title)}</td><td>${esc(l.id)}</td><td>${esc(l.count)}</td><td><span class="status-pill ok">محمل</span></td></tr>`).join('') || '<tr><td colspan="4">لم يتم رصد قوانين محملة.</td></tr>';
    const customRows = data.laws.map((l,i)=>`<tr><td>${esc(l.title)}</td><td>${esc(l.source||'إضافة محلية')}</td><td>${esc(l.notes||'')}</td><td><button class="mini-btn danger" onclick="deleteCustomLaw(${i})">حذف</button></td></tr>`).join('') || '<tr><td colspan="4">لا توجد قوانين مضافة محليًا بعد.</td></tr>';
    const tmplRows = data.templates.map((t,i)=>`<tr><td><input class="inline-input" value="${esc(t.title)}" onchange="updateTemplateField(${i},'title',this.value)"><small class="muted">${esc(t.id)}</small></td><td><input class="inline-input" value="${esc(t.group)}" onchange="updateTemplateField(${i},'group',this.value)"><input class="inline-input" value="${esc((t.keywords||[]).join ? t.keywords.join('، ') : (t.keywords||''))}" placeholder="كلمات ترجيح" onchange="updateTemplateKeywords(${i},this.value)"></td><td><textarea class="inline-template-body" rows="3" placeholder="نص مخصص اختياري للقالب" onchange="updateTemplateField(${i},'body',this.value)">${esc(t.body||'')}</textarea></td><td><label class="switch-line compact"><input type="checkbox" ${t.active!==false?'checked':''} onchange="updateTemplateField(${i},'active',this.checked)"> مفعّل</label></td><td><button class="mini-btn danger" onclick="deleteDraftTemplateAdmin(${i})">حذف</button></td></tr>`).join('');
    return `<section class="admin-settings-page content-admin-page">
      <div class="page-title-row"><div><span class="eyebrow">إدارة مؤسسية</span><h2>🧩 إدارة القوانين والقوالب وسَنَد</h2><p>لوحة إدارة أولية للمحتوى تعمل محليًا الآن، ومجهزة للانتقال لاحقًا إلى Backend وقاعدة بيانات.</p></div><div class="admin-toolbar"><button class="gold-btn" onclick="exportInstitutionalContent()">📤 تصدير المحتوى</button><button class="soft-btn" onclick="importInstitutionalContent()">📥 استيراد</button></div></div>
      <div class="settings-alert">⚠️ التعديلات هنا محلية على المتصفح حاليًا. لا تضع بيانات قضايا أو أشخاص حقيقية داخل الإعدادات أو القوالب العامة.</div>
      <div class="admin-content-tabs"><button class="admin-content-tab active" data-tab="laws" onclick="setInstitutionalContentTab('laws')">🏛️ القوانين</button><button class="admin-content-tab" data-tab="templates" onclick="setInstitutionalContentTab('templates')">📝 القوالب والمسودات</button><button class="admin-content-tab" data-tab="sand" onclick="setInstitutionalContentTab('sand')">🤖 شخصية سَنَد</button><button class="admin-content-tab" data-tab="review" onclick="setInstitutionalContentTab('review')">✅ مراجعة ونشر</button></div>
      <div class="admin-content-panel active" data-panel="laws"><div class="settings-card wide"><h3>القوانين المحملة في المنصة</h3><table class="admin-table"><thead><tr><th>القانون</th><th>المعرف</th><th>عدد تقريبي</th><th>الحالة</th></tr></thead><tbody>${lawRows}</tbody></table></div><div class="settings-card wide"><h3>إضافة قانون إلى سجل الإدارة</h3><div class="inline-form"><input id="newLawTitle" placeholder="اسم القانون"><input id="newLawSource" placeholder="المصدر / الملف"><input id="newLawNotes" placeholder="ملاحظات"><button class="gold-btn" onclick="addCustomLaw()">إضافة</button></div><table class="admin-table"><thead><tr><th>القانون</th><th>المصدر</th><th>ملاحظات</th><th></th></tr></thead><tbody>${customRows}</tbody></table></div></div>
      <div class="admin-content-panel" data-panel="templates"><div class="settings-card wide"><h3>قوالب المسودات والأوامر</h3><p class="muted">المرحلة 5.4: القوالب المضافة أو المعطلة هنا تنعكس فعليًا داخل مركز المسودات، والكلمات الترجيحية تساعد سَنَد في ترتيب المقترحات.</p><table class="admin-table admin-template-table"><thead><tr><th>اسم القالب</th><th>التصنيف/الكلمات</th><th>نص مخصص اختياري</th><th>الحالة</th><th></th></tr></thead><tbody>${tmplRows}</tbody></table><div class="settings-subcard"><h4>إضافة قالب جديد لمركز المسودات</h4><div class="inline-form"><input id="newTemplateTitle" placeholder="اسم القالب"><select id="newTemplateGroup"><option>استيفاءات وتحريات</option><option>تقارير وفحوص فنية</option><option>تصرفات قضائية</option><option>شهود وأطراف</option><option>أدلة رقمية</option></select><input id="newTemplateKeywords" placeholder="كلمات ترجيح: مخدرات، كاميرا، إصابة"><button class="gold-btn" onclick="addDraftTemplateAdmin()">إضافة قالب</button></div><textarea id="newTemplateBody" class="settings-textarea" rows="5" placeholder="نص القالب اختياريًا. يمكنك استخدام رموز: {{summary}} {{closest}} {{missing}} {{sources}} {{today}}"></textarea></div></div></div>
      <div class="admin-content-panel" data-panel="sand"><div class="settings-grid"><article class="settings-card"><h3>سلوك سَنَد التحليلي</h3><label>النبرة<input id="sandToneAdmin" value="${esc(data.sandProfile.tone)}"></label><label>مستوى الحذر<select id="sandStrictnessAdmin"><option value="careful" ${data.sandProfile.strictness==='careful'?'selected':''}>حذر</option><option value="balanced" ${data.sandProfile.strictness==='balanced'?'selected':''}>متوازن</option><option value="assertive" ${data.sandProfile.strictness==='assertive'?'selected':''}>أجرأ في الترجيح المبدئي</option></select></label><label>صيغة التنبيه<input id="sandConfidenceAdmin" value="${esc(data.sandProfile.defaultLegalConfidence)}"></label></article><article class="settings-card"><h3>تعليمات إضافية</h3><textarea id="sandExtraInstructionsAdmin" rows="8">${esc(data.sandProfile.extraInstructions)}</textarea><button class="gold-btn" onclick="saveSandProfileAdmin()">💾 حفظ شخصية سَنَد</button></article></div></div>
      <div class="admin-content-panel" data-panel="review"><div class="settings-card wide"><h3>مراجعة قبل النشر</h3><ul class="quality-list"><li>تأكد أن القوالب العامة لا تحتوي على أسماء أو أرقام قضايا حقيقية.</li><li>تأكد أن إضافة قانون جديد لها مصدر واضح ونسخة مراجعة.</li><li>تأكد أن شخصية سَنَد لا تقدم قرارات نهائية بل ترجيحًا مبدئيًا قابلًا للمراجعة.</li><li>صدّر نسخة احتياطية من الإعدادات قبل رفع أي تعديل كبير.</li></ul><button class="gold-btn" onclick="exportInstitutionalContent()">📦 تصدير نسخة إدارة المحتوى</button><button class="danger-soft-btn" onclick="resetInstitutionalContent()">↩️ إعادة ضبط محتوى الإدارة</button></div></div>
      <input type="file" id="institutionalContentImportInput" accept="application/json" style="display:none" onchange="handleInstitutionalContentFile(this.files&&this.files[0])">
    </section>`;
  }
  window.openInstitutionalContentAdmin=function(){
    const view=byId('appView'); if(!view) return;
    document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
    const btn=document.querySelector('[data-nav="content-admin"]'); if(btn) btn.classList.add('active');
    view.innerHTML=render();
    if(typeof closeSidebar==='function') closeSidebar();
  };
  window.setInstitutionalContentTab=setActiveTab;
  window.addCustomLaw=function(){
    const data=merged();
    const title=byId('newLawTitle')?.value?.trim(); if(!title) return toast('اكتب اسم القانون أولًا.');
    data.laws.push({title, source:byId('newLawSource')?.value?.trim()||'', notes:byId('newLawNotes')?.value?.trim()||'', addedAt:new Date().toISOString()});
    save(data); window.openInstitutionalContentAdmin(); toast('تمت إضافة القانون إلى سجل الإدارة.');
  };
  window.deleteCustomLaw=function(i){ const data=merged(); data.laws.splice(i,1); save(data); window.openInstitutionalContentAdmin(); };
  window.updateTemplateField=function(i,field,value){ const data=merged(); if(!data.templates[i]) return; data.templates[i][field]=value; save(data); };
  window.updateTemplateKeywords=function(i,value){ const data=merged(); if(!data.templates[i]) return; data.templates[i].keywords=String(value||'').split(/[،,]/).map(x=>x.trim()).filter(Boolean); save(data); };
  window.addDraftTemplateAdmin=function(){
    const data=merged(); const title=byId('newTemplateTitle')?.value?.trim(); if(!title) return toast('اكتب اسم القالب.');
    data.templates.push({id:'custom-'+Date.now(), title, group:byId('newTemplateGroup')?.value||'استيفاءات وتحريات', keywords:String(byId('newTemplateKeywords')?.value||'').split(/[،,]/).map(x=>x.trim()).filter(Boolean), body:byId('newTemplateBody')?.value||'', active:true, custom:true}); save(data); window.openInstitutionalContentAdmin(); toast('تمت إضافة القالب وربطه بمركز المسودات.');
  };
  window.deleteDraftTemplateAdmin=function(i){ const data=merged(); data.templates.splice(i,1); save(data); window.openInstitutionalContentAdmin(); };
  window.saveSandProfileAdmin=function(){
    const data=merged();
    data.sandProfile={tone:byId('sandToneAdmin')?.value||'رصين وودود', strictness:byId('sandStrictnessAdmin')?.value||'balanced', defaultLegalConfidence:byId('sandConfidenceAdmin')?.value||'ترجيح مبدئي غير ملزم', extraInstructions:byId('sandExtraInstructionsAdmin')?.value||''};
    save(data); toast('تم حفظ إعدادات شخصية سَنَد المؤسسية.');
  };
  window.exportInstitutionalContent=function(){ const blob=new Blob([JSON.stringify(merged(),null,2)],{type:'application/json;charset=utf-8'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='sand-institutional-content.json'; a.click(); URL.revokeObjectURL(a.href); };
  window.importInstitutionalContent=function(){ byId('institutionalContentImportInput')?.click(); };
  window.handleInstitutionalContentFile=async function(file){ if(!file) return; try{ const data=JSON.parse(await file.text()); save(data); window.openInstitutionalContentAdmin(); toast('تم استيراد محتوى الإدارة.'); }catch(e){ toast('تعذر استيراد الملف.'); } };
  window.resetInstitutionalContent=function(){ if(!confirm('إعادة ضبط محتوى الإدارة المحلي؟')) return; localStorage.removeItem(STORE_KEY); window.openInstitutionalContentAdmin(); toast('تمت إعادة الضبط.'); };


  // ===== المرحلة 5.4 — جسر ربط الإدارة بباقي وحدات المنصة =====
  function publicMerged(){ return merged(); }
  function groupToCategory(group){
    const g=String(group||'');
    if(/رقمي|أدلة/.test(g)) return 'digital';
    if(/فنية|فحوص|تقارير|معمل|طبي/.test(g)) return 'technical';
    if(/تصرف|قضائية|إحالة|حفظ|حبس|إخلاء/.test(g)) return 'judicial';
    if(/شهود|أطراف|متهم|مجني/.test(g)) return 'parties';
    return 'investigation';
  }
  window.SAND_ADMIN_BRIDGE={
    storeKey: STORE_KEY,
    getContent: publicMerged,
    getActiveDraftTemplates(){ return (publicMerged().templates||[]).filter(t=>t.active!==false); },
    getDraftTemplateState(id){ return (publicMerged().templates||[]).find(t=>String(t.id)===String(id)); },
    groupToCategory,
    getSandProfile(){ return publicMerged().sandProfile || {}; },
    buildSandInstructionAppendix(){
      const p=publicMerged().sandProfile||{};
      const parts=[];
      if(p.tone) parts.push(`النبرة المؤسسية المطلوبة: ${p.tone}.`);
      if(p.strictness==='assertive') parts.push('كن أجرأ في الترجيح المبدئي المشروط، ولا تكتف بجمع الوقائع عند توافر قدر كافٍ من المعلومات.');
      if(p.strictness==='careful') parts.push('التزم بحذر أعلى عند نقص الوقائع، واذكر الاحتمالات المشروطة بوضوح.');
      if(p.defaultLegalConfidence) parts.push(`صيغة التنبيه المعتمدة: ${p.defaultLegalConfidence}.`);
      if(p.extraInstructions) parts.push(`تعليمات إدارية إضافية: ${p.extraInstructions}`);
      return parts.join('\n');
    }
  };

})();
