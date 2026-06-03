const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, getDoc } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

const firebaseConfig = {
  apiKey: "AIzaSyBGfXTxNzr68pksZeEoM9IGb0Tz9XDc1iI",
  authDomain: "monappedu-f6048.firebaseapp.com",
  projectId: "monappedu-f6048",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function fixBadges() {
  try {
    // Connecte-toi avec ton compte (remplace mot de passe)
    const userCredential = await signInWithEmailAndPassword(auth, 'nina@gmail.com', 'Aaaaaa');
    const user = userCredential.user;
    console.log('✅ Connecté:', user.uid);
    
    const badgesRef = doc(db, 'badges', user.uid);
    const existing = await getDoc(badgesRef);
    
    if (!existing.exists()) {
      await setDoc(badgesRef, { badges: [], updatedAt: new Date().toISOString() });
      console.log('✅ Document badges créé');
    } else {
      console.log('✅ Document badges existe déjà');
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

fixBadges();
