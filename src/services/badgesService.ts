import { getSessionsEnfantFirebase } from './firebaseEnfantService';
import { getTimeStats }              from './timeTrackingService';
import * as SecureStore              from 'expo-secure-store';
import AsyncStorage                  from '@react-native-async-storage/async-storage';

const BADGES_KEY = 'repetia_badges_v3';

// ── Temps de travail (révision + devoir, pas navigation) ──
async function getTempsTravailMinutes(): Promise<number> {
  try {
    const stats = await getTimeStats();
    return Math.max(0, Math.round((stats.revisions || 0) + (stats.devoirs || 0)));
  } catch { return 0; }
}

// ── Nombre de messages Coach IA ──
async function getCoachCount(): Promise<number> {
  try {
    const v = await AsyncStorage.getItem('repetia_coach_count');
    return v ? parseInt(v, 10) : 0;
  } catch { return 0; }
}

export async function incrementCoachCount(): Promise<void> {
  try {
    const current = await getCoachCount();
    await AsyncStorage.setItem('repetia_coach_count', String(current + 1));
  } catch {}
}

// ── Série de jours consécutifs ──
function calculerSerie(sessions: any[]): number {
  if (!sessions?.length) return 0;

  // Dates ISO fiables : YYYY-MM-DD
  const datesSet = new Set<string>(
    sessions.map(s => {
      const d = new Date(s.date || s.createdAt || Date.now());
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    })
  );
  const dates = Array.from(datesSet).sort();
  if (dates.length === 0) return 0;

  let maxSerie = 1, serie = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i-1]);
    const curr = new Date(dates[i]);
    const diff = Math.round((curr.getTime() - prev.getTime()) / (1000*60*60*24));
    if (diff === 1) { serie++; if (serie > maxSerie) maxSerie = serie; }
    else if (diff > 1) serie = 1;
  }
  return maxSerie;
}

