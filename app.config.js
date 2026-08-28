import 'dotenv/config';

export default {
  name: 'RÉPÉTIA',
  slug: 'repetia',
  scheme: 'repetia',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  jsEngine: 'hermes',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.repetia.app',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    package: 'com.repetia.app',
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-font',
    'expo-asset',
    'expo-notifications',
  ],
  extra: {
    eas: {
      projectId: '29f40f56-e8f9-49ec-a115-253f1355721b',
    },
  },
};
