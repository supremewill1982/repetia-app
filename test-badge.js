const { initializeApp } = require('firebase/app');
const { getFirestore, doc, updateDoc, arrayUnion } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

const firebaseConfig = {
  apiKey: "AIzaSyBGfXTxNzr68pksZeEoM9IGb0Tz9XDc1iI",
  authDomain: "monappedu-f6048.firebaseapp.com",
  projectId: "monappedu-f6048",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function addTestBadge(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    const testBadge = {
      id: 'test_badge',
      nom: 'Badge de test',
      description: 'Ceci est un badge de test',
      icone: 'star',
      couleur: '#FFD700',
      dateObtention: new Date().toISOString()
    };
    
    const badgesRef = doc(db, 'badges', user.uid);
    await updateDoc(badgesRef, {
      badges: arrayUnion(testBadge)
    });
    console.log(`✅ Badge de test ajouté pour ${email}`);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

// Remplace par l'email et le mot de passe du nouvel élève
addTestBadge('willy@gmail.com', 'Aaaaaa');