// ══════════════════════════════════════════════════
// 📋 DÉFINITION DES 30 BADGES — Conditions précises
// ══════════════════════════════════════════════════
export const BADGES_LIST = [

  // ── Temps de travail (révision + devoir) ──
  {
    id: 'temps_30min', nom: 'Petite graine 🌱',
    description: '30 minutes de travail accumulées',
    icone: 'timer-sand', couleur: '#6BAE98',
    condition: (s: any) => s.tempsTravail >= 30,
  },
  {
    id: 'temps_2h', nom: 'Jeune pousse 🌿',
    description: '2 heures de travail accumulées',
    icone: 'sprout', couleur: '#5A9E88',
    condition: (s: any) => s.tempsTravail >= 120,
  },
  {
    id: 'temps_10h', nom: 'Arbre de la connaissance 🌳',
    description: '10 heures de travail',
    icone: 'tree', couleur: '#4A8E78',
    condition: (s: any) => s.tempsTravail >= 600,
  },
  {
    id: 'temps_50h', nom: 'Forêt enchantée 🌲',
    description: '50 heures de travail',
    icone: 'forest', couleur: '#3A7E68',
    condition: (s: any) => s.tempsTravail >= 3000,
  },

  // ── Premier pas ──
  {
    id: 'premiere_revision', nom: 'Premier pas 🚶',
    description: 'Première révision complétée !',
    icone: 'star', couleur: '#7BA89A',
    // ✅ Au moins 1 révision avec des questions
    condition: (s: any) => s.totalRevisions >= 1,
  },
  {
    id: 'premier_devoir', nom: 'Premier devoir 📝',
    description: 'Premier devoir complété !',
    icone: 'book-open', couleur: '#8A9AAA',
    condition: (s: any) => s.totalDevoirs >= 1,
  },

  // ── Bonnes réponses (note = 2) ──
  {
    id: 'bonne_reponse_10', nom: 'En feu 🔥',
    description: '10 réponses correctes',
    icone: 'fire', couleur: '#D4924A',
    condition: (s: any) => s.bonnesReponses >= 10,
  },
  {
    id: 'bonne_reponse_50', nom: 'Brillant ⭐',
    description: '50 réponses correctes',
    icone: 'star-circle', couleur: '#C4824A',
    condition: (s: any) => s.bonnesReponses >= 50,
  },
  {
    id: 'bonne_reponse_100', nom: 'Expert 💎',
    description: '100 réponses correctes',
    icone: 'diamond', couleur: '#5A8A9A',
    condition: (s: any) => s.bonnesReponses >= 100,
  },

  // ── Sans faute (toutes notes = 2 sur une révision) ──
  {
    id: 'sans_faute_1', nom: 'Impeccable ✨',
    description: 'Révision sans aucune erreur',
    icone: 'check-decagram', couleur: '#6BAE98',
    // ✅ Session avec AU MOINS 1 question ET toutes à 2/2
    condition: (s: any) => s.sansFaute >= 1,
  },
  {
    id: 'sans_faute_5', nom: 'Perfect 🏅',
    description: '5 révisions sans la moindre erreur',
    icone: 'check-decagram', couleur: '#5A9E88',
    condition: (s: any) => s.sansFaute >= 5,
  },
  {
    id: 'sans_faute_10', nom: 'Master Perfect 💎',
    description: '10 révisions parfaites',
    icone: 'check-decagram', couleur: '#4A8E78',
    condition: (s: any) => s.sansFaute >= 10,
  },

  // ── Devoir parfait (20/20) ──
  {
    id: 'devoir_parfait', nom: 'Devoir parfait 🌟',
    description: '20/20 à un devoir',
    icone: 'star-circle', couleur: '#D4924A',
    // ✅ Devoir avec toutes questions à 2/2 ET au moins 1 question
    condition: (s: any) => s.devoirParfait >= 1,
  },
  {
    id: 'devoir_master', nom: 'Maître des devoirs 👑',
    description: '10 devoirs complétés',
    icone: 'crown', couleur: '#C4824A',
    condition: (s: any) => s.totalDevoirs >= 10,
  },
  {
    id: 'devoir_express', nom: 'Éclair ⚡',
    description: 'Devoir entier réussi du premier coup',
    icone: 'lightning-bolt', couleur: '#5A8AAA',
    // ✅ Devoir où chaque question a essais=1 et note=2
    condition: (s: any) => s.devoirPremierEssai >= 1,
  },

  // ── Série de jours consécutifs ──
  {
    id: 'serie_3', nom: 'Petite flamme 🕯️',
    description: '3 jours consécutifs de révision',
    icone: 'fire', couleur: '#D4924A',
    condition: (s: any) => s.serie >= 3,
  },
  {
    id: 'serie_7', nom: 'Grande flamme 🔥',
    description: '7 jours consécutifs',
    icone: 'fire', couleur: '#C4724A',
    condition: (s: any) => s.serie >= 7,
  },
  {
    id: 'serie_14', nom: 'Légende 🏆',
    description: '14 jours consécutifs',
    icone: 'crown', couleur: '#7BA89A',
    condition: (s: any) => s.serie >= 14,
  },
  {
    id: 'serie_30', nom: 'Immortel ∞',
    description: '30 jours consécutifs',
    icone: 'infinity', couleur: '#5A8A9A',
    condition: (s: any) => s.serie >= 30,
  },

  // ── Nombre de révisions ──
  {
    id: 'dix_revisions', nom: 'Assidu 📚',
    description: '10 révisions complétées',
    icone: 'book-open-variant', couleur: '#7BA89A',
    condition: (s: any) => s.totalRevisions >= 10,
  },
  {
    id: 'vingt_revisions', nom: 'Régulier 🎯',
    description: '20 révisions complétées',
    icone: 'target', couleur: '#6B9A8A',
    condition: (s: any) => s.totalRevisions >= 20,
  },
  {
    id: 'cinquante_revisions', nom: 'Champion 🌟',
    description: '50 révisions complétées',
    icone: 'trophy', couleur: '#5A8A7A',
    condition: (s: any) => s.totalRevisions >= 50,
  },

  // ── Questions totales ──
  {
    id: 'vingt_questions', nom: 'Curieux 🤔',
    description: '20 questions répondues',
    icone: 'help-circle', couleur: '#7BA89A',
    condition: (s: any) => s.totalQuestions >= 20,
  },
  {
    id: 'cent_questions', nom: 'Philosophe 🧠',
    description: '100 questions répondues',
    icone: 'brain', couleur: '#6B9A8A',
    condition: (s: any) => s.totalQuestions >= 100,
  },
  {
    id: 'cinq_cent_questions', nom: 'Encyclopédie 📖',
    description: '500 questions répondues',
    icone: 'book-multiple', couleur: '#5A8A7A',
    condition: (s: any) => s.totalQuestions >= 500,
  },

  // ── Badges spéciaux ──
  {
    id: 'perseverant', nom: 'Persévérant 💪',
    description: 'Réussi une question après 3 essais',
    icone: 'arm-flex', couleur: '#7B98A8',
    // ✅ Question réussie (note >= 1.5) AU TROISIÈME essai
    condition: (s: any) => s.troisEssaisReussis >= 1,
  },
  {
    id: 'matinier', nom: 'Lève-tôt 🌅',
    description: '5 révisions avant 9h du matin',
    icone: 'weather-sunset-up', couleur: '#D4924A',
    condition: (s: any) => s.revisionsMatin >= 5,
  },
  {
    id: 'nocturne', nom: 'Hibou 🦉',
    description: '3 révisions après 22h',
    icone: 'weather-night', couleur: '#5A7A9A',
    condition: (s: any) => s.revisionsSoir >= 3,
  },
  {
    id: 'multimatiere', nom: 'Polyvalent 🌍',
    description: '5 matières différentes utilisées',
    icone: 'earth', couleur: '#6BAE98',
    condition: (s: any) => s.matieresUniques >= 5,
  },
  {
    id: 'coach_10', nom: 'Questionneur 💬',
    description: '10 messages envoyés au Coach IA',
    icone: 'robot', couleur: '#7BA89A',
    // ✅ Compteur incrémenté dans CoachIAScreen.tsx à chaque envoi
    condition: (s: any) => s.questionsCoach >= 10,
  },
];

