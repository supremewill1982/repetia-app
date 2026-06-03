import axios from 'axios';
import Constants from 'expo-constants';

const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

const getApiKey = (): string =>
  Constants.expoConfig?.extra?.openRouterApiKey || '';

export interface QuestionDevoir {
  texte:     string;
  reponse:   string;
  points:    number;
  consigne?: string;
}

export interface AnalyseDevoir {
  titre:      string;
  matiere:    string;
  consignes:  string;
  questions:  QuestionDevoir[];
}

// ══════════════════════════════════════════
// ANALYSE DEVOIR PRINCIPAL
// ══════════════════════════════════════════
export async function analyserDevoirProfond(
  imageBase64: string,
  matiere?: string
): Promise<AnalyseDevoir> {
  // 3 tentatives avec prompts différents
  for (let tentative = 1; tentative <= 3; tentative++) {
    try {
      console.log(`📝 Analyse devoir tentative ${tentative}/3`);
      const result = await _analyserAvecPrompt(imageBase64, matiere, tentative);
      if (result.questions.length > 0) {
        console.log(`✅ ${result.questions.length} questions extraites`);
        return result;
      }
    } catch (e) {
      console.log(`⚠️ Tentative ${tentative} échouée:`, e);
      if (tentative < 3) await _attendre(2000);
    }
  }

  // Fallback : retourner une question générique
  console.log('🔄 Fallback devoir générique');
  return _fallbackDevoir(matiere);
}

