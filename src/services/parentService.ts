import {
  getFirestore, doc, getDoc, setDoc, addDoc,
  collection, query, where, getDocs, updateDoc,
  onSnapshot, serverTimestamp, deleteDoc, orderBy, limit,
} from 'firebase/firestore';
import {
  getAuth, createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { auth } from './firebaseConfig';

const db     = getFirestore();
const getKey = () => Constants.expoConfig?.extra?.openRouterApiKey || '';

// ── Types ──────────────────────────────────────
export interface EnfantLie {
  uid:          string;
  prenom:       string;
  classe:       string;
  serie:        string;
  email:        string;
  dateCreation: string;
}

export interface ScoreBienEtre {
  score:      number;       // 0-100
  niveau:     'excellent' | 'bien' | 'attention' | 'preoccupant' | 'alerte';
  emoji:      string;
  couleur:    string;
  facteurs:   string[];     // Explications textuelles
}

export interface PredictionBac {
  pourcentage:    number;
  label:          string;
  parMatiere:     { matiere: string; moyenne: number; poids: number; alerte: boolean }[];
  alerteOracle:   string[];  // Croisement Oracle Bac × lacunes
}

export interface EvenementTimeline {
  id:          string;
  type:        'revision' | 'devoir' | 'badge' | 'absence' | 'podcast' | 'coup_de_pouce';
  date:        string;
  heure:       string;
  matiere?:    string;
  titre:       string;
  description: string;
  score?:      number;      // /20
  dureeMin?:   number;
  icone:       string;
  couleur:     string;
  sessionData?: any;
}

// ══════════════════════════════════════════════════
// AUTH PARENT
// ══════════════════════════════════════════════════
export async function inscrireParent(email: string, password: string, prenom: string): Promise<void> {
  const cred = await createUserWithEmailAndPassword(getAuth(), email, password);
  await setDoc(doc(db, 'users', cred.user.uid), {
    uid:          cred.user.uid,
    email,
    prenom,
    role:         'parent',
    enfants:      [],
    alertes: {
      absence48h:   true,
      absence7j:    true,
      badges:       true,
      moyenneChute: true,
      rapport:      'hebdomadaire',
    },
    dateCreation: serverTimestamp(),
  });
}

export async function connecterParent(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(getAuth(), email, password);
}

// ══════════════════════════════════════════════════
// LIAISON PARENT ↔ ENFANT
// ══════════════════════════════════════════════════

// [CÔTÉ ENFANT] — Génère un code de 6 chiffres valable 10 min
export async function genererCodeLiaison(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('Non connecté');

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const infos = await getDoc(doc(db, 'users', user.uid));

  await setDoc(doc(db, 'linkCodes', code), {
    enfantId:  user.uid,
    prenom:    infos.data()?.prenom || 'Élève',
    classe:    infos.data()?.classe || 'Terminale',
    serie:     infos.data()?.serie  || 'C',
    email:     user.email,
    expires:   Date.now() + 10 * 60 * 1000, // 10 minutes
    createdAt: serverTimestamp(),
  });

  return code;
}

// [CÔTÉ PARENT] — Lier un enfant via le code
export async function lierCompteEnfant(code: string): Promise<EnfantLie> {
  const user = auth.currentUser;
  if (!user) throw new Error('Non connecté');

  const codeDoc = await getDoc(doc(db, 'linkCodes', code));
  if (!codeDoc.exists()) throw new Error('Code invalide ou expiré.');

  const data = codeDoc.data();
  if (data.expires < Date.now()) {
    await deleteDoc(doc(db, 'linkCodes', code));
    throw new Error('Ce code a expiré. Demande un nouveau code à ton enfant.');
  }

  const enfant: EnfantLie = {
    uid:          data.enfantId,
    prenom:       data.prenom,
    classe:       data.classe,
    serie:        data.serie,
    email:        data.email,
    dateCreation: new Date().toISOString(),
  };

  // Ajouter l'enfant dans le profil parent
  const parentDoc = await getDoc(doc(db, 'users', user.uid));
  const enfants   = parentDoc.data()?.enfants || [];
  if (!enfants.find((e: any) => e.uid === enfant.uid)) {
    enfants.push(enfant);
    await updateDoc(doc(db, 'users', user.uid), { enfants });
  }

  // Lier le parent dans le profil enfant
  await updateDoc(doc(db, 'users', data.enfantId), {
    parentId:    user.uid,
    parentPrenom: parentDoc.data()?.prenom || 'Parent',
  });

  await deleteDoc(doc(db, 'linkCodes', code));
  return enfant;
}

export async function getEnfantsLies(): Promise<EnfantLie[]> {
  try {
    const user = auth.currentUser;
    if (!user) return [];
    const snap = await getDoc(doc(db, 'users', user.uid));
    return snap.data()?.enfants || [];
  } catch { return []; }
}

// ══════════════════════════════════════════════════
// DONNÉES ENFANT
// ══════════════════════════════════════════════════
export async function getSessionsEnfant(enfantId: string): Promise<any[]> {
  try {
    const q    = query(
      collection(db, 'sessions'),
      where('enfantId', '==', enfantId),
      limit(50)
    );
    const snap = await getDocs(q);
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a: any, b: any) =>
        new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
      );
  } catch { return []; }
}