// ══════════════════════════════════════════════════
// PERSISTANCE
// ══════════════════════════════════════════════════
export async function getBadgesDeBloques(): Promise<any[]> {
  try {
    const v = await SecureStore.getItemAsync(BADGES_KEY);
    return v ? JSON.parse(v) : [];
  } catch { return []; }
}

async function _sauvegarderBadges(badges: any[]): Promise<void> {
  try {
    await SecureStore.setItemAsync(BADGES_KEY, JSON.stringify(badges));
  } catch (e) {
    console.error('Erreur sauvegarde badges:', e);
  }
}

// ══════════════════════════════════════════════════
// CALCUL DES STATISTIQUES
// ══════════════════════════════════════════════════
export async function calculerStatsPourBadges() {
  try {
    const sessions    = await getSessionsEnfantFirebase();
    const tempsTravail = await getTempsTravailMinutes();
    const questionsCoach = await getCoachCount();

    const isDevoir = (s: any) =>
      s.type === 'devoir' || s.source === 'devoir' ||
      (s.cours && s.cours.toLowerCase().includes('devoir'));

    const sessionsRevision = sessions.filter(s => !isDevoir(s));
    const sessionsDevoir   = sessions.filter(s => isDevoir(s));

    let bonnesReponses     = 0;
    let sansFaute          = 0;
    let devoirParfait      = 0;
    let devoirPremierEssai = 0;
    let revisionsMatin     = 0;
    let revisionsSoir      = 0;
    let troisEssaisReussis = 0;
    let totalQuestions     = 0;

    const matieresSet = new Set<string>();

    sessions.forEach(s => {
      if (s.matiere) matieresSet.add(s.matiere);

      const qs = s.questions || [];
      totalQuestions += qs.length;

      // ✅ Seulement si la session a des questions
      if (qs.length > 0) {
        const toutesBonnes = qs.every((q: any) => (q.note ?? 0) >= 2);

        // Révision parfaite (sans faute)
        if (!isDevoir(s) && toutesBonnes) sansFaute++;

        // Devoir parfait
        if (isDevoir(s) && toutesBonnes) devoirParfait++;

        // Devoir premier essai : toutes questions réussies (note=2) au 1er essai
        if (isDevoir(s) && toutesBonnes) {
          const toutPremierEssai = qs.every((q: any) => (q.essais ?? 1) <= 1 && (q.note ?? 0) >= 2);
          if (toutPremierEssai) devoirPremierEssai++;
        }

        qs.forEach((q: any) => {
          if ((q.note ?? 0) >= 2) bonnesReponses++;
          // Persévérant : réussi au 3ème essai (note >= 1.5 et essais = 3)
          if ((q.essais ?? 0) >= 3 && (q.note ?? 0) >= 1.5) troisEssaisReussis++;
        });
      }

      // Heure de la session
      const heure = new Date(s.date || s.createdAt || Date.now()).getHours();
      if (heure < 9)  revisionsMatin++;
      if (heure >= 22) revisionsSoir++;
    });

    const serie = calculerSerie(sessions);

    const stats = {
      tempsTravail,            // minutes de révision + devoir
      totalRevisions:     sessionsRevision.length,
      totalDevoirs:       sessionsDevoir.length,
      totalQuestions,
      bonnesReponses,
      sansFaute,
      devoirParfait,
      devoirPremierEssai,
      revisionsMatin,
      revisionsSoir,
      troisEssaisReussis,
      serie,
      matieresUniques:    matieresSet.size,
      questionsCoach,
    };

    console.log('📊 Stats badges:', JSON.stringify(stats));
    return stats;
  } catch (e) {
    console.error('Erreur calcul stats:', e);
    return {
      tempsTravail: 0, totalRevisions: 0, totalDevoirs: 0,
      totalQuestions: 0, bonnesReponses: 0, sansFaute: 0,
      devoirParfait: 0, devoirPremierEssai: 0, revisionsMatin: 0,
      revisionsSoir: 0, troisEssaisReussis: 0, serie: 0,
      matieresUniques: 0, questionsCoach: 0,
    };
  }
}

