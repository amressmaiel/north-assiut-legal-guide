/**
 * admin-settings.js — Phase 5.2
 * لوحة إعدادات مؤسسية بسيطة تعمل محليًا عبر localStorage.
 */
(function(){
  function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}
  function byId(id){return document.getElementById(id);}
  function cfg(){return window.SAND_APP_CONFIG || {};}
  function toast(msg){ if(typeof judicialToast==='function') judicialToast(msg); else alert(msg); }
  function get(path, fallback=''){
    return path.split('.').reduce((o,k)=>o&&o[k], cfg()) ?? fallback;
  }
  function bool(path){ return get(path, false) !== false; }
  function patchFromForm(){
    const features = {};
    document.querySelectorAll('[data-setting-feature]').forEach(ch=>features[ch.dataset.settingFeature]=!!ch.checked);
    return {
      app:{
        name: byId('setAppName')?.value?.trim() || get('app.name'),
        shortName: byId('setShortName')?.value?.trim() || get('app.shortName'),
        assistantName: byId('setAssistantName')?.value?.trim() || get('app.assistantName'),
        splashDurationMs: Number(byId('setSplashDuration')?.value || get('app.splashDurationMs',7000))
      },
      institutionalIdentity:{
        guidance: byId('setGuidance')?.value?.trim() || '',
        supervision: byId('setSupervision')?.value?.trim() || '',
        development: byId('setDevelopment')?.value?.trim() || '',
        office: byId('setOffice')?.value?.trim() || ''
      },
      backend:{
        proxyUrl: byId('setProxyUrl')?.value?.trim() || '',
        liveTokenPath: byId('setLiveTokenPath')?.value?.trim() || '/live-token',
        authApiUrl: byId('setAuthApiUrl')?.value?.trim() || ''
      },
      sand:{
        defaultVoice: byId('setDefaultVoice')?.value || 'Charon',
        defaultAnswerMode: byId('setAnswerMode')?.value || 'executive',
        defaultInteractionMode: byId('setInteractionMode')?.value || 'ptt',
        maxHistoryMessages: Number(byId('setMaxHistory')?.value || 6),
        safetyNote: byId('setSafetyNote')?.value?.trim() || ''
      },
      features
    };
  }
  function applyVisibleConfig(){
    const c = cfg();
    document.title = c.app?.name || document.title;
    document.querySelectorAll('.brand h1').forEach(el=>el.textContent = c.app?.shortName || c.app?.name || el.textContent);
    document.querySelectorAll('.brand p,.splash-subtitle').forEach(el=>el.textContent = c.institutionalIdentity?.office || el.textContent);
    document.querySelectorAll('.splash-title').forEach(el=>el.textContent = c.app?.name || el.textContent);
    document.querySelectorAll('.splash-ai-name').forEach(el=>el.textContent = `${c.app?.assistantName||'سَنَد'} — المساعد القضائي الذكي`);
    document.querySelectorAll('.splash-supervision-line').forEach(el=>el.textContent = c.institutionalIdentity?.guidance || el.textContent);
    document.querySelectorAll('.footer').forEach(el=>el.textContent = c.institutionalIdentity?.development || el.textContent);
    if(c.backend?.proxyUrl){ window.AI_PROXY_URL = c.backend.proxyUrl; }
  }
  function renderSettingsView(){
    const c = cfg();
    const voices = (c.sand?.voiceOptions || ['Charon','Orus','Gacrux','Alnilam','Iapetus']).map(v=>`<option value="${esc(v)}" ${v===c.sand?.defaultVoice?'selected':''}>${esc(v)}</option>`).join('');
    const featureNames = [
      ['lawsLibrary','مكتبة القوانين'],['sandAssistant','مساعد سَنَد النصي'],['liveVoice','الحوار الصوتي'],['caseAnalysisRoom','غرفة تحليل الواقعة'],['professionalReport','التقرير الاحترافي'],['draftCenter','مركز المسودات'],['exportWordHtmlPrintPdf','التصدير Word / HTML / PDF'],['institutionalSettingsPanel','لوحة الإعدادات المؤسسية']
    ];
    return `<section class="admin-settings-page">
      <div class="page-title-row"><div><span class="eyebrow">إدارة مؤسسية</span><h2>⚙️ لوحة إعدادات المنصة</h2><p>تعديل آمن للإعدادات العامة محليًا من غير وضع أي مفاتيح سرية في الواجهة.</p></div><button class="gold-btn" onclick="exportSandSettings()">📤 تصدير الإعدادات</button></div>
      <div class="settings-alert">🔐 هذه اللوحة لا تحفظ أسرارًا ولا مفاتيح API. رابط Cloudflare Worker فقط يُحفظ محليًا في المتصفح. مفاتيح Gemini تظل داخل Cloudflare Secrets.</div>
      <div class="settings-grid">
        <article class="settings-card"><h3>هوية المنصة</h3>
          <label>اسم المنصة<input id="setAppName" value="${esc(get('app.name'))}"></label>
          <label>الاسم المختصر<input id="setShortName" value="${esc(get('app.shortName'))}"></label>
          <label>اسم المساعد<input id="setAssistantName" value="${esc(get('app.assistantName'))}"></label>
          <label>الجهة / المكتب<input id="setOffice" value="${esc(get('institutionalIdentity.office'))}"></label>
        </article>
        <article class="settings-card"><h3>التوجيه والإشراف</h3>
          <label>سطر التوجيه<textarea id="setGuidance">${esc(get('institutionalIdentity.guidance'))}</textarea></label>
          <label>سطر الإشراف<textarea id="setSupervision">${esc(get('institutionalIdentity.supervision'))}</textarea></label>
          <label>سطر التطوير<textarea id="setDevelopment">${esc(get('institutionalIdentity.development'))}</textarea></label>
        </article>
        <article class="settings-card"><h3>Cloudflare و سَنَد</h3>
          <label>رابط Worker الخاص بسَنَد / Gemini<input id="setProxyUrl" value="${esc(get('backend.proxyUrl'))}" dir="ltr"></label>
          <label>رابط Worker الخاص بالعضويات Auth API<input id="setAuthApiUrl" value="${esc(get('backend.authApiUrl',''))}" dir="ltr" placeholder="https://north-assiut-legal-auth-api.xxx.workers.dev"></label>
          <label>مسار live-token<input id="setLiveTokenPath" value="${esc(get('backend.liveTokenPath','/live-token'))}" dir="ltr"></label>
          <label>صوت سَنَد الافتراضي<select id="setDefaultVoice">${voices}</select></label>
          <label>نمط الإجابة الافتراضي<select id="setAnswerMode"><option value="brief">مختصر</option><option value="executive" ${get('sand.defaultAnswerMode')==='executive'?'selected':''}>تنفيذي</option><option value="detailed" ${get('sand.defaultAnswerMode')==='detailed'?'selected':''}>تفصيلي</option><option value="educational" ${get('sand.defaultAnswerMode')==='educational'?'selected':''}>تعليمي</option></select></label>
          <label>طريقة الحوار الصوتي<select id="setInteractionMode"><option value="ptt" ${get('sand.defaultInteractionMode')==='ptt'?'selected':''}>اضغط مطولًا للتحدث</option><option value="auto" ${get('sand.defaultInteractionMode')==='auto'?'selected':''}>محادثة تلقائية</option></select></label>
          <label>عدد رسائل الذاكرة<input id="setMaxHistory" type="number" min="2" max="12" value="${esc(get('sand.maxHistoryMessages',6))}"></label>
        </article>
        <article class="settings-card"><h3>المزايا النشطة</h3><div class="feature-switches">
          ${featureNames.map(([k,t])=>`<label class="switch-line"><input type="checkbox" data-setting-feature="${k}" ${bool('features.'+k)?'checked':''}> <span>${t}</span></label>`).join('')}
        </div><label>تنبيه سَنَد المهني<textarea id="setSafetyNote">${esc(get('sand.safetyNote'))}</textarea></label><label>مدة شاشة البداية بالمللي ثانية<input id="setSplashDuration" type="number" min="1000" max="15000" step="500" value="${esc(get('app.splashDurationMs',7000))}"></label></article>
      </div>
      <div class="settings-actions"><button class="gold-btn" onclick="saveSandSettingsFromPanel()">💾 حفظ الإعدادات</button><button class="soft-btn" onclick="importSandSettings()">📥 استيراد إعدادات</button><button class="danger-soft-btn" onclick="resetSandSettings()">↩️ استعادة الافتراضي</button></div>
      <input type="file" id="sandSettingsImportInput" accept="application/json" style="display:none" onchange="handleSandSettingsImportFile(this.files&&this.files[0])">
    </section>`;
  }
  window.openInstitutionalSettings = function(){
    const view = byId('appView'); if(!view) return;
    document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
    const btn = document.querySelector('[data-nav="institutional-settings"]'); if(btn) btn.classList.add('active');
    view.innerHTML = renderSettingsView();
    if(typeof closeSidebar==='function') closeSidebar();
  };
  window.saveSandSettingsFromPanel = function(){
    if(!window.SandConfig) return toast('ملف الإعدادات المركزي غير محمّل.');
    window.SandConfig.saveLocal(patchFromForm());
    applyVisibleConfig();
    toast('تم حفظ إعدادات المنصة محليًا.');
  };
  window.resetSandSettings = function(){
    if(!confirm('استعادة الإعدادات الافتراضية؟')) return;
    window.SandConfig?.resetLocal(); applyVisibleConfig(); window.openInstitutionalSettings();
    toast('تمت استعادة الإعدادات الافتراضية.');
  };
  window.exportSandSettings = function(){
    const data = JSON.stringify(window.SandConfig?.readLocal?.() || {}, null, 2);
    const blob = new Blob([data], {type:'application/json;charset=utf-8'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'sand-platform-settings.json'; a.click(); URL.revokeObjectURL(a.href);
  };
  window.importSandSettings = function(){ byId('sandSettingsImportInput')?.click(); };
  window.handleSandSettingsImportFile = async function(file){
    if(!file) return;
    try{ const data = JSON.parse(await file.text()); window.SandConfig?.saveLocal(data); applyVisibleConfig(); window.openInstitutionalSettings(); toast('تم استيراد الإعدادات.'); }
    catch(e){ toast('تعذر قراءة ملف الإعدادات.'); }
  };
  window.addEventListener('sand:config-updated', applyVisibleConfig);
  document.addEventListener('DOMContentLoaded', applyVisibleConfig);
})();
