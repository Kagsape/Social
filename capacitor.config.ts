import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ciep165.app',
  appName: 'CIEP 165',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;