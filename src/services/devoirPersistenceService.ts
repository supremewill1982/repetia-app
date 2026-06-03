import * as SecureStore from 'expo-secure-store';
import { auth } from './firebaseConfig';

const SESSIONS_DEVOIR_KEY = 'devoirs_en_cours';

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

// Sauvegarder un devoir en cours
export async function sauvegarderDevoirEnCours(session: SessionDevoir) {
  try {
    const user = auth.currentUser;
    if (!user) return;
    
    const key = `${SESSIONS_DEVOIR_KEY}_${user.uid}`;
    const existing = await getDevoirsEnCours();
    const index = existing.findIndex(s => s.id === session.id);
    
    if (index >= 0) {
      existing[index] = session;
    } else {
      existing.push(session);
    }
    
    await SecureStore.setItemAsync(key, JSON.stringify(existing));
  } catch (error) {
    console.error('Erreur sauvegarde devoir:', error);
  }
}

// Récupérer tous les devoirs en cours
export async function getDevoirsEnCours(): Promise<SessionDevoir[]> {
  try {
    const user = auth.currentUser;
    if (!user) return [];
    
    const key = `${SESSIONS_DEVOIR_KEY}_${user.uid}`;
    const data = await SecureStore.getItemAsync(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    return [];
  }
}

// Suspendre une question
export async function suspendreQuestion(sessionId: string, questionId: string) {
  const devoirs = await getDevoirsEnCours();
  const session = devoirs.find(s => s.id === sessionId);
  if (session) {
    const question = session.questions.find(q => q.id === questionId);
    if (question) {
      question.suspendue = true;
      await sauvegarderDevoirEnCours(session);
    }
  }
}

// Reprendre une question suspendue
export async function reprendreQuestion(sessionId: string, questionId: string) {
  const devoirs = await getDevoirsEnCours();
  const session = devoirs.find(s => s.id === sessionId);
  if (session) {
    const question = session.questions.find(q => q.id === questionId);
    if (question) {
      question.suspendue = false;
      await sauvegarderDevoirEnCours(session);
    }
  }
}

// Terminer un devoir (marquer comme terminé et supprimer de la liste)
export async function terminerDevoir(sessionId: string) {
  const devoirs = await getDevoirsEnCours();
  const filtered = devoirs.filter(s => s.id !== sessionId);
  
  const user = auth.currentUser;
  if (user) {
    const key = `${SESSIONS_DEVOIR_KEY}_${user.uid}`;
    await SecureStore.setItemAsync(key, JSON.stringify(filtered));
  }
}
