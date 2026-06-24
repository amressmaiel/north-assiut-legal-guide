/* =========================================================
   Phase 5.26.6 — Android App Shell Adapter
   Detects Capacitor Android runtime and applies safer mobile behavior.
   ========================================================= */
(function () {
  const ua = navigator.userAgent || '';
  const isAndroidUA = /Android/i.test(ua);
  const isCapacitor = !!(window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform());
  const platform = window.Capacitor && typeof window.Capacitor.getPlatform === 'function' ? window.Capacitor.getPlatform() : '';
  const isAndroid = platform === 'android' || (isAndroidUA && (isCapacitor || window.matchMedia('(display-mode: standalone)').matches));

  window.SAND_ANDROID_APP_SHELL = {
    isAndroid,
    isCapacitor,
    platform: platform || (isAndroidUA ? 'android-web' : 'web'),
    version: '5.26.6',
    externalLinkPolicy: 'open-outside-app',
    storagePolicy: 'web-core-local-first'
  };

  if (!isAndroid) return;

  document.documentElement.classList.add('sand-env-android');
  document.body.classList.add('sand-env-android');

  function showHint(message) {
    let el = document.querySelector('.android-native-hint');
    if (!el) {
      el = document.createElement('div');
      el.className = 'android-native-hint';
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.remove('show'), 2600);
  }

  document.addEventListener('click', function (event) {
    const a = event.target.closest && event.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    if (/^(https?:|mailto:|tel:)/i.test(href) && !href.includes(location.host)) {
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
    }
  }, true);

  window.openAndroidShellReadiness = function () {
    const summary = [
      'Android App Shell: جاهز مبدئيًا',
      'Capacitor: ' + (isCapacitor ? 'Native' : 'Web/Preview'),
      'Platform: ' + (platform || 'android-web'),
      'External links: outside app',
      'Touch targets: 48px minimum'
    ].join('\n');
    if (window.SAND_PREMIUM_UI && window.SAND_PREMIUM_UI.toast) {
      window.SAND_PREMIUM_UI.toast(summary, 'info');
    } else {
      showHint(summary.replace(/\n/g, ' — '));
    }
    return window.SAND_ANDROID_APP_SHELL;
  };
})();
