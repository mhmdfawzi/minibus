import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.transport.mvp',
  appName: 'Transport MVP',
  webDir: 'www',
  server: {
    hostname: 'minibus-frontend-production.up.railway.app',
    androidScheme: 'https',
    iosScheme: 'https',
    cleartext: true
  },
  plugins: {
    Keyboard: {
      resize: 'body'
    },
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ['phone']
    }
  }
};

export default config;
