import * as SecureStore from 'expo-secure-store';
import { auth } from './firebaseConfig';

const PENDING_QUESTIONS_KEY = 'monrepetiteur_pending_questions';

export interface PendingQuestion {
  id: string;
  question: string;
  matiere: string;
  type: 'revision' | 'devoir';
  sessionId: string;
  tentative: number;
  maxTentatives: number;
  reponsesPrecedentes: string[];
  dateCreation: string;
  dateDerniereTentative: string;
  contenuCours?: string;
  reponseAttendue?: string;
  criteresCorrection?: string;
}

async function getPendingQuestions(): Promise<PendingQuestion[]> {
  try {
    const user = auth.currentUser;
    if (!user) return [];
    const data = await SecureStore.getItemAsync(`${PENDING_QUESTIONS_KEY}_${user.uid}`);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Erreur chargement questions en attente:', error);
    return [];
  }
}

async function savePendingQuestions(questions: PendingQuestion[]): Promise<void> {
  try {
    const user = auth.currentUser;
    if (!user) return;
    await SecureStore.setItemAsync(`${PENDING_QUESTIONS_KEY}_${user.uid}`, JSON.stringify(questions));
  } catch (error) {
    console.error('Erreur sauvegarde questions en attente:', error);
  }
}

export async function ajouterQuestionEnAttente(
  question: string,
  matiere: string,
  type: 'revision' | 'devoir',
  sessionId: string,
  reponseIncorrecte?: string,
  feedback?: string,
  contenuCours?: string,
  reponseAttendue?: string,
  criteresCorrection?: string
): Promise<void> {
  const pending = await getPendingQuestions();
  
  const existeDeja = pending.some(q => q.question === question && q.matiere === matiere);
  if (existeDeja) return;
  
  const nouvelleQuestion: PendingQuestion = {
    id: Date.now().toString(),
    question,
    matiere,
    type,
    sessionId,
    tentative: 1,
    maxTentatives: 3,
    reponsesPrecedentes: reponseIncorrecte ? [reponseIncorrecte] : [],
    dateCreation: new Date().toISOString(),
    dateDerniereTentative: new Date().toISOString()
  };
  
  pending.push(nouvelleQuestion);
  await savePendingQuestions(pending);
  console.log(`📝 Question ajoutée en attente: ${question.substring(0, 50)}...`);
}

export async function getQuestionsEnAttente(): Promise<PendingQuestion[]> {
  return await getPendingQuestions();
}

export async function getQuestionsEnAttenteParMatiere(matiere: string): Promise<PendingQuestion[]> {
  const pending = await getPendingQuestions();
  return pending.filter(q => q.matiere === matiere);
}

export async function getNombreQuestionsEnAttente(): Promise<number> {
  const pending = await getPendingQuestions();
  return pending.length;
}

export async function enregistrerNouvelleTentative(
  questionId: string,
  reponse: string,
  reussie: boolean,
  feedback?: string
): Promise<{ success: boolean; termine: boolean; tentativeRestante: number }> {
  const pending = await getPendingQuestions();
  const index = pending.findIndex(q => q.id === questionId);
  
  if (index === -1) {
    return { success: false, termine: true, tentativeRestante: 0 };
  }
  
  const question = pending[index];
  question.tentative++;
  question.reponsesPrecedentes.push(reponse);
  question.dateDerniereTentative = new Date().toISOString();
  
  if (reussie) {
    pending.splice(index, 1);
    await savePendingQuestions(pending);
    return { success: true, termine: true, tentativeRestante: 0 };
  } else if (question.tentative >= question.maxTentatives) {
    pending.splice(index, 1);
    await savePendingQuestions(pending);
    return { success: false, termine: true, tentativeRestante: 0 };
  } else {
    await savePendingQuestions(pending);
    return { success: false, termine: false, tentativeRestante: question.maxTentatives - question.tentative };
  }
}

export async function supprimerQuestionEnAttente(questionId: string): Promise<void> {
  const pending = await getPendingQuestions();
  const filtered = pending.filter(q => q.id !== questionId);
  await savePendingQuestions(filtered);
  console.log(`🗑️ Question supprimée de la file d'attente: ${questionId}`);
}

export async function supprimerToutesQuestionsEnAttente(): Promise<void> {
  const user = auth.currentUser;
  if (user) {
    await SecureStore.deleteItemAsync(`${PENDING_QUESTIONS_KEY}_${user.uid}`);
  }
}
