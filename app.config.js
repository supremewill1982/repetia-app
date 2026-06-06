require('dotenv').config();

module.exports = {
  expo: {
    name: "RÉPÉTIA",
    slug: "repetia",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: false,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ECEEF3"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.repetia.app"
    },
    android: {
      package: "com.repetia.app",
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ECEEF3"
      },
      edgeToEdgeEnabled: true,
      permissions: [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "INTERNET",
        "ACCESS_NETWORK_STATE",
        "VIBRATE"
      ]
    },
    web: { favicon: "./assets/favicon.png" },
    extra: {
      eas: {
        projectId: "29f40f56-e8f9-49ec-a115-253f1355721b"
      },
      openRouterApiKey: process.env.OPENROUTER_API_KEY || '',
    }
  }
};
