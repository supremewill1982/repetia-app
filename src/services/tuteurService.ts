import {
  getFirestore, collection, doc, getDoc, getDocs, setDoc,
  serverTimestamp, increment, updateDoc, query, where, limit, addDoc,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';
import { auth } from './firebaseConfig';

const db     = getFirestore();
const getKey = () => Constants.expoConfig?.extra?.openRouterApiKey || '';
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// ══════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════
export type StatutTuteur = 'en_attente' | 'certifie' | 'suspendu';

export interface Tuteur {
  uid:          string;
  nom:          string;
  prenom:       string;
  bio:          string;
  email:        string;
  telephone:    string;
  whatsapp:     string;
  matieres:     string[];
  niveaux:      string[];
  diplome:      string;
  universite:   string;
  anneeExp:     number;
  prix30min:    number;
  prix60min:    number;
  prixMensuel:  number;
  statut:       StatutTuteur;
  noteGlobale:  number;
  nbAvis:       number;
  nbSessions:   number;
  revenuTotal:  number;
  revenuMois:   number;
  scoreTest:    number;
  disponible:   boolean;
  dateCreation: string;
  avatar:       string;    // Emoji avatar
}

export interface Reservation {
  id?:         string;
  eleveId:     string;
  elevePrénom: string;
  tuteurId:    string;
  tuteurNom:   string;
  matiere:     string;
  dureeMin:    number;
  prix:        number;
  statut:      'en_attente' | 'confirmee' | 'terminee' | 'annulee';
  date:        string;
  heure:       string;
  message:     string;
  dateCreation: string;
}

export interface Avis {
  id?:          string;
  eleveId:      string;
  elevePrénom:  string;
  tuteurId:     string;
  note:         number;  // 1-5
  commentaire:  string;
  matiere:      string;
  date:         string;
}

// ══════════════════════════════════════════════════
// INSCRIPTIONS TUTEURS
// ══════════════════════════════════════════════════
export async function inscrireTuteur(data: Omit<Tuteur, 'uid'|'statut'|'noteGlobale'|'nbAvis'|'nbSessions'|'revenuTotal'|'revenuMois'|'scoreTest'>): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Non connecté');

  const tuteur: Tuteur = {
    ...data,
    uid:          user.uid,
    statut:       'en_attente',
    noteGlobale:  0,
    nbAvis:       0,
    nbSessions:   0,
    revenuTotal:  0,
    revenuMois:   0,
    scoreTest:    0,
    disponible:   true,
  };

  await setDoc(doc(db, 'tuteurs', user.uid), {
    ...tuteur,
    dateCreation: serverTimestamp(),
  });

  // Marquer dans le profil utilisateur
  await setDoc(doc(db, 'users', user.uid, 'roles', 'tuteur'), {
    estTuteur: true,
    statut:    'en_attente',
    depuis:    serverTimestamp(),
  });
}

export async function getMonProfilTuteur(): Promise<Tuteur | null> {
  try {
    const user = auth.currentUser;
    if (!user) return null;
    const snap = await getDoc(doc(db, 'tuteurs', user.uid));
    return snap.exists() ? snap.data() as Tuteur : null;
  } catch { return null; }
}

export async function mettreAJourProfilTuteur(data: Partial<Tuteur>): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Non connecté');
  await updateDoc(doc(db, 'tuteurs', user.uid), data);
}

export async function basculerDisponibilite(disponible: boolean): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Non connecté');
  await updateDoc(doc(db, 'tuteurs', user.uid), { disponible });
}

// ══════════════════════════════════════════════════
// TEST DE VALIDATION IA
// ══════════════════════════════════════════════════
export interface QuestionTest {
  texte:    string;
  options:  string[];
  bonne:    number;  // Index 0-3
  explication: string;
}

export async function genererTestValidation(matiere: string): Promise<QuestionTest[]> {
  const prompt = `Tu es un expert en ${matiere} niveau Terminale/Université.
Génère 20 questions QCM difficiles pour valider un répétiteur.

Réponds UNIQUEMENT en JSON :
{
  "questions": [
    {
      "texte": "Question précise et technique...",
      "options": ["Réponse A", "Réponse B", "Réponse C", "Réponse D"],
      "bonne": 0,
      "explication": "Pourquoi cette réponse est correcte..."
    }
  ]
}

Les questions doivent être difficiles (niveau Terminale C/D pour les sciences).
JSON uniquement.`;

  const response = await axios.post(API_URL, {
    model: 'google/gemini-flash-1.5',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 3000,
    temperature: 0.3,
  }, {
    headers: { Authorization: `Bearer ${getKey()}`, 'Content-Type': 'application/json' },
    timeout: 45000,
  });

  const contenu = response.data.choices[0]?.message?.content || '';
  const cleaned = contenu.replace(/```json\s*/gi,'').replace(/```/g,'').trim();
  const match   = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Test non généré');

  const parsed = JSON.parse(match[0]);
  return parsed.questions || [];
}

