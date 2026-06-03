import axios from 'axios';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';

const API_URL   = 'https://openrouter.ai/api/v1/chat/completions';
const STORE_KEY = 'repetia_audio_v1';
const getKey    = () => Constants.expoConfig?.extra?.openRouterApiKey || '';

export interface PodcastScript {
  id:           string;
  matiere:      string;
  sujet:        string;
  niveau:       string;
  dureeMin:     number;
  sections:     { type: string; titre: string; contenu: string }[];
  texteComplet: string;
  phrases:      string[];
  dateCreation: string;
  ecoutes:      number;
}

// ── Génération du script podcast par IA ──
export async function genererScriptPodcast(
  matiere:  string,
  sujet:    string,
  niveau:   string = 'Terminale',
  dureeMin: number = 10
): Promise<PodcastScript> {

  const prompt = `Tu es un animateur de podcast éducatif africain.
Génère un script de podcast de révision de ${dureeMin} minutes sur :
- Matière : ${matiere}
- Sujet : ${sujet}
- Niveau : ${niveau}

STYLE : Oral, naturel, dynamique. Parle directement à l'élève ("tu").
Utilise des exemples concrets du Gabon et d'Afrique centrale.
Pas de formules complexes à l'oral, explique avec des mots simples.

Réponds UNIQUEMENT en JSON :
{
  "sections": [
    { "type": "intro",       "titre": "Introduction",     "contenu": "Texte 30 secondes..." },
    { "type": "explication", "titre": "Notion principale", "contenu": "Explication 3-4 minutes..." },
    { "type": "exemple",     "titre": "Exemple concret",  "contenu": "Exemple africain..." },
    { "type": "quiz",        "titre": "Quiz oral",         "contenu": "3 questions avec réponses..." },
    { "type": "conclusion",  "titre": "À retenir",         "contenu": "3 points essentiels..." }
  ]
}
JSON uniquement, sans texte avant ou après.`;

  const response = await axios.post(API_URL, {
    model: 'google/gemini-flash-1.5',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 2500,
    temperature: 0.7,
  }, {
    headers: { Authorization: `Bearer ${getKey()}`, 'Content-Type': 'application/json' },
    timeout: 45000,
  });

  const contenu = response.data.choices[0]?.message?.content || '';
  const cleaned = contenu.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
  const match   = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Script non généré');

  const parsed   = JSON.parse(match[0]);
  const sections = parsed.sections || [];

  const texteComplet = sections
    .map((s: any) => `${s.titre}. ${s.contenu}`)
    .join(' ');

  // Découpe en phrases pour le TTS
  const phrases = texteComplet
    .split(/(?<=[.!?])\s+/)
    .map((p: string) => p.trim())
    .filter((p: string) => p.length > 5);

  const nbMots   = texteComplet.split(' ').length;
  const dureeReel = Math.max(1, Math.round(nbMots / 130));

  const podcast: PodcastScript = {
    id:           Date.now().toString(),
    matiere,
    sujet,
    niveau,
    dureeMin:     dureeReel,
    sections,
    texteComplet,
    phrases,
    dateCreation: new Date().toISOString(),
    ecoutes:      0,
  };

  await sauvegarderPodcast(podcast);
  return podcast;
}

// ── TTS Manager ──
let _phrases: string[]   = [];
let _phraseIdx           = 0;
let _isPlaying           = false;
let _speed               = 1.0;
let _onProgress: ((i: number, t: number) => void) | null = null;
let _onFinish:   (() => void) | null = null;

export function initTTS(
  phrases:    string[],
  onProgress: (i: number, t: number) => void,
  onFinish:   () => void,
  startFrom:  number = 0
) {
  _phrases    = phrases;
  _onProgress = onProgress;
  _onFinish   = onFinish;
  _phraseIdx  = startFrom;
  _isPlaying  = false;
  Speech.stop();
}

export function playTTS(speed = 1.0) {
  if (_phrases.length === 0) return;
  _isPlaying = true;
  _speed     = speed;
  _jouerPhrase(_phraseIdx);
}

function _jouerPhrase(idx: number) {
  if (!_isPlaying || idx >= _phrases.length) {
    if (idx >= _phrases.length) {
      _isPlaying = false;
      _onFinish?.();
    }
    return;
  }
  _phraseIdx = idx;
  _onProgress?.(idx, _phrases.length);

  Speech.speak(_phrases[idx], {
    language:  'fr-FR',
    rate:      _speed,
    pitch:     1.0,
    onDone:    () => { if (_isPlaying) setTimeout(() => _jouerPhrase(idx + 1), 250); },
    onError:   () => { if (_isPlaying) _jouerPhrase(idx + 1); },
    onStopped: () => {},
  });
}

export function pauseTTS()  { _isPlaying = false; Speech.stop(); }
export function resumeTTS() { _isPlaying = true; _jouerPhrase(_phraseIdx); }
export function stopTTS()   { _isPlaying = false; _phraseIdx = 0; Speech.stop(); }
export function getTTSIsPlaying() { return _isPlaying; }
export function getCurrentIdx()   { return _phraseIdx; }

export function setTTSSpeed(speed: number) {
  _speed = speed;
  if (_isPlaying) { Speech.stop(); setTimeout(() => _jouerPhrase(_phraseIdx), 200); }
}

export function skipPhrases(n: number) {
  const newIdx = Math.max(0, Math.min(_phraseIdx + n, _phrases.length - 1));
  Speech.stop();
  _phraseIdx = newIdx;
  if (_isPlaying) _jouerPhrase(newIdx);
}

// ── Stockage local ──
export async function sauvegarderPodcast(p: PodcastScript): Promise<void> {
  try {
    const list = await getPodcastsSauvegardes();
    const idx  = list.findIndex(x => x.id === p.id);
    if (idx >= 0) list[idx] = p; else list.unshift(p);
    await AsyncStorage.setItem(STORE_KEY, JSON.stringify(list.slice(0, 20)));
  } catch {}
}

export async function getPodcastsSauvegardes(): Promise<PodcastScript[]> {
  try {
    const v = await AsyncStorage.getItem(STORE_KEY);
    return v ? JSON.parse(v) : [];
  } catch { return []; }
}

export async function supprimerPodcast(id: string): Promise<void> {
  try {
    const list = await getPodcastsSauvegardes();
    await AsyncStorage.setItem(STORE_KEY, JSON.stringify(list.filter(p => p.id !== id)));
  } catch {}
}
