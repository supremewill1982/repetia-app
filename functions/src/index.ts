import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { initializeApp } from 'firebase-admin/app';

initializeApp();
const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');
const MODEL = 'gemini-2.5-flash';

export const generateParentRecommendations = onCall(
  { region: 'us-central1', secrets: [GEMINI_API_KEY], timeoutSeconds: 60, memory: '256MiB' },
  async request => {
    if (!request.auth?.uid) throw new HttpsError('unauthenticated', 'Connexion requise.');
    const stats = request.data?.stats;
    if (!stats || typeof stats !== 'object') throw new HttpsError('invalid-argument', 'Statistiques manquantes.');

    const prompt = `Tu es l'analyste pédagogique de RÉPETIA. Analyse uniquement les données réelles fournies ci-dessous. Ne fabrique aucune note, aucune tendance et aucune difficulté absente des données. Génère entre 1 et 4 recommandations utiles à un parent. Les catégories possibles sont: Résultats, Assiduité, Difficulté, Optimisation. Une recommandation doit expliquer le signal observé et proposer une action simple. Si les données sont insuffisantes, dis-le. Réponds uniquement en JSON sous la forme {"recommendations":[{"kind":"Résultats|Assiduité|Difficulté|Optimisation","title":"...","text":"..."}]}.

DONNÉES RÉELLES:
${JSON.stringify(stats)}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY.value() },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0.2, maxOutputTokens: 1200, responseMimeType: 'application/json' } }),
    });
    if (!response.ok) throw new HttpsError('internal', `Service IA indisponible (${response.status}).`);
    const data = await response.json() as any;
    const text = data?.candidates?.[0]?.content?.parts?.map((p:any)=>p.text||'').join('')?.trim();
    if (!text) throw new HttpsError('internal', 'Réponse IA vide.');
    try { return JSON.parse(text); } catch { throw new HttpsError('internal', 'Réponse IA invalide.'); }
  }
);
