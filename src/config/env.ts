import Constants from 'expo-constants';

export const ENV = {
  OPENROUTER_API_KEY: Constants.expoConfig?.extra?.openRouterKey || 
                      process.env.EXPO_PUBLIC_OPENROUTER_KEY ||
                      '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',
};
