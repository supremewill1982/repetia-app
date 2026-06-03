import { db, auth } from './firebaseConfig';
import { doc, setDoc, getDoc, increment, serverTimestamp } from 'firebase/firestore';

export function formatTime(minutes: number): string {
  if (!minutes || minutes < 0) return '0min';
  if (minutes < 60) return `${Math.round(minutes)}min`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours}h${mins}` : `${hours}h`;
}

export async function saveTimeStatsToFirebase(stats: {
  totalApp: number;
  totalRevisions: number;
  totalDevoirs: number;
  navigation: number;
  parMatiere: any;
}) {
  try {
    const user = auth.currentUser;
    if (!user) return false;
    
    const timeRef = doc(db, 'timeStats', user.uid);
    const today = new Date().toISOString().split('T')[0];
    
    const docSnap = await getDoc(timeRef);
    let history = [];
    
    if (docSnap.exists()) {
      const existing = docSnap.data();
      history = existing.history || [];
    }
    
    await setDoc(timeRef, {
      totalApp: Math.round(stats.totalApp),
      totalRevisions: Math.round(stats.totalRevisions),
      totalDevoirs: Math.round(stats.totalDevoirs),
      navigation: Math.round(stats.navigation),
      parMatiere: stats.parMatiere,
      lastUpdated: serverTimestamp()
    }, { merge: true });
    
    console.log('✅ Stats temps sauvegardées dans Firebase');
    return true;
  } catch (error) {
    console.error('❌ Erreur sauvegarde temps Firebase:', error);
    return false;
  }
}

export async function getTimeStatsFromFirebase() {
  try {
    const user = auth.currentUser;
    if (!user) return null;
    
    const timeRef = doc(db, 'timeStats', user.uid);
    const docSnap = await getDoc(timeRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        navigation: data.navigation || 0,
        devoirs: data.totalDevoirs || 0,
        revisions: data.totalRevisions || 0,
        totalApp: data.totalApp || 0,
        parMatiere: data.parMatiere || {}
      };
    }
    return null;
  } catch (error) {
    console.error('❌ Erreur lecture temps Firebase:', error);
    return null;
  }
}

export async function addTimeToMatiere(matiere: string, type: 'revision' | 'devoir', minutes: number) {
  try {
    const user = auth.currentUser;
    if (!user || minutes < 0.1) return;
    
    const timeRef = doc(db, 'timeStats', user.uid);
    const fieldPath = `parMatiere.${matiere}.${type}`;
    const totalField = `parMatiere.${matiere}.total`;
    
    await setDoc(timeRef, {
      [fieldPath]: increment(minutes),
      [totalField]: increment(minutes),
      [`total${type === 'revision' ? 'Revisions' : 'Devoirs'}`]: increment(minutes),
      totalApp: increment(minutes),
      lastUpdated: serverTimestamp()
    }, { merge: true });
    
    console.log(`✅ +${minutes.toFixed(1)} min ajoutés à ${matiere} (${type})`);
  } catch (error) {
    console.error('❌ Erreur ajout temps matière:', error);
  }
}
