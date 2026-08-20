import axios from 'axios';

const OPENROUTER_API_KEY = '';
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export interface QuestionDevoir {
  id: string;
  texte: string;
  reponseUtilisateur?: string;
  essais: number;
  reussie: boolean;
  suspendue: boolean;
  feedback?: string;
}

export interface SessionDevoir {
  id: string;
  matiere: string;
  titre: string;
  questions: QuestionDevoir[];
  dateCreation: Date;
  dateDerniereModification: Date;
  terminee: boolean;
}

// Analyser un devoir et extraire toutes les questions
export async function analyserDevoirComplet(imageBase64: string, matiere: string): Promise<{ titre: string; questions: string[] }> {
  try {
    const response = await axios.post(API_URL, {
      model: 'google/gemini-flash-1.5',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: `Analyse ce devoir de ${matiere}. Extrais le TITRE et toutes les QUESTIONS. Réponds UNIQUEMENT en JSON:
{
  "titre": "Titre du devoir",
  "questions": ["Question 1", "Question 2", "..."]
}` },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
          ]
        }
      ],
      max_tokens: 800,
      temperature: 0.3,
    }, {
      headers: { 'Authorization': `Bearer ${OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' }
    });
    
    const contenu = response.data.choices[0]?.message?.content;
    const cleaned = contenu.replace(/```json\s*|\s*```/g, '').trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      return { titre: parsed.titre || 'Devoir sans titre', questions: parsed.questions || [] };
    }
    return { titre: 'Devoir', questions: ["Explique ce que tu as compris de cet exercice."] };
  } catch (error) {
    return { titre: 'Devoir', questions: ["Peux-tu résoudre cet exercice ?"] };
  }
}

// Évaluer une réponse de devoir avec suivi progressif
export async function evaluerReponseDevoir(
  question: string,
  reponse: string,
  essai: number,
  historiqueReponses: string[] = []
): Promise<{ correct: boolean; note: number; feedback: string; indice?: string }> {
  try {
    const prompt = `Tu es un professeur bienveillant qui aide un élève à résoudre un exercice.

QUESTION: ${question}

RÉPONSE DE L'ÉLÈVE (essai n°${essai}): ${reponse}

HISTORIQUE DES RÉPONSES PRÉCÉDENTES:
${historiqueReponses.map((r, i) => `Essai ${i + 1}: ${r}`).join('\n')}

RÈGLES:
- Si la réponse est correcte: note=2, feedback félicitations
- Si la réponse est partiellement correcte (essai 1-2): note=1, donne un indice sans donner la réponse
- Si la réponse est fausse (essai 1-2): note=0, pose une question pour guider
- Si 3ème essai: explique la méthode, ne donne JAMAIS la réponse finale

RÉPONDS UNIQUEMENT EN JSON:
{
  "note": 0,
  "feedback": "message personnalisé",
  "indice": "indice ou null"
}`;

    const response = await axios.post(API_URL, {
      model: 'google/gemini-flash-1.5',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      temperature: 0.3,
    }, {
      headers: { 'Authorization': `Bearer ${OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' }
    });
    
    const contenu = response.data.choices[0]?.message?.content;
    const cleaned = contenu.replace(/```json\s*|\s*```/g, '').trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      return {
        correct: parsed.note === 2,
        note: parsed.note,
        feedback: parsed.feedback,
        indice: parsed.indice
      };
    }
    return { correct: false, note: 0, feedback: "Je n'ai pas compris ta réponse." };
  } catch (error) {
    return { correct: false, note: 0, feedback: "Erreur technique. Réessaie." };
  }
}