// ══════════════════════════════════════════════════
// VÉRIFICATION & DÉBLOCAGE
// ══════════════════════════════════════════════════
export async function verifierEtDebloquerBadges(): Promise<any[]> {
  try {
    const stats          = await calculerStatsPourBadges();
    const badgesActuels  = await getBadgesDeBloques();
    const idsObtenus     = new Set(badgesActuels.map((b: any) => b.id));
    const nouveaux: any[] = [];

    for (const badge of BADGES_LIST) {
      if (!idsObtenus.has(badge.id) && badge.condition(stats)) {
        const nouveau = {
          id:            badge.id,
          nom:           badge.nom,
          description:   badge.description,
          icone:         badge.icone,
          couleur:       badge.couleur,
          dateObtention: new Date().toISOString(),
        };
        nouveaux.push(nouveau);
        console.log(`🏅 BADGE DÉBLOQUÉ : ${badge.nom}`);
      }
    }

    if (nouveaux.length > 0) {
      await _sauvegarderBadges([...badgesActuels, ...nouveaux]);
    }

    return nouveaux;
  } catch (e) {
    console.error('Erreur vérification badges:', e);
    return [];
  }
}

export async function synchroniserBadgesUtilisateur(): Promise<any[]> {
  const badges = await getBadgesDeBloques();
  console.log(`🔄 ${badges.length} badges chargés`);
  return badges;
}
