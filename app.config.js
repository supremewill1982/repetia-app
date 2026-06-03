require('dotenv').config();

module.exports = {
  expo: {
    name: "RÉPÉTIA",
    slug: "repetia",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "dark",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#0A0A1A"
    },
    ios: { supportsTablet: true },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#0A0A1A"
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false
    },
    web: { favicon: "./assets/favicon.png" },
    extra: {
      openRouterApiKey: process.env.OPENROUTER_API_KEY || '',
    }
  }
};