// Écoute temps réel de l'activité enfant
export function ecouterActiviteLive(
  enfantId: string,
  onUpdate: (estActif: boolean, detail: string) => void
): () => void {
  const ref = doc(db, 'users', enfantId);
  return onSnapshot(ref, (snap) => {
    const data = snap.data();
    if (!data) { onUpdate(false, 'Hors ligne'); return; }

    const lastActive = data.lastActive?.toDate?.() || new Date(data.lastActive || 0);
    const diffMin    = (Date.now() - lastActive.getTime()) / 60000;

    if (diffMin < 5) {
      const matiere = data.matiereEnCours || 'ses cours';
      onUpdate(true, `En train de réviser ${matiere}`);
    } else if (diffMin < 60) {
      onUpdate(false, `Actif il y a ${Math.round(diffMin)} min`);
    } else {
      const heures = Math.floor(diffMin / 60);
      const jours  = Math.floor(heures / 24);
      if (jours > 0) onUpdate(false, `Inactif depuis ${jours} jour${jours > 1 ? 's' : ''}`);
      else           onUpdate(false, `Inactif depuis ${heures}h`);
    }
  }, () => onUpdate(false, 'Erreur connexion'));
}

// ══════════════════════════════════════════════════
// SCORE DE BIEN-ÊTRE SCOLAIRE
// ══════════════════════════════════════════════════
export function calculerScoreBienEtre(sessions: any[]): ScoreBienEtre {
  if (!sessions || sessions.length === 0) {
    return {
      score: 30, niveau: 'preoccupant', emoji: '🟠', couleur: '#D4924A',
      facteurs: ['Aucune session enregistrée'],
    };
  }

  let score     = 100;
  const facteurs: string[] = [];
  const now = Date.now();

  // Dernière session
  const derniereSession = new Date(sessions[0]?.date || 0).getTime();
  const joursSansActivite = (now - derniereSession) / (1000 * 60 * 60 * 24);

  if (joursSansActivite > 7)       { score -= 40; facteurs.push(`⚠️ Aucun travail depuis ${Math.round(joursSansActivite)} jours`); }
  else if (joursSansActivite > 3)  { score -= 20; facteurs.push(`Pas de travail depuis ${Math.round(joursSansActivite)} jours`); }
  else if (joursSansActivite < 1)  { facteurs.push('✅ A travaillé aujourd\'hui'); }

  // Sessions des 7 derniers jours
  const sessionsRecentes = sessions.filter(s => {
    const age = (now - new Date(s.date || 0).getTime()) / (1000 * 60 * 60 * 24);
    return age <= 7;
  });

  // Taux d'échec
  let totalQs = 0, echecs = 0;
  sessionsRecentes.forEach(s => {
    (s.questions || []).forEach((q: any) => {
      totalQs++;
      if ((q.note || 0) < 1) echecs++;
    });
  });
  if (totalQs > 0 && echecs / totalQs > 0.6) {
    score -= 20;
    facteurs.push(`⚠️ Taux d'échec élevé (${Math.round(echecs / totalQs * 100)}%)`);
  } else if (totalQs > 0 && echecs / totalQs < 0.2) {
    facteurs.push('✅ Très bon taux de réussite');
  }

  // Révisions nocturnes (après 22h)
  const sessionsNocturnes = sessionsRecentes.filter(s => {
    const h = new Date(s.date || 0).getHours();
    return h >= 22 || h < 6;
  });
  if (sessionsNocturnes.length > sessionsRecentes.length * 0.5 && sessionsRecentes.length > 2) {
    score -= 10;
    facteurs.push('🌙 Révise souvent très tard le soir');
  }

  // Sessions très courtes (< 3 min)
  const sessionsCourtes = sessionsRecentes.filter(s => (s.dureeMin || 10) < 3);
  if (sessionsCourtes.length > sessionsRecentes.length * 0.6) {
    score -= 10;
    facteurs.push('Sessions très courtes détectées');
  }

  // Nombre de matières différentes
  const matieres = new Set(sessionsRecentes.map(s => s.matiere)).size;
  if (matieres >= 3) facteurs.push(`✅ Travaille ${matieres} matières différentes`);
  if (matieres <= 1 && sessionsRecentes.length >= 3) {
    score -= 5;
    facteurs.push('Se concentre sur une seule matière');
  }

  score = Math.max(0, Math.min(100, score));

  const niveauData = score >= 80 ? { niveau: 'excellent'    as const, emoji: '🟢', couleur: '#6BAE98' }
    : score >= 60 ? { niveau: 'bien'         as const, emoji: '🟢', couleur: '#7BA89A' }
    : score >= 40 ? { niveau: 'attention'    as const, emoji: '🟡', couleur: '#D4924A' }
    : score >= 20 ? { niveau: 'preoccupant'  as const, emoji: '🟠', couleur: '#C47A3A' }
    :               { niveau: 'alerte'       as const, emoji: '🔴', couleur: '#E55C5C' };

  return { score, ...niveauData, facteurs };
}

