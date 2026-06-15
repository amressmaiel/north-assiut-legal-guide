// Phase 5.5.4 — Auth API Client connected to Cloudflare Worker + D1
// لا يحفظ أسرارًا في الواجهة. يحفظ فقط session token مؤقتًا وبيانات المستخدم العامة.
(function(){
  const TOKEN_KEY = 'sand_auth_token';
  const USER_KEY = 'sand_auth_user';
  const PERMS_KEY = 'sand_auth_permissions';
  const EXP_KEY = 'sand_auth_expires_at';
  const DEVICE_KEY = 'sand_device_fingerprint';
  const BASE_KEY = 'SAND_AUTH_API_BASE';

  function cleanBase(v){ return String(v || '').trim().replace(/\/$/, ''); }
  function readSettingsOverride(){
    try {
      const key = window.SAND_APP_CONFIG?.storage?.localSettingsKey || 'northAssiutLegalGuide.settings.v1';
      return JSON.parse(localStorage.getItem(key) || '{}') || {};
    } catch(_) { return {}; }
  }
  function getBase(){
    const o = readSettingsOverride();
    const fromSettings = o?.backend?.authApiUrl || o?.backend?.authWorkerUrl || o?.auth?.apiBaseUrl;
    const fromConfig = window.SAND_APP_CONFIG?.backend?.authApiUrl || window.SAND_APP_CONFIG?.auth?.apiBaseUrl;
    return cleanBase(fromSettings || fromConfig || localStorage.getItem(BASE_KEY) || '');
  }
  function setBase(url){
    const base = cleanBase(url);
    if (base) localStorage.setItem(BASE_KEY, base);
    else localStorage.removeItem(BASE_KEY);
    window.dispatchEvent(new CustomEvent('sand:auth-api-base-updated', { detail:{ base } }));
    return base;
  }
  function isConfigured(){ return !!getBase(); }
  function getDeviceFingerprint(){
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = 'dev_' + (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)) + '_' + Date.now();
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  }
  async function request(path, options={}){
    const base = getBase();
    if (!base) {
      const err = new Error('لم يتم ضبط رابط Auth API بعد. افتح إعدادات المنصة وضع رابط Worker الخاص بالعضويات.');
      err.code = 'AUTH_API_BASE_NOT_CONFIGURED';
      throw err;
    }
    const token = localStorage.getItem(TOKEN_KEY);
    const headers = {
      'content-type': 'application/json',
      'x-device-fingerprint': getDeviceFingerprint(),
      'x-device-label': navigator.platform || 'Browser',
      ...(options.headers || {})
    };
    if (token) headers.authorization = 'Bearer ' + token;
    const res = await fetch(base + path, {
      method: options.method || 'GET',
      headers,
      body: options.body == null ? undefined : (typeof options.body === 'string' ? options.body : JSON.stringify(options.body))
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.ok === false) {
      const err = new Error(data.message || translateError(data.error) || 'فشل الطلب');
      err.data = data; err.status = res.status; err.code = data.error || 'REQUEST_FAILED';
      throw err;
    }
    return data;
  }
  function translateError(code){
    const map = {
      AUTH_DB_NOT_BOUND:'قاعدة AUTH_DB غير مربوطة بالـWorker.',
      AUTH_REQUIRED:'تسجيل الدخول مطلوب.',
      INVALID_SESSION:'الجلسة غير صالحة.',
      SESSION_EXPIRED:'انتهت الجلسة.',
      ACCOUNT_NOT_ACTIVE:'الحساب غير نشط أو بانتظار الموافقة.',
      ACCOUNT_EXPIRED:'انتهت مدة العضوية.',
      INVALID_CREDENTIALS:'بيانات الدخول غير صحيحة.',
      DEVICE_LIMIT_REACHED:'تم تجاوز عدد الأجهزة المسموح بها.',
      DEVICE_NOT_ACTIVE:'هذا الجهاز غير مفعل لهذا الحساب.',
      PERMISSION_DENIED:'ليست لديك صلاحية تنفيذ هذا الإجراء.',
      USERNAME_EXISTS:'اسم المستخدم مستخدم بالفعل.',
      INVALID_USERNAME:'اسم المستخدم غير صحيح.',
      FULL_NAME_REQUIRED:'الاسم الكامل مطلوب.'
    };
    return map[code] || code;
  }
  function saveSession(data){
    if (data.token) localStorage.setItem(TOKEN_KEY, data.token);
    if (data.user) localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    if (Array.isArray(data.permissions)) localStorage.setItem(PERMS_KEY, JSON.stringify(data.permissions));
    if (data.expiresAt) localStorage.setItem(EXP_KEY, data.expiresAt);
    window.dispatchEvent(new CustomEvent('sand:auth-session-updated', { detail:{ user:data.user || currentUser(), permissions: permissions() } }));
  }
  function clear(){
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(PERMS_KEY);
    localStorage.removeItem(EXP_KEY);
    window.dispatchEvent(new CustomEvent('sand:auth-session-updated', { detail:{ user:null, permissions:[] } }));
  }
  async function login(username, password){
    const data = await request('/api/auth/login', { method:'POST', body:{ username, password, deviceLabel: navigator.platform || 'Browser' } });
    saveSession(data);
    return data;
  }
  async function logout(){
    try { await request('/api/auth/logout', { method:'POST', body:{} }); } finally { clear(); }
  }
  async function refreshMe(){
    const data = await request('/api/auth/me');
    saveSession({ user:data.user, permissions:data.permissions });
    return data;
  }
  function currentUser(){ try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch { return null; } }
  function permissions(){ try { return JSON.parse(localStorage.getItem(PERMS_KEY) || '[]'); } catch { return []; } }
  function expiresAt(){ return localStorage.getItem(EXP_KEY) || ''; }
  function isLoggedIn(){ return !!localStorage.getItem(TOKEN_KEY) && !!currentUser(); }
  function hasPermission(key){ const u=currentUser(); return !!u?.isSuperOwner || !!u?.is_super_owner || permissions().includes(key); }

  window.SandAuthApi = {
    request,
    getBase,
    setBase,
    isConfigured,
    getDeviceFingerprint,
    translateError,
    saveSession,
    clear,
    login,
    logout,
    refreshMe,
    currentUser,
    permissions,
    expiresAt,
    isLoggedIn,
    hasPermission,
    health: ()=>request('/api/auth/health'),
    register: (payload)=>request('/api/auth/register',{ method:'POST', body: payload }),
    checkUsername: (username)=>request('/api/auth/check-username',{ method:'POST', body:{ username } }),
    me: refreshMe,
    bootstrapStatus: ()=>request('/api/bootstrap/status'),
    bootstrapRequest: ()=>request('/api/bootstrap/request',{ method:'POST', body:{} }),
    bootstrapComplete: (envelope)=>request('/api/bootstrap/complete',{ method:'POST', body:{ envelope } }),
    verifyLicense: (envelope, expectedType)=>request('/api/license/verify',{ method:'POST', body:{ envelope, expectedType } }),
    users: ()=>request('/api/users'),
    pendingUsers: ()=>request('/api/users/pending'),
    approveUser: (payload)=>request('/api/users/approve',{ method:'POST', body: payload }),
    rejectUser: (payload)=>request('/api/users/reject',{ method:'POST', body: payload }),
    updateUserStatus: (payload)=>request('/api/users/update-status',{ method:'POST', body: payload }),
    roles: ()=>request('/api/roles'),
    permissionsList: ()=>request('/api/permissions'),
    devices: ()=>request('/api/devices'),
    updateDeviceStatus: (payload)=>request('/api/devices/update-status',{ method:'POST', body: payload }),
    audit: (limit=100)=>request('/api/audit?limit='+encodeURIComponent(limit))
  };
})();
