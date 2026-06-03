import axios from 'axios';
import Constants from 'expo-constants';
import { getSessionsEnfantFirebase, getInfosEnfant } from './firebaseEnfantService';

const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

const getApiKey = (): string =>
  Constants.expoConfig?.extra?.openRouterApiKey || '';

export let contexteEleve = {
  niveau: 'Terminale',
  prenom: 'Élève',
  matieresFaibles: [] as string[],
  dernieresErreurs: [] as string[],
};

export async function chargerContexteEleve() {
  try {
    const infos = await getInfosEnfant();
    if (infos) {
      contexteEleve.niveau = infos.classe || 'Terminale';
      contexteEleve.prenom = infos.prenom || 'Élève';
    }

    const sessions = await getSessionsEnfantFirebase();
    const erreurs: string[] = [];
    const matieresNotes: { [key: string]: { total: number; count: number } } = {};

    sessions.forEach(session => {
      const matiere = session.matiere || 'Général';
      if (!matieresNotes[matiere]) matieresNotes[matiere] = { total: 0, count: 0 };
      session.questions?.forEach((q: any) => {
        matieresNotes[matiere].total += q.note || 0;
        matieresNotes[matiere].count++;
        if ((q.note || 0) < 1.5) {
          erreurs.push(`${matiere}: ${(q.question || '').substring(0, 50)}`);
        }
      });
    });

    contexteEleve.matieresFaibles = Object.entries(matieresNotes)
      .filter(([_, d]) => d.count > 0 && d.total / d.count < 1.5)
      .map(([nom]) => nom);
    contexteEleve.dernieresErreurs = erreurs.slice(-5);
  } catch (error) {
    console.error('Erreur chargement contexte:', error);
  }
}

export async function chatCoachingAvance(message: string): Promise<{ message: string; suggestions?: string[] }> {
  try {
    const systemPrompt = `Tu es un répétiteur patient et bienveillant pour ${contexteEleve.prenom}, élève de ${contexteEleve.niveau}.

RÈGLES :
1. Ne donne JAMAIS la réponse directement
2. Utilise la méthode socratique
3. Adapte ton explication au niveau ${contexteEleve.niveau}
4. Matières à renforcer : ${contexteEleve.matieresFaibles.join(', ') || 'aucune'}
5. Termine toujours par une question ouverte

Tu es un RÉPÉTITEUR, pas un donneur de réponses !`;

    const response = await axios.post(API_URL, {
      model: 'google/gemini-flash-1.5',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      max_tokens: 800,
      temperature: 0.7,
    }, {
      headers: { Authorization: `Bearer ${getApiKey()}`, 'Content-Type': 'application/json' },
    });

    const reponse = response.data.choices[0]?.message?.content;
    return {
      message: reponse || "Je réfléchis... Peux-tu reformuler ta question ?",
      suggestions: ['Peux-tu développer ?', 'As-tu relu ton cours ?', 'Montre-moi un exercice'],
    };
  } catch (error) {
    console.error('❌ Erreur coaching:', error);
    return { message: "Désolé, réessaie dans un instant." };
  }
}

export async function enregistrerErreur(matiere: string, question: string) {
  contexteEleve.dernieresErreurs.unshift(`${matiere}: ${question.substring(0, 50)}`);
  if (contexteEleve.dernieresErreurs.length > 10) contexteEleve.dernieresErreurs.pop();
}
