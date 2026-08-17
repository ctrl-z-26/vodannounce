import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vois.vodannounce',
  appName: 'Vodannounce',
  webDir: 'dist',

  android: {
    allowMixedContent: true
  }
};

export default config;