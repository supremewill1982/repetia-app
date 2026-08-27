import { auth } from './firebaseConfig';

const SUPABASE_FUNCTION_URL =
  'https://kvnhfqgezkeqidmpagon.supabase.co/functions/v1/repetia-ai';

export type IaRequestOptions = {
  systemInstruction?: string;
  imageBase64?: string;
  mimeType?: string;
  maxOutputTokens?: number;
  responseMimeType?: string;
};

export async function appelerGeminiBackend(
  prompt: string,
  options?: IaRequestOptions,
): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('Connexion requise pour utiliser le service IA.');

  const idToken = await user.getIdToken();
  const response = await fetch(SUPABASE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt, ...options }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || `Service IA indisponible (${response.status}).`);
  }
  if (typeof data?.content !== 'string' || !data.content.trim()) {
    throw new Error('Réponse IA vide.');
  }
  return data.content.trim();
}
