import {
  getFirestore, doc, getDoc, setDoc, collection,
} from 'firebase/firestore';
import { auth } from './firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

const db = getFirestore();

// ── Clé de la semaine courante (ex: "2026_W22")
export function getWeekKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const d1 = new Date(year, 0, 1);
  const week = Math.ceil(((now.getTime() - d1.getTime()) / 86400000 + d1.getDay() + 1) / 7);
  return `${year}_W${String(week).padStart(2, '0')}`;
}

export interface ScoreArena {
  uid: string;
  prenom: string;
  score: number; // sur 20
  points: number; // bruts (bonnes réponses)
  matiere: string;
  tempsMs: number; // temps mis en ms
  date: string;
  weekKey: string;
}

// ── Sauvegarder un score après duel
export async function sauvegarderScoreArena(score: ScoreArena): Promise<void> {
  try {
    const user = auth.currentUser;
    if (!user) return;

    // Firestore: collection rankings > semaine > utilisateur (1 doc par user/semaine)
    const ref = doc(db, 'rankings', score.weekKey, 'scores', user.uid);
    const existing = await getDoc(ref);

    // Ne sauvegarder que si meilleur score
    if (existing.exists() && (existing.data().score || 0) >= score.score) return;

    await setDoc(ref, {
      ...score,
      uid: user.uid,
      prenom: user.displayName || score.prenom || 'Élève',
      updatedAt: serverTimestamp(),
    });

    // Cache local aussi
    await AsyncStorage.setItem(
      `arena_score_${score.weekKey}`,
      JSON.stringify(score)
    );
  } catch (e) {
    console.error('Erreur sauvegarde score arena:', e);
  }
}

// ── Récupérer le classement de la semaine
export async function getClassementSemaine(weekKey?: string): Promise<ScoreArena[]> {
  try {
    const wk = weekKey || getWeekKey();
    const ref = collection(db, 'rankings', wk, 'scores');
    const snap = await getDocs(q);

    // ✅ Tri côté client (score desc, puis temps asc)
    const scores: ScoreArena[] = snap.docs
      .map(d => d.data() as ScoreArena)
      .sort((a, b) => b.score - a.score || a.tempsMs - b.tempsMs);

    // Ajouter des scores simulés si peu de joueurs (pour l'effet classement)
    if (scores.length < 8) {
      const simules = _scoresSimules().filter(
        s => !scores.find(r => r.uid === s.uid)
      );
      return [...scores, ...simules].sort((a, b) => b.score - a.score || a.tempsMs - b.tempsMs).slice(0, 50);
    }
    return scores;
  } catch (e) {
    console.error('Erreur classement:', e);
    return _scoresSimules();
  }
}

// ── Mon meilleur score de la semaine
export async function getMonMeilleurScore(weekKey?: string): Promise<ScoreArena | null> {
  try {
    const user = auth.currentUser;
    if (!user) return null;
    const wk = weekKey || getWeekKey();
    const ref = doc(db, 'rankings', wk, 'scores', user.uid);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() as ScoreArena : null;
  } catch {
    return null;
  }
}

// ── Historique local des duels
export async function getHistoriqueDuels(): Promise<ScoreArena[]> {
  try {
    const val = await AsyncStorage.getItem('arena_historique');
    return val ? JSON.parse(val) : [];
  } catch { return []; }
}

export async function ajouterAuHistorique(score: ScoreArena): Promise<void> {
  try {
    const hist = await getHistoriqueDuels();
    const newHist = [score, ...hist].slice(0, 20); // 20 derniers duels
    await AsyncStorage.setItem('arena_historique', JSON.stringify(newHist));
  } catch {}
}

// ── Scores simulés pour remplir le classement
function _scoresSimules(): ScoreArena[] {
  const wk = getWeekKey();
  return [
    { uid: 'sim1', prenom: 'Amina G.', score: 19, points: 19, matiere: 'Maths', tempsMs: 180000, date: new Date().toISOString(), weekKey: wk },
    { uid: 'sim2', prenom: 'Kevin M.', score: 18, points: 18, matiere: 'SVT', tempsMs: 210000, date: new Date().toISOString(), weekKey: wk },
    { uid: 'sim3', prenom: 'Laure N.', score: 17, points: 17, matiere: 'Français', tempsMs: 195000, date: new Date().toISOString(), weekKey: wk },
    { uid: 'sim4', prenom: 'Jonas B.', score: 16, points: 16, matiere: 'Physique', tempsMs: 240000, date: new Date().toISOString(), weekKey: wk },
    { uid: 'sim5', prenom: 'Carine O.', score: 15, points: 15, matiere: 'Hist-Géo', tempsMs: 255000, date: new Date().toISOString(), weekKey: wk },
    { uid: 'sim6', prenom: 'Patrick E.', score: 13, points: 13, matiere: 'Philo', tempsMs: 270000, date: new Date().toISOString(), weekKey: wk },
    { uid: 'sim7', prenom: 'Sandra T.', score: 12, points: 12, matiere: 'Anglais', tempsMs: 285000, date: new Date().toISOString(), weekKey: wk },
    { uid: 'sim8', prenom: 'Marc D.', score: 10, points: 10, matiere: 'Maths', tempsMs: 298000, date: new Date().toISOString(), weekKey: wk },
  ];
}

// ── Score KEBA (IA adversaire simulé)
export function scoreKeba(matiere: string): number {
  const bases: Record<string, number> = {
    maths: 16, svt: 15, francais: 14, physique: 15,
    histgeo: 14, philo: 13, anglais: 14, info: 15,
  };
  const base = bases[matiere.toLowerCase()] || 14;
  // Variation aléatoire ±2
  return Math.min(20, Math.max(8, base + Math.floor(Math.random() * 5) - 2));
}
