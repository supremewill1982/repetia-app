import { db } from './firebaseConfig';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  limit,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  deleteDoc
} from 'firebase/firestore';
import { auth } from './firebaseConfig';
import { normalizeSessions, normalizeMatiere } from './normalizeMatiereService';

// Cache spécifique à l'utilisateur
let sessionsCache: any = null;
let lastFetch = 0;
let currentUserId: string | null = null;
const CACHE_DURATION = 30000; // 30 secondes

export async function sauvegarderSessionFirebase(sessionData: any) {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.log('❌ sauvegarderSessionFirebase: utilisateur non connecté');
      return { success: false, error: 'Utilisateur non connecté' };
    }

    const matiereFinale = normalizeMatiere(sessionData.matiere, sessionData.type);

    const session = {
      ...sessionData,
      matiere: matiereFinale,
      enfantId: user.uid,
      date: sessionData.date || new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, 'sessions'), session);
    console.log('✅ Session sauvegardée dans Firebase:', docRef.id);
    
    // Invalider le cache spécifique à cet utilisateur
    if (currentUserId === user.uid) {
      sessionsCache = null;
      lastFetch = 0;
    }
    
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('❌ Erreur sauvegarde Firebase:', error);
    return { success: false, error };
  }
}

export async function getSessionsEnfantFirebase(forceRefresh = false) {
  const user = auth.currentUser;
  if (!user) {
    console.log('⚠️ getSessionsEnfantFirebase: utilisateur non connecté');
    return [];
  }

  // CORRECTION: Vérifier si l'utilisateur a changé
  if (currentUserId !== user.uid) {
    console.log(`🔄 Changement d'utilisateur détecté: ${currentUserId || 'aucun'} -> ${user.uid}, cache invalidé`);
    sessionsCache = null;
    lastFetch = 0;
    currentUserId = user.uid;
  }

  const now = Date.now();
  if (!forceRefresh && sessionsCache && (now - lastFetch) < CACHE_DURATION) {
    console.log(`📦 Utilisation du cache pour ${user.email} (${sessionsCache.length} sessions)`);
    return sessionsCache;
  }

  try {
    console.log(`🔍 Recherche des sessions pour enfantId: ${user.uid} (${user.email})`);
    
    const sessionsRef = collection(db, 'sessions');
    const q = query(
      sessionsRef, 
      where('enfantId', '==', user.uid),
      limit(100)
    );
    
    const querySnapshot = await getDocs(q);
    const sessions = [];
    
    querySnapshot.forEach((doc) => {
      sessions.push({ id: doc.id, ...doc.data() });
    });
    
    console.log(`✅ ${sessions.length} sessions trouvées pour ${user.email}`);
    
    const sessionsNormalisees = normalizeSessions(sessions);
    
    // Mettre en cache
    sessionsCache = sessionsNormalisees;
    lastFetch = now;
    
    return sessionsNormalisees;
  } catch (error) {
    console.error('❌ Erreur chargement sessions:', error);
    return sessionsCache || [];
  }
}

export async function refreshSessions() {
  sessionsCache = null;
  lastFetch = 0;
  return await getSessionsEnfantFirebase(true);
}

export async function genererCodeLiaison() {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Utilisateur non connecté');

    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += characters[Math.floor(Math.random() * characters.length)];
    }
    const codeFormate = `${code.slice(0, 3)}-${code.slice(3, 6)}`;

    const codesRef = collection(db, 'codesLiaison');
    const q = query(
      codesRef, 
      where('enfantId', '==', user.uid),
      where('actif', '==', true)
    );
    const oldCodes = await getDocs(q);
    oldCodes.forEach(async (doc) => {
      await updateDoc(doc.ref, { actif: false });
    });

    await setDoc(doc(db, 'codesLiaison', codeFormate), {
      code: codeFormate,
      enfantId: user.uid,
      enfantPrenom: (await getInfosEnfant()).prenom || 'Enfant',
      actif: true,
      dateCreation: new Date().toISOString()
    });

    console.log('🔑 Nouveau code généré:', codeFormate);
    return codeFormate;
  } catch (error) {
    console.error('❌ Erreur génération code:', error);
    return null;
  }
}

export async function getCodeLiaison() {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Utilisateur non connecté');

    const codesRef = collection(db, 'codesLiaison');
    const q = query(
      codesRef, 
      where('enfantId', '==', user.uid),
      where('actif', '==', true),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].id;
    }
    return null;
  } catch (error) {
    console.error('❌ Erreur récupération code:', error);
    return null;
  }
}

export async function verifierCodeLiaison(code: string) {
  try {
    const codeRef = doc(db, 'codesLiaison', code);
    const codeSnap = await getDoc(codeRef);
    
    if (codeSnap.exists()) {
      const data = codeSnap.data();
      if (data.actif === true) {
        return { valid: true, enfantId: data.enfantId, enfantPrenom: data.enfantPrenom };
      }
    }
    return { valid: false };
  } catch (error) {
    console.error('❌ Erreur vérification code:', error);
    return { valid: false };
  }
}

export async function getInfosEnfant() {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Utilisateur non connecté');

    const enfantRef = doc(db, 'enfants', user.uid);
    const enfantSnap = await getDoc(enfantRef);
    
    if (enfantSnap.exists()) {
      return enfantSnap.data();
    } else {
      console.log('Document enfant non trouvé');
      return null;
    }
  } catch (error) {
    console.error('❌ Erreur récupération infos:', error);
    return null;
  }
}

export function calculerStatsEnfant(sessions: any[]) {
  if (sessions.length === 0) {
    return {
      moyenne: 0,
      totalRevisions: 0,
      totalQuestions: 0,
      serie: 0,
      tempsTotal: 0,
      pointsFaibles: []
    };
  }

  const totalQuestions = sessions.reduce((acc, s) => acc + (s.questions?.length || 0), 0);
  const totalPoints = sessions.reduce((acc, s) => acc + (s.scoreTotal || 0), 0);
  const moyenne = totalQuestions > 0 ? Math.round((totalPoints / (totalQuestions * 2)) * 100) : 0;

  const datesUniques = [...new Set(sessions.map(s => 
    new Date(s.date).toLocaleDateString('fr-FR')
  ))].sort();
  
  let serie = 1;
  for (let i = 1; i < datesUniques.length; i++) {
    const diff = (new Date(datesUniques[i]) - new Date(datesUniques[i-1])) / (1000 * 60 * 60 * 24);
    if (diff <= 2) {
      serie++;
    } else {
      serie = 1;
    }
  }

  const pointsFaibles = [];
  sessions.forEach(s => {
    s.questions?.forEach((q: any) => {
      if (q.note < 2) {
        pointsFaibles.push({
          matiere: s.matiere || (s.type === 'devoir' ? 'Devoir' : 'Révision'),
          question: q.question,
          reponse: q.reponse,
          correction: q.feedback,
          date: s.date
        });
      }
    });
  });

  const tempsTotal = Math.round(sessions.reduce((acc, s) => acc + (s.questions?.length || 0) * 2.5, 0) / 60);

  return {
    moyenne,
    totalRevisions: sessions.length,
    totalQuestions,
    serie,
    tempsTotal,
    pointsFaibles: pointsFaibles.slice(0, 10)
  };
}

export function formatMatiereDisplay(matiere: string | undefined | null, type?: string): string {
  return normalizeMatiere(matiere, type);
}
