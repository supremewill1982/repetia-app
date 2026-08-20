import axios from 'axios';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import {
  getFirestore, collection, doc, setDoc,
  getDocs, deleteDoc, query, where, serverTimestamp, increment,
} from 'firebase/firestore';
import { auth } from './firebaseConfig';
import { PodcastEnregistre, Matiere, ScriptSection } from '../types/podcast.types';

const db      = getFirestore();
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const getKey  = () => Constants.expoConfig?.extra?.openRouterApiKey || '';

const STORAGE_KEY = 'podcasts_meta_v2';
const MAX_PODCASTS = 15;

// ── Utils ──────────────────────────────────────
export function podcastVersPhrase(script: ScriptSection[]): {
  phrases: string[];
  phraseToSection: number[];
} {
  const phrases: string[]         = [];
  const phraseToSection: number[] = [];

  script.forEach((section, sIdx) => {
    const ps = section.texte
      .split(/(?<=[.!?])\s+/)
      .map(p => p.trim())
      .filter(p => p.length > 5);
    ps.forEach(p => {
      phrases.push(p);
      phraseToSection.push(sIdx);
    });
  });

  return { phrases, phraseToSection };
}

// ── Limite 15 podcasts ─────────────────────────
export async function peutCreerPodcast(): Promise<{ peutCreer: boolean; reste: number; message?: string }> {
  const liste = await getPodcastsLocaux();
  const reste = MAX_PODCASTS - liste.length;
  if (reste <= 0) {
    return {
      peutCreer: false, reste: 0,
      message: `Tu as atteint la limite de ${MAX_PODCASTS} podcasts. Supprime-en un avant d'en créer un nouveau.`,
    };
  }
  return { peutCreer: true, reste };
}

// ── Stockage local ────────────────────────────
export async function getPodcastsLocaux(): Promise<PodcastEnregistre[]> {
  try {
    const v = await AsyncStorage.getItem(STORAGE_KEY);
    return v ? JSON.parse(v) : [];
  } catch { return []; }
}

async function sauvegarderLocalement(podcast: PodcastEnregistre): Promise<void> {
  const liste = await getPodcastsLocaux();
  const idx   = liste.findIndex(p => p.id === podcast.id);
  if (idx >= 0) liste[idx] = podcast; else liste.unshift(podcast);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(liste.slice(0, MAX_PODCASTS)));
}

export async function supprimerPodcast(podcast: PodcastEnregistre): Promise<void> {
  if (podcast.estPublic) {
    try { await deleteDoc(doc(db, 'podcasts_public', podcast.id)); } catch {}
  }
  const liste = await getPodcastsLocaux();
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(liste.filter(p => p.id !== podcast.id)));
}

export async function toggleFavori(podcastId: string): Promise<void> {
  const liste = await getPodcastsLocaux();
  const idx   = liste.findIndex(p => p.id === podcastId);
  if (idx >= 0) {
    liste[idx].estFavori = !liste[idx].estFavori;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(liste));
  }
}

export async function incrementerEcoute(podcastId: string): Promise<void> {
  const liste = await getPodcastsLocaux();
  const idx   = liste.findIndex(p => p.id === podcastId);
  if (idx >= 0) {
    liste[idx].nbEcoute++;
    liste[idx].derniereEcoute = new Date().toISOString();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(liste));
  }
}

// ── Export texte ──────────────────────────────
export async function exporterScriptTexte(podcast: PodcastEnregistre): Promise<void> {
  const texte = [
    `═══════════════════════════════════`,
    `🎧 RÉPÉTIA — Script de Podcast`,
    `═══════════════════════════════════`,
    `📚 Matière : ${podcast.matiere}`,
    `📖 Chapitre : ${podcast.titreChapitre}`,
    podcast.titreSection ? `📝 Section : ${podcast.titreSection}` : '',
    `⏱️ Durée : ${Math.round(podcast.dureeSecondes / 60)} min`,
    `📅 Créé le : ${new Date(podcast.dateCreation).toLocaleDateString('fr-FR')}`,
    ``,
    ...podcast.scriptPodcast.map(s => [
      `── ${s.type.toUpperCase()} ──`,
      s.texte,
      ``,
    ].join('\n')),
    `═══════════════════════════════════`,
  ].filter(Boolean).join('\n');

  const path = `${FileSystem.cacheDirectory}podcast_${podcast.id}.txt`;
  await FileSystem.writeAsStringAsync(path, texte, { encoding: 'utf8' });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(path, {
      mimeType: 'text/plain',
      dialogTitle: `${podcast.titreChapitre}.txt`,
    });
  }
}

