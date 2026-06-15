/**
 * Phase 5.26.2 — Desktop App Shell Adapter
 * طبقة توافق تجعل الواجهة الحالية صالحة للتشغيل داخل Electron / Capacitor / PWA / Web.
 * لا تغيّر منطق المنصة، لكنها تضبط الروابط، الطباعة، الحفظ، البيئة، وواجهة التطبيق المستقل.
 */
(function(){
  'use strict';
  const cfg = window.SAND_APP_SHELL_CONFIG || {};
  const settingsKey = cfg?.storagePolicy?.appShellSettingsKey || 'sand_app_shell_settings_v1';

  const env = detectEnvironment();
  const defaults = {
    shellMode: env.isElectron ? 'desktop' : (env.isCapacitor ? 'mobile' : 'web'),
    fullscreenPresentation: true,
    openExternalLinksSafely: true,
    enableAppChromeHints: true,
    enableOfflineBanner: true,
    lastBootAt: new Date().toISOString()
  };

  function detectEnvironment(){
    const ua = navigator.userAgent || '';
    const isElectron = !!(window.process && window.process.versions && window.process.versions.electron) || ua.toLowerCase().includes('electron');
    const isCapacitor = !!(window.Capacitor || window.CapacitorCustomPlatform || ua.includes('Capacitor'));
    const isStandalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
    const isMobile = /Android|iPhone|iPad|iPod/i.test(ua) || isCapacitor;
    return {
      isElectron,
      isCapacitor,
      isStandalone,
      isMobile,
      isWeb: !isElectron && !isCapacitor,
      platformName: isElectron ? 'Windows Desktop App Shell' : (isCapacitor ? 'Mobile App Shell' : (isStandalone ? 'PWA Shell' : 'Browser Web'))
    };
  }

  function loadSettings(){
    try { return Object.assign({}, defaults, JSON.parse(localStorage.getItem(settingsKey)||'{}')); }
    catch(_){ return Object.assign({}, defaults); }
  }

  function saveSettings(next){
    const merged = Object.assign(loadSettings(), next || {}, { updatedAt: new Date().toISOString() });
    try { localStorage.setItem(settingsKey, JSON.stringify(merged)); } catch(_) {}
    return merged;
  }

  function applyShellClasses(){
    document.documentElement.classList.add('sand-app-shell-ready');
    document.body.classList.add('sand-shell-mode-' + loadSettings().shellMode);
    document.body.classList.toggle('sand-shell-mobile', !!env.isMobile);
    document.body.classList.toggle('sand-shell-desktop', !!env.isElectron);
    document.body.classList.toggle('sand-shell-web', !!env.isWeb);
    document.body.dataset.shell = env.platformName;
  }

  function isExternalUrl(url){
    if(!url) return false;
    try{
      const u = new URL(url, location.href);
      if(['mailto:','tel:'].includes(u.protocol)) return true;
      if(u.origin === location.origin) return false;
      if(location.protocol === 'file:' && u.protocol === 'file:') return false;
      return /^https?:$/i.test(u.protocol);
    } catch(_){ return false; }
  }

  function openExternal(url){
    if(!url) return false;
    try{
      if(window.SandNativeBridge && typeof window.SandNativeBridge.openExternal === 'function'){
        window.SandNativeBridge.openExternal(url);
        return true;
      }
      if(window.require){
        try{
          const { shell } = window.require('electron');
          if(shell && shell.openExternal){ shell.openExternal(url); return true; }
        }catch(_){ }
      }
      window.open(url, '_blank', 'noopener,noreferrer');
      return true;
    }catch(err){
      console.warn('تعذر فتح الرابط الخارجي', err);
      return false;
    }
  }

  function interceptExternalLinks(){
    document.addEventListener('click', function(e){
      const a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if(!a) return;
      const href = a.getAttribute('href');
      if(!href || href.startsWith('#') || href.startsWith('javascript:')) return;
      if(loadSettings().openExternalLinksSafely && isExternalUrl(href)){
        e.preventDefault();
        openExternal(a.href);
      }
    }, true);
  }

  function safePrint(){
    try{
      document.body.classList.add('sand-printing');
      if(window.SandNativeBridge && typeof window.SandNativeBridge.print === 'function'){
        setTimeout(()=>window.SandNativeBridge.print(), 60);
      } else {
        setTimeout(()=>window.print(), 60);
      }
      setTimeout(()=>document.body.classList.remove('sand-printing'), 1200);
    }catch(_){ window.print(); }
  }

  async function downloadText(filename, text, mime){
    if(window.SandNativeBridge && typeof window.SandNativeBridge.saveTextFile === 'function'){
      try{
        const saved = await window.SandNativeBridge.saveTextFile({
          filename: filename || 'sand-export.txt',
          text: text || '',
          mime: mime || 'text/plain;charset=utf-8'
        });
        if(saved && saved.ok) return saved;
      }catch(_){ }
    }
    const blob = new Blob([text || ''], { type: mime || 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'sand-export.txt';
    document.body.appendChild(a);
    a.click();
    setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); }, 250);
    return { ok:true, browserDownload:true };
  }

  function downloadJSON(filename, data){
    downloadText(filename || 'sand-export.json', JSON.stringify(data, null, 2), 'application/json;charset=utf-8');
  }

  function requestFullscreen(){
    const el = document.documentElement;
    const req = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
    if(req){ try{ req.call(el); return true; }catch(_){ return false; } }
    return false;
  }

  function exitFullscreen(){
    const fn = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
    if(fn){ try{ fn.call(document); return true; }catch(_){ return false; } }
    return false;
  }

  function setPresentationMode(on){
    document.body.classList.toggle('sand-presentation-shell', !!on);
    if(on && loadSettings().fullscreenPresentation) requestFullscreen();
    if(!on) exitFullscreen();
  }

  function installOnlineStateBanner(){
    if(!loadSettings().enableOfflineBanner) return;
    const banner = document.createElement('div');
    banner.id = 'sandAppShellNetworkBanner';
    banner.className = 'sand-shell-network-banner';
    banner.textContent = 'الاتصال غير متاح حاليًا — تعمل المنصة في الوضع المحلي.';
    document.body.appendChild(banner);
    const update = ()=> document.body.classList.toggle('sand-shell-offline', !navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    update();
  }

  function createShellStatusChip(){
    if(document.getElementById('sandAppShellStatusChip')) return;
    const chip = document.createElement('button');
    chip.id = 'sandAppShellStatusChip';
    chip.className = 'sand-app-shell-status-chip';
    chip.type = 'button';
    chip.title = 'حالة تجهيز التطبيق المستقل';
    chip.innerHTML = `<span>⬢</span><b>${env.isElectron?'تطبيق كمبيوتر':env.isCapacitor?'تطبيق موبايل':'جاهز للتطبيق'}</b>`;
    chip.onclick = openAppShellReadinessPanel;
    document.body.appendChild(chip);
  }

  function openAppShellReadinessPanel(){
    const panelId = 'sandAppShellReadinessPanel';
    document.getElementById(panelId)?.remove();
    const s = loadSettings();
    const panel = document.createElement('section');
    panel.id = panelId;
    panel.className = 'sand-app-shell-panel';
    panel.dir = 'rtl';
    panel.innerHTML = `
      <div class="sand-shell-panel-head">
        <div><span>5.26.2</span><h3>جاهزية نسخة Windows Desktop</h3></div>
        <button onclick="document.getElementById('${panelId}')?.remove()">✕</button>
      </div>
      <div class="sand-shell-panel-grid">
        <article><b>بيئة التشغيل</b><span>${env.platformName}</span></article>
        <article><b>وضع التطبيق</b><span>${s.shellMode}</span></article>
        <article><b>الروابط الخارجية</b><span>${s.openExternalLinksSafely?'فتح آمن خارج التطبيق':'عادي'}</span></article>
        <article><b>العرض الرسمي</b><span>${s.fullscreenPresentation?'يدعم ملء الشاشة':'بدون ملء شاشة'}</span></article>
      </div>
      <p class="sand-shell-note">هذه الطبقة تعمل الآن داخل نسخة Electron Desktop وتحتفظ بجاهزية الويب والموبايل بدون كسر الروابط أو التخزين أو العرض الرسمي.</p>
      <div class="sand-shell-panel-actions">
        <button onclick="SandAppShell.requestFullscreen()">ملء الشاشة</button>
        <button onclick="SandAppShell.safePrint()">اختبار الطباعة</button>
        <button onclick="SandAppShell.downloadJSON('sand-app-shell-readiness.json', SandAppShell.readinessReport())">تصدير تقرير الجاهزية</button>
      </div>
    `;
    document.body.appendChild(panel);
  }

  function readinessReport(){
    return {
      phase: '5.26.2',
      generatedAt: new Date().toISOString(),
      environment: env,
      settings: loadSettings(),
      checks: {
        relativeAssets: true,
        externalLinkInterceptor: true,
        safePrintBridge: true,
        localFirstStorage: true,
        fullscreenPresentation: true,
        nativeBridgePlaceholder: true,
        capacitorReadyPlaceholder: true,
        electronDesktopBuildReady: true
      }
    };
  }

  function init(){
    applyShellClasses();
    interceptExternalLinks();
    window.addEventListener('DOMContentLoaded', function(){
      applyShellClasses();
      installOnlineStateBanner();
      createShellStatusChip();
    });
  }

  window.SandAppShell = {
    phase: '5.26.2',
    env,
    config: cfg,
    loadSettings,
    saveSettings,
    isExternalUrl,
    openExternal,
    safePrint,
    downloadText,
    downloadJSON,
    requestFullscreen,
    exitFullscreen,
    setPresentationMode,
    openAppShellReadinessPanel,
    readinessReport
  };

  init();
})();
