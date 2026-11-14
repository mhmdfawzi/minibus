import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.transport.mvp',
  appName: 'Transport MVP',
  webDir: 'www',
  server: {
    hostname: 'localhost',
    androidScheme: 'http',
    iosScheme: 'https',
    cleartext: true
  }
};

export default config;
