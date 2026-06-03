import axios from 'axios';
import Constants from 'expo-constants';
import { getSessionsEnfantFirebase } from './firebaseEnfantService';

const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const getApiKey = () => Constants.expoConfig?.extra?.openRouterApiKey || '';

export interface Prediction {
  noteEstimee: number;
  mention: string;
  confiance: number; // 0-100
  conseils: string[];
  matieresRisque: string[];
  matieresForce: string[];
}

export async function predireNoteBac(): Promise<Prediction> {
  const sessions = await getSessionsEnfantFirebase();
  const notesParMatiere: Record<string, number[]> = {};

  sessions.forEach(s => {
    if (s.matiere && typeof s.noteSur20 === 'number') {
      if (!notesParMatiere[s.matiere]) notesParMatiere[s.matiere] = [];
      notesParMatiere[s.matiere].push(s.noteSur20);
    }
  });

  const moyennes: Record<string, number> = {};
  for (const [mat, notes] of Object.entries(notesParMatiere)) {
    moyennes[mat] = notes.reduce((a,b) => a+b, 0) / notes.length;
  }
  const moyenneGenerale = Object.values(moyennes).reduce((a,b) => a+b, 0) / (Object.keys(moyennes).length || 1);

  const prompt = `Tu es un oracle du baccalauréat. Analyse ces données et fais une prédiction.

Moyenne générale actuelle : ${moyenneGenerale.toFixed(1)}/20
Détail par matière : ${JSON.stringify(moyennes)}

Réponds UNIQUEMENT en JSON :
{
  "noteEstimee": nombre sur 20 (réaliste mais un peu optimiste),
  "mention": "Passable" | "Assez bien" | "Bien" | "Très bien" | "Excellent",
  "confiance": nombre entre 50 et 95,
  "conseils": ["conseil1", "conseil2", "conseil3"],
  "matieresRisque": ["matière1", "matière2"],
  "matieresForce": ["matière3"]
}`;

  const response = await axios.post(API_URL, {
    model: 'google/gemini-flash-1.5',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 800,
    temperature: 0.5,
  }, {
    headers: { Authorization: `Bearer ${getApiKey()}`, 'Content-Type': 'application/json' },
    timeout: 30000,
  });

  const contenu = response.data.choices[0]?.message?.content || '';
  const cleaned = contenu.replace(/```json\s*/gi,'').replace(/```/g,'').trim();
  const match   = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Prédiction non générée');

  return JSON.parse(match[0]) as Prediction;
}
