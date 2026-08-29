import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp();
const db = getFirestore();
const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');
const MODEL = 'gemini-2.5-flash';

// Secure AI backend: API key remains in Firebase Secret Manager.
// Deployment marker: keep Firebase Functions + Firestore rules deployment verifiable in CI.
async function gemini(body: any) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY.value() },
      body: JSON.stringify(body),
    },
  );
  if (!response.ok) throw new HttpsError('internal', `Service IA indisponible (${response.status}).`);
  return response.json() as Promise<any>;
}

export const generateParentRecommendations = onCall(
  { region: 'us-central1', secrets: [GEMINI_API_KEY], timeoutSeconds: 60, memory: '256MiB' },
  async request => {
    if (!request.auth?.uid) throw new HttpsError('unauthenticated', 'Connexion requise.');
    const stats = request.data?.stats;
    if (!stats || typeof stats !== 'object') throw new HttpsError('invalid-argument', 'Statistiques manquantes.');
    const prompt = `Tu es l'analyste pédagogique de RÉPETIA. Analyse uniquement les données réelles fournies. Ne fabrique aucune note, tendance ou difficulté absente. Génère 1 à 4 recommandations utiles à un parent dans les catégories Résultats, Assiduité, Difficulté, Optimisation. Réponds uniquement en JSON: {"recommendations":[{"kind":"Résultats|Assiduité|Difficulté|Optimisation","title":"...","text":"..."}]}. DONNÉES: ${JSON.stringify(stats)}`;
    const data = await gemini({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: .2, maxOutputTokens: 1200, responseMimeType: 'application/json' } });
    const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('').trim();
    if (!text) throw new HttpsError('internal', 'Réponse IA vide.');
    try { return JSON.parse(text); } catch { throw new HttpsError('internal', 'Réponse IA invalide.'); }
  },
);

export const generateAiResponse = onCall(
  { region: 'us-central1', secrets: [GEMINI_API_KEY], timeoutSeconds: 60, memory: '512MiB' },
  async request => {
    if (!request.auth?.uid) throw new HttpsError('unauthenticated', 'Connexion requise.');
    const messages = request.data?.messages;
    if (!Array.isArray(messages) || messages.length === 0) throw new HttpsError('invalid-argument', 'Messages manquants.');
    const parts: any[] = [];
    for (const message of messages.slice(-12)) {
      if (typeof message.content === 'string') parts.push({ text: `${message.role === 'assistant' ? 'ASSISTANT' : 'UTILISATEUR'}: ${message.content}` });
    }
    if (request.data?.imageBase64) parts.unshift({ inline_data: { mime_type: request.data.mimeType || 'image/jpeg', data: request.data.imageBase64 } });
    const data = await gemini({ contents: [{ role: 'user', parts }], generationConfig: { temperature: request.data?.temperature ?? .6, maxOutputTokens: request.data?.max_tokens ?? 1800 } });
    const content = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('').trim();
    if (!content) throw new HttpsError('internal', 'Réponse IA vide.');
    return { content };
  },
);

// Secure parent/child linking: the parent never writes another user's document directly.
// The server validates the one-time code and performs the relationship atomically.
export const linkChildByCode = onCall(
  { region: 'us-central1', timeoutSeconds: 30, memory: '256MiB' },
  async request => {
    const parentId = request.auth?.uid;
    if (!parentId) throw new HttpsError('unauthenticated', 'Connexion requise.');

    const code = String(request.data?.code || '').trim();
    if (!/^\d{6}$/.test(code)) throw new HttpsError('invalid-argument', 'Code de liaison invalide.');

    const codeRef = db.collection('codesLiaison').doc(code);
    const parentRef = db.collection('users').doc(parentId);

    const result = await db.runTransaction(async transaction => {
      const [codeSnap, parentSnap] = await Promise.all([
        transaction.get(codeRef),
        transaction.get(parentRef),
      ]);

      if (!codeSnap.exists) throw new HttpsError('not-found', 'Code invalide ou expiré.');
      if (!parentSnap.exists || parentSnap.data()?.role !== 'parent') {
        throw new HttpsError('permission-denied', 'Profil parent introuvable.');
      }

      const data = codeSnap.data()!;
      if (data.actif !== true || (data.expires && Number(data.expires) < Date.now())) {
        throw new HttpsError('failed-precondition', 'Ce code a expiré ou a déjà été utilisé.');
      }

      const childId = String(data.enfantId || '');
      if (!childId) throw new HttpsError('failed-precondition', 'Code de liaison incomplet.');

      const childRef = db.collection('users').doc(childId);
      const childSnap = await transaction.get(childRef);
      if (!childSnap.exists) throw new HttpsError('not-found', 'Profil élève introuvable.');

      const child = childSnap.data()!;
      if (child.role !== 'eleve') throw new HttpsError('failed-precondition', 'Le compte ciblé n’est pas un élève.');
      if (child.parentId && child.parentId !== parentId) {
        throw new HttpsError('already-exists', 'Cet élève est déjà lié à un autre parent.');
      }

      const parent = parentSnap.data()!;
      const enfant = {
        uid: childId,
        prenom: data.prenom || data.enfantPrenom || child.prenom || 'Élève',
        classe: data.classe || child.classe || 'Terminale',
        serie: data.serie || child.serie || 'C',
        email: data.email || child.email || '',
        dateCreation: new Date().toISOString(),
      };
      const enfants = Array.isArray(parent.enfants) ? parent.enfants : [];
      const nextEnfants = enfants.some((e: any) => e?.uid === childId) ? enfants : [...enfants, enfant];

      transaction.update(parentRef, { enfants: nextEnfants });
      transaction.update(childRef, { parentId, parentPrenom: parent.prenom || 'Parent' });
      transaction.delete(codeRef);
      return enfant;
    });

    return { enfant: result };
  },
);
