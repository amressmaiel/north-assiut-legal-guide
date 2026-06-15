/* =========================================================
   Phase 5.26.4 — iPhone-first UI Pass
   يضيف طبقة تحسين iPhone/iPad بدون الاعتماد على Build Tools.
   ========================================================= */
(function(){
  'use strict';

  const state = {
    isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1),
    isTouch: matchMedia('(pointer: coarse)').matches,
    isStandalone: window.navigator.standalone === true || matchMedia('(display-mode: standalone)').matches,
    installed: false
  };

  function ready(fn){
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, {once:true});
    else fn();
  }

  function addBodyClasses(){
    document.body.classList.add('ios-first-pass');
    if(state.isIOS) document.body.classList.add('is-ios-device');
    if(state.isTouch) document.body.classList.add('is-touch-device');
    if(state.isStandalone) document.body.classList.add('is-standalone-app');
  }

  function safeCall(fnName){
    try{
      if(typeof window[fnName] === 'function') window[fnName]();
    }catch(err){
      console.warn('[iPhone UI Pass] failed action:', fnName, err);
    }
  }

  function createQuickDock(){
    if(document.querySelector('.iphone-quick-dock')) return;
    const dock = document.createElement('nav');
    dock.className = 'iphone-quick-dock';
    dock.setAttribute('aria-label', 'اختصارات iPhone السريعة');
    dock.innerHTML = `
      <button type="button" data-action="home"><b>⌂</b><span>الرئيسية</span></button>
      <button type="button" data-action="sand"><b>⚖</b><span>سَنَد</span></button>
      <button type="button" data-action="case"><b>📁</b><span>ملفاتي</span></button>
      <button type="button" data-action="train"><b>🎥</b><span>تدريب</span></button>
      <button type="button" data-action="menu"><b>☰</b><span>القائمة</span></button>
    `;
    dock.addEventListener('click', (e)=>{
      const btn = e.target.closest('button[data-action]');
      if(!btn) return;
      const action = btn.dataset.action;
      dock.querySelectorAll('button').forEach(b=>b.classList.remove('is-active'));
      btn.classList.add('is-active');
      if(action === 'home') safeCall('goHome');
      if(action === 'sand') safeCall('openCaseAnalysisRoom');
      if(action === 'case') safeCall('openCaseFilesCenter');
      if(action === 'train') safeCall('openTrainingCenter');
      if(action === 'menu') toggleMobileMenu();
    });
    document.body.appendChild(dock);
  }

  function toggleMobileMenu(){
    const sidebar = document.getElementById('appSidebar') || document.querySelector('.sidebar');
    if(!sidebar) return;
    sidebar.classList.toggle('mobile-open');
    document.body.classList.toggle('sidebar-mobile-open', sidebar.classList.contains('mobile-open'));
  }

  function normalizeInputs(){
    document.querySelectorAll('input, textarea, select').forEach(el=>{
      if(!el.dataset.iosFontFixed){
        el.dataset.iosFontFixed = '1';
        const fs = parseFloat(getComputedStyle(el).fontSize || '16');
        if(fs < 16) el.style.fontSize = '16px';
      }
    });
  }

  function preventDoubleTapZoom(){
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(event){
      const now = Date.now();
      if(now - lastTouchEnd <= 300) event.preventDefault();
      lastTouchEnd = now;
    }, {passive:false});
  }

  function addReadinessApi(){
    window.openIOSReadinessPanel = function(){
      const target = document.getElementById('mainContent') || document.querySelector('main') || document.querySelector('.content-area') || document.body;
      const html = `
        <section class="ios-readiness-panel">
          <h2>جاهزية تجربة iPhone / iPad</h2>
          <p>فحص سريع للعناصر التي تهم نسخة iOS قبل البناء على Xcode وTestFlight.</p>
          <div class="ios-readiness-grid">
            <div class="ios-readiness-item"><strong>Safe Area</strong><span>${state.isIOS ? 'نشط على جهاز iOS' : 'مجهز ويظهر فعليًا على iPhone/iPad'}</span></div>
            <div class="ios-readiness-item"><strong>Touch Targets</strong><span>الأزرار الأساسية لا تقل عن 48px للمس المريح.</span></div>
            <div class="ios-readiness-item"><strong>Input Zoom</strong><span>حقول الإدخال مثبتة على 16px لمنع تكبير iOS التلقائي.</span></div>
            <div class="ios-readiness-item"><strong>Quick Dock</strong><span>شريط اختصارات سفلي مناسب للاستخدام بيد واحدة.</span></div>
            <div class="ios-readiness-item"><strong>Standalone</strong><span>${state.isStandalone ? 'يعمل كوضع تطبيق مستقل' : 'جاهز لوضع التطبيق المستقل بعد Capacitor'}</span></div>
            <div class="ios-readiness-item"><strong>External Links</strong><span>الروابط والاجتماعات محفوظة بسياسة فتح آمنة.</span></div>
          </div>
        </section>`;
      target.insertAdjacentHTML('afterbegin', html);
      window.scrollTo({top:0, behavior:'smooth'});
      if(window.showPremiumToast) window.showPremiumToast('تم فتح فحص جاهزية iPhone', 'success');
    };
  }

  function bindDynamicObserver(){
    const mo = new MutationObserver(()=> normalizeInputs());
    mo.observe(document.documentElement, {childList:true, subtree:true});
  }

  ready(()=>{
    addBodyClasses();
    createQuickDock();
    normalizeInputs();
    preventDoubleTapZoom();
    addReadinessApi();
    bindDynamicObserver();
    state.installed = true;
    window.SAND_IOS_FIRST_UI_PASS = state;
    console.info('[SAND] iPhone-first UI Pass active', state);
  });
})();
