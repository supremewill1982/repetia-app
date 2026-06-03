import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Alert, ActivityIndicator, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { AGENTS } from '../../services/iaServiceOpenRouter';
import {
  genererScriptPodcast, getPodcastsSauvegardes,
  supprimerPodcast, initTTS, playTTS, pauseTTS,
  resumeTTS, stopTTS, setTTSSpeed, skipPhrases,
  getTTSIsPlaying, PodcastScript,
} from '../../services/audioRevisionService';

const VITESSES = [0.75, 1.0, 1.25, 1.5, 2.0];

export default function AudioRevisionScreen({ navigation }: any) {
  const { colors } = useTheme();

  const [onglet, setOnglet]           = useState<'generer'|'bibliotheque'>('generer');
  const [agentChoisi, setAgent]       = useState(AGENTS[0]);
  const [sujet, setSujet]             = useState('');
  const [duree, setDuree]             = useState(10);
  const [generating, setGenerating]   = useState(false);
  const [podcast, setPodcast]         = useState<PodcastScript | null>(null);
  const [isPlaying, setIsPlaying]     = useState(false);
  const [phraseIdx, setPhraseIdx]     = useState(0);
  const [totalPhrases, setTotal]      = useState(0);
  const [vitesse, setVitesse]         = useState(1.0);
  const [bibliotheque, setBiblio]     = useState<PodcastScript[]>([]);
  const [phraseTexte, setPhraseTexte] = useState('');

  const pulseAnim    = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseRef     = useRef<any>(null);

  useFocusEffect(useCallback(() => {
    chargerBiblio();
    return () => { stopTTS(); setIsPlaying(false); };
  }, []));

  useEffect(() => {
    if (isPlaying) {
      pulseRef.current = Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]));
      pulseRef.current.start();
    } else {
      pulseRef.current?.stop();
      pulseAnim.setValue(1);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (totalPhrases > 0) {
      Animated.timing(progressAnim, {
        toValue: phraseIdx / totalPhrases,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [phraseIdx, totalPhrases]);

  const chargerBiblio = async () => {
    const saved = await getPodcastsSauvegardes();
    setBiblio(saved);
  };

  const handleGenerer = async () => {
    if (!sujet.trim()) { Alert.alert('Sujet requis', 'Entre un sujet à réviser.'); return; }
    setGenerating(true);
    try {
      const script = await genererScriptPodcast(agentChoisi.matiere, sujet, 'Terminale', duree);
      await chargerBiblio();
      chargerPodcast(script);
    } catch (e: any) {
      Alert.alert('Erreur', e.message || 'Impossible de générer le podcast.');
    } finally {
      setGenerating(false);
    }
  };

  const chargerPodcast = (p: PodcastScript) => {
    stopTTS();
    setPodcast(p);
    setPhraseIdx(0);
    setTotal(p.phrases.length);
    setIsPlaying(false);
    setPhraseTexte(p.phrases[0] || '');

    initTTS(
      p.phrases,
      (idx, total) => {
        setPhraseIdx(idx);
        setTotal(total);
        setPhraseTexte(p.phrases[idx] || '');
      },
      () => { setIsPlaying(false); setPhraseIdx(0); }
    );
  };

  const handlePlayPause = () => {
    if (!podcast) return;
    if (isPlaying) { pauseTTS(); setIsPlaying(false); }
    else {
      if (phraseIdx === 0 || !getTTSIsPlaying()) playTTS(vitesse);
      else resumeTTS();
      setIsPlaying(true);
    }
  };

  const handleRestart = () => {
    if (!podcast) return;
    stopTTS();
    setPhraseIdx(0);
    setPhraseTexte(podcast.phrases[0] || '');
    setIsPlaying(false);
    initTTS(podcast.phrases,
      (i, t) => { setPhraseIdx(i); setTotal(t); setPhraseTexte(podcast.phrases[i] || ''); },
      () => { setIsPlaying(false); setPhraseIdx(0); }
    );
  };

  const handleVitesse = () => {
    const idx    = VITESSES.indexOf(vitesse);
    const newVit = VITESSES[(idx + 1) % VITESSES.length];
    setVitesse(newVit);
    setTTSSpeed(newVit);
  };

  const progression = totalPhrases > 0 ? phraseIdx / totalPhrases : 0;
  const tempsEcoule = podcast ? Math.round(progression * podcast.dureeMin) : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient colors={['#E8F2EE', '#ECEEF3']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn}
          onPress={() => { stopTTS(); navigation.goBack(); }}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primary} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.headerTitre, { color: colors.text }]}>🎧 AudioRévision</Text>
          <Text style={[styles.headerSub, { color: colors.textMuted }]}>Révise en écoutant</Text>
        </View>
      </LinearGradient>

      {/* Onglets */}
      <View style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {(['generer', 'bibliotheque'] as const).map(t => (
          <TouchableOpacity key={t} style={[styles.tab, onglet === t && { borderBottomColor: colors.primary, borderBottomWidth: 2.5 }]} onPress={() => setOnglet(t)}>
            <Text style={[styles.tabTxt, { color: onglet === t ? colors.primary : colors.textMuted }]}>
              {t === 'generer' ? '✨ Générer' : `📚 Bibliothèque (${bibliotheque.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {onglet === 'generer' && (
          <>
            {/* Player */}
            {podcast && (
              <View style={[styles.playerCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.playerTitre, { color: colors.text }]} numberOfLines={2}>
                  🎙️ {podcast.sujet}
                </Text>
                <Text style={[styles.playerMatiere, { color: agentChoisi.couleur }]}>
                  {podcast.matiere} · {podcast.dureeMin} min
                </Text>

                {/* Barre progression */}
                <View style={styles.progressRow}>
                  <Text style={[styles.tempsTxt, { color: colors.textMuted }]}>{tempsEcoule}:00</Text>
                  <View style={[styles.progressBg, { backgroundColor: colors.border }]}>
                    <Animated.View style={[styles.progressFill, {
                      width: progressAnim.interpolate({ inputRange:[0,1], outputRange:['0%','100%'] }),
                      backgroundColor: agentChoisi.couleur,
                    }]} />
                  </View>
                  <Text style={[styles.tempsTxt, { color: colors.textMuted }]}>{podcast.dureeMin}:00</Text>
                </View>

                {/* Contrôles */}
                <View style={styles.controls}>
                  <TouchableOpacity onPress={() => skipPhrases(-8)}>
                    <MaterialCommunityIcons name="skip-backward" size={30} color={colors.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleRestart}>
                    <MaterialCommunityIcons name="restart" size={26} color={colors.textSecondary} />
                  </TouchableOpacity>

                  <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                    <TouchableOpacity
                      style={[styles.playBtn, { backgroundColor: agentChoisi.couleur }]}
                      onPress={handlePlayPause}
                    >
                      <MaterialCommunityIcons name={isPlaying ? 'pause' : 'play'} size={34} color="white" />
                    </TouchableOpacity>
                  </Animated.View>

                  <TouchableOpacity onPress={handleVitesse}>
                    <View style={[styles.vitesseBox, { backgroundColor: colors.border }]}>
                      <Text style={[styles.vitesseTxt, { color: colors.text }]}>{vitesse}×</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => skipPhrases(8)}>
                    <MaterialCommunityIcons name="skip-forward" size={30} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* Phrase en cours */}
                {phraseTexte !== '' && (
                  <View style={[styles.phraseBox, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.phraseTxt, { color: colors.textSecondary }]} numberOfLines={3}>
                      "{phraseTexte}"
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Sections du script */}
            {podcast && (
              <View style={[styles.scriptCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.scriptTitre, { color: colors.text }]}>📋 Contenu</Text>
                {podcast.sections.map((s, i) => {
                  const typeColors: Record<string, string> = {
                    intro: '#4DA6FF', explication: '#7BA89A',
                    exemple: '#6BAE98', quiz: '#FF9800', conclusion: '#5A8A7A',
                  };
                  const c = typeColors[s.type] || colors.primary;
                  return (
                    <View key={i} style={[styles.sectionRow, { borderLeftColor: c }]}>
                      <Text style={[styles.sectionTitre, { color: c }]}>{s.titre}</Text>
                      <Text style={[styles.sectionPreview, { color: colors.textMuted }]} numberOfLines={2}>
                        {s.contenu}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Formulaire */}
            <View style={[styles.formCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.formTitre, { color: colors.text }]}>
                {podcast ? '🔄 Nouveau podcast' : '✨ Créer un podcast'}
              </Text>

              <Text style={[styles.fieldLbl, { color: colors.textSecondary }]}>Matière</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {AGENTS.map(a => {
                    const sel = a.id === agentChoisi.id;
                    return (
                      <TouchableOpacity key={a.id}
                        style={[styles.agentChip, {
                          backgroundColor: sel ? a.couleur + '25' : colors.surface,
                          borderColor: sel ? a.couleur : colors.border,
                          borderWidth: sel ? 2 : 1,
                        }]}
                        onPress={() => setAgent(a)}
                      >
                        <Text style={{ fontSize: 22 }}>{a.emoji}</Text>
                        <Text style={[styles.agentNom, { color: sel ? a.couleur : colors.textSecondary }]}>
                          {a.matiere.split('-')[0].split(' ')[0]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              <Text style={[styles.fieldLbl, { color: colors.textSecondary }]}>Sujet ou chapitre</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                placeholder="Ex: Les dérivées, La photosynthèse..."
                placeholderTextColor={colors.textMuted}
                value={sujet}
                onChangeText={setSujet}
              />

              <Text style={[styles.fieldLbl, { color: colors.textSecondary }]}>Durée</Text>
              <View style={styles.dureeRow}>
                {[5, 10, 15].map(d => (
                  <TouchableOpacity key={d}
                    style={[styles.dureeChip, {
                      flex: 1,
                      backgroundColor: duree === d ? colors.primary + '25' : colors.surface,
                      borderColor: duree === d ? colors.primary : colors.border,
                    }]}
                    onPress={() => setDuree(d)}
                  >
                    <Text style={[styles.dureeTxt, { color: duree === d ? colors.primary : colors.textSecondary }]}>
                      {d} min
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.genBtn, { backgroundColor: agentChoisi.couleur }]}
                onPress={handleGenerer}
                disabled={generating}
              >
                {generating
                  ? <><ActivityIndicator size="small" color="white" /><Text style={styles.genBtnTxt}>L'IA rédige...</Text></>
                  : <><MaterialCommunityIcons name="microphone" size={22} color="white" /><Text style={styles.genBtnTxt}>Générer le podcast</Text></>
                }
              </TouchableOpacity>
            </View>
          </>
        )}

        {onglet === 'bibliotheque' && (
          <>
            {bibliotheque.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={{ fontSize: 56 }}>🎧</Text>
                <Text style={[styles.emptyTxt, { color: colors.textSecondary }]}>
                  Bibliothèque vide.{'\n'}Génère ton premier podcast !
                </Text>
                <TouchableOpacity style={[styles.emptyBtn, { backgroundColor: colors.primary }]} onPress={() => setOnglet('generer')}>
                  <Text style={styles.emptyBtnTxt}>✨ Créer un podcast</Text>
                </TouchableOpacity>
              </View>
            ) : (
              bibliotheque.map(p => {
                const a = AGENTS.find(ag => ag.matiere === p.matiere) || AGENTS[0];
                return (
                  <View key={p.id} style={[styles.bibCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={[styles.bibEmoji, { backgroundColor: a.couleur + '20' }]}>
                      <Text style={{ fontSize: 28 }}>{a.emoji}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.bibTitre, { color: colors.text }]} numberOfLines={2}>{p.sujet}</Text>
                      <Text style={[styles.bibMeta, { color: colors.textMuted }]}>
                        {p.matiere} · {p.dureeMin} min · {new Date(p.dateCreation).toLocaleDateString('fr-FR')}
                      </Text>
                    </View>
                    <View style={styles.bibActions}>
                      <TouchableOpacity
                        style={[styles.bibPlay, { backgroundColor: a.couleur }]}
                        onPress={() => { chargerPodcast(p); setOnglet('generer'); }}
                      >
                        <MaterialCommunityIcons name="play" size={18} color="white" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => Alert.alert('Supprimer ?', '', [
                        { text: 'Annuler', style: 'cancel' },
                        { text: 'Supprimer', style: 'destructive', onPress: async () => { await supprimerPodcast(p.id); chargerBiblio(); } },
                      ])}>
                        <MaterialCommunityIcons name="delete-outline" size={22} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,215,0,0.1)', justifyContent: 'center', alignItems: 'center' },
  headerTitre: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  headerSub: { fontSize: 12, marginTop: 2 },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabTxt: { fontSize: 13, fontWeight: '600' },
  content: { padding: 16, gap: 16, paddingBottom: 40 },

  playerCard: { borderRadius: 24, padding: 20, gap: 14 },
  playerTitre: { fontSize: 17, fontWeight: 'bold' },
  playerMatiere: { fontSize: 13, fontWeight: '600' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tempsTxt: { fontSize: 11, width: 36 },
  progressBg: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  playBtn: { width: 68, height: 68, borderRadius: 34, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  vitesseBox: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14 },
  vitesseTxt: { fontSize: 14, fontWeight: 'bold' },
  phraseBox: { borderRadius: 14, padding: 14 },
  phraseTxt: { fontSize: 13, lineHeight: 20, fontStyle: 'italic', textAlign: 'center' },

  scriptCard: { borderRadius: 20, padding: 16, gap: 10 },
  scriptTitre: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  sectionRow: { borderLeftWidth: 3, paddingLeft: 10, gap: 4 },
  sectionTitre: { fontSize: 13, fontWeight: '600' },
  sectionPreview: { fontSize: 12, lineHeight: 18 },

  formCard: { borderRadius: 24, padding: 20, gap: 12 },
  formTitre: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  fieldLbl: { fontSize: 13, fontWeight: '600' },
  agentChip: { alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, gap: 4, minWidth: 68 },
  agentNom: { fontSize: 10, fontWeight: '600' },
  input: { borderRadius: 14, borderWidth: 1, padding: 14, fontSize: 15 },
  dureeRow: { flexDirection: 'row', gap: 10 },
  dureeChip: { padding: 12, borderRadius: 14, borderWidth: 1, alignItems: 'center' },
  dureeTxt: { fontSize: 14, fontWeight: '600' },
  genBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16, borderRadius: 16, marginTop: 4 },
  genBtnTxt: { color: 'white', fontSize: 15, fontWeight: 'bold' },

  bibCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 20, borderWidth: 1, gap: 12 },
  bibEmoji: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  bibTitre: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  bibMeta: { fontSize: 11 },
  bibActions: { gap: 10, alignItems: 'center' },
  bibPlay: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },

  emptyBox: { alignItems: 'center', paddingTop: 60, gap: 16 },
  emptyTxt: { fontSize: 15, textAlign: 'center', lineHeight: 24 },
  emptyBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 },
  emptyBtnTxt: { color: 'white', fontWeight: 'bold', fontSize: 15 },
});
