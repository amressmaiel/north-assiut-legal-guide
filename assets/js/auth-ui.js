// Phase 5.6 — Institutional Auth UI status and navigation controls
(function(){
  function api(){ return window.SandAuthApi || null; }
  function user(){ try { return api() && api().currentUser ? api().currentUser() : null; } catch(_) { return null; } }
  function setDisplay(selector, show){ document.querySelectorAll(selector).forEach(el=>{ el.style.display = show ? '' : 'none'; }); }
  function text(el, value){ if(el) el.textContent = value; }
  window.refreshInstitutionalAuthBar = function(){
    const u = user();
    const name = u ? (u.fullName || u.full_name || u.username || 'مستخدم') : '';
    const chip = document.getElementById('topbarUserChip');
    if (chip) {
      chip.classList.toggle('logged-in', !!u);
      chip.innerHTML = u ? `<span>جلسة مفعلة</span><b>${escapeHtml(name)}</b>` : `<span>غير مسجل</span><b>زائر</b>`;
    }
    setDisplay('.auth-login-action', !u);
    setDisplay('.auth-register-action', !u);
    setDisplay('.auth-logout-action', !!u);
    setDisplay('.auth-sidebar-logout', !!u);
  };
  function escapeHtml(v){ return String(v||'').replace(/[&<>"]/g, s=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[s])); }
  window.addEventListener('sand:auth-session-updated', window.refreshInstitutionalAuthBar);
  window.addEventListener('sand:auth-api-base-updated', window.refreshInstitutionalAuthBar);
  document.addEventListener('DOMContentLoaded', ()=>setTimeout(window.refreshInstitutionalAuthBar, 100));
})();
