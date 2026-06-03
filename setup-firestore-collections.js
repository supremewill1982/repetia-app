const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

const firebaseConfig = {
  apiKey: "AIzaSyBGfXTxNzr68pksZeEoM9IGb0Tz9XDc1iI",
  authDomain: "monappedu-f6048.firebaseapp.com",
  projectId: "monappedu-f6048",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function setupCollections() {
  try {
    // Se connecter (remplacer email et mot de passe)
    const userCredential = await signInWithEmailAndPassword(auth, 'ton-email@example.com', 'ton-mot-de-passe');
    const uid = userCredential.user.uid;
    console.log('✅ Connecté, UID:', uid);
    
    // Créer document progression
    const progressionRef = doc(db, 'progression', uid);
    await setDoc(progressionRef, {
      moyenneGlobale: 0,
      totalRevisions: 0,
      totalDevoirs: 0,
      totalQuestions: 0,
      serie: 0,
      meilleureMatiere: '',
      pireMatiere: '',
      progression30Jours: [],
      tempsTotal: 0,
      badgesCount: 0,
      lastUpdated: new Date().toISOString()
    }, { merge: true });
    console.log('✅ Collection progression créée');
    
    // Créer document timeStats
    const timeStatsRef = doc(db, 'timeStats', uid);
    await setDoc(timeStatsRef, {
      totalApp: 0,
      totalRevisions: 0,
      totalDevoirs: 0,
      parMatiere: {},
      history: [],
      lastUpdated: new Date().toISOString()
    }, { merge: true });
    console.log('✅ Collection timeStats créée');
    
    // Créer document badges
    const badgesRef = doc(db, 'badges', uid);
    await setDoc(badgesRef, {
      badges: [],
      updatedAt: new Date().toISOString()
    }, { merge: true });
    console.log('✅ Collection badges créée');
    
    console.log('🎉 Toutes les collections sont prêtes !');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

setupCollections();
