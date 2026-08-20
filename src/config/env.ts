import Constants from 'expo-constants';

export const ENV = {
  OPENROUTER_API_KEY: Constants.expoConfig?.extra?.openRouterKey || 
                      process.env.EXPO_PUBLIC_OPENROUTER_KEY ||
                      '',
};
