import * as SecureStore from 'expo-secure-store';

const SESSIONS_KEY = 'monrepetiteur_sessions';

// Version ultra-légère pour rester sous 2048 bytes
export async function saveSessionSecure(session: any) {
  try {
    // Ne garder que l'essentiel
    const lightSession = {
      d: new Date(session.date).toISOString().substring(0, 10),
      m: (session.matiere || 'Révision').substring(0, 15),
      t: session.type === 'devoir' ? 'D' : 'R',
      s: session.scoreTotal || 0,
      x: session.scoreMax || 10,
      q: (session.questions || []).slice(0, 3).map((q: any) => ({ n: q.note || 0 }))
    };
    
    // Récupérer les sessions existantes
    const existing = await getSessionsSecure();
    const allSessions = [...existing, { ...session, _light: lightSession }];
    
    // Ne garder que les 20 dernières sessions
    const recentSessions = allSessions.slice(-20);
    const toStore = recentSessions.map(s => s._light || {
      d: new Date(s.date).toISOString().substring(0, 10),
      m: (s.matiere || 'Révision').substring(0, 15),
      t: s.type === 'devoir' ? 'D' : 'R',
      s: s.scoreTotal || 0,
      x: s.scoreMax || 10,
      q: (s.questions || []).slice(0, 3).map((q: any) => ({ n: q.note || 0 }))
    });
    
    const jsonString = JSON.stringify(toStore);
    const size = new Blob([jsonString]).size;
    if (size > 2000) {
      console.log(`⚠️ Taille: ${size} bytes, compression supplémentaire`);
      // Compresser davantage en supprimant les questions
      const ultraLight = toStore.map(s => ({ d: s.d, m: s.m, t: s.t, s: s.s, x: s.x }));
      await SecureStore.setItemAsync(SESSIONS_KEY, JSON.stringify(ultraLight));
    } else {
      await SecureStore.setItemAsync(SESSIONS_KEY, jsonString);
    }
    
    console.log(`✅ Session sauvegardée - ID: ${session.id || Date.now()}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur sauvegarde:', error);
    return { success: false, error };
  }
}

export async function getSessionsSecure() {
  try {
    const jsonValue = await SecureStore.getItemAsync(SESSIONS_KEY);
    if (!jsonValue) return [];
    const stored = JSON.parse(jsonValue);
    // Restaurer les sessions
    return stored.map((s: any) => ({
      date: s.d,
      matiere: s.m === 'D' ? 'Devoir' : (s.m === 'R' ? 'Révision' : s.m),
      type: s.t === 'D' ? 'devoir' : 'revision',
      scoreTotal: s.s,
      scoreMax: s.x,
      questions: (s.q || []).map((q: any) => ({ note: q.n, question: '', reponse: '', feedback: '' })),
      id: Date.now() + Math.random()
    }));
  } catch (error) {
    console.error('❌ Erreur lecture:', error);
    return [];
  }
}
