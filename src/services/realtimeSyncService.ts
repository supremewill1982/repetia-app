import { db, auth } from './firebaseConfig';
import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  type Unsubscribe,
} from 'firebase/firestore';

import { saveSessionSecure } from './secureStorageService';
import {
  getBadgesDeBloques,
    sauvegarderBadges,
} from './badgesService';

type RealtimeDataType = 'sessions' | 'badges';

type RealtimeDataUpdate = (
  type: RealtimeDataType,
  data: any[]
) => void;

interface SessionData {
  id: string;
  [key: string]: any;
}

interface BadgeData {
  id: string;
  [key: string]: any;
}

let unsubscribeSessions: Unsubscribe | null = null;
let unsubscribeBadges: Unsubscribe | null = null;

export function startRealtimeSync(
  onDataUpdate?: RealtimeDataUpdate
): () => void {
  const user = auth.currentUser;

  if (!user) {
    console.log(
      '⚠️ startRealtimeSync: aucun utilisateur connecté'
    );

    return () => {};
  }

  console.log(
    `📡 Démarrage synchronisation temps réel pour ${user.email}`
  );

  // ============================================================
  // ÉCOUTE DES SESSIONS
  // ============================================================

  const sessionsRef = collection(db, 'sessions');

  const q = query(
    sessionsRef,
    where('enfantId', '==', user.uid)
  );

  unsubscribeSessions = onSnapshot(
    q,
    async (snapshot) => {
      const nouvellesSessions: SessionData[] = [];

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          console.log(
            `📝 Nouvelle session ajoutée: ${change.doc.id}`
          );

          nouvellesSessions.push({
            id: change.doc.id,
            ...change.doc.data(),
          });
        }
      });

      if (nouvellesSessions.length > 0) {
        for (const session of nouvellesSessions) {
          await saveSessionSecure(session);
        }

        onDataUpdate?.(
          'sessions',
          nouvellesSessions
        );
      }
    },
    (error) => {
      console.error(
        '❌ Erreur écoute sessions:',
        error
      );
    }
  );

  // ============================================================
  // ÉCOUTE DES BADGES
  // ============================================================

  const badgesRef = doc(
    db,
    'badges',
    user.uid
  );

  unsubscribeBadges = onSnapshot(
    badgesRef,
    async (docSnap) => {
      if (!docSnap.exists()) {
        return;
      }

      const badges: BadgeData[] =
        (docSnap.data().badges || []) as BadgeData[];

      const badgesLocaux =
        await getBadgesDeBloques();

      const nouveauxBadges = badges.filter(
        (b: BadgeData) =>
          !badgesLocaux.some(
            (lb: BadgeData) => lb.id === b.id
          )
      );

      if (nouveauxBadges.length > 0) {
        console.log(
          `🎖️ ${nouveauxBadges.length} nouveaux badges synchronisés`
        );

        await sauvegarderBadges(badges);

        onDataUpdate?.(
          'badges',
          nouveauxBadges
        );
      }
    },
    (error) => {
      console.error(
        '❌ Erreur écoute badges:',
        error
      );
    }
  );

  // ============================================================
  // ARRÊT DE LA SYNCHRONISATION
  // ============================================================

  return () => {
    console.log(
      '🔴 Arrêt synchronisation temps réel'
    );

    if (unsubscribeSessions) {
      unsubscribeSessions();
      unsubscribeSessions = null;
    }

    if (unsubscribeBadges) {
      unsubscribeBadges();
      unsubscribeBadges = null;
    }
  };
}