export async function sauvegarderScoreTest(score: number, matiere: string): Promise<boolean> {
  try {
    const user = auth.currentUser;
    if (!user) return false;
    const certifie = score >= 85;
    await updateDoc(doc(db, 'tuteurs', user.uid), {
      scoreTest: score,
      statut: certifie ? 'certifie' : 'en_attente',
      matierePrincipale: matiere,
    });
    if (certifie) {
      await updateDoc(doc(db, 'users', user.uid, 'roles', 'tuteur'), {
        statut: 'certifie',
      });
    }
    return certifie;
  } catch { return false; }
}

// ══════════════════════════════════════════════════
// LISTE DES TUTEURS (pour les élèves)
// ══════════════════════════════════════════════════
const CACHE_TUTEURS = 'repetia_tuteurs_cache';

export async function getTuteursDisponibles(matiere?: string): Promise<Tuteur[]> {
  try {
    let q: any = query(
      collection(db, 'tuteurs'),
      where('statut', '==', 'certifie'),
      where('disponible', '==', true),
      limit(30)
    );

    const snap  = await getDocs(q);
      let tuteurs = snap.docs.map(d => ({ ...(d.data() as Record<string, unknown>), uid: d.id }) as Tuteur);

    if (matiere) {
      tuteurs = tuteurs.filter(t => t.matieres.includes(matiere));
    }

    // Fallback si liste vide → tuteurs simulés
    if (tuteurs.length === 0) tuteurs = _tuteurSimules(matiere);

    await AsyncStorage.setItem(CACHE_TUTEURS, JSON.stringify(tuteurs));
    return tuteurs;
  } catch {
    // Cache local si Firestore inaccessible
    const cached = await AsyncStorage.getItem(CACHE_TUTEURS);
    if (cached) {
      const tuteurs = JSON.parse(cached) as Tuteur[];
      return matiere ? tuteurs.filter(t => t.matieres.includes(matiere)) : tuteurs;
    }
    return _tuteurSimules(matiere);
  }
}

export async function getTuteur(uid: string): Promise<Tuteur | null> {
  try {
    const snap = await getDoc(doc(db, 'tuteurs', uid));
    return snap.exists() ? { ...snap.data(), uid: snap.id } as Tuteur : null;
  } catch { return null; }
}

// ══════════════════════════════════════════════════
// RÉSERVATIONS
// ══════════════════════════════════════════════════
export async function creerReservation(res: Omit<Reservation, 'id'|'statut'|'dateCreation'>): Promise<string> {
  const ref = await addDoc(collection(db, 'reservations'), {
    ...res,
    statut:       'en_attente',
    dateCreation: serverTimestamp(),
  });
  return ref.id;
}

export async function getMesReservationsTuteur(): Promise<Reservation[]> {
  try {
    const user = auth.currentUser;
    if (!user) return [];
    const q    = query(
      collection(db, 'reservations'),
      where('tuteurId', '==', user.uid),
      limit(20)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id }) as Reservation);
  } catch { return []; }
}

export async function confirmerReservation(id: string): Promise<void> {
  await updateDoc(doc(db, 'reservations', id), {
    statut: 'confirmee',
  });
}

export async function terminerReservation(id: string, montant: number): Promise<void> {
  const snap = await getDoc(doc(db, 'reservations', id));
  if (!snap.exists()) return;

  const res = snap.data() as Reservation;
  await updateDoc(doc(db, 'reservations', id), { statut: 'terminee' });

  // Mise à jour revenus tuteur
  const commission   = Math.round(montant * 0.30);
  const gainTuteur   = montant - commission;
  await updateDoc(doc(db, 'tuteurs', res.tuteurId), {
    nbSessions:  increment(1),
    revenuTotal: increment(gainTuteur),
    revenuMois:  increment(gainTuteur),
    solde:       increment(gainTuteur),
  });
}

// ══════════════════════════════════════════════════
// AVIS
// ══════════════════════════════════════════════════
export async function laisserAvis(avis: Omit<Avis, 'id'|'date'>): Promise<void> {
  await addDoc(collection(db, 'avis'), {
    ...avis,
    date: serverTimestamp(),
  });

  // Recalculer la note globale du tuteur
  const avisQuery = query(collection(db, 'avis'), where('tuteurId', '==', avis.tuteurId));
  const snap      = await getDocs(avisQuery);
  const notes     = snap.docs.map(d => d.data().note as number);
  const moyenne   = notes.reduce((a,b) => a+b, 0) / notes.length;

  await updateDoc(doc(db, 'tuteurs', avis.tuteurId), {
    noteGlobale: Math.round(moyenne * 10) / 10,
    nbAvis:      notes.length,
  });
}

export async function getAvisTuteur(tuteurId: string): Promise<Avis[]> {
  try {
    const q    = query(
      collection(db, 'avis'),
      where('tuteurId', '==', tuteurId),
      limit(10)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id }) as Avis);
  } catch { return []; }
}