// ══════════════════════════════════════════════════
// PRÉDICTION BAC
// ══════════════════════════════════════════════════
const POIDS_SERIES: Record<string, Record<string, number>> = {
  C: { Mathématiques: 0.35, 'Physique-Chimie': 0.30, SVT: 0.15, Français: 0.10, Philosophie: 0.05, Anglais: 0.05 },
  D: { SVT: 0.35, Mathématiques: 0.25, 'Physique-Chimie': 0.15, Français: 0.10, Philosophie: 0.10, Anglais: 0.05 },
  A: { Français: 0.30, Philosophie: 0.25, 'Histoire-Géographie': 0.20, Anglais: 0.15, Mathématiques: 0.10 },
  F: { Mathématiques: 0.30, Informatique: 0.30, 'Physique-Chimie': 0.25, Français: 0.10, Anglais: 0.05 },
};

// Probabilités Oracle Bac (% de chance de tomber)
const ORACLE_PROBABILITES: Record<string, Record<string, number>> = {
  'Mathématiques':    { 'Probabilités': 82, 'Suites numériques': 78, 'Intégrales': 65 },
  'SVT':              { 'Immunologie': 85,  'Génétique': 80,         'Reproduction': 70 },
  'Physique-Chimie':  { 'Électrocinétique': 75, 'Mécanique': 72,     'Chimie organique': 68 },
  'Français':         { 'Dissertation': 90, 'Commentaire composé': 88 },
};

