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
  },
  plugins: {
    Keyboard: {
      resize: 'body'
    }
  }
};

export default config;
