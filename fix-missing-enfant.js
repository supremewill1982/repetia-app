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

async function fixEnfantDocument() {
  try {
    // Remplace par le mot de passe de willy@gmail.com
    const userCredential = await signInWithEmailAndPassword(auth, 'willy@gmail.com', 'Aaaaaa');
    const user = userCredential.user;
    console.log('✅ Connecté:', user.uid);
    
    // Vérifier si le document enfant existe
    const enfantRef = doc(db, 'enfants', user.uid);
    const enfantSnap = await getDoc(enfantRef);
    
    if (!enfantSnap.exists()) {
      await setDoc(enfantRef, {
        prenom: 'Willy',
        classe: 'Non définie',
        email: 'willy@gmail.com',
        age: 10,
        dateCreation: new Date().toISOString(),
        codeLiaison: null,
        parentsLies: []
      });
      console.log('✅ Document enfant créé');
    } else {
      console.log('✅ Document enfant existe déjà');
    }
    
    // Créer aussi le document badges
    const badgesRef = doc(db, 'badges', user.uid);
    const badgesSnap = await getDoc(badgesRef);
    
    if (!badgesSnap.exists()) {
      await setDoc(badgesRef, { badges: [], updatedAt: new Date().toISOString() });
      console.log('✅ Document badges créé');
    } else {
      console.log('✅ Document badges existe déjà');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

fixEnfantDocument();