export async function calculerPredictionBac(sessions: any[], serie: string): Promise<PredictionBac> {
  const poids = POIDS_SERIES[serie] || POIDS_SERIES['C'];

  // Moyennes par matière
  const statsParMatiere: Record<string, { total: number; max: number }> = {};
  sessions.forEach(s => {
    if (!s.matiere) return;
    if (!statsParMatiere[s.matiere]) statsParMatiere[s.matiere] = { total: 0, max: 0 };
    (s.questions || []).forEach((q: any) => {
      statsParMatiere[s.matiere].total += q.note || 0;
      statsParMatiere[s.matiere].max   += 2;
    });
  });

  const moyennesParMatiere: Record<string, number> = {};
  Object.entries(statsParMatiere).forEach(([mat, data]) => {
    moyennesParMatiere[mat] = data.max > 0 ? (data.total / data.max) * 20 : 10;
  });

  // Score pondéré
  let scoreTotal    = 0;
  let poidsTotal    = 0;
  const parMatiere: PredictionBac['parMatiere'] = [];

  Object.entries(poids).forEach(([matiere, p]) => {
    const moy = moyennesParMatiere[matiere] ?? 10; // 10/20 par défaut si pas de données
    scoreTotal += moy * p;
    poidsTotal += p;
    parMatiere.push({
      matiere, moyenne: Math.round(moy * 10) / 10,
      poids: Math.round(p * 100), alerte: moy < 10,
    });
  });

  const prediction = poidsTotal > 0 ? scoreTotal / poidsTotal : 10;

  // Croisement Oracle × Lacunes
  const alerteOracle: string[] = [];
  Object.entries(ORACLE_PROBABILITES).forEach(([matiere, sujets]) => {
    const moy = moyennesParMatiere[matiere];
    if (moy !== undefined && moy < 12) {
      Object.entries(sujets).forEach(([sujet, prob]) => {
        if (prob >= 75) {
          alerteOracle.push(
            `⚠️ ${sujet} en ${matiere} : ${prob}% de chance au Bac · Moyenne actuelle ${moy.toFixed(1)}/20`
          );
        }
      });
    }
  });

  const pct   = Math.round((prediction / 20) * 100);
  const label = prediction >= 16 ? 'Excellent' : prediction >= 14 ? 'Très bien'
    : prediction >= 12 ? 'Favorable' : prediction >= 10 ? 'Incertain' : 'Risqué';

  return { pourcentage: pct, label, parMatiere, alerteOracle };
}

// ══════════════════════════════════════════════════
// TIMELINE
// ══════════════════════════════════════════════════
export function buildTimeline(sessions: any[], joursAbsence: number): EvenementTimeline[] {
  const events: EvenementTimeline[] = [];

  sessions.slice(0, 20).forEach(s => {
    const date   = new Date(s.date || Date.now());
    const heure  = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const dateStr = date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
    const isDevoir = s.type === 'devoir';
    const note = s.noteSur20 || (s.scoreTotal && s.scoreMax ? Math.round((s.scoreTotal / s.scoreMax) * 20) : null);

    events.push({
      id:          s.id || Math.random().toString(),
      type:        isDevoir ? 'devoir' : 'revision',
      date:        dateStr,
      heure,
      matiere:     s.matiere,
      titre:       isDevoir
        ? `Devoir — ${s.matiere || 'Général'}`
        : `Révision — ${s.matiere || 'Général'}`,
      description: note !== null
        ? `${(s.questions || []).length} questions · Note : ${note}/20`
        : `${(s.questions || []).length} questions`,
      score:       note ?? undefined,
      dureeMin:    s.dureeMin,
      icone:       isDevoir ? 'pencil' : 'book-open',
      couleur:     isDevoir ? '#7B98A8' : '#7BA89A',
      sessionData: s,
    });
  });

  // Jours sans activité
  if (joursAbsence >= 2) {
    events.unshift({
      id:          'absence',
      type:        'absence',
      date:        'Période récente',
      heure:       '',
      titre:       `${joursAbsence} jours sans activité`,
      description: joursAbsence >= 7 ? '🔴 Alerte : absence prolongée' : '⚠️ Rappel envoyé',
      icone:       'alert-circle',
      couleur:     joursAbsence >= 7 ? '#E55C5C' : '#D4924A',
    });
  }

  return events;
}