// ══════════════════════════════════════════════════
// TUTEURS SIMULÉS (pour dev / liste vide)
// ══════════════════════════════════════════════════
function _tuteurSimules(matiere?: string): Tuteur[] {
  const base: Tuteur[] = [
    {
      uid: 'sim1', nom: 'Ondo', prenom: 'Marie',
      bio: 'Professeure de Maths et Physique depuis 5 ans. Ancienne élève de terminale C mention Très Bien.',
      email: 'marie@exemple.com', telephone: '241060000001', whatsapp: '241060000001',
      matieres: ['Mathématiques', 'Physique-Chimie'],
      niveaux: ['3ème', 'Seconde', 'Première', 'Terminale'],
      diplome: 'Licence Mathématiques', universite: 'Université Omar Bongo',
      anneeExp: 5, prix30min: 2000, prix60min: 3500, prixMensuel: 15000,
      statut: 'certifie', noteGlobale: 4.9, nbAvis: 47, nbSessions: 134,
      revenuTotal: 890000, revenuMois: 75000, scoreTest: 95, disponible: true,
      dateCreation: '2024-01-15', avatar: '👩🏾‍🏫',
    },
    {
      uid: 'sim2', nom: 'Mba', prenom: 'Kevin',
      bio: 'Ingénieur informaticien, passionné par la pédagogie. Bac C mention Bien. 3 ans de répétition.',
      email: 'kevin@exemple.com', telephone: '241060000002', whatsapp: '241060000002',
      matieres: ['Mathématiques', 'Informatique', 'Physique-Chimie'],
      niveaux: ['3ème', 'Terminale'],
      diplome: 'Master Informatique', universite: 'Institut Supérieur de Technologie',
      anneeExp: 3, prix30min: 1500, prix60min: 2500, prixMensuel: 12000,
      statut: 'certifie', noteGlobale: 4.7, nbAvis: 23, nbSessions: 67,
      revenuTotal: 420000, revenuMois: 52000, scoreTest: 91, disponible: true,
      dateCreation: '2024-03-10', avatar: '👨🏾‍💻',
    },
    {
      uid: 'sim3', nom: 'Nguema', prenom: 'Laure',
      bio: 'Diplômée en Lettres modernes. Spécialiste Français, Philosophie et Histoire-Géo.',
      email: 'laure@exemple.com', telephone: '241060000003', whatsapp: '241060000003',
      matieres: ['Français', 'Philosophie', 'Histoire-Géographie'],
      niveaux: ['Seconde', 'Première', 'Terminale'],
      diplome: 'Master Lettres Modernes', universite: 'Université Omar Bongo',
      anneeExp: 4, prix30min: 1800, prix60min: 3000, prixMensuel: 13000,
      statut: 'certifie', noteGlobale: 4.8, nbAvis: 31, nbSessions: 89,
      revenuTotal: 560000, revenuMois: 61000, scoreTest: 88, disponible: true,
      dateCreation: '2024-02-20', avatar: '👩🏾‍🎓',
    },
    {
      uid: 'sim4', nom: 'Bongo', prenom: 'Patrick',
      bio: 'Biologiste de formation, je prépare les élèves au Bac SVT depuis 6 ans avec un taux de réussite de 92%.',
      email: 'patrick@exemple.com', telephone: '241060000004', whatsapp: '241060000004',
      matieres: ['SVT'],
      niveaux: ['3ème', 'Seconde', 'Première', 'Terminale'],
      diplome: 'Master Biologie', universite: 'Université des Sciences',
      anneeExp: 6, prix30min: 2000, prix60min: 3500, prixMensuel: 14000,
      statut: 'certifie', noteGlobale: 4.6, nbAvis: 58, nbSessions: 178,
      revenuTotal: 1200000, revenuMois: 89000, scoreTest: 93, disponible: false,
      dateCreation: '2023-09-01', avatar: '👨🏾‍🔬',
    },
    {
      uid: 'sim5', nom: 'Ella', prenom: 'Sandra',
      bio: 'Prof d\'Anglais certifiée Cambridge. Préparation examens oraux et écrits.',
      email: 'sandra@exemple.com', telephone: '241060000005', whatsapp: '241060000005',
      matieres: ['Anglais'],
      niveaux: ['Collège', '3ème', 'Seconde', 'Première', 'Terminale'],
      diplome: 'Licence Anglais', universite: 'Université Omar Bongo',
      anneeExp: 4, prix30min: 1500, prix60min: 2500, prixMensuel: 11000,
      statut: 'certifie', noteGlobale: 4.5, nbAvis: 19, nbSessions: 45,
      revenuTotal: 280000, revenuMois: 38000, scoreTest: 87, disponible: true,
      dateCreation: '2024-04-05', avatar: '👩🏾‍🏫',
    },
  ];

  return matiere
    ? base.filter(t => t.matieres.includes(matiere))
    : base;
}
