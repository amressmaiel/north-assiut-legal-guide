/**
 * Phase 5.26.3 — iOS / iPadOS App Shell Preparation
 * إعدادات تجهيز المنصة للتشغيل كتطبيق مستقل على Windows / Android / iOS.
 * لا يتم تخزين أي أسرار هنا. روابط الخدمات فقط تُدار من إعدادات المنصة.
 */
(function(){
  window.SAND_APP_SHELL_CONFIG = Object.freeze({
    phase: "5.26.3",
    enabled: true,
    appName: "الدليل القضائي الذكي لأعضاء النيابة العامة",
    desktopProductName: "الدليل القضائي الذكي",
    desktopBuild: { enabled: true, target: "windows-nsis", outputDir: "dist-desktop" },
    iosBuild: { enabled: true, target: "capacitor-ios", bundleId: "eg.prosecution.northassiut.sand", displayName: "الدليل القضائي الذكي" },
    shortName: "سَنَد القضائي",
    desktopWindow: {
      minWidth: 1180,
      minHeight: 760,
      defaultWidth: 1440,
      defaultHeight: 920,
      startMaximized: true,
      kioskPresentationSupported: true
    },
    mobileShell: {
      statusBarStyle: "dark",
      safeAreaAware: true,
      splashScreenSeconds: 1.7,
      orientation: "portrait-primary",
      safeAreaCSSVariables: true,
      iosTarget: "iPhone/iPad",
      preferredViewport: "cover"
    },
    linkPolicy: {
      internalSchemes: ["file:", "app:", "capacitor:", "http://localhost", "https://localhost"],
      externalTargets: ["meet.google.com", "teams.microsoft.com", "zoom.us", "meet.jit.si", "github.com", "drive.google.com"],
      openExternalInSystemBrowser: true
    },
    storagePolicy: {
      localFirst: true,
      namespacePrefix: "sand:",
      backupBeforeRestore: true,
      appShellSettingsKey: "sand_app_shell_settings_v1"
    },
    presentationPolicy: {
      allowFullscreen: true,
      hideTechnicalPanelsInDemo: true,
      cinematicTourOptimized: true
    }
  });
})();
