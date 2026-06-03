import axios from 'axios';
import Constants from 'expo-constants';
import { getInfosEnfant } from './firebaseEnfantService';

const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const getApiKey = () => Constants.expoConfig?.extra?.openRouterApiKey || '';

export interface Repetiteur {
  id: string;
  nom: string;
  matieres: string[];
  tarifHoraire: number; // en FCFA
  note: number; // /5
  localisation: string;
  enLigne: boolean;
  description: string;
  contact: string;
}

// Génère des répétiteurs fictifs mais réalistes via IA
export async function recommanderRepetiteurs(matiere?: string): Promise<Repetiteur[]> {
  const infos = await getInfosEnfant();
  const classe = infos?.classe || 'Terminale';
  const prompt = `Génère une liste de 3 répétiteurs particuliers pour un élève de ${classe}${matiere ? ` spécialisé en ${matiere}` : ''}. Pour chacun : nom (africain), matières (1-2), tarif horaire en FCFA (2000-8000), note /5 (3.5-5), localisation (ville du Gabon ou "En ligne"), enLigne (boolean), description courte (15 mots), contact (téléphone ou email fictif). Réponds UNIQUEMENT en JSON : [ { "nom": "...", "matieres": [...], "tarifHoraire": nombre, "note": nombre, "localisation": "...", "enLigne": boolean, "description": "...", "contact": "..." } ]`;

  const response = await axios.post(API_URL, {
    model: 'google/gemini-flash-1.5',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1500,
    temperature: 0.8,
  }, {
    headers: { Authorization: `Bearer ${getApiKey()}`, 'Content-Type': 'application/json' },
    timeout: 30000,
  });

  const contenu = response.data.choices[0]?.message?.content || '';
  const cleaned = contenu.replace(/```json\s*/gi,'').replace(/```/g,'').trim();
  const match   = cleaned.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('Aucun répétiteur généré');

  const data = JSON.parse(match[0]);
  return data.map((r: any, idx: number) => ({ ...r, id: `rep_${Date.now()}_${idx}` }));
}
