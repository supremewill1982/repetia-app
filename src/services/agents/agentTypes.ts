import axios from 'axios';
import Constants from 'expo-constants';

export type AgentType = 'tuteur' | 'evaluateur' | 'moderateur' | 'coach';

export interface AgentContext {
  userId: string;
  userRole: 'eleve' | 'parent' | 'repetiteur' | 'etablissement' | 'admin';
  matiere?: string;
  niveau?: string;
  historique?: Array<{ role: string; content: string }>;
}

export interface AgentResponse {
  reponse: string;
  coursManquant?: boolean;
  coursExiste?: boolean;
  propositionAjout?: string;
  score?: number;
}

const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

const getApiKey = (): string =>
  Constants.expoConfig?.extra?.openRouterApiKey ||
  Constants.expoConfig?.extra?.openRouterKey ||
  process.env.EXPO_PUBLIC_OPENROUTER_KEY ||
  '';

import { ENV } from '../../config/env';

export const utiliserOpenRouter = async (params: {
  messages: Array<{ role: string; content: string }>;
  model?: string;
  temperature?: number;
  max_tokens?: number;
}): Promise<{
  choices: Array<{ message: { content: string } }>;
}> => {
  const response = await axios.post(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      model: params.model || 'google/gemini-flash-1.5',
      messages: params.messages,
      temperature: params.temperature ?? 0.7,
      max_tokens: params.max_tokens ?? 800,
    },
    {
      headers: {
        Authorization: `Bearer ${ENV.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
};
