import * as SecureStore from 'expo-secure-store';
import { auth } from './firebaseConfig';
import { addTimeToMatiere, saveTimeStatsToFirebase, getTimeStatsFromFirebase } from './timeTrackingFirebaseService';

export function formatTime(minutes: number): string {
  if (!minutes || minutes < 0) return '0min';
  if (minutes < 60) return `${Math.round(minutes)}min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h${m}` : `${h}h`;
}

const TIME_KEY = 'repetia_time_v3';

interface Session {
  startTime: number | null;
  type: 'revision' | 'devoir' | 'navigation' | null;
  matiere: string | null;
}

interface TimeStats {
  navigation: number;
  devoirs: number;
  revisions: number;
  global: number;
  currentSession: Session;
  parMatiere: Record<string, { revision: number; devoir: number; navigation: number; total: number }>;
}

let stats: TimeStats = {
  navigation: 0, devoirs: 0, revisions: 0, global: 0,
  currentSession: { startTime: null, type: null, matiere: null },
  parMatiere: {},
};
let loaded = false;

async function key(): Promise<string> {
  const uid = auth.currentUser?.uid || 'anon';
  return `${TIME_KEY}_${uid}`;
}

async function load() {
  try {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      stats = { navigation: 0, devoirs: 0, revisions: 0, global: 0,
        currentSession: { startTime: null, type: null, matiere: null }, parMatiere: {} };
      loaded = true;
      return;
    }
    const k = await key();
    const local = await SecureStore.getItemAsync(k);
    let loc = local ? JSON.parse(local) : null;
    const cloud = await getTimeStatsFromFirebase();

    let nav = 0, dev = 0, rev = 0;
    let parMatiere: any = {};

    if (loc && cloud) {
      nav = Math.max(loc.navigation || 0, cloud.navigation || 0);
      dev = Math.max(loc.devoirs    || 0, cloud.totalDevoirs   || 0);
      rev = Math.max(loc.revisions  || 0, cloud.totalRevisions || 0);
      parMatiere = { ...(cloud.parMatiere || {}), ...(loc.parMatiere || {}) };
    } else if (loc) {
      nav = loc.navigation || 0;
      dev = loc.devoirs    || 0;
      rev = loc.revisions  || 0;
      parMatiere = loc.parMatiere || {};
    } else if (cloud) {
      nav = cloud.navigation     || 0;
      dev = cloud.totalDevoirs   || 0;
      rev = cloud.totalRevisions || 0;
      parMatiere = cloud.parMatiere || {};
    }

    stats.navigation = nav;
    stats.devoirs    = dev;
    stats.revisions  = rev;
    stats.global     = nav + dev + rev;
    stats.parMatiere = parMatiere;
    stats.currentSession = { startTime: null, type: null, matiere: null };
    await save();
    loaded = true;
  } catch (e) {
    console.error('Erreur load time:', e);
    loaded = true;
  }
}

async function save() {
  try {
    if (!auth.currentUser) return;
    const k = await key();
    const data = {
      navigation: stats.navigation,
      devoirs:    stats.devoirs,
      revisions:  stats.revisions,
      global:     stats.global,
      parMatiere: stats.parMatiere,
    };
    await SecureStore.setItemAsync(k, JSON.stringify(data));
    await saveTimeStatsToFirebase({
      totalApp:       data.global,
      totalRevisions: data.revisions,
      totalDevoirs:   data.devoirs,
      navigation:     data.navigation,
      parMatiere:     data.parMatiere,
    });
  } catch (e) {
    console.error('Erreur save time:', e);
  }
}

load();

export async function startTimeTracking(
  type: 'revision' | 'devoir' | 'navigation',
  matiere: string = 'Général'
) {
  if (!loaded) await load();
  if (stats.currentSession.type === type && stats.currentSession.matiere === matiere) return;
  if (stats.currentSession.startTime) await _flush();
  stats.currentSession = { startTime: Date.now(), type, matiere };
  console.log(`⏱️ Début [${type}] — ${matiere}`);
}

export async function stopTimeTracking() {
  if (!stats.currentSession.startTime) return;
  await _flush();
  console.log(`⏱️ Arrêt — rev=${stats.revisions.toFixed(1)}m dev=${stats.devoirs.toFixed(1)}m nav=${stats.navigation.toFixed(1)}m`);
}

export async function stopAndRestartNavigation() {
  await stopTimeTracking();
  await startTimeTracking('navigation', 'Général');
}

async function _flush() {
  if (!stats.currentSession.startTime) return;
  const duration = (Date.now() - stats.currentSession.startTime) / 60000;
  const { type, matiere } = stats.currentSession;

  if (duration >= 0.033) {
    if (type === 'navigation') stats.navigation += duration;
    else if (type === 'revision') stats.revisions += duration;
    else if (type === 'devoir')   stats.devoirs   += duration;

    stats.global = stats.navigation + stats.revisions + stats.devoirs;

    if (matiere && type !== 'navigation') {
      if (!stats.parMatiere[matiere]) {
        stats.parMatiere[matiere] = { revision: 0, devoir: 0, navigation: 0, total: 0 };
      }
      stats.parMatiere[matiere][type as 'revision' | 'devoir'] += duration;
      stats.parMatiere[matiere].total += duration;
      await addTimeToMatiere(matiere, type as 'revision' | 'devoir', duration);
    }
    await save();
  }
  stats.currentSession = { startTime: null, type: null, matiere: null };
}

// ✅ FIX: Inclut la session en cours dans les totaux affichés
export async function getTimeStats() {
  if (!loaded) await load();

  // Durée de la session en cours (pas encore flushée)
  let liveElapsed = 0;
  if (stats.currentSession.startTime && stats.currentSession.type) {
    liveElapsed = (Date.now() - stats.currentSession.startTime) / 60000;
  }

  const liveNav = stats.currentSession.type === 'navigation' ? liveElapsed : 0;
  const liveDev = stats.currentSession.type === 'devoir'     ? liveElapsed : 0;
  const liveRev = stats.currentSession.type === 'revision'   ? liveElapsed : 0;

  return {
    navigation:     stats.navigation + liveNav,
    devoirs:        stats.devoirs    + liveDev,
    revisions:      stats.revisions  + liveRev,
    global:         stats.global     + liveElapsed,
    parMatiere:     stats.parMatiere,
    currentSession: stats.currentSession,
  };
}

export async function getTimeSummary() {
  const s = await getTimeStats();
  return {
    navigation:         formatTime(s.navigation),
    devoirs:            formatTime(s.devoirs),
    revisions:          formatTime(s.revisions),
    global:             formatTime(s.global),
    globalMinutes:      s.global,
    navigationMinutes:  s.navigation,
    devoirsMinutes:     s.devoirs,
    revisionsMinutes:   s.revisions,
  };
}

export async function getTimePerSubject() {
  if (!loaded) await load();
  return Object.entries(stats.parMatiere || {}).map(([matiere, data]) => ({
    matiere,
    revision:   data.revision   || 0,
    devoir:     data.devoir     || 0,
    navigation: data.navigation || 0,
    total:      data.total      || 0,
  })).sort((a, b) => b.total - a.total);
}

export async function syncTimeWithFirebase() { await save(); }
export async function forceReloadStats() { loaded = false; await load(); return getTimeStats(); }
