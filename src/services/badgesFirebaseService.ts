import { db } from './firebaseConfig';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth } from './firebaseConfig';

export async function sauvegarderBadgesFirebase(badges: unknown) {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.log('⚠️ sauvegarderBadgesFirebase: utilisateur non connecté');
      return false;
    }
    
    // S'assurer que badges est un tableau, pas une fonction
    const badgesArray = Array.isArray(badges) ? badges : [];
    
    const badgesRef = doc(db, 'badges', user.uid);
    await setDoc(badgesRef, {
      badges: badgesArray,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    console.log(`✅ Badges sauvegardés dans Firebase (${badgesArray.length} badges)`);
    return true;
  } catch (error) {
    console.error('❌ Erreur sauvegarde badges Firebase:', error);
    return false;
  }
}

export async function getBadgesFirebase() {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.log('⚠️ getBadgesFirebase: utilisateur non connecté');
      return null;
    }
    
    const badgesRef = doc(db, 'badges', user.uid);
    const docSnap = await getDoc(badgesRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return Array.isArray(data.badges) ? data.badges : [];
    }
    return null;
  } catch (error) {
    console.error('❌ Erreur lecture badges Firebase:', error);
    return null;
  }
}

export async function synchroniserBadges() {
  try {
    // Import dynamique pour éviter les dépendances circulaires.
    const { getBadgesDeBloques, sauvegarderBadges } = require('./badgesService');

    const user = auth.currentUser;
    if (!user) {
      console.warn('⚠️ synchroniserBadges: aucun utilisateur connecté');
      return null;
    }

    const uid = user.uid;

    const badgesLocaux = await getBadgesDeBloques();
    const badgesFirebase = await getBadgesFirebase();

    const badgesExistants = new Map<string, any>();

    // Firebase et local appartiennent obligatoirement au même UID.
    if (Array.isArray(badgesFirebase)) {
      badgesFirebase.forEach((badge: any) => {
        if (badge?.id) badgesExistants.set(badge.id, badge);
      });
    }

    if (Array.isArray(badgesLocaux)) {
      badgesLocaux.forEach((badge: any) => {
        if (badge?.id && !badgesExistants.has(badge.id)) {
          badgesExistants.set(badge.id, badge);
        }
      });
    }

    const badgesFusionnes = Array.from(badgesExistants.values());

    // Protection contre un logout/login pendant l'opération.
    if (auth.currentUser?.uid !== uid) {
      console.warn('⚠️ UID changé pendant synchronisation badges — écriture annulée');
      return null;
    }

    await sauvegarderBadges(badgesFusionnes);

    if (auth.currentUser?.uid !== uid) {
      console.warn('⚠️ UID changé avant Firebase — écriture annulée');
      return null;
    }

    await sauvegarderBadgesFirebase(badgesFusionnes);

    console.log(`🔄 Badges synchronisés pour ${uid}: ${badgesFusionnes.length}`);
    return badgesFusionnes;
  } catch (error) {
    console.error('❌ Erreur synchronisation badges:', error);
    return null;
  }
}
