import { getFirestore, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from './firebaseConfig';

const db          = getFirestore();
const CACHE_KEY   = 'repetia_premium_v2';

export type Plan = 'gratuit' | 'etudiant' | 'etudiantPlus' | 'famille' | 'excellence';

export const PLANS_INFO = {
  gratuit: {
    nom: 'Gratuit', emoji: '🆓', prix: 0, couleur: '#606080',
    questionsParJour: 5, photosParSemaine: 2, matieres: 2,
    description: 'Pour découvrir RÉPÉTIA',
    avantages: ['5 questions IA/jour','2 matières','2 photos/semaine','Badges de base'],
  },
  etudiant: {
    nom: 'Étudiant', emoji: '🥈', prix: 2500, couleur: '#4DA6FF',
    questionsParJour: 9999, photosParSemaine: 9999, matieres: 8,
    description: 'Pour réviser sérieusement',
    avantages: ['Questions illimitées','8 matières + profs IA','Photos illimitées','Planning intelligent','Tous les badges'],
  },
  etudiantPlus: {
    nom: 'Étudiant+', emoji: '🥇', prix: 4500, couleur: '#FFD700',
    questionsParJour: 9999, photosParSemaine: 9999, matieres: 8,
    description: "Pour viser l'excellence",
    avantages: ["Tout Étudiant +",'Oracle du Bac 🔮','Sprint Mode 48h','1 session répétiteur/mois','Accès prioritaire'],
  },
  famille: {
    nom: 'Famille', emoji: '👨‍👩‍👧', prix: 6500, couleur: '#00E5A0',
    questionsParJour: 9999, photosParSemaine: 9999, matieres: 8,
    description: 'Pour toute la famille',
    avantages: ['3 enfants inclus','Dashboard parent','Rapports WhatsApp','Alertes décrochage'],
  },
  excellence: {
    nom: 'Excellence', emoji: '🏆', prix: 12000, couleur: '#8B5CF6',
    questionsParJour: 9999, photosParSemaine: 9999, matieres: 8,
    description: 'Tout inclus, garanti',
    avantages: ['Tout illimité','Répétiteur dédié','2 sessions live/semaine','Garantie satisfaction 💯'],
  },
};

export interface StatutPremium {
  plan:               Plan;
  isPremium:          boolean;
  expiresAt:          string | null;
  questionsUtilisees: number;
  photosUtilisees:    number;
  dernierReset:       string;
}

function statutGratuitDefaut(): StatutPremium {
  return {
    plan: 'gratuit', isPremium: false, expiresAt: null,
    questionsUtilisees: 0, photosUtilisees: 0,
    dernierReset: new Date().toDateString(),
  };
}

// ── Cache local ──
async function saveCache(s: StatutPremium) {
  try { await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(s)); } catch {}
}
async function loadCache(): Promise<StatutPremium | null> {
  try {
    const v = await AsyncStorage.getItem(CACHE_KEY);
    return v ? JSON.parse(v) : null;
  } catch { return null; }
}

// ══════════════════════════════════════════
// RÉCUPÉRER STATUT (Firestore + cache local)
// ══════════════════════════════════════════
export async function getStatutPremium(): Promise<StatutPremium> {
  const user = auth.currentUser;
  if (!user) return statutGratuitDefaut();

  const today = new Date().toDateString();

  // 1. Essayer Firestore
  try {
    const ref  = doc(db, 'users', user.uid, 'premium', 'statut');
    const snap = await getDoc(ref);

    let statut: StatutPremium;

    if (!snap.exists()) {
      statut = statutGratuitDefaut();
      await setDoc(ref, statut);
    } else {
      statut = snap.data() as StatutPremium;
    }

    // Expiration
    if (statut.expiresAt && new Date(statut.expiresAt) < new Date()) {
      statut = { ...statut, plan: 'gratuit', isPremium: false };
      await updateDoc(ref, { plan: 'gratuit', isPremium: false });
    }

    // Reset quotidien
    if (statut.dernierReset !== today) {
      statut = { ...statut, questionsUtilisees: 0, photosUtilisees: 0, dernierReset: today };
      await updateDoc(ref, { questionsUtilisees: 0, photosUtilisees: 0, dernierReset: today });
    }

    await saveCache(statut);
    return statut;

  } catch (e: any) {
    // 2. Fallback cache local si Firestore inaccessible (permissions)
    console.warn('⚠️ Premium Firestore inaccessible, cache local utilisé');
    const cached = await loadCache();
    if (cached) {
      // Reset quotidien sur le cache aussi
      if (cached.dernierReset !== today) {
        const reset = { ...cached, questionsUtilisees: 0, photosUtilisees: 0, dernierReset: today };
        await saveCache(reset);
        return reset;
      }
      return cached;
    }
    return statutGratuitDefaut();
  }
}