// ── Génération principale ─────────────────────
export async function genererPodcastPhoto(
  imageBase64: string,
  matiere:       Matiere,
  titreChapitre: string,
  titreSection:  string | null,
  estPublic:     boolean,
  userId:        string,
  userPrenom:    string,
  onStep:        (step: number, msg: string) => void
): Promise<PodcastEnregistre> {

  onStep(1, '📖 Lecture du texte...');
  const texteOCR = await _ocrGemini(imageBase64, matiere);

  onStep(2, '🤖 L\'IA structure ton cours...');
  const scriptPodcast = await _genererScript(texteOCR, matiere, titreChapitre, titreSection);

  onStep(3, '🎙️ Préparation de l\'audio...');
  const dureeSecondes = scriptPodcast.reduce((acc, s) => acc + s.dureeSec, 0);
  await _attendre(500);

  onStep(4, '💾 Sauvegarde...');

  const podcast: PodcastEnregistre = {
    id:             `${userId}_${Date.now()}`,
    userId,
    userPrenom,
    matiere,
    titreChapitre,
    titreSection:   titreSection || null,
    texteOCR,
    scriptPodcast,
    dureeSecondes,
    dateCreation:   new Date().toISOString(),
    derniereEcoute: null,
    nbEcoute:       0,
    estFavori:      false,
    estPublic,
    likesCount:     0,
  };

  await sauvegarderLocalement(podcast);

  if (estPublic) {
    try {
      await setDoc(doc(db, 'podcasts_public', podcast.id), {
        ...podcast,
        dateCreation: serverTimestamp(),
      });
    } catch (e) { console.warn('Upload cloud échoué', e); }
  }

  return podcast;
}

async function _ocrGemini(imageBase64: string, matiere: Matiere): Promise<string> {
  const response = await axios.post(API_URL, {
    model: 'google/gemini-flash-1.5',
    messages: [{
      role: 'user',
      content: [
        {
          type: 'text',
          text: `Extrais TOUT le texte de cette photo de cours de ${matiere}. Corrige les fautes d'orthographe évidentes. Réponds UNIQUEMENT avec le texte extrait.`,
        },
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
      ],
    }],
    max_tokens: 2000,
    temperature: 0.1,
  }, {
    headers: { Authorization: `Bearer ${getKey()}`, 'Content-Type': 'application/json' },
    timeout: 30000,
  });

  return response.data.choices[0]?.message?.content || 'Texte non détecté.';
}

async function _genererScript(
  texteOCR: string, matiere: Matiere,
  titreChapitre: string, titreSection: string | null
): Promise<ScriptSection[]> {
  const ajoutSection = titreSection ? `, section "${titreSection}"` : '';

  const prompt = `Tu es un prof particulier de ${matiere}. Voici le texte d'un élève de Terminale sur "${titreChapitre}"${ajoutSection}.

TEXTE OCR (peut contenir des erreurs) :
${texteOCR.substring(0, 2000)}

CONSIGNES :
1. Corrige et reformule pour l'oral
2. Ajoute UN exemple africain (Gabon/Cameroun)
3. Termine par 3 questions quiz avec réponses
4. Réponds UNIQUEMENT EN JSON

{
  "script": [
    { "type": "intro", "dureeSec": 25, "texte": "Bonjour ! Aujourd'hui on révise..." },
    { "type": "explication", "dureeSec": 180, "texte": "..." },
    { "type": "exemple", "dureeSec": 60, "texte": "Au Gabon, ..." },
    { "type": "quiz", "dureeSec": 60, "texte": "Question 1 : ... Réponse : ..." },
    { "type": "conclusion", "dureeSec": 35, "texte": "À retenir..." }
  ]
}`;

  const response = await axios.post(API_URL, {
    model: 'google/gemini-flash-1.5',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 3000,
    temperature: 0.6,
  }, {
    headers: { Authorization: `Bearer ${getKey()}`, 'Content-Type': 'application/json' },
    timeout: 45000,
  });

  const contenu = response.data.choices[0]?.message?.content || '';
  const cleaned = contenu.replace(/```json\s*/gi,'').replace(/```/g,'').trim();
  const match   = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return _scriptFallback(titreChapitre, texteOCR);

  const parsed = JSON.parse(match[0]);
  return parsed.script || _scriptFallback(titreChapitre, texteOCR);
}

function _scriptFallback(titre: string, texte: string): ScriptSection[] {
  return [
    { type: 'intro', dureeSec: 20, texte: `Bonjour ! Aujourd'hui on révise : ${titre}.` },
    { type: 'explication', dureeSec: 180, texte: texte.substring(0, 500) },
    { type: 'exemple', dureeSec: 40, texte: 'Voici un exemple concret pour mieux comprendre.' },
    { type: 'quiz', dureeSec: 50, texte: 'Question 1 : Qu\'as-tu retenu ? Réponse : Les points essentiels du cours.' },
    { type: 'conclusion', dureeSec: 30, texte: `À retenir : révise bien ${titre}.` },
  ];
}

function _attendre(ms: number) { return new Promise(r => setTimeout(r, ms)); }

// ── Podcasts publics ──────────────────────────
export async function getPodcastsPublics(
  filtre?: Matiere,
  tri: 'recent' | 'populaire' = 'recent'
): Promise<PodcastEnregistre[]> {
  try {
    const colRef = collection(db, 'podcasts_public');
    const q = filtre
      ? query(colRef, where('matiere', '==', filtre))
      : query(colRef);

    const snap = await getDocs(q);
    const docs = snap.docs.map(d => ({ ...d.data(), id: d.id }) as PodcastEnregistre);

    return docs
      .filter(p => p.estPublic)
      .sort((a, b) =>
        tri === 'populaire'
          ? (b.likesCount || 0) - (a.likesCount || 0)
          : new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime()
      )
      .slice(0, 30);
  } catch { return []; }
}
