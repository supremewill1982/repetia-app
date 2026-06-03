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

async function createDocuments() {
  try {
    // Remplace par le vrai mot de passe
    const password = 'Aaaaaa';
    const userCredential = await signInWithEmailAndPassword(auth, 'willy@gmail.com', password);
    const uid = userCredential.user.uid;
    console.log('✅ UDI récupéré:', uid);
    
    // Créer document enfants
    const enfantRef = doc(db, 'enfants', uid);
    await setDoc(enfantRef, {
      prenom: 'Willy',
      classe: 'CM2',
      email: 'willy@gmail.com',
      age: 10,
      dateCreation: new Date().toISOString(),
      codeLiaison: null,
      parentsLies: []
    });
    console.log('✅ Document enfants créé');
    
    // Créer document badges
    const badgesRef = doc(db, 'badges', uid);
    await setDoc(badgesRef, {
      badges: [],
      updatedAt: new Date().toISOString()
    });
    console.log('✅ Document badges créé');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

createDocuments();
