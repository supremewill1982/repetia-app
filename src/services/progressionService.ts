import { db, auth } from './firebaseConfig';
import { doc, setDoc, getDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { getSessionsEnfantFirebase } from './firebaseEnfantService';
import { getTimeStats } from './timeTrackingService';

interface ProgressionData {
  moyenneGlobale: number;
  totalRevisions: number;
  totalDevoirs: number;
  totalQuestions: number;
  serie: number;
  meilleureMatiere: string;
  pireMatiere: string;
  progression30Jours: number[];
  tempsTotal: number;
  badgesCount: number;
  lastUpdated: any;
}

// Sauvegarder la progression agrégée dans Firebase
export async function saveProgressionToFirebase() {
  try {
    const user = auth.currentUser;
    if (!user) return false;
    
    const sessions = await getSessionsEnfantFirebase();
    const timeStats = await getTimeStats();
    
    // Calculer les stats
    const totalRevisions = sessions.length;
    const totalDevoirs = sessions.filter(s => s.type === 'devoir').length;
    let totalQuestions = 0;
    let totalPoints = 0;
      const statsParMatiere: Record<string, { points: number; questions: number }> = {};
    
    sessions.forEach(s => {
      if (s.questions) {
        totalQuestions += s.questions.length;
        s.questions.forEach(q => { totalPoints += (q.note || 0); });
      }
      const matiere = s.matiere || 'Général';
      if (!statsParMatiere[matiere]) statsParMatiere[matiere] = { points: 0, questions: 0 };
      if (s.questions) {
        s.questions.forEach(q => {
          statsParMatiere[matiere].points += (q.note || 0);
          statsParMatiere[matiere].questions++;
        });
      }
    });
    
    const moyenneGlobale = totalQuestions > 0 ? Math.round((totalPoints / (totalQuestions * 2)) * 20) : 0;
    
    // Meilleure et pire matière
    let meilleureMatiere = '', pireMatiere = '';
    let meilleureNote = 0, pireNote = 20;
    for (const [matiere, data] of Object.entries(statsParMatiere)) {
      const note = data.questions > 0 ? (data.points / data.questions) * 10 : 0;
      if (note > meilleureNote) { meilleureNote = note; meilleureMatiere = matiere; }
      if (note < pireNote && data.questions > 0) { pireNote = note; pireMatiere = matiere; }
    }
    
    // Série
    const datesUniques = [...new Set(sessions.map(s => new Date(s.date).toLocaleDateString('fr-FR')))].sort();
    let serie = datesUniques.length > 0 ? 1 : 0;
    for (let i = 1; i < datesUniques.length; i++) {
        const diff = (new Date(datesUniques[i]).getTime() - new Date(datesUniques[i-1]).getTime()) / (1000 * 60 * 60 * 24);
      if (diff <= 2) serie++; else serie = 1;
    }
    
    const progressionData: ProgressionData = {
      moyenneGlobale,
      totalRevisions,
      totalDevoirs,
      totalQuestions,
      serie,
      meilleureMatiere,
      pireMatiere,
      progression30Jours: [], // À calculer séparément
      tempsTotal: Math.round(timeStats.global),
      badgesCount: 0,
      lastUpdated: serverTimestamp()
    };
    
    const progressionRef = doc(db, 'progression', user.uid);
    await setDoc(progressionRef, progressionData, { merge: true });
    console.log('✅ Progression sauvegardée dans Firebase');
    return true;
  } catch (error) {
    console.error('❌ Erreur sauvegarde progression:', error);
    return false;
  }
}

// Récupérer la progression depuis Firebase
export async function getProgressionFromFirebase() {
  try {
    const user = auth.currentUser;
    if (!user) return null;
    
    const progressionRef = doc(db, 'progression', user.uid);
    const docSnap = await getDoc(progressionRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as ProgressionData;
    }
    return null;
  } catch (error) {
    console.error('❌ Erreur lecture progression:', error);
    return null;
  }
}
