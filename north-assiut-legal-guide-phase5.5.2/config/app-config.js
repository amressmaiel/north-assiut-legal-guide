/**
 * app-config.js — Phase 5.2
 * ملف إعدادات مركزي قابل للقراءة من كل وحدات المنصة.
 * لا يحتوي على مفاتيح سرية. أي Secret يظل داخل Cloudflare فقط.
 */
(function(){
  const DEFAULT_CONFIG = {
    version: "5.2.0-institutional-settings",
    app: {
      name: "الدليل القضائي الذكي لأعضاء النيابة العامة",
      shortName: "الدليل القضائي الذكي",
      assistantName: "سَنَد",
      direction: "rtl",
      language: "ar-EG",
      defaultFont: "Cairo",
      splashDurationMs: 7000
    },
    institutionalIdentity: {
      guidance: "بتوجيه من معالي السيد الأستاذ المستشار / أحمد فاروق المحامي العام لنيابة شمال أسيوط الكلية",
      supervision: "بإشراف الأستاذ أحمد علي عبد العال رئيس النيابة",
      development: "Programming and Development: Amr essmaiel — Manfalut Partial Prosecution 2026",
      office: "نيابة شمال أسيوط الكلية"
    },
    assets: {
      logo: "assets/images/logo.png",
      sandAvatar: "assets/images/avatar-3d.png",
      attorneyGeneral: "assets/images/attorney-general.PNG"
    },
    backend: {
      provider: "cloudflare-worker",
      proxyUrl: "https://north-assiut-legal-ai-proxy.amressmaiel.workers.dev",
      liveTokenPath: "/live-token",
      secretsPolicy: "no-secrets-in-frontend"
    },
    sand: {
      defaultAnswerMode: "executive",
      maxHistoryMessages: 6,
      liveVoiceModel: "gemini-3.1-flash-live-preview",
      defaultVoice: "Charon",
      voiceOptions: ["Charon","Orus","Gacrux","Alnilam","Iapetus"],
      defaultInteractionMode: "ptt",
      style: "legal-egyptian-professional",
      safetyNote: "مخرجات سَنَد للمراجعة المهنية وليست قرارًا قضائيًا ملزمًا."
    },
    features: {
      lawsLibrary: true,
      sandAssistant: true,
      liveVoice: true,
      caseAnalysisRoom: true,
      professionalReport: true,
      draftCenter: true,
      exportWordHtmlPrintPdf: true,
      institutionalSettingsPanel: true,
      adminWorkspace: true,
      institutionalScaffold: true
    },
    storage: {
      mode: "local-first",
      localSettingsKey: "northAssiutLegalGuide.settings.v1",
      sensitiveDataPolicy: "avoid-or-anonymize",
      plannedBackendStorage: "Cloudflare D1/KV or Node API"
    }
  };

  function deepMerge(base, extra){
    if(!extra || typeof extra !== 'object') return base;
    const out = Array.isArray(base) ? [...base] : {...base};
    Object.keys(extra).forEach(k=>{
      const bv = out[k], ev = extra[k];
      if(ev && typeof ev === 'object' && !Array.isArray(ev) && bv && typeof bv === 'object' && !Array.isArray(bv)) out[k]=deepMerge(bv, ev);
      else out[k]=ev;
    });
    return out;
  }
  function readLocal(){
    try{return JSON.parse(localStorage.getItem(DEFAULT_CONFIG.storage.localSettingsKey)||'{}')||{};}catch(_){return {};}
  }
  function saveLocal(patch){
    const current = readLocal();
    const next = deepMerge(current, patch||{});
    localStorage.setItem(DEFAULT_CONFIG.storage.localSettingsKey, JSON.stringify(next));
    window.SAND_APP_CONFIG = deepMerge(DEFAULT_CONFIG, next);
    window.dispatchEvent(new CustomEvent('sand:config-updated',{detail:{config:window.SAND_APP_CONFIG}}));
    return window.SAND_APP_CONFIG;
  }
  function resetLocal(){
    localStorage.removeItem(DEFAULT_CONFIG.storage.localSettingsKey);
    window.SAND_APP_CONFIG = deepMerge(DEFAULT_CONFIG, {});
    window.dispatchEvent(new CustomEvent('sand:config-updated',{detail:{config:window.SAND_APP_CONFIG}}));
    return window.SAND_APP_CONFIG;
  }
  window.SAND_DEFAULT_APP_CONFIG = DEFAULT_CONFIG;
  window.SAND_APP_CONFIG = deepMerge(DEFAULT_CONFIG, readLocal());
  window.SandConfig = { defaultConfig: DEFAULT_CONFIG, readLocal, saveLocal, resetLocal, deepMerge };
})();
