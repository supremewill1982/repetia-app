import { db, auth } from './firebaseConfig';
import { doc, setDoc, getDoc, increment, serverTimestamp } from 'firebase/firestore';


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

    await setDoc(timeRef, {
      totalApp: stats.totalApp,
      totalRevisions: stats.totalRevisions,
      totalDevoirs: stats.totalDevoirs,
      navigation: stats.navigation,
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