// ══════════════════════════════════════════
// VÉRIFIER QUOTA
// ══════════════════════════════════════════
export async function verifierQuota(type: 'question' | 'photo'): Promise<{
  autorise: boolean; restant: number; statut: StatutPremium;
}> {
  try {
    const statut   = await getStatutPremium();
    const planInfo = PLANS_INFO[statut.plan];

    if (type === 'question') {
      const autorise = statut.questionsUtilisees < planInfo.questionsParJour;
      const restant  = Math.max(0, planInfo.questionsParJour - statut.questionsUtilisees);
      return { autorise, restant, statut };
    } else {
      const autorise = statut.photosUtilisees < planInfo.photosParSemaine;
      const restant  = Math.max(0, planInfo.photosParSemaine - statut.photosUtilisees);
      return { autorise, restant, statut };
    }
  } catch {
    return { autorise: true, restant: 5, statut: statutGratuitDefaut() };
  }
}

// ══════════════════════════════════════════
// CONSOMMER QUOTA
// ══════════════════════════════════════════
export async function consommerQuota(type: 'question' | 'photo'): Promise<void> {
  try {
    const user   = auth.currentUser;
    if (!user) return;

    const statut = await getStatutPremium();
    if (statut.isPremium) return; // Premium = pas de quota

    const nouveau = {
      ...statut,
      questionsUtilisees: type === 'question' ? statut.questionsUtilisees + 1 : statut.questionsUtilisees,
      photosUtilisees:    type === 'photo'    ? statut.photosUtilisees + 1    : statut.photosUtilisees,
    };

    await saveCache(nouveau);

    // Essayer Firestore
    try {
      const ref = doc(db, 'users', user.uid, 'premium', 'statut');
      if (type === 'question') await updateDoc(ref, { questionsUtilisees: nouveau.questionsUtilisees });
      else                     await updateDoc(ref, { photosUtilisees:    nouveau.photosUtilisees    });
    } catch {
      // Cache local suffisant si Firestore inaccessible
    }
  } catch (e) {
    console.error('Erreur consommerQuota:', e);
  }
}

// ══════════════════════════════════════════
// ACTIVER PREMIUM (admin via Firestore console)
// ══════════════════════════════════════════
export async function activerPremium(plan: Plan, dureeJours: number): Promise<void> {
  try {
    const user = auth.currentUser;
    if (!user) return;

    const expiration = new Date();
    expiration.setDate(expiration.getDate() + dureeJours);

    const statut: StatutPremium = {
      plan,
      isPremium:          plan !== 'gratuit',
      expiresAt:          expiration.toISOString(),
      questionsUtilisees: 0,
      photosUtilisees:    0,
      dernierReset:       new Date().toDateString(),
    };

    await saveCache(statut);

    const ref = doc(db, 'users', user.uid, 'premium', 'statut');
    await setDoc(ref, statut);

    console.log(`✅ Premium ${plan} activé jusqu'au ${expiration.toLocaleDateString()}`);
  } catch (e) {
    console.error('Erreur activerPremium:', e);
  }
}
