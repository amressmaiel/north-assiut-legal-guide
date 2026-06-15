/**
 * secure-communication-center.js — Phase 5.16.1
 * مركز التواصل القضائي الآمن + الزملاء الموثوقون + طبقات الخصوصية.
 * ملاحظة تنفيذية: النسخة الحالية Frontend/Local-first، وجاهزة لاحقًا للربط بــ Backend/Realtime.
 */
(function(){
  const MEMBERS_KEY='sand_comm_members_v1';
  const PRIVACY_KEY='sand_comm_privacy_v1';
  const CONNECTIONS_KEY='sand_comm_connections_v1';
  const REQUESTS_KEY='sand_comm_requests_v1';
  const BLOCKS_KEY='sand_comm_blocks_v1';
  const THREADS_KEY='sand_comm_threads_v1';
  const GROUPS_KEY='sand_comm_groups_v1';
  const MESSAGES_KEY='sand_comm_messages_v1';
  const AUDIT_KEY='sand_comm_audit_v1';
  const AUTH_MEMBERSHIP_KEY='sand_membership_requests_v1';

  function e(v){ return typeof window.esc==='function' ? window.esc(v) : String(v??'').replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[m])); }
  function readJson(k,f){ try{ const v=JSON.parse(localStorage.getItem(k)||'null'); return v??f; }catch{ return f; } }
  function writeJson(k,v){ localStorage.setItem(k,JSON.stringify(v)); }
  function arr(v){ return Array.isArray(v)?v:[]; }
  function id(p='cm'){ return `${p}_${Date.now()}_${Math.random().toString(16).slice(2,8)}`; }
  function now(){ return new Date().toISOString(); }
  function fmt(iso){ try{return new Date(iso).toLocaleString('ar-EG-u-nu-arab',{dateStyle:'medium',timeStyle:'short'});}catch{return '—';} }
  function currentUser(){ return window.SandAuthApi?.currentUser?.() || null; }
  function isOwner(){ const u=currentUser(); return !!(u&&(u.isSuperOwner||u.is_super_owner||u.role==='owner'||u.role==='super_owner')); }
  function hasPerm(p){ return !!window.SandAuthApi?.hasPermission?.(p); }
  function canAdmin(){ return isOwner() || hasPerm('chat.admin') || hasPerm('chat.announcement.send') || hasPerm('users.manage'); }
  function canCreateGroup(){ return canAdmin() || hasPerm('chat.group.create'); }
  function uid(){ const u=currentUser(); return String(u?.id||u?.userId||u?.email||u?.username||'local_owner'); }
  function userName(){ const u=currentUser(); return u?(u.fullName||u.full_name||u.name||u.username||'مستخدم المنصة'):'مالك النظام المحلي'; }
  function userRole(){ const u=currentUser(); return u?(u.roleLabel||u.role_name||u.role||'عضو'):'مالك النظام'; }
  function userOrg(){ const u=currentUser(); return u?(u.office||u.organization||u.prosecution||u.department||'نيابة شمال أسيوط الكلية'):'نيابة شمال أسيوط الكلية'; }
  function toast(msg){ if(window.showToast) window.showToast(msg); else alert(msg); }
  function notify(n){ try{ window.SandNotifications?.create?.(Object.assign({category:'account',priority:'normal',source:'secure-communication',fingerprint:`comm-${Date.now()}-${Math.random()}`},n||{})); }catch{} }
  function audit(action,details){ const a=arr(readJson(AUDIT_KEY,[])); a.unshift({id:id('audit'),at:now(),actorId:uid(),actorName:userName(),action,details:details||{}}); writeJson(AUDIT_KEY,a.slice(0,300)); }

  const DEFAULT_MEMBERS=[
    {id:'member_training_supervisor',name:'مشرف التدريب القضائي',role:'مشرف تدريب',org:'نيابة شمال أسيوط الكلية',badge:'عضو معتمد',status:'available'},
    {id:'member_admin_support',name:'الدعم المؤسسي للمنصة',role:'دعم فني وإداري',org:'إدارة المنصة',badge:'جهة رسمية',status:'available'},
    {id:'member_north_assiut_a',name:'عضو نيابة — شمال أسيوط',role:'عضو نيابة',org:'نيابة شمال أسيوط الكلية',badge:'عضو معتمد',status:'busy'},
    {id:'member_training_guestless',name:'منسق الاجتماعات والتدريب',role:'منسق تدريب',org:'مركز التدريب المرئي',badge:'عضو معتمد',status:'available'}
  ];

  function ensureMembers(){
    const existing=arr(readJson(MEMBERS_KEY,[]));
    const me={id:uid(),name:userName(),role:userRole(),org:userOrg(),badge:canAdmin()?'إدارة':'عضو معتمد',status:'available',isMe:true};
    const fromRequests=arr(readJson(AUTH_MEMBERSHIP_KEY,[])).map((r,i)=>({
      id:String(r.id||r.email||`membership_${i}`),
      name:r.fullName||r.full_name||r.name||r.username||`عضو رقم ${i+1}`,
      role:r.role||r.position||'عضو',
      org:r.office||r.organization||r.prosecution||'غير محدد',
      badge:(r.status==='approved'||r.status==='active')?'عضو معتمد':'عضوية قيد المراجعة',
      status:'available'
    }));
    const merged=[me,...DEFAULT_MEMBERS,...fromRequests,...existing];
    const seen=new Map();
    merged.forEach(m=>{ if(m&&m.id&&!seen.has(String(m.id))) seen.set(String(m.id),Object.assign({status:'available'},m)); });
    const list=Array.from(seen.values());
    writeJson(MEMBERS_KEY,list);
    return list;
  }
  function members(){ return ensureMembers(); }
  function member(mid){ return members().find(m=>String(m.id)===String(mid)); }
  function privacy(){
    const all=readJson(PRIVACY_KEY,{});
    const mine=all[uid()]||{};
    return Object.assign({discoverability:'all',requestFrom:'same_org',directFrom:'trusted_admin',statusVisible:'trusted',groupInvite:'approval',showOrg:true,showRole:true},mine);
  }
  function savePrivacy(p){ const all=readJson(PRIVACY_KEY,{}); all[uid()]=Object.assign(privacy(),p||{}); writeJson(PRIVACY_KEY,all); audit('privacy.update',p); }
  function requests(){ return arr(readJson(REQUESTS_KEY,[])); }
  function saveRequests(v){ writeJson(REQUESTS_KEY,arr(v)); }
  function connections(){ return arr(readJson(CONNECTIONS_KEY,[])); }
  function saveConnections(v){ writeJson(CONNECTIONS_KEY,arr(v)); }
  function blocks(){ return arr(readJson(BLOCKS_KEY,[])); }
  function saveBlocks(v){ writeJson(BLOCKS_KEY,arr(v)); }
  function messages(){ return arr(readJson(MESSAGES_KEY,[])); }
  function saveMessages(v){ writeJson(MESSAGES_KEY,arr(v)); }
  function groups(){ const g=arr(readJson(GROUPS_KEY,[])); if(!g.length){ const defaults=[
      {id:'group_announcements',name:'إعلانات الإدارة',type:'announcement',description:'قناة رسمية للقراءة فقط، مخصصة للتوجيهات والتنبيهات العامة.',members:[uid(),'member_admin_support'],admins:[uid()],readOnly:true,createdAt:now()},
      {id:'group_training',name:'مناقشات التدريب المرئي',type:'training',description:'مساحة نقاش مرتبطة بمركز التدريب المرئي والاجتماعات المباشرة.',members:[uid(),'member_training_supervisor','member_training_guestless'],admins:[uid(),'member_training_supervisor'],readOnly:false,createdAt:now()},
      {id:'group_support',name:'الدعم الفني للمنصة',type:'support',description:'قناة للتواصل مع الدعم المؤسسي حول التشغيل والمشكلات الفنية.',members:[uid(),'member_admin_support'],admins:[uid(),'member_admin_support'],readOnly:false,createdAt:now()}
    ]; writeJson(GROUPS_KEY,defaults); return defaults; } return g; }
  function saveGroups(v){ writeJson(GROUPS_KEY,arr(v)); }
  function threadIdFor(a,b){ return ['direct',String(a),String(b)].sort().join('__'); }
  function isBlocked(mid){ return blocks().some(b=>b.ownerId===uid()&&b.memberId===mid); }
  function blockedMe(mid){ return blocks().some(b=>b.ownerId===mid&&b.memberId===uid()); }
  function isTrusted(mid){ return connections().some(c=>c.status==='accepted' && ((c.a===uid()&&c.b===mid)||(c.a===mid&&c.b===uid()))); }
  function canDirect(mid){ if(mid===uid()) return false; if(isBlocked(mid)||blockedMe(mid)) return false; return canAdmin() || isTrusted(mid); }
  function pendingBetween(mid){ return requests().find(r=>r.status==='pending' && ((r.fromId===uid()&&r.toId===mid)||(r.fromId===mid&&r.toId===uid()))); }
  function outgoing(){ return requests().filter(r=>r.fromId===uid()&&r.status==='pending'); }
  function incoming(){ return requests().filter(r=>r.toId===uid()&&r.status==='pending'); }
  function trusted(){ return connections().filter(c=>c.status==='accepted'&&(c.a===uid()||c.b===uid())).map(c=>member(c.a===uid()?c.b:c.a)).filter(Boolean); }

  function css(){
    if(document.getElementById('secureCommunicationStyles')) return;
    document.head.insertAdjacentHTML('beforeend',`<style id="secureCommunicationStyles">
      .comm-shell{padding:26px;display:flex;flex-direction:column;gap:18px}.comm-hero{position:relative;overflow:hidden;border:1px solid rgba(218,176,83,.35);border-radius:28px;background:radial-gradient(circle at 15% 15%,rgba(218,176,83,.22),transparent 35%),linear-gradient(135deg,#090806,#171107 65%,#050505);padding:28px;box-shadow:0 22px 65px rgba(0,0,0,.35)}.comm-hero:before{content:"";position:absolute;inset:-80px auto auto -80px;width:260px;height:260px;border-radius:50%;background:rgba(218,176,83,.12);filter:blur(18px)}.comm-hero-grid{display:grid;grid-template-columns:1.4fr .8fr;gap:18px;align-items:center}.comm-kicker{display:inline-flex;gap:8px;align-items:center;color:#f4d381;font-weight:800;letter-spacing:.5px}.comm-hero h2{margin:8px 0 8px;color:#fff;font-size:30px}.comm-hero p{margin:0;color:#e8dcc0;line-height:1.9}.comm-identity-card{border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);border-radius:22px;padding:16px;backdrop-filter:blur(12px)}.comm-identity-card b{display:block;color:#fff;font-size:18px}.comm-identity-card span{color:#d6c299}.comm-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.comm-stat{border:1px solid rgba(218,176,83,.24);border-radius:20px;background:linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.03));padding:15px}.comm-stat small{display:block;color:#cbb885}.comm-stat b{font-size:25px;color:#fff}.comm-tabs{display:flex;gap:8px;flex-wrap:wrap}.comm-tab{border:1px solid rgba(218,176,83,.22);background:rgba(15,12,7,.78);color:#f5dfad;border-radius:999px;padding:10px 15px;cursor:pointer;font-family:Cairo}.comm-tab.active{background:linear-gradient(135deg,#d7a83e,#7c5516);color:#111;font-weight:900}.comm-grid{display:grid;grid-template-columns:310px 1fr 300px;gap:16px}.comm-panel{border:1px solid rgba(218,176,83,.22);border-radius:24px;background:rgba(10,10,10,.73);box-shadow:0 16px 45px rgba(0,0,0,.22);padding:16px;color:#f4ead2}.comm-panel h3{margin:0 0 12px;color:#f6d78a}.comm-list{display:flex;flex-direction:column;gap:10px;max-height:620px;overflow:auto;padding-left:3px}.comm-item{border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.045);border-radius:18px;padding:12px;cursor:pointer}.comm-item:hover{border-color:rgba(218,176,83,.45);background:rgba(218,176,83,.08)}.comm-item.active{border-color:#d7a83e;background:rgba(218,176,83,.14)}.comm-item b{display:block;color:#fff}.comm-item small{color:#c9b98f}.comm-badges{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.comm-badge{font-size:12px;border:1px solid rgba(218,176,83,.25);background:rgba(218,176,83,.1);color:#f5d992;border-radius:999px;padding:3px 8px}.comm-search{display:flex;gap:10px;margin-bottom:12px}.comm-input,.comm-select,.comm-textarea{width:100%;border:1px solid rgba(218,176,83,.22);border-radius:16px;background:rgba(255,255,255,.06);color:#fff;padding:12px;font-family:Cairo;outline:none}.comm-input::placeholder,.comm-textarea::placeholder{color:#bfae86}.comm-select option{background:#171107;color:#fff}.comm-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.comm-btn{border:0;border-radius:14px;background:rgba(255,255,255,.08);color:#fff;padding:10px 13px;font-family:Cairo;cursor:pointer}.comm-btn.gold{background:linear-gradient(135deg,#f1cf76,#9d711f);color:#100d07;font-weight:900}.comm-btn.red{background:rgba(180,45,45,.25);color:#ffd0d0}.comm-btn:disabled{opacity:.45;cursor:not-allowed}.comm-chat{display:flex;flex-direction:column;min-height:560px}.comm-chat-head{border-bottom:1px solid rgba(255,255,255,.1);padding-bottom:12px;margin-bottom:12px}.comm-messages{flex:1;display:flex;flex-direction:column;gap:10px;max-height:520px;overflow:auto;padding:6px}.comm-msg{max-width:78%;border:1px solid rgba(255,255,255,.1);border-radius:18px;padding:11px 13px;background:rgba(255,255,255,.06)}.comm-msg.mine{align-self:flex-start;background:rgba(218,176,83,.16);border-color:rgba(218,176,83,.28)}.comm-msg.other{align-self:flex-end}.comm-msg small{display:block;color:#cab98d;margin-top:6px}.comm-composer{display:flex;gap:10px;margin-top:12px}.comm-composer textarea{min-height:52px;resize:vertical}.comm-empty{border:1px dashed rgba(218,176,83,.25);border-radius:20px;padding:28px;text-align:center;color:#d7c6a0;background:rgba(255,255,255,.035)}.comm-profile-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px}.comm-privacy-row{border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:12px;margin-bottom:10px;background:rgba(255,255,255,.04)}.comm-privacy-row label{display:block;color:#f6d78a;margin-bottom:8px;font-weight:800}.comm-section-title{margin:20px 0 10px;color:#f5d992}.comm-admin-strip{border:1px solid rgba(218,176,83,.3);background:linear-gradient(135deg,rgba(218,176,83,.13),rgba(255,255,255,.04));border-radius:20px;padding:14px;margin-bottom:14px}.comm-warning{color:#ffdd9c;border:1px solid rgba(255,189,74,.22);background:rgba(255,189,74,.08);border-radius:16px;padding:12px;line-height:1.8}@media(max-width:1100px){.comm-grid,.comm-hero-grid{grid-template-columns:1fr}.comm-stats{grid-template-columns:repeat(2,1fr)}}@media(max-width:680px){.comm-shell{padding:14px}.comm-stats{grid-template-columns:1fr}.comm-composer{flex-direction:column}.comm-msg{max-width:96%}}
    </style>`);
  }

  function stats(){ return {trusted:trusted().length,incoming:incoming().length,outgoing:outgoing().length,groups:groups().filter(g=>arr(g.members).includes(uid())||canAdmin()).length,unread:messages().filter(m=>arr(m.readBy).indexOf(uid())===-1&&m.senderId!==uid()).length}; }
  function baseLayout(active='inbox',content=''){
    css(); ensureMembers(); const st=stats();
    return `<section class="comm-shell">
      <div class="comm-hero">
        <div class="comm-hero-grid">
          <div><span class="comm-kicker">💬 مرحلة 5.16.1 — تواصل مؤسسي آمن</span><h2>مركز التواصل القضائي الآمن</h2><p>منظومة تواصل داخلية للأعضاء فقط، قائمة على الزملاء الموثوقين وطلبات التواصل المتبادلة، مع قنوات رسمية للإدارة والتدريب والدعم، وطبقات خصوصية تمنع الفوضى وتحافظ على هيبة المنصة.</p></div>
          <div class="comm-identity-card"><b>${e(userName())}</b><span>${e(userRole())} — ${e(userOrg())}</span><div class="comm-badges"><span class="comm-badge">🔐 عضو فقط</span><span class="comm-badge">🤝 موافقة متبادلة</span><span class="comm-badge">🛡️ سجل تدقيق</span></div></div>
        </div>
      </div>
      <div class="comm-stats"><div class="comm-stat"><small>زملاء موثوقون</small><b>${st.trusted}</b></div><div class="comm-stat"><small>طلبات واردة</small><b>${st.incoming}</b></div><div class="comm-stat"><small>طلبات مرسلة</small><b>${st.outgoing}</b></div><div class="comm-stat"><small>قنوات ومجموعات</small><b>${st.groups}</b></div></div>
      <div class="comm-tabs">
        ${tab('inbox','المحادثات والقنوات',active)}${tab('members','البحث عن الأعضاء',active)}${tab('trusted','الزملاء الموثوقون',active)}${tab('requests','طلبات التواصل',active)}${tab('privacy','الخصوصية',active)}${canAdmin()?tab('admin','الإعلانات الرسمية',active):''}
      </div>
      ${content}
    </section>`;
  }
  function tab(idt,label,active){ return `<button class="comm-tab ${active===idt?'active':''}" onclick="openSecureCommunicationCenter('${idt}')">${label}</button>`; }
  function render(active='inbox'){
    window.__sandCommLastTab=active;
    if(typeof closeSidebar==='function') closeSidebar(); if(typeof setActiveNav==='function') setActiveNav('secure-communication-center');
    const view=document.getElementById('appView'); if(!view) return;
    const map={inbox:renderInbox,members:renderMembers,trusted:renderTrusted,requests:renderRequests,privacy:renderPrivacy,admin:renderAdmin};
    view.innerHTML=baseLayout(active,(map[active]||renderInbox)());
  }
  function renderInbox(){
    const convs=trusted().map(m=>({kind:'direct',id:threadIdFor(uid(),m.id),label:m.name,sub:`${m.role||'عضو'} — ${m.org||''}`,memberId:m.id,icon:'👤'}));
    const gs=groups().filter(g=>arr(g.members).includes(uid())||canAdmin()).map(g=>({kind:'group',id:g.id,label:g.name,sub:g.description||'مجموعة تواصل',group:g,icon:g.type==='announcement'?'📢':g.type==='training'?'🎥':'💬'}));
    const all=[...gs,...convs];
    const selected=window.__sandCommSelected || (all[0]?{kind:all[0].kind,id:all[0].id,memberId:all[0].memberId}:null);
    if(!selected && all[0]) window.__sandCommSelected={kind:all[0].kind,id:all[0].id,memberId:all[0].memberId};
    const list=all.map(x=>`<div class="comm-item ${selected&&selected.id===x.id?'active':''}" onclick="selectCommThread('${e(x.kind)}','${e(x.id)}','${e(x.memberId||'')}')"><b>${x.icon} ${e(x.label)}</b><small>${e(x.sub)}</small>${x.kind==='group'&&x.group?.readOnly?'<div class="comm-badges"><span class="comm-badge">قراءة فقط</span></div>':''}</div>`).join('') || `<div class="comm-empty">لم يتم إنشاء محادثات بعد. ابدأ بإضافة زملاء موثوقين أو ادخل قنوات الإدارة والتدريب.</div>`;
    return `<div class="comm-grid"><div class="comm-panel"><h3>المحادثات والقنوات</h3><div class="comm-list">${list}</div>${canCreateGroup()?'<div class="comm-actions"><button class="comm-btn gold" onclick="openCreateGroupModal()">+ إنشاء مجموعة</button></div>':''}</div><div class="comm-panel comm-chat">${renderChat(selected)}</div><div class="comm-panel"><h3>قواعد التواصل</h3><div class="comm-warning">المحادثة الفردية لا تُفتح إلا بعد قبول طلب التواصل من الطرفين. الإدارة والقنوات الرسمية لها صلاحية إرسال إعلانات عامة دون فتح بيانات المنصة للضيوف.</div><h3 class="comm-section-title">اختصارات</h3><div class="comm-actions"><button class="comm-btn" onclick="openSecureCommunicationCenter('members')">بحث عن عضو</button><button class="comm-btn" onclick="openSecureCommunicationCenter('requests')">طلبات التواصل</button><button class="comm-btn" onclick="openNotificationsCenter&&openNotificationsCenter()">الإشعارات</button></div></div></div>`;
  }
  function renderChat(sel){
    if(!sel) return `<div class="comm-empty">اختر محادثة أو قناة من القائمة لبدء التواصل.</div>`;
    const isGroup=sel.kind==='group'; const g=isGroup?groups().find(x=>x.id===sel.id):null; const m=!isGroup?member(sel.memberId):null;
    const title=isGroup?g?.name:m?.name; const subtitle=isGroup?(g?.description||'مجموعة تواصل'):`${m?.role||'عضو'} — ${m?.org||''}`;
    const canSend=isGroup?(!g?.readOnly || canAdmin() || arr(g?.admins).includes(uid())):canDirect(sel.memberId);
    const tId=isGroup?sel.id:threadIdFor(uid(),sel.memberId);
    const msgs=messages().filter(x=>x.threadId===tId).sort((a,b)=>new Date(a.at)-new Date(b.at));
    msgs.forEach(mm=>{ mm.readBy=Array.from(new Set([...(mm.readBy||[]),uid()])); }); saveMessages(messages());
    const body=msgs.map(mm=>`<div class="comm-msg ${mm.senderId===uid()?'mine':'other'}"><b>${e(mm.senderName||'عضو')}</b><div>${e(mm.text)}</div><small>${fmt(mm.at)} ${arr(mm.readBy).length>1?'— تمت القراءة':''}</small></div>`).join('') || `<div class="comm-empty">لا توجد رسائل بعد. ابدأ الحوار برسالة واضحة ومختصرة.</div>`;
    return `<div class="comm-chat-head"><h3>${isGroup?(g?.type==='announcement'?'📢':'💬'):'👤'} ${e(title||'محادثة')}</h3><small>${e(subtitle||'')}</small>${isGroup&&g?.readOnly?'<div class="comm-badges"><span class="comm-badge">قناة رسمية — قراءة فقط للأعضاء</span></div>':''}</div><div class="comm-messages" id="commMessagesList">${body}</div>${canSend?`<div class="comm-composer"><textarea class="comm-textarea" id="commMessageText" placeholder="اكتب رسالة داخلية آمنة..."></textarea><button class="comm-btn gold" onclick="sendCommMessage('${e(sel.kind)}','${e(tId)}','${e(sel.memberId||'')}')">إرسال</button></div>`:`<div class="comm-warning">لا يمكنك الإرسال هنا حاليًا. المحادثات الفردية تتطلب زميلًا موثوقًا، والقنوات الرسمية قد تكون قراءة فقط.</div>`}`;
  }
  function renderMembers(){
    const q=String(window.__sandCommSearch||'').toLowerCase(); const p=privacy();
    const rows=members().filter(m=>m.id!==uid()).filter(m=>!q||`${m.name} ${m.role} ${m.org}`.toLowerCase().includes(q)).map(m=>memberCard(m)).join('') || `<div class="comm-empty">لا توجد نتائج مطابقة.</div>`;
    return `<div class="comm-grid"><div class="comm-panel"><h3>بحث آمن عن الأعضاء</h3><input class="comm-input" placeholder="ابحث بالاسم أو الجهة أو الدور..." value="${e(window.__sandCommSearch||'')}" oninput="window.__sandCommSearch=this.value;openSecureCommunicationCenter('members')"><div class="comm-warning" style="margin-top:10px">ظهور الأعضاء واحتمال إرسال الطلبات يخضع لإعدادات الخصوصية. النسخة الحالية محلية وجاهزة للربط بالسيرفر لاحقًا.</div></div><div class="comm-panel" style="grid-column:span 2"><h3>نتائج البحث</h3><div class="comm-list">${rows}</div></div></div>`;
  }
  function memberCard(m){
    const pending=pendingBetween(m.id); const trustedNow=isTrusted(m.id); const blocked=isBlocked(m.id); const canMsg=canDirect(m.id);
    const actions=[];
    if(trustedNow) actions.push(`<button class="comm-btn gold" onclick="selectCommThread('direct','${e(threadIdFor(uid(),m.id))}','${e(m.id)}');openSecureCommunicationCenter('inbox')">مراسلة</button>`);
    else if(pending) actions.push(`<button class="comm-btn" disabled>${pending.fromId===uid()?'طلب مرسل':'طلب وارد'}</button>`);
    else if(!blocked) actions.push(`<button class="comm-btn gold" onclick="sendConnectionRequest('${e(m.id)}')">إرسال طلب تواصل</button>`);
    if(blocked) actions.push(`<button class="comm-btn" onclick="unblockCommMember('${e(m.id)}')">إلغاء الحظر</button>`); else actions.push(`<button class="comm-btn red" onclick="blockCommMember('${e(m.id)}')">حظر</button>`);
    return `<div class="comm-item"><b>${e(m.name)}</b><small>${e(m.role||'عضو')} — ${e(m.org||'غير محدد')}</small><div class="comm-badges"><span class="comm-badge">${e(m.badge||'عضو')}</span><span class="comm-badge">${m.status==='busy'?'مشغول':'متاح'}</span>${trustedNow?'<span class="comm-badge">زميل موثوق</span>':''}${blocked?'<span class="comm-badge">محظور</span>':''}</div><div class="comm-actions">${actions.join('')}</div></div>`;
  }
  function renderTrusted(){
    const rows=trusted().map(m=>`<div class="comm-item"><b>🤝 ${e(m.name)}</b><small>${e(m.role)} — ${e(m.org)}</small><div class="comm-actions"><button class="comm-btn gold" onclick="selectCommThread('direct','${e(threadIdFor(uid(),m.id))}','${e(m.id)}');openSecureCommunicationCenter('inbox')">مراسلة</button><button class="comm-btn" onclick="removeTrustedMember('${e(m.id)}')">إزالة من الزملاء</button><button class="comm-btn red" onclick="blockCommMember('${e(m.id)}')">حظر</button></div></div>`).join('') || `<div class="comm-empty">لا يوجد زملاء موثوقون حتى الآن. ابحث عن الأعضاء وأرسل طلب تواصل.</div>`;
    const blocked=blocks().filter(b=>b.ownerId===uid()).map(b=>member(b.memberId)).filter(Boolean).map(m=>`<div class="comm-item"><b>🚫 ${e(m.name)}</b><small>${e(m.role)} — ${e(m.org)}</small><div class="comm-actions"><button class="comm-btn" onclick="unblockCommMember('${e(m.id)}')">إلغاء الحظر</button></div></div>`).join('') || `<div class="comm-empty">لا يوجد أعضاء محظورون.</div>`;
    return `<div class="comm-grid"><div class="comm-panel" style="grid-column:span 2"><h3>الزملاء الموثوقون</h3><div class="comm-list">${rows}</div></div><div class="comm-panel"><h3>الأعضاء المحظورون</h3><div class="comm-list">${blocked}</div></div></div>`;
  }
  function renderRequests(){
    const inc=incoming().map(r=>requestCard(r,'incoming')).join('') || `<div class="comm-empty">لا توجد طلبات واردة.</div>`;
    const out=outgoing().map(r=>requestCard(r,'outgoing')).join('') || `<div class="comm-empty">لا توجد طلبات مرسلة.</div>`;
    return `<div class="comm-grid"><div class="comm-panel" style="grid-column:span 2"><h3>طلبات التواصل الواردة</h3><div class="comm-list">${inc}</div></div><div class="comm-panel"><h3>طلبات مرسلة</h3><div class="comm-list">${out}</div></div></div>`;
  }
  function requestCard(r,kind){ const other=member(kind==='incoming'?r.fromId:r.toId)||{}; return `<div class="comm-item"><b>${kind==='incoming'?'📩':'📤'} ${e(other.name||'عضو')}</b><small>${e(other.role||'عضو')} — ${e(other.org||'')}</small><div class="comm-badges"><span class="comm-badge">${fmt(r.createdAt)}</span></div>${kind==='incoming'?`<div class="comm-actions"><button class="comm-btn gold" onclick="acceptConnectionRequest('${e(r.id)}')">قبول</button><button class="comm-btn" onclick="rejectConnectionRequest('${e(r.id)}')">رفض</button><button class="comm-btn red" onclick="blockCommMember('${e(r.fromId)}')">حظر</button></div>`:`<div class="comm-actions"><button class="comm-btn" onclick="cancelConnectionRequest('${e(r.id)}')">إلغاء الطلب</button></div>`}</div>`; }
  function renderPrivacy(){
    const p=privacy();
    return `<div class="comm-grid"><div class="comm-panel" style="grid-column:span 2"><h3>إعدادات الخصوصية والتواصل</h3>${privacyRow('من يمكنه العثور عليّ؟','discoverability',p.discoverability,[['all','كل الأعضاء'],['same_org','أعضاء نفس الجهة فقط'],['trusted','الزملاء فقط'],['admin','الإدارة فقط']])}${privacyRow('من يمكنه إرسال طلب تواصل؟','requestFrom',p.requestFrom,[['all','كل الأعضاء'],['same_org','أعضاء نفس الجهة فقط'],['roles','أصحاب أدوار محددة لاحقًا'],['none','لا أحد']])}${privacyRow('من يمكنه مراسلتي مباشرة؟','directFrom',p.directFrom,[['trusted','الزملاء الموثوقون فقط'],['trusted_admin','الزملاء + الإدارة'],['admin','الإدارة فقط']])}${privacyRow('من يمكنه رؤية حالتي؟','statusVisible',p.statusVisible,[['all','الكل'],['trusted','الزملاء فقط'],['none','لا أحد']])}${privacyRow('من يمكنه إضافتي إلى مجموعة؟','groupInvite',p.groupInvite,[['admin','الإدارة فقط'],['supervisors','المشرفون فقط'],['trusted','الزملاء'],['approval','بعد موافقتي فقط']])}<div class="comm-actions"><button class="comm-btn gold" onclick="saveCommPrivacyFromForm()">حفظ إعدادات الخصوصية</button></div></div><div class="comm-panel"><h3>مبدأ الحماية</h3><div class="comm-warning">القاعدة الأساسية: لا محادثة فردية إلا بعد موافقة الطرفين، ولا صلاحيات للضيوف، والإعلانات الرسمية منفصلة عن علاقات الزمالة.</div></div></div>`;
  }
  function privacyRow(label,key,val,opts){ return `<div class="comm-privacy-row"><label>${label}</label><select class="comm-select" data-privacy-key="${key}">${opts.map(o=>`<option value="${o[0]}" ${val===o[0]?'selected':''}>${o[1]}</option>`).join('')}</select></div>`; }
  function renderAdmin(){
    if(!canAdmin()) return `<div class="comm-empty">هذه المساحة مخصصة للإدارة فقط.</div>`;
    return `<div class="comm-grid"><div class="comm-panel" style="grid-column:span 2"><div class="comm-admin-strip"><h3>📢 إرسال إعلان رسمي</h3><p>الإعلان الرسمي يصل إلى قناة إعلانات الإدارة، ويولّد إشعارًا داخليًا للأعضاء داخل مركز الإشعارات.</p></div><input class="comm-input" id="commAnnTitle" placeholder="عنوان الإعلان الرسمي"><textarea class="comm-textarea" id="commAnnBody" placeholder="نص الإعلان أو التوجيه..."></textarea><div class="comm-actions"><button class="comm-btn gold" onclick="sendOfficialAnnouncement()">إرسال الإعلان</button><button class="comm-btn" onclick="selectCommThread('group','group_announcements','');openSecureCommunicationCenter('inbox')">فتح قناة الإعلانات</button></div></div><div class="comm-panel"><h3>سجل التواصل</h3><div class="comm-list">${arr(readJson(AUDIT_KEY,[])).slice(0,8).map(a=>`<div class="comm-item"><b>${e(a.action)}</b><small>${fmt(a.at)} — ${e(a.actorName)}</small></div>`).join('')||'<div class="comm-empty">لا توجد أحداث بعد.</div>'}</div></div></div>`;
  }

  window.openSecureCommunicationCenter=function(active){ render(active||'inbox'); };
  window.selectCommThread=function(kind,threadId,memberId){ window.__sandCommSelected={kind,id:threadId,memberId:memberId||''}; render('inbox'); };
  window.sendConnectionRequest=function(mid){ if(isBlocked(mid)||blockedMe(mid)) return toast('لا يمكن إرسال طلب تواصل لهذا العضو بسبب إعدادات الحظر.'); if(pendingBetween(mid)||isTrusted(mid)) return; const m=member(mid); const r=requests(); r.unshift({id:id('req'),fromId:uid(),toId:mid,status:'pending',createdAt:now()}); saveRequests(r); audit('connection.request',{toId:mid,toName:m?.name}); notify({category:'account',priority:'normal',title:'طلب تواصل جديد',body:`تم إرسال طلب تواصل إلى ${m?.name||'عضو'} بنظام الزملاء الموثوقين.`,action:"openSecureCommunicationCenter && openSecureCommunicationCenter('requests')"}); toast('تم إرسال طلب التواصل.'); render('members'); };
  window.acceptConnectionRequest=function(rid){ const rs=requests(); const r=rs.find(x=>x.id===rid&&x.toId===uid()); if(!r) return; r.status='accepted'; r.respondedAt=now(); saveRequests(rs); const cs=connections(); if(!cs.some(c=>(c.a===r.fromId&&c.b===r.toId)||(c.a===r.toId&&c.b===r.fromId))) cs.unshift({id:id('conn'),a:r.fromId,b:r.toId,status:'accepted',createdAt:now()}); saveConnections(cs); audit('connection.accept',{requestId:rid,fromId:r.fromId}); notify({category:'account',priority:'normal',title:'تم قبول طلب التواصل',body:'تمت إضافة عضو جديد إلى قائمة الزملاء الموثوقين، ويمكن الآن بدء محادثة مباشرة.',action:"openSecureCommunicationCenter && openSecureCommunicationCenter('trusted')"}); render('requests'); };
  window.rejectConnectionRequest=function(rid){ const rs=requests(); const r=rs.find(x=>x.id===rid&&x.toId===uid()); if(r){r.status='rejected';r.respondedAt=now();saveRequests(rs);audit('connection.reject',{requestId:rid});} render('requests'); };
  window.cancelConnectionRequest=function(rid){ saveRequests(requests().map(r=>r.id===rid&&r.fromId===uid()?Object.assign(r,{status:'cancelled',respondedAt:now()}):r)); audit('connection.cancel',{requestId:rid}); render('requests'); };
  window.removeTrustedMember=function(mid){ if(!confirm('إزالة هذا العضو من قائمة الزملاء الموثوقين؟')) return; saveConnections(connections().filter(c=>!((c.a===uid()&&c.b===mid)||(c.a===mid&&c.b===uid())))); audit('connection.remove',{memberId:mid}); render('trusted'); };
  window.blockCommMember=function(mid){ const b=blocks(); if(!b.some(x=>x.ownerId===uid()&&x.memberId===mid)) b.unshift({id:id('block'),ownerId:uid(),memberId:mid,createdAt:now()}); saveBlocks(b); saveConnections(connections().filter(c=>!((c.a===uid()&&c.b===mid)||(c.a===mid&&c.b===uid())))); audit('member.block',{memberId:mid}); render(window.__sandCommLastTab||'members'); };
  window.unblockCommMember=function(mid){ saveBlocks(blocks().filter(b=>!(b.ownerId===uid()&&b.memberId===mid))); audit('member.unblock',{memberId:mid}); render('trusted'); };
  window.sendCommMessage=function(kind,threadId,memberId){ const box=document.getElementById('commMessageText'); const text=String(box?.value||'').trim(); if(!text) return; if(kind==='direct'&&!canDirect(memberId)) return toast('لا يمكن الإرسال إلا لزميل موثوق أو بصلاحية إدارية.'); const ms=messages(); ms.push({id:id('msg'),threadId,senderId:uid(),senderName:userName(),text,at:now(),readBy:[uid()],kind}); saveMessages(ms); audit('message.send',{threadId,kind}); if(kind==='direct') notify({category:'account',priority:'normal',title:'رسالة داخلية جديدة',body:`رسالة ضمن مركز التواصل القضائي الآمن.`,action:"openSecureCommunicationCenter && openSecureCommunicationCenter('inbox')"}); render('inbox'); setTimeout(()=>{ const el=document.getElementById('commMessagesList'); if(el) el.scrollTop=el.scrollHeight;},50); };
  window.openCreateGroupModal=function(){ const html=`<div class="review-modal-backdrop" onclick="this.remove()"><div class="review-modal" onclick="event.stopPropagation()"><button class="review-modal-close" onclick="this.closest('.review-modal-backdrop').remove()">×</button><span class="institutional-kicker">💬 مجموعة تواصل</span><h3>إنشاء مجموعة جديدة</h3><input class="comm-input" id="newGroupName" placeholder="اسم المجموعة"><textarea class="comm-textarea" id="newGroupDesc" placeholder="وصف المجموعة"></textarea><label style="display:flex;gap:8px;align-items:center;margin-top:10px"><input type="checkbox" id="newGroupReadOnly"> قراءة فقط للأعضاء</label><div class="comm-actions"><button class="comm-btn gold" onclick="createCommGroup();this.closest('.review-modal-backdrop').remove()">إنشاء</button></div></div></div>`; document.body.insertAdjacentHTML('beforeend',html); };
  window.createCommGroup=function(){ const name=String(document.getElementById('newGroupName')?.value||'').trim(); if(!name) return; const desc=String(document.getElementById('newGroupDesc')?.value||'').trim(); const ro=!!document.getElementById('newGroupReadOnly')?.checked; const g=groups(); const ng={id:id('group'),name,description:desc,type:'custom',members:[uid(),...trusted().map(m=>m.id)],admins:[uid()],readOnly:ro,createdAt:now()}; g.unshift(ng); saveGroups(g); audit('group.create',{groupId:ng.id,name}); window.__sandCommSelected={kind:'group',id:ng.id,memberId:''}; render('inbox'); };
  window.sendOfficialAnnouncement=function(){ const title=String(document.getElementById('commAnnTitle')?.value||'').trim(); const body=String(document.getElementById('commAnnBody')?.value||'').trim(); if(!title||!body) return toast('اكتب عنوان الإعلان ونصه أولًا.'); const ms=messages(); ms.push({id:id('msg'),threadId:'group_announcements',senderId:uid(),senderName:userName(),text:`${title}\n\n${body}`,at:now(),readBy:[uid()],kind:'announcement'}); saveMessages(ms); audit('announcement.send',{title}); notify({category:'admin',priority:'high',title:`إعلان رسمي: ${title}`,body,action:"openSecureCommunicationCenter && openSecureCommunicationCenter('inbox')"}); toast('تم إرسال الإعلان الرسمي داخل قناة الإدارة.'); render('admin'); };
  window.saveCommPrivacyFromForm=function(){ const values={}; document.querySelectorAll('[data-privacy-key]').forEach(el=>{ values[el.getAttribute('data-privacy-key')]=el.value; }); savePrivacy(values); toast('تم حفظ إعدادات الخصوصية.'); render('privacy'); };

  // Seed one incoming request for testing the workflow, only once.
  function seed(){ ensureMembers(); if(localStorage.getItem('sand_comm_seeded_5161')) return; const rs=requests(); rs.unshift({id:id('req'),fromId:'member_training_supervisor',toId:uid(),status:'pending',createdAt:now()}); saveRequests(rs); localStorage.setItem('sand_comm_seeded_5161','1'); }
  setTimeout(seed,300);
})();
