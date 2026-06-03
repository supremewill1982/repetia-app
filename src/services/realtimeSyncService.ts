import { db } from './firebaseConfig';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { auth } from './firebaseConfig';
import { getSessionsSecure, saveSessionSecure } from './secureStorageService';
import { getBadgesDeBloques, sauvegarderBadges } from './badgesService';

let unsubscribeSessions = null;
let unsubscribeBadges = null;

export function startRealtimeSync(onDataUpdate) {
  const user = auth.currentUser;
  if (!user) {
    console.log('⚠️ startRealtimeSync: aucun utilisateur connecté');
    return () => {};
  }

  console.log(`📡 Démarrage synchronisation temps réel pour ${user.email}`);

  // Écouter les nouvelles sessions
  const sessionsRef = collection(db, 'sessions');
  const q = query(sessionsRef, where('enfantId', '==', user.uid));
  
  unsubscribeSessions = onSnapshot(q, async (snapshot) => {
    const nouvellesSessions = [];
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        console.log(`📝 Nouvelle session ajoutée: ${change.doc.id}`);
        nouvellesSessions.push({ id: change.doc.id, ...change.doc.data() });
      }
    });
    if (nouvellesSessions.length > 0) {
      for (const session of nouvellesSessions) {
        await saveSessionSecure(session);
      }
      if (onDataUpdate) onDataUpdate('sessions', nouvellesSessions);
    }
  }, (error) => {
    console.error('❌ Erreur écoute sessions:', error);
  });

  // Écouter les badges
  const badgesRef = doc(db, 'badges', user.uid);
  unsubscribeBadges = onSnapshot(badgesRef, async (docSnap) => {
    if (docSnap.exists()) {
      const badges = docSnap.data().badges || [];
      const badgesLocaux = await getBadgesDeBloques();
      
      // Vérifier si de nouveaux badges sont arrivés
      const nouveauxBadges = badges.filter(b => 
        !badgesLocaux.some(lb => lb.id === b.id)
      );
      
      if (nouveauxBadges.length > 0) {
        console.log(`🎖️ ${nouveauxBadges.length} nouveaux badges synchronisés`);
        await sauvegarderBadges(badges);
        if (onDataUpdate) onDataUpdate('badges', nouveauxBadges);
      }
    }
  }, (error) => {
    console.error('❌ Erreur écoute badges:', error);
  });

  // Retourner une fonction pour arrêter l'écoute
  return () => {
    console.log('🔴 Arrêt synchronisation temps réel');
    if (unsubscribeSessions) unsubscribeSessions();
    if (unsubscribeBadges) unsubscribeBadges();
  };
}