// ══════════════════════════════════════════════════
// IA COACH PARENT — Analyse Gemini RÉELLE
// ══════════════════════════════════════════════════
export async function genererAnalyseIAParent(
  enfant:     EnfantLie,
  sessions:   any[],
  bienEtre:   ScoreBienEtre,
  prediction: PredictionBac
): Promise<string> {

  const sessionsRecentes = sessions.slice(0, 10);
  const totalQs = sessionsRecentes.reduce((a, s) => a + (s.questions?.length || 0), 0);
  const totalPts = sessionsRecentes.reduce((a, s) => a + (s.scoreTotal || 0), 0);
  const totalMax = sessionsRecentes.reduce((a, s) => a + (s.scoreMax || 1), 0);
  const moy = totalMax > 0 ? Math.round((totalPts / totalMax) * 20 * 10) / 10 : 0;

  const statsMatiere: Record<string, number[]> = {};
  sessions.forEach(s => {
    if (!s.matiere) return;
    if (!statsMatiere[s.matiere]) statsMatiere[s.matiere] = [];
    if (s.noteSur20) statsMatiere[s.matiere].push(s.noteSur20);
  });

  const matieresAnalyse = Object.entries(statsMatiere)
    .map(([m, notes]) => `${m}: ${(notes.reduce((a,b)=>a+b,0)/notes.length).toFixed(1)}/20`)
    .join(', ');

  const prompt = `Tu es un conseiller pédagogique expert du système scolaire gabonais.

PROFIL DE L'ÉLÈVE :
- Prénom : ${enfant.prenom}
- Classe : ${enfant.classe} Série ${enfant.serie}
- Score bien-être scolaire : ${bienEtre.score}/100 (${bienEtre.niveau})
- Prédiction Bac : ${prediction.pourcentage}% (${prediction.label})

DONNÉES (10 dernières sessions) :
- Sessions : ${sessionsRecentes.length}
- Questions répondues : ${totalQs}
- Moyenne générale : ${moy}/20
- Par matière : ${matieresAnalyse || 'Données insuffisantes'}

ALERTES ORACLE BAC :
${prediction.alerteOracle.length > 0 ? prediction.alerteOracle.join('\n') : 'Aucune alerte critique'}

FACTEURS BIEN-ÊTRE :
${bienEtre.facteurs.join('\n')}

Génère une analyse personnalisée et bienveillante pour le PARENT de ${enfant.prenom}, en tenant compte du Bac gabonais (programme CENAP), de la série ${enfant.serie}.

Structure ta réponse EXACTEMENT ainsi (en français, ton naturel et chaleureux) :

📊 SYNTHÈSE DE LA SEMAINE
[2-3 phrases résumant l'activité de l'enfant de façon concrète]

🔍 POINTS D'ATTENTION
• [Point 1 concret]
• [Point 2 concret si nécessaire]

💡 MES SUGGESTIONS
1. [Suggestion actionnable et spécifique]
2. [Suggestion actionnable et spécifique]
3. [Encouragement ou récompense à proposer]

🎯 FOCUS BAC ${new Date().getFullYear()}
[Phrase sur les sujets probables que l'enfant doit prioriser selon Oracle + ses lacunes]`;

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'google/gemini-flash-1.5',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
        temperature: 0.7,
      },
      {
        headers: { Authorization: `Bearer ${getKey()}`, 'Content-Type': 'application/json' },
        timeout: 30000,
      }
    );
    return response.data.choices[0]?.message?.content || _analyseParDefaut(enfant, moy, bienEtre);
  } catch {
    return _analyseParDefaut(enfant, moy, bienEtre);
  }
}

function _analyseParDefaut(enfant: EnfantLie, moy: number, bienEtre: ScoreBienEtre): string {
  return `📊 SYNTHÈSE DE LA SEMAINE
${enfant.prenom} a une moyenne de ${moy}/20 sur ses dernières sessions. Son score de bien-être est de ${bienEtre.score}/100.

🔍 POINTS D'ATTENTION
${bienEtre.facteurs.slice(0, 2).map(f => `• ${f}`).join('\n')}

💡 MES SUGGESTIONS
1. Encouragez ${enfant.prenom} à diversifier ses révisions
2. Proposez un moment tranquille de 30 min chaque soir
3. Célébrez chaque badge débloqué pour maintenir la motivation

🎯 FOCUS BAC
Consultez l'Oracle du Bac dans l'application pour identifier les sujets prioritaires.`;
}

