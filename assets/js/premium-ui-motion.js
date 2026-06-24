/* =========================================================
   Phase 5.26.1.1 — Premium UI & Motion Layer
   Lightweight no-build UI adapter for browser/Electron/Capacitor
   ========================================================= */
(function(){
  'use strict';
  const CONFIG_KEY = 'sand_premium_ui_settings_v1';
  const defaults = { enabled:true, motion:'balanced', toasts:true, tooltips:true, pageTransitions:true, premiumSplash:true };
  function readSettings(){ try{return Object.assign({}, defaults, JSON.parse(localStorage.getItem(CONFIG_KEY)||'{}'));}catch(e){return defaults;} }
  function saveSettings(next){ localStorage.setItem(CONFIG_KEY, JSON.stringify(Object.assign(readSettings(), next||{}))); }
  const settings = readSettings();
  if(!settings.enabled) return;
  document.documentElement.classList.add('premium-ui-root');
  document.addEventListener('DOMContentLoaded', init);
  function init(){
    document.body.classList.add('premium-ui-ready');
    if(settings.motion === 'low' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) document.body.classList.add('jp-motion-low');
    if(settings.premiumSplash){ const splash=document.getElementById('appSplashScreen'); if(splash) splash.classList.add('premium-splash'); }
    decorateInteractiveCards();
    installToasts();
    installConfirmDialog();
    if(settings.tooltips) installTooltips();
    if(settings.pageTransitions) hookNavigationTransitions();
    exposeAPI();
    setTimeout(()=>window.SandPremiumUI?.toast('تم تفعيل طبقة المظهر الاحترافي','واجهة المنصة جاهزة لتجربة التطبيق المستقل.', 'success'), 900);
  }
  function decorateInteractiveCards(){
    const selectors=['.primary-btn','.gold-btn','.hero-card','.command-card','.presentation-hero','.brand-mark'];
    selectors.forEach(sel=>document.querySelectorAll(sel).forEach(el=>el.classList.add('premium-shine')));
  }
  function ensureToastStack(){
    let stack=document.querySelector('.jp-toast-stack');
    if(!stack){ stack=document.createElement('div'); stack.className='jp-toast-stack'; document.body.appendChild(stack); }
    return stack;
  }
  function toast(title,message,type='info',timeout=4200){
    if(!settings.toasts) return;
    const stack=ensureToastStack();
    const el=document.createElement('div');
    const icon= type==='success'?'✅': type==='warn'?'⚠️': type==='danger'?'⛔':'✨';
    el.className='jp-toast '+type;
    el.innerHTML=`<div class="jp-toast-icon">${icon}</div><div><div class="jp-toast-title">${escapeHtml(title)}</div><div class="jp-toast-message">${escapeHtml(message||'')}</div></div>`;
    stack.appendChild(el);
    setTimeout(()=>{ el.style.opacity='0'; el.style.transform='translateY(10px) scale(.98)'; setTimeout(()=>el.remove(),220); }, timeout);
  }
  function installToasts(){
    window.addEventListener('sand:toast', e=>{ const d=e.detail||{}; toast(d.title||'تنبيه', d.message||'', d.type||'info'); });
  }
  function confirmDialog(opts){
    opts=Object.assign({title:'تأكيد الإجراء',message:'هل تريد المتابعة؟',confirmText:'تأكيد',cancelText:'إلغاء',danger:false},opts||{});
    return new Promise(resolve=>{
      const back=document.createElement('div'); back.className='jp-confirm-backdrop';
      back.innerHTML=`<div class="jp-confirm" role="dialog" aria-modal="true"><h3>${escapeHtml(opts.title)}</h3><p>${escapeHtml(opts.message)}</p><div class="jp-confirm-actions"><button class="jp-btn ${opts.danger?'danger':'primary'}" data-confirm="yes">${escapeHtml(opts.confirmText)}</button><button class="jp-btn" data-confirm="no">${escapeHtml(opts.cancelText)}</button></div></div>`;
      document.body.appendChild(back);
      back.addEventListener('click',ev=>{ const btn=ev.target.closest('[data-confirm]'); if(!btn && ev.target!==back) return; const yes=btn && btn.dataset.confirm==='yes'; back.remove(); resolve(!!yes); });
    });
  }
  function installConfirmDialog(){ window.SandConfirm = confirmDialog; }
  function installTooltips(){
    const tip=document.createElement('div'); tip.className='jp-tooltip'; document.body.appendChild(tip);
    document.addEventListener('mouseover',ev=>{
      const target=ev.target.closest('[data-tip],[title]'); if(!target) return;
      const text=target.getAttribute('data-tip')||target.getAttribute('title'); if(!text) return;
      if(target.getAttribute('title')){ target.dataset.originalTitle=text; target.removeAttribute('title'); }
      tip.textContent=text; tip.classList.add('show');
      const r=target.getBoundingClientRect(); tip.style.left=(r.left+r.width/2)+'px'; tip.style.top=(r.top-8)+'px';
    });
    document.addEventListener('mouseout',ev=>{ if(ev.target.closest('[data-tip],[data-original-title]')) tip.classList.remove('show'); });
  }
  function hookNavigationTransitions(){
    const main=document.querySelector('main, .main-content, #mainContent, #content, .content');
    const container=main || document.querySelector('.app-main') || document.body;
    const observer=new MutationObserver(()=>{ container.classList.remove('jp-page-enter'); void container.offsetWidth; container.classList.add('jp-page-enter'); decorateInteractiveCards(); });
    observer.observe(container,{childList:true,subtree:false});
  }
  function exposeAPI(){
    window.SandPremiumUI={
      toast, confirm:confirmDialog,
      settings:readSettings,
      saveSettings,
      skeleton(target,count=3){ const el=typeof target==='string'?document.querySelector(target):target; if(!el) return; el.innerHTML=Array.from({length:count},()=>'<div class="jp-skeleton" style="height:18px;margin:10px 0"></div>').join(''); },
      empty(target,icon,title,message){ const el=typeof target==='string'?document.querySelector(target):target; if(!el) return; el.innerHTML=`<div class="jp-empty-state"><div class="icon">${icon||'⚖️'}</div><strong>${escapeHtml(title||'لا توجد بيانات')}</strong><span>${escapeHtml(message||'سيظهر المحتوى هنا عند توفره.')}</span></div>`; }
    };
  }
  function escapeHtml(s){ return String(s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
})();
