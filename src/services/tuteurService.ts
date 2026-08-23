import {
  getFirestore, collection, doc, getDoc, getDocs, setDoc,
  serverTimestamp, increment, updateDoc, query, where, limit, addDoc,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';
import { auth } from './firebaseConfig';

const db = getFirestore();
const getKey = () => Constants.expoConfig?.extra?.openRouterApiKey || '';
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export type StatutTuteur = 'en_attente' | 'certifie' | 'suspendu';

export interface Tuteur {
  uid: string;
  nom: string;
  prenom: string;
  bio: string;
  email: string;
  telephone: string;
  whatsapp: string;
  matieres: string[];
  niveaux: string[];
  diplome: string;
  universite: string;
  anneeExp: number;
  prix30min: number;
  prix60min: number;
  prixMensuel: number;
  statut: StatutTuteur;
  noteGlobale: number;
  nbAvis: number;
  nbSessions: number;
  revenuTotal: number;
  revenuMois: number;
  scoreTest: number;
  disponible: boolean;
  dateCreation: string;
  avatar: string;
}

export interface Reservation {
  id?: string;
  eleveId: string;
  elevePrénom: string;
  tuteurId: string;
  tuteurNom: string;
  matiere: string;
  dureeMin: number;
  prix: number;
  statut: 'en_attente' | 'confirmee' | 'terminee' | 'annulee';
  date: string;
  heure: string;
  message: string;
  dateCreation: string;
}

export interface Avis {
  id?: string;
  eleveId: string;
  elevePrénom: string;
  tuteurId: string;
  note: number;
  commentaire: string;
  matiere: string;
  date: string;
}

export async function inscrireTuteur(data: Omit<Tuteur, 'uid'|'statut'|'noteGlobale'|'nbAvis'|'nbSessions'|'revenuTotal'|'revenuMois'|'scoreTest'>): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Non connecté');
  const tuteur: Tuteur = {
    ...data, uid: user.uid, statut: 'en_attente', noteGlobale: 0,
    nbAvis: 0, nbSessions: 0, revenuTotal: 0, revenuMois: 0,
    scoreTest: 0, disponible: true,
  };
  await setDoc(doc(db, 'tuteurs', user.uid), { ...tuteur, dateCreation: serverTimestamp() });
  await setDoc(doc(db, 'users', user.uid, 'roles', 'tuteur'), {
    estTuteur: true, statut: 'en_attente', depuis: serverTimestamp(),
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
  await setDoc(doc(db, 'tuteurs', user.uid), data, { merge: true });
}

export async function basculerDisponibilite(disponible: boolean): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Non connecté');
  await setDoc(doc(db, 'tuteurs', user.uid), { disponible }, { merge: true });
}

// Certification IA conservée volontairement dormante. La certification active est manuelle par l'administration.
export interface QuestionTest { texte: string; options: string[]; bonne: number; explication: string; }

export async function genererTestValidation(matiere: string): Promise<QuestionTest[]> {
  const prompt = `Tu es un expert en ${matiere} niveau Terminale/Université. Génère 20 questions QCM difficiles pour valider un répétiteur. Réponds UNIQUEMENT en JSON.`;
  const response = await axios.post(API_URL, {
    model: 'google/gemini-flash-1.5', messages: [{ role: 'user', content: prompt }],
    max_tokens: 3000, temperature: 0.3,
  }, { headers: { Authorization: `Bearer ${getKey()}`, 'Content-Type': 'application/json' }, timeout: 45000 });
  const contenu = response.data.choices[0]?.message?.content || '';
  const cleaned = contenu.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Test non généré');
  const parsed = JSON.parse(match[0]);
  return parsed.questions || [];
}

export async function sauvegarderScoreTest(_score: number, _matiere: string): Promise<boolean> {
  return false;
}

const CACHE_TUTEURS = 'repetia_tuteurs_cache';

// Tous les répétiteurs inscrits et non suspendus sont visibles. Le badge dépend uniquement du statut.
export async function getTuteursDisponibles(matiere?: string): Promise<Tuteur[]> {
  try {
    const q = query(collection(db, 'tuteurs'), limit(30));
    const snap = await getDocs(q);
    let tuteurs = snap.docs
      .map(d => ({ ...(d.data() as Record<string, unknown>), uid: d.id }) as Tuteur)
      .filter(t => t.statut !== 'suspendu');
    if (matiere) tuteurs = tuteurs.filter(t => (t.matieres || []).includes(matiere));
    await AsyncStorage.setItem(CACHE_TUTEURS, JSON.stringify(tuteurs));
    return tuteurs;
  } catch {
    const cached = await AsyncStorage.getItem(CACHE_TUTEURS);
    if (cached) {
      const tuteurs = (JSON.parse(cached) as Tuteur[]).filter(t => t.statut !== 'suspendu');
      return matiere ? tuteurs.filter(t => (t.matieres || []).includes(matiere)) : tuteurs;
    }
    return [];
  }
}

export async function getTuteur(uid: string): Promise<Tuteur | null> {
  try {
    const snap = await getDoc(doc(db, 'tuteurs', uid));
    return snap.exists() ? { ...snap.data(), uid: snap.id } as Tuteur : null;
  } catch { return null; }
}

export async function creerReservation(res: Omit<Reservation, 'id'|'statut'|'dateCreation'>): Promise<string> {
  const ref = await addDoc(collection(db, 'reservations'), { ...res, statut: 'en_attente', dateCreation: serverTimestamp() });
  return ref.id;
}

export async function getMesReservationsTuteur(): Promise<Reservation[]> {
  try {
    const user = auth.currentUser;
    if (!user) return [];
    const snap = await getDocs(query(collection(db, 'reservations'), where('tuteurId', '==', user.uid), limit(20)));
    return snap.docs.map(d => ({ ...d.data(), id: d.id }) as Reservation);
  } catch { return []; }
}

export async function confirmerReservation(id: string): Promise<void> {
  await updateDoc(doc(db, 'reservations', id), { statut: 'confirmee' });
}

export async function terminerReservation(id: string, montant: number): Promise<void> {
  const snap = await getDoc(doc(db, 'reservations', id));
  if (!snap.exists()) return;
  const res = snap.data() as Reservation;
  await updateDoc(doc(db, 'reservations', id), { statut: 'terminee' });
  const gainTuteur = montant - Math.round(montant * 0.30);
  await setDoc(doc(db, 'tuteurs', res.tuteurId), {
    nbSessions: increment(1), revenuTotal: increment(gainTuteur), revenuMois: increment(gainTuteur), solde: increment(gainTuteur),
  }, { merge: true });
}

export async function laisserAvis(avis: Omit<Avis, 'id'|'date'>): Promise<void> {
  await addDoc(collection(db, 'avis'), { ...avis, date: serverTimestamp() });
  const snap = await getDocs(query(collection(db, 'avis'), where('tuteurId', '==', avis.tuteurId)));
  const notes = snap.docs.map(d => d.data().note as number);
  const moyenne = notes.reduce((a, b) => a + b, 0) / notes.length;
  await setDoc(doc(db, 'tuteurs', avis.tuteurId), { noteGlobale: Math.round(moyenne * 10) / 10, nbAvis: notes.length }, { merge: true });
}

export async function getAvisTuteur(tuteurId: string): Promise<Avis[]> {
  try {
    const snap = await getDocs(query(collection(db, 'avis'), where('tuteurId', '==', tuteurId), limit(10)));
    return snap.docs.map(d => ({ ...d.data(), id: d.id }) as Avis);
  } catch { return []; }
}