// ══════════════════════════════════════════════════
// COUP DE POUCE — Message parent → enfant
// ══════════════════════════════════════════════════
export async function envoyerCoupDePouce(
  enfantId: string,
  message:  string,
  parentPrenom: string
): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Non connecté');

  await setDoc(doc(db, 'coupsDePouces', enfantId), {
    parentId:     user.uid,
    parentPrenom,
    enfantId,
    message,
    timestamp:    serverTimestamp(),
    lu:           false,
  });
}

export async function lancerDefi(
  enfantId:    string,
  titre:       string,
  description: string,
  dureeHeures: number,
  parentPrenom: string
): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Non connecté');

  await setDoc(doc(db, 'defis', enfantId), {
    parentId:    user.uid,
    parentPrenom,
    enfantId,
    titre,
    description,
    deadline:    new Date(Date.now() + dureeHeures * 60 * 60 * 1000).toISOString(),
    statut:      'en_cours',
    createdAt:   serverTimestamp(),
  });
}

// ══════════════════════════════════════════════════
// RAPPORT HEBDOMADAIRE
// ══════════════════════════════════════════════════
export async function genererEtPartagerRapport(
  enfant:     EnfantLie,
  sessions:   any[],
  bienEtre:   ScoreBienEtre,
  prediction: PredictionBac
): Promise<void> {
  const semaine = sessions.filter(s => {
    const age = (Date.now() - new Date(s.date || 0).getTime()) / (1000 * 60 * 60 * 24);
    return age <= 7;
  });

  const totalQs  = semaine.reduce((a, s) => a + (s.questions?.length || 0), 0);
  const totalPts = semaine.reduce((a, s) => a + (s.scoreTotal || 0), 0);
  const totalMax = semaine.reduce((a, s) => a + (s.scoreMax || 1), 0);
  const moy      = totalMax > 0 ? Math.round((totalPts / totalMax) * 20 * 10) / 10 : 0;
  const tempsTot = semaine.reduce((a, s) => a + (s.dureeMin || 0), 0);

  const rapport = `
╔════════════════════════════════════════════╗
║     RAPPORT HEBDOMADAIRE — RÉPÉTIA IA     ║
╚════════════════════════════════════════════╝

👤 Élève : ${enfant.prenom}
📚 Classe : ${enfant.classe} · Série ${enfant.serie}
📅 Semaine du ${new Date(Date.now() - 7 * 86400000).toLocaleDateString('fr-FR')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 STATISTIQUES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Sessions     : ${semaine.length}
  Questions    : ${totalQs}
  Moyenne      : ${moy}/20
  Temps total  : ${Math.floor(tempsTot / 60)}h${tempsTot % 60}min
  Bien-être    : ${bienEtre.emoji} ${bienEtre.score}/100 (${bienEtre.niveau})

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 PRÉDICTION BAC ${new Date().getFullYear()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Estimation : ${prediction.pourcentage}% (${prediction.label})

${prediction.parMatiere.map(m =>
  `  ${m.matiere.padEnd(20)} ${m.moyenne.toFixed(1)}/20 ${m.alerte ? '⚠️' : '✅'}`
).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ ALERTES ORACLE BAC
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${prediction.alerteOracle.length > 0
  ? prediction.alerteOracle.join('\n  ')
  : '  Aucune alerte critique cette semaine'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ POINTS POSITIFS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${bienEtre.facteurs.filter(f => f.startsWith('✅')).map(f => `  ${f}`).join('\n') || '  Continuez à encourager votre enfant !'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📲 Rapport généré par RÉPÉTIA IA
   Application éducative pour le Bac Gabon
`.trim();

  const path = `${FileSystem.cacheDirectory}rapport_${enfant.prenom}_${Date.now()}.txt`;
  await FileSystem.writeAsStringAsync(path, rapport, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(path, {
      mimeType:    'text/plain',
      dialogTitle: `Rapport de ${enfant.prenom}`,
    });
  }
}

// ── Mise à jour lastActive côté ENFANT ──
export async function mettreAJourActiviteLive(matiere?: string): Promise<void> {
  try {
    const user = auth.currentUser;
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid), {
      lastActive:      serverTimestamp(),
      matiereEnCours:  matiere || null,
    });
  } catch {}
}
