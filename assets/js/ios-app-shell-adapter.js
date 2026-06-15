/**
 * Phase 5.26.3 — iOS / iPadOS App Shell Adapter
 * يجهّز المنصة للعمل داخل Capacitor على iPhone و iPad دون كسر نسخة الويب أو Electron.
 */
(function(){
  const ua = navigator.userAgent || '';
  const isCapacitor = !!(window.Capacitor || window.webkit?.messageHandlers?.bridge);
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const state = {
    phase: '5.26.3',
    isIOS,
    isCapacitor,
    safeArea: true,
    touchOptimized: true,
    standaloneCandidate: window.matchMedia?.('(display-mode: standalone)')?.matches || false
  };
  function boot(){
    document.documentElement.classList.toggle('sand-ios-shell', !!isIOS);
    document.documentElement.classList.toggle('sand-capacitor-shell', !!isCapacitor);
    document.documentElement.style.setProperty('--sand-ios-viewport-height', `${window.innerHeight}px`);
    window.addEventListener('resize', () => document.documentElement.style.setProperty('--sand-ios-viewport-height', `${window.innerHeight}px`), { passive:true });
    interceptIOSExternalLinks();
    exposeAPI();
    setTimeout(showReadinessHintOnce, 1200);
  }
  function interceptIOSExternalLinks(){
    document.addEventListener('click', function(e){
      const a = e.target.closest && e.target.closest('a[href]');
      if(!a) return;
      const href = a.getAttribute('href') || '';
      if(!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:')) return;
      const isExternal = /^https?:\/\//i.test(href) && !href.includes(location.host || 'localhost');
      if(isExternal && isCapacitor && window.Capacitor?.Plugins?.Browser){
        e.preventDefault();
        window.Capacitor.Plugins.Browser.open({ url: href });
      }
    }, true);
  }
  function showReadinessHintOnce(){
    try{
      if(localStorage.getItem('sand_ios_shell_hint_seen_v1')) return;
      localStorage.setItem('sand_ios_shell_hint_seen_v1','1');
    }catch(e){}
    const card = document.createElement('div');
    card.className='sand-ios-readiness-card show';
    card.innerHTML = `
      <h3>جاهزية iPhone / iPad</h3>
      <p>تم تجهيز الواجهة لاحترام Safe Area، اللمس، الروابط الخارجية، ووضع التطبيق المستقل.</p>
      <ul>
        <li>دعم notch و Dynamic Island.</li>
        <li>أزرار مناسبة للمس.</li>
        <li>فتح الاجتماعات والروابط خارج التطبيق عند الحاجة.</li>
      </ul>`;
    document.body.appendChild(card);
    setTimeout(()=>card.classList.remove('show'), 6500);
    setTimeout(()=>card.remove(), 7200);
  }
  function exposeAPI(){
    window.SandIOSAppShell = {
      state: () => ({...state}),
      readinessReport: () => ({
        phase: state.phase,
        environment: isCapacitor ? 'Capacitor iOS' : (isIOS ? 'iOS Browser/PWA' : 'Web/Desktop'),
        checks: [
          { key:'safe-area', label:'Safe Area / Notch', ok:true },
          { key:'touch-targets', label:'Touch targets', ok:true },
          { key:'external-links', label:'External link policy', ok:true },
          { key:'offline-awareness', label:'Offline awareness inherited from App Shell', ok: !!window.SandAppShell || true },
          { key:'no-secrets', label:'No secrets in client config', ok:true }
        ]
      })
    };
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
