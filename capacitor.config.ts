import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'eg.prosecution.northassiut.sand',
  appName: 'الدليل القضائي الذكي',
  webDir: '.',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
    iosScheme: 'capacitor'
  },
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true,
    allowsLinkPreview: false,
    backgroundColor: '#050506',
    scheme: 'SANDLegalGuide'
  },
  android: {
    backgroundColor: '#050506',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1800,
      backgroundColor: '#050506',
      showSpinner: false
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#050506',
      overlaysWebView: false
    }
  }
};

export default config;
