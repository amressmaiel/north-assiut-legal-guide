/** Capacitor Template — Phase 5.26.1
 * يستخدم لاحقًا في 5.26.3 / 5.26.4 عند تجهيز Android و iOS.
 */
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'eg.prosecution.northassiut.sand',
  appName: 'الدليل القضائي الذكي',
  webDir: '.',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1700,
      backgroundColor: '#050506',
      showSpinner: false
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#050506'
    }
  }
};

export default config;
