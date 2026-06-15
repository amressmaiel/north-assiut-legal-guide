/* =========================================================
   Phase 5.21 — Backup & Restore Center
   مركز النسخ الاحتياطي والاستعادة
   ========================================================= */
(function(){
  const BACKUP_HISTORY_KEY = 'sand_backup_history_v521';
  const LAST_BACKUP_KEY = 'sand_last_backup_summary_v521';
  const PHASE = '5.21';
  const MODULES = [
    {id:'settings', title:'إعدادات المنصة', icon:'⚙️', keys:['sand_platform_settings','sand_institutional_settings','sand_app_settings','sand_auth_api_settings','sand_case_files_sync_settings_v517','sand_comm_realtime_settings_v5162']},
    {id:'auth', title:'العضويات والصلاحيات والجلسات', icon:'🛡️', keys:['sand_auth_session','sand_current_user','sand_auth_membership_requests','sand_membership_requests','sand_auth_sessions','sand_access_roles','sand_user_permissions','sand_registered_devices','sand_license_devices','sand_pending_devices','sand_security_audit_log_v510','sand_access_audit_log_v510','sand_auth_audit_log']},
    {id:'training', title:'التدريب والاجتماعات', icon:'🎥', keys:['sand_training_courses_v514','sand_training_meetings_v514','sand_training_progress_v513','sand_training_attendance_v5141','sand_training_guest_attendance_v5142','sand_training_settings_v514']},
    {id:'notifications', title:'الإشعارات والتنبيهات', icon:'🔔', keys:['sand_notifications_v516','sand_notifications_settings_v516']},
    {id:'communication', title:'التواصل القضائي', icon:'💬', keys:['sand_secure_comm_messages_v5161','sand_secure_comm_requests_v5161','sand_secure_comm_trusted_v5161','sand_secure_comm_channels_v5161','sand_secure_comm_blocks_v5161','sand_secure_comm_privacy_v5161','sand_secure_comm_audit_v5161','sand_comm_realtime_queue_v5162','sand_comm_realtime_last_sync_v5162']},
    {id:'cases', title:'ملفات الوقائع والتحليلات', icon:'📁', keys:['sand_case_files_v517','sand_case_file_notes_v517','sand_case_file_drafts_v517','sand_case_file_deadlines_v517','sand_case_file_activity_v517','sand_case_file_storage_policy_v517','sand_case_file_shares_v518','sand_case_file_reviews_v518','sand_case_file_share_audit_v518']},
    {id:'legalContent', title:'إدارة المحتوى القانوني', icon:'📚', keys:['sand_legal_content_store_v519','sand_legal_content_audit_v519','sand_legal_content_settings_v519','sand_legal_content_keywords_v519','sand_legal_content_templates_v519']},
    {id:'reports', title:'التقارير والتحليلات', icon:'📊', keys:['sand_institutional_reports_settings_v520']}
  ];
  const state = { selected:new Set(MODULES.map(m=>m.id)), lastPreview:null };

  function escapeHtml(v){ return String(v ?? '').replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[s])); }
  function now(){ return new Date().toISOString(); }
  function uid(p='backup'){ return p+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8); }
  function safeParse(raw, fallback){ try{ return raw ? JSON.parse(raw) : fallback; }catch(e){ return fallback; } }
  function arr(key){ const v = safeParse(localStorage.getItem(key), []); return Array.isArray(v) ? v : []; }
  function bytes(str){ try{ return new Blob([str || '']).size; }catch(e){ return (str||'').length; } }
  function humanSize(n){ if(!n) return '0 B'; const u=['B','KB','MB','GB']; let i=0; let v=n; while(v>1024 && i<u.length-1){v/=1024;i++;} return `${v.toFixed(v>=10||i===0?0:1)} ${u[i]}`; }
  function currentUser(){ try{ if(window.SandAuth?.getCurrentUser) return SandAuth.getCurrentUser() || null; const raw = localStorage.getItem('sand_auth_session') || localStorage.getItem('sand_current_user'); return raw ? JSON.parse(raw) : null; }catch(e){ return null; } }
  function isAdmin(){
    try{ if(window.AccessControlGuard?.hasAnyRole) return AccessControlGuard.hasAnyRole(['owner','system_owner','admin','manager','auditor','backup_admin']); }catch(e){}
    const u = currentUser(); const role = String(u?.role || u?.userRole || u?.accountRole || '').toLowerCase();
    return ['owner','system_owner','admin','manager','auditor','backup'].some(r => role.includes(r));
  }
  function setMain(html){
    const main = document.getElementById('appView') || document.getElementById('mainContent') || document.querySelector('main') || document.body;
    main.innerHTML = html;
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.nav === 'backup-restore-center'));
    window.scrollTo({top:0, behavior:'smooth'});
  }
  function toast(msg){ try{ window.showToast ? window.showToast(msg) : alert(msg); }catch(e){ alert(msg); } }
  function audit(action, details){
    const history = arr(BACKUP_HISTORY_KEY);
    history.unshift({id:uid('baklog'), action, details:details||'', at:now(), by:currentUser()?.name || currentUser()?.displayName || 'local-admin'});
    localStorage.setItem(BACKUP_HISTORY_KEY, JSON.stringify(history.slice(0,100)));
  }
  function checksum(str){
    let h = 2166136261;
    for(let i=0;i<str.length;i++){ h ^= str.charCodeAt(i); h += (h<<1)+(h<<4)+(h<<7)+(h<<8)+(h<<24); }
    return ('00000000'+(h>>>0).toString(16)).slice(-8);
  }
  function moduleById(id){ return MODULES.find(m=>m.id===id); }
  function selectedModules(){ return MODULES.filter(m => state.selected.has(m.id)); }
  function collectBackup(){
    const modules = selectedModules();
    const payload = {};
    let totalKeys = 0, totalBytes = 0;
    const summary = modules.map(m => {
      const data = {};
      let count = 0, size = 0;
      m.keys.forEach(k => {
        const raw = localStorage.getItem(k);
        if(raw !== null){ data[k] = raw; count++; size += bytes(raw); totalKeys++; totalBytes += bytes(raw); }
      });
      payload[m.id] = { title:m.title, keys:data };
      return { id:m.id, title:m.title, icon:m.icon, count, size };
    });
    const body = { meta:{ app:'north-assiut-legal-guide', phase:PHASE, type:'sand-platform-backup', createdAt:now(), createdBy:currentUser()?.name || currentUser()?.displayName || 'local-admin', version:(window.PLATFORM_MANIFEST?.version || 'local'), modules:modules.map(m=>m.id), totalKeys, totalBytes }, payload };
    body.meta.checksum = checksum(JSON.stringify(body.payload));
    body.meta.summary = summary;
    return body;
  }
  function downloadText(filename, text){
    const blob = new Blob([text], {type:'application/json;charset=utf-8'});
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }
  function exportBackup(){
    const data = collectBackup();
    const json = JSON.stringify(data, null, 2);
    const stamp = new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');
    downloadText(`sand-platform-backup-${stamp}.json`, json);
    localStorage.setItem(LAST_BACKUP_KEY, JSON.stringify({at:data.meta.createdAt, modules:data.meta.modules.length, keys:data.meta.totalKeys, size:data.meta.totalBytes, checksum:data.meta.checksum}));
    audit('create_backup', `تم إنشاء نسخة احتياطية: ${data.meta.modules.length} أقسام، ${data.meta.totalKeys} مفتاح`);
    render();
  }
  function exportModule(id){ state.selected = new Set([id]); exportBackup(); state.selected = new Set(MODULES.map(m=>m.id)); }
  function toggleModule(id, checked){ checked ? state.selected.add(id) : state.selected.delete(id); render(); }
  function selectAll(v){ state.selected = new Set(v ? MODULES.map(m=>m.id) : []); render(); }
  function analyzeFile(file){
    const reader = new FileReader();
    reader.onload = () => {
      try{
        const obj = JSON.parse(reader.result);
        if(obj?.meta?.type !== 'sand-platform-backup') throw new Error('invalid');
        const expected = checksum(JSON.stringify(obj.payload || {}));
        obj._validChecksum = expected === obj.meta.checksum;
        state.lastPreview = obj;
        renderRestorePreview(obj);
      }catch(e){ toast('ملف النسخة الاحتياطية غير صالح أو غير متوافق.'); }
    };
    reader.readAsText(file, 'utf-8');
  }
  function restore(mode='merge'){
    const backup = state.lastPreview;
    if(!backup){ toast('اختار ملف نسخة احتياطية الأول.'); return; }
    if(!backup._validChecksum && !confirm('تحذير: لم يتم التحقق من سلامة checksum. هل تريد الاستمرار؟')) return;
    const mods = Object.keys(backup.payload || {});
    if(!confirm(`سيتم ${mode==='replace'?'استبدال':'دمج'} بيانات ${mods.length} قسم من النسخة الاحتياطية. هل تؤكد؟`)) return;
    if(mode === 'replace'){
      mods.forEach(id => { const mod = moduleById(id); if(mod) mod.keys.forEach(k => localStorage.removeItem(k)); });
    }
    let restored = 0;
    mods.forEach(id => {
      const keys = backup.payload[id]?.keys || {};
      Object.keys(keys).forEach(k => { localStorage.setItem(k, keys[k]); restored++; });
    });
    audit('restore_backup', `تمت الاستعادة بأسلوب ${mode} — ${restored} مفتاح`);
    toast('تمت الاستعادة بنجاح. يفضل تحديث الصفحة لمراجعة البيانات.');
    render();
  }
  function renderRestorePreview(obj){
    const rows = (obj.meta.summary || []).map(s => `<div class="brc-preview-row"><span>${s.icon||'📦'} ${escapeHtml(s.title)}</span><b>${s.count} عنصر</b><small>${humanSize(s.size)}</small></div>`).join('');
    const el = document.getElementById('brcRestorePreview');
    if(el){ el.innerHTML = `<div class="brc-preview-card"><h3>ملخص النسخة المختارة</h3><p>تاريخ الإنشاء: ${new Date(obj.meta.createdAt).toLocaleString('ar-EG')} — المرحلة: ${escapeHtml(obj.meta.phase)} — السلامة: ${obj._validChecksum?'✅ سليمة':'⚠️ تحتاج مراجعة'}</p>${rows}<div class="brc-actions"><button class="brc-btn primary" onclick="BackupRestoreCenter.restore('merge')">دمج مع البيانات الحالية</button><button class="brc-btn danger" onclick="BackupRestoreCenter.restore('replace')">استبدال البيانات الحالية</button></div></div>`; }
  }
  function moduleCards(){
    return MODULES.map(m => {
      let count=0,size=0; m.keys.forEach(k=>{ const raw=localStorage.getItem(k); if(raw!==null){count++; size+=bytes(raw);} });
      const checked = state.selected.has(m.id) ? 'checked' : '';
      return `<div class="brc-module-card"><label><input type="checkbox" ${checked} onchange="BackupRestoreCenter.toggleModule('${m.id}', this.checked)"><span>${m.icon}</span><b>${escapeHtml(m.title)}</b></label><p>${count} مفاتيح بيانات — ${humanSize(size)}</p><button class="brc-mini" onclick="BackupRestoreCenter.exportModule('${m.id}')">تصدير هذا القسم فقط</button></div>`;
    }).join('');
  }
  function historyList(){
    const h = arr(BACKUP_HISTORY_KEY).slice(0,8);
    return h.length ? h.map(x=>`<div class="brc-history-item"><b>${escapeHtml(x.action)}</b><span>${escapeHtml(x.details)}</span><small>${new Date(x.at).toLocaleString('ar-EG')} — ${escapeHtml(x.by)}</small></div>`).join('') : '<p class="brc-empty">لا يوجد سجل نسخ احتياطي حتى الآن.</p>';
  }
  function openBackupRestoreCenter(){
    if(!isAdmin()){
      setMain(`<section class="brc-page"><div class="brc-hero"><div><span class="brc-kicker">المرحلة 5.21</span><h2>مركز النسخ الاحتياطي والاستعادة</h2><p>هذه الشاشة مخصصة لمالك النظام أو أصحاب صلاحيات النسخ والاستعادة.</p></div><button class="brc-btn" onclick="goHome && goHome()">العودة لمركز القيادة</button></div></section>`);
      return;
    }
    render();
  }
  function render(){
    const selected = selectedModules();
    const preview = collectBackup();
    const last = safeParse(localStorage.getItem(LAST_BACKUP_KEY), null);
    setMain(`<section class="brc-page">
      <div class="brc-hero">
        <div><span class="brc-kicker">المرحلة 5.21</span><h2>مركز النسخ الاحتياطي والاستعادة</h2><p>مركز مؤسسي لإنشاء نسخ احتياطية كاملة أو جزئية، فحص سلامة النسخ، واستعادة البيانات بنظام دمج أو استبدال مع سجل تدقيق واضح.</p></div>
        <div class="brc-hero-actions"><button class="brc-btn primary" onclick="BackupRestoreCenter.exportBackup()">⬇️ إنشاء نسخة احتياطية</button><button class="brc-btn" onclick="BackupRestoreCenter.render()">🔄 تحديث</button></div>
      </div>
      <div class="brc-kpi-grid">
        <div class="brc-kpi"><b>${selected.length}</b><span>أقسام محددة</span></div>
        <div class="brc-kpi"><b>${preview.meta.totalKeys}</b><span>مفاتيح بيانات</span></div>
        <div class="brc-kpi"><b>${humanSize(preview.meta.totalBytes)}</b><span>الحجم التقديري</span></div>
        <div class="brc-kpi"><b>${last?new Date(last.at).toLocaleDateString('ar-EG'):'—'}</b><span>آخر نسخة</span></div>
      </div>
      <div class="brc-layout">
        <div class="brc-panel wide"><div class="brc-panel-head"><h3>اختيار بيانات النسخة الاحتياطية</h3><div><button class="brc-mini" onclick="BackupRestoreCenter.selectAll(true)">تحديد الكل</button><button class="brc-mini" onclick="BackupRestoreCenter.selectAll(false)">إلغاء الكل</button></div></div><div class="brc-modules">${moduleCards()}</div></div>
        <div class="brc-panel"><h3>استعادة نسخة احتياطية</h3><p>اختر ملف JSON تم تصديره من المنصة. سيتم فحص النوع والـ checksum قبل الاستعادة.</p><label class="brc-file"><input type="file" accept="application/json,.json" onchange="this.files[0] && BackupRestoreCenter.analyzeFile(this.files[0])"><span>📂 اختيار ملف نسخة احتياطية</span></label><div id="brcRestorePreview"></div></div>
      </div>
      <div class="brc-layout bottom"><div class="brc-panel"><h3>سجل النسخ والاستعادة</h3>${historyList()}</div><div class="brc-panel"><h3>سياسة الأمان</h3><ul class="brc-policy"><li>الاستعادة مقيدة إداريًا فقط.</li><li>يتم فحص checksum قبل الدمج أو الاستبدال.</li><li>النسخ الحالية لا تخزن ملفات مرفقة كبيرة؛ تحفظ مفاتيح وروابط البيانات فقط.</li><li>التشفير بكلمة مرور مجهز كخيار واجهة للمرحلة اللاحقة.</li></ul></div></div>
    </section>`);
    if(state.lastPreview) setTimeout(()=>renderRestorePreview(state.lastPreview),0);
  }

  window.openBackupRestoreCenter = openBackupRestoreCenter;
  window.BackupRestoreCenter = {render, exportBackup, exportModule, toggleModule, selectAll, analyzeFile, restore};
})();
