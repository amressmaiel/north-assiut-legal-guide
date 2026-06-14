/**
 * platform-boot.js
 * نقطة تمهيد مؤسسية مستقبلية.
 * لا تغيّر سلوك التشغيل الحالي؛ فقط تتحقق من وجود الإعدادات والسجل المعماري.
 */
(function(){
  window.SAND_PLATFORM = window.SAND_PLATFORM || {};
  window.SAND_PLATFORM.bootInfo = {
    version: "5.1.0",
    configLoaded: !!window.SAND_APP_CONFIG,
    registryLoaded: !!window.SAND_MODULE_REGISTRY,
    startedAt: new Date().toISOString()
  };
  try {
    console.info("✅ تم تحميل الهيكل المؤسسي للمنصة 5.1", window.SAND_PLATFORM.bootInfo);
  } catch (_) {}
})();