async function _analyserAvecPrompt(
  imageBase64: string,
  matiere: string | undefined,
  tentative: number
): Promise<AnalyseDevoir> {

  const prompts = [
    // Tentative 1 : prompt précis JSON
    `Tu es un professeur expert. Analyse cette image de devoir scolaire.
Extrait TOUTES les questions/exercices visibles.
Réponds UNIQUEMENT en JSON valide, sans texte avant ou après :
{"titre":"titre du devoir","matiere":"${matiere||'Général'}","consignes":"consignes générales si présentes","questions":[{"texte":"question exacte","reponse":"réponse attendue détaillée","points":2}]}
Si tu vois plusieurs exercices, mets chaque sous-question séparément.
IMPORTANT: Le champ "questions" doit contenir au moins 1 élément.`,

    // Tentative 2 : prompt simplifié
    `Regarde cette image de devoir scolaire de ${matiere||'mathématiques'}.
Liste toutes les questions que tu vois.
Réponds en JSON :
{"titre":"Devoir","matiere":"${matiere||'Général'}","consignes":"","questions":[{"texte":"écris la question ici","reponse":"réponse correcte","points":2}]}
Minimum 1 question obligatoire.`,

    // Tentative 3 : prompt très permissif
    `Décris ce devoir scolaire. Même si l'image est floue, essaie de deviner le type d'exercice.
JSON uniquement :
{"titre":"Devoir ${matiere||''}","matiere":"${matiere||'Général'}","consignes":"","questions":[{"texte":"D'après ce que tu vois dans l'image, quelle est la question principale ?","reponse":"Réponse à construire selon le cours","points":2}]}`,
  ];

  const response = await axios.post(
    API_URL,
    {
      model: 'google/gemini-flash-1.5',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text',      text: prompts[tentative - 1] },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
          ],
        },
      ],
      max_tokens: 1500,
      temperature: tentative === 3 ? 0.5 : 0.2,
    },
    {
      headers: {
        Authorization:  `Bearer ${getApiKey()}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    }
  );

  const contenu = response.data.choices[0]?.message?.content || '';
  return _parseReponse(contenu, matiere);
}

// ── Parser robuste ──
function _parseReponse(contenu: string, matiere?: string): AnalyseDevoir {
  if (!contenu || contenu.trim() === '') {
    throw new Error('Réponse vide');
  }

  // Nettoyer le markdown
  let cleaned = contenu
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  // Extraire le JSON (chercher { ... })
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Pas de JSON trouvé');

  let parsed: any;
  try {
    parsed = JSON.parse(match[0]);
  } catch {
    // Tentative de réparation JSON
    const repaired = match[0]
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']')
      .replace(/'/g, '"');
    parsed = JSON.parse(repaired);
  }

  // Valider et normaliser
  const questions: QuestionDevoir[] = [];

  if (Array.isArray(parsed.questions)) {
    for (const q of parsed.questions) {
      const texte = q.texte || q.question || q.enonce || q.text || '';
      if (texte.trim().length > 3) {
        questions.push({
          texte:   texte.trim(),
          reponse: (q.reponse || q.response || q.answer || q.correction || 'Voir le cours').trim(),
          points:  typeof q.points === 'number' ? q.points : 2,
        });
      }
    }
  }

  if (questions.length === 0) {
    throw new Error('Aucune question valide extraite');
  }

  return {
    titre:     parsed.titre || parsed.title || `Devoir de ${matiere || 'Général'}`,
    matiere:   parsed.matiere || matiere || 'Général',
    consignes: parsed.consignes || parsed.instructions || '',
    questions,
  };
}

// ── Fallback si tout échoue ──
function _fallbackDevoir(matiere?: string): AnalyseDevoir {
  return {
    titre:     `Devoir de ${matiere || 'Général'}`,
    matiere:   matiere || 'Général',
    consignes: 'Photo difficile à lire. Réponds au mieux.',
    questions: [
      {
        texte:   `Explique en quelques lignes ce que tu as compris de ce devoir de ${matiere || 'la matière'}.`,
        reponse: 'Réponse libre basée sur le cours.',
        points:  2,
      },
      {
        texte:   `Quelles sont les notions principales abordées dans ce devoir ?`,
        reponse: 'Les notions clés du chapitre en cours.',
        points:  2,
      },
      {
        texte:   `Comment résoudrais-tu le problème principal de ce devoir ?`,
        reponse: 'Application de la méthode vue en classe.',
        points:  2,
      },
    ],
  };
}

// ══════════════════════════════════════════
// ÉVALUATION RÉPONSE DEVOIR
// ══════════════════════════════════════════
export async function evaluerReponseDevoirPrecise(
  question: QuestionDevoir,
  reponseEleve: string,
  essai: number = 1
): Promise<{ note: number; feedback: string; correction: string }> {
  try {
    if (!reponseEleve?.trim()) {
      return { note: 0, feedback: 'Tu n\'as pas répondu.', correction: question.reponse };
    }

    const prompt = `Tu es un professeur bienveillant.

QUESTION : ${question.texte}
RÉPONSE ATTENDUE : ${question.reponse}
RÉPONSE ÉLÈVE (essai ${essai}) : ${reponseEleve}

Évalue et réponds en JSON :
{"note":0,"feedback":"explication courte","correction":"correction complète"}

Barème :
- 2 = correct et complet
- 1 = partiellement correct
- 0 = incorrect

JSON uniquement, pas de texte avant ou après.`;

    const response = await axios.post(
      API_URL,
      {
        model: 'google/gemini-flash-1.5',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 400,
        temperature: 0.1,
      },
      {
        headers: {
          Authorization:  `Bearer ${getApiKey()}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    const contenu = response.data.choices[0]?.message?.content || '';
    const cleaned = contenu.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
    const match   = cleaned.match(/\{[\s\S]*\}/);

    if (match) {
      const parsed = JSON.parse(match[0]);
      return {
        note:       Math.min(2, Math.max(0, parseInt(parsed.note) || 0)),
        feedback:   parsed.feedback   || 'Continue !',
        correction: parsed.correction || question.reponse,
      };
    }
  } catch (e) {
    console.error('Erreur évaluation devoir:', e);
  }

  // Fallback : évaluation par longueur
  return _evaluerParLongueur(reponseEleve, question.reponse, essai);
}

function _evaluerParLongueur(
  reponse: string,
  reponseAttendue: string,
  essai: number
): { note: number; feedback: string; correction: string } {
  const len = reponse.trim().length;
  if (len > 80)  return { note: 2, feedback: 'Bonne réponse détaillée !', correction: reponseAttendue };
  if (len > 20)  return { note: 1, feedback: 'Développe un peu plus.', correction: reponseAttendue };
  if (essai >= 3) return { note: 0, feedback: 'Réponse trop courte.', correction: reponseAttendue };
  return { note: 0, feedback: 'Développe ta réponse.', correction: reponseAttendue };
}

function _attendre(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
