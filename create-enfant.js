const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

const firebaseConfig = {
  apiKey: "AIzaSyBGfXTxNzr68pksZeEoM9IGb0Tz9XDc1iI",
  authDomain: "monappedu-f6048.firebaseapp.com",
  projectId: "monappedu-f6048",
  storageBucket: "monappedu-f6048.firebasestorage.app",
  messagingSenderId: "91467362855",
  appId: "1:91467362855:web:aab443bf9135e4049f1402"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function createEnfantDocument() {
  try {
    // Se connecter avec le compte existant
    const userCredential = await signInWithEmailAndPassword(auth, 'jean@jean.com', 'votre-mot-de-passe');
    const user = userCredential.user;
    console.log('✅ Connecté:', user.uid);
    
    // Créer le document enfant
    await setDoc(doc(db, 'enfants', user.uid), {
      prenom: 'Jean',
      classe: 'CM2',
      email: 'jean@jean.com',
      age: 10,
      dateCreation: new Date().toISOString()
    });
    console.log('✅ Document enfant créé avec succès');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

createEnfantDocument();
