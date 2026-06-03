const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, getDoc } = require('firebase/firestore');
const { getAuth } = require('firebase/auth');

const firebaseConfig = {
  apiKey: "AIzaSyBGfXTxNzr68pksZeEoM9IGb0Tz9XDc1iI",
  authDomain: "monappedu-f6048.firebaseapp.com",
  projectId: "monappedu-f6048",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function fixBadgesForAllUsers() {
  try {
    // Récupérer tous les utilisateurs (nécessite admin SDK)
    // En attendant, créer une fonction pour l'utilisateur connecté
    const user = auth.currentUser;
    if (user) {
      const badgesRef = doc(db, 'badges', user.uid);
      const existing = await getDoc(badgesRef);
      if (!existing.exists()) {
        await setDoc(badgesRef, { badges: [], updatedAt: new Date().toISOString() });
        console.log(`✅ Document badges créé pour ${user.email} (${user.uid})`);
      } else {
        console.log(`✅ Document badges existe déjà pour ${user.email}`);
      }
    } else {
      console.log('⚠️ Aucun utilisateur connecté');
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

fixBadgesForAllUsers();
