const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configuration anti-ENOSPC et anti-erreurs
config.watchFolders = [__dirname + '/src'];
config.maxWorkers = 1;

// Résoudre les problèmes de modules vides
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'empty-module') {
    return { filePath: __dirname + '/empty-module.js' };
  }
  return context.resolveRequest(context, moduleName, platform);
};

// Ignorer les dossiers problématiques
config.resolver.blockList = [
  /.*\/node_modules\/.*\/node_modules\/.*/,
  /.*\/android\/.*/,
  /.*\/ReactAndroid\/.*/,
  /.*\/ReactCommon\/.*/,
];

config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_classnames: true,
    keep_fnames: true,
  },
};

config.cacheStores = [];
config.cacheVersion = 'v2';

console.log('🚀 Metro config chargée');
module.exports = config;
