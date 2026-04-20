import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ciep165.app',
  appName: 'CIEP 165',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // Permite que o app capture o esquema customizado
    allowNavigation: ['com.ciep165.app://*']
  }
};

export default config;