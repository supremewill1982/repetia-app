import * as SecureStore from 'expo-secure-store';
import { auth } from './firebaseConfig';

const SESSIONS_KEY_PREFIX = 'monrepetiteur_sessions';

function getSessionsKey(): string | null {
  const uid = auth.currentUser?.uid;
  return uid ? `${SESSIONS_KEY_PREFIX}_${uid}` : null;
}

// Stockage local léger et isolé par utilisateur.
export async function saveSessionSecure(session: any) {
  try {
    const sessionsKey = getSessionsKey();

    if (!sessionsKey) {
      console.warn(
        '⚠️ saveSessionSecure: aucun utilisateur connecté — écriture locale annulée'
      );

      return {
        success: false,
        error: 'Utilisateur non connecté',
      };
    }

    const lightSession = {
      d: new Date(
        session.date || new Date()
      ).toISOString().substring(0, 10),

      m: (session.matiere || 'Révision').substring(0, 15),

      t: session.type === 'devoir' ? 'D' : 'R',

      s: session.scoreTotal || 0,

      x: session.scoreMax || 10,

      q: (session.questions || [])
        .slice(0, 3)
        .map((q: any) => ({
          n: q.note || 0,
        })),
    };

    const existing = await getSessionsSecure();

    const allSessions = [
      ...existing,
      {
        ...session,
        _light: lightSession,
      },
    ];

    // Garder uniquement les 20 dernières sessions.
    const recentSessions = allSessions.slice(-20);

    const toStore = recentSessions.map((s: any) => {
      if (s._light) {
        return s._light;
      }

      return {
        d: new Date(
          s.date || new Date()
        ).toISOString().substring(0, 10),

        m: (s.matiere || 'Révision').substring(0, 15),

        t: s.type === 'devoir' ? 'D' : 'R',

        s: s.scoreTotal || 0,

        x: s.scoreMax || 10,

        q: (s.questions || [])
          .slice(0, 3)
          .map((q: any) => ({
            n: q.note || 0,
          })),
      };
    });

    const jsonString = JSON.stringify(toStore);
    const size = new Blob([jsonString]).size;

    if (size > 2000) {
      console.log(
        `⚠️ Taille: ${size} bytes — compression supplémentaire`
      );

      const ultraLight = toStore.map((s: any) => ({
        d: s.d,
        m: s.m,
        t: s.t,
        s: s.s,
        x: s.x,
      }));

      await SecureStore.setItemAsync(
        sessionsKey,
        JSON.stringify(ultraLight)
      );
    } else {
      await SecureStore.setItemAsync(
        sessionsKey,
        jsonString
      );
    }

    console.log(
      `✅ Session sauvegardée — ID: ${session.id || Date.now()}`
    );

    return {
      success: true,
    };
  } catch (error) {
    console.error(
      '❌ Erreur sauvegarde session locale:',
      error
    );

    return {
      success: false,
      error,
    };
  }
}

export async function getSessionsSecure() {
  try {
    const sessionsKey = getSessionsKey();

    if (!sessionsKey) {
      console.warn(
        '⚠️ getSessionsSecure: aucun utilisateur connecté — lecture locale annulée'
      );

      return [];
    }

    const jsonValue =
      await SecureStore.getItemAsync(sessionsKey);

    if (!jsonValue) {
      return [];
    }

    const stored = JSON.parse(jsonValue);

    if (!Array.isArray(stored)) {
      console.warn(
        '⚠️ getSessionsSecure: données locales invalides'
      );

      return [];
    }

    return stored.map((s: any) => ({
      date: s.d,

      matiere:
        s.m === 'D'
          ? 'Devoir'
          : s.m === 'R'
            ? 'Révision'
            : s.m,

      type:
        s.t === 'D'
          ? 'devoir'
          : 'revision',

      scoreTotal: s.s,

      scoreMax: s.x,

      questions: (s.q || []).map((q: any) => ({
        note: q.n,
        question: '',
        reponse: '',
        feedback: '',
      })),

      id:
        `${auth.currentUser?.uid || 'unknown'}_local_${s.d}_${Math.random()}`,
    }));
  } catch (error) {
    console.error(
      '❌ Erreur lecture sessions locales:',
      error
    );

    return [];
  }
}
