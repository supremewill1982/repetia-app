import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../../context/ThemeContext';
import { initTTS, playTTS, pauseTTS, resumeTTS, stopTTS, setTTSSpeed, skipPhrases, getTTSIsPlaying } from '../../../services/audioRevisionService';
import { podcastVersPhrase, incrementerEcoute } from '../../../services/podcastService';
import { MATIERE_CONFIG } from '../../../types/podcast.types';
import { PodcastEnregistre } from '../../../types/podcast.types';

const VITESSES = [0.75, 1.0, 1.25, 1.5, 2.0];
const SECTION_COLORS: Record<string, string> = {
  intro: '#4DA6FF', explication: '#7BA89A', exemple: '#6BAE98', quiz: '#FF9800', conclusion: '#5A8A7A',
};

export default function AudioPhotoLecteur({ route, navigation }: any) {
  const { colors } = useTheme();
  const { podcast }: { podcast: PodcastEnregistre } = route.params || {};

  const [isPlaying, setIsPlaying] = useState(false);
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [totalPhrases, setTotal] = useState(0);
  const [vitesse, setVitesse] = useState(1.0);
  const [showScript, setShowScript] = useState(false);
  const [phraseToSection, setSectionMap] = useState<number[]>([]);
  const [phrases, setPhrases] = useState<string[]>([]);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseRef = useRef<any>(null);
  const hasStarted = useRef(false);
  const cfg = MATIERE_CONFIG[podcast?.matiere] || MATIERE_CONFIG['Maths'];
  const sectionActuelle = podcast?.scriptPodcast[phraseToSection[phraseIdx]];

  useFocusEffect(useCallback(() => {
    if (podcast) {
      const { phrases: ps, phraseToSection: map } = podcastVersPhrase(podcast.scriptPodcast);
      setPhrases(ps);
      setTotal(ps.length);
      setSectionMap(map);
      initTTS(ps, (idx) => setPhraseIdx(idx), () => { setIsPlaying(false); setPhraseIdx(0); });
    }
    return () => { stopTTS(); setIsPlaying(false); };
  }, [podcast?.id]));

  useEffect(() => {
    if (isPlaying) {
      pulseRef.current = Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]));
      pulseRef.current.start();
    } else { pulseRef.current?.stop(); pulseAnim.setValue(1); }
  }, [isPlaying]);

  useEffect(() => {
    if (totalPhrases > 0) Animated.timing(progressAnim, { toValue: phraseIdx / totalPhrases, duration: 300, useNativeDriver: false }).start();
  }, [phraseIdx, totalPhrases]);

  const handlePlayPause = () => {
    if (!podcast) return;
    if (isPlaying) { pauseTTS(); setIsPlaying(false); }
    else {
      if (!hasStarted.current) { playTTS(vitesse); hasStarted.current = true; incrementerEcoute(podcast.id); }
      else { resumeTTS(); }
      setIsPlaying(true);
    }
  };

  const handleSkip = (secondes: number) => { const nbPhrases = Math.round(secondes / 3); skipPhrases(nbPhrases); setPhraseIdx(prev => Math.max(0, Math.min(prev + nbPhrases, totalPhrases - 1))); };
  const handleVitesse = () => { const idx = VITESSES.indexOf(vitesse); const newVit = VITESSES[(idx + 1) % VITESSES.length]; setVitesse(newVit); setTTSSpeed(newVit); };
  const handleSection = (sIdx: number) => { const firstPhraseIdx = phraseToSection.findIndex(s => s === sIdx); if (firstPhraseIdx >= 0) { skipPhrases(firstPhraseIdx - phraseIdx); setPhraseIdx(firstPhraseIdx); } };

  const formatTemps = (s: number) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
  const fenetreStart = Math.max(0, phraseIdx - 2);
  const fenetreEnd = Math.min(totalPhrases, phraseIdx + 3);
  const fenetre = phrases.slice(fenetreStart, fenetreEnd);

  if (!podcast) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={[cfg.couleur, '#ECEEF3']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => { stopTTS(); navigation.goBack(); }}><MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} /></TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerEmoji}>{cfg.emoji}</Text>
          <View style={{ flex: 1 }}><Text style={[styles.headerTitre, { color: colors.text }]} numberOfLines={2}>{podcast.titreChapitre}</Text><Text style={styles.headerMeta}>{podcast.matiere} · {formatTemps(podcast.dureeSecondes)}</Text></View>
        </View>
        {sectionActuelle && <View style={[styles.sectionBadge, { backgroundColor: SECTION_COLORS[sectionActuelle.type] + '30' }]}><Text style={[styles.sectionBadgeTxt, { color: SECTION_COLORS[sectionActuelle.type] }]}>{sectionActuelle.type.toUpperCase()}</Text></View>}
      </LinearGradient>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        <View style={styles.progressWrapper}>
          <Text style={[styles.tempsTxt, { color: colors.textMuted }]}>{formatTemps(Math.round((phraseIdx / totalPhrases) * podcast.dureeSecondes))}</Text>
          <View style={[styles.progressBg, { backgroundColor: colors.border }]}><Animated.View style={[styles.progressFill, { width: progressAnim.interpolate({ inputRange: [0,1], outputRange: ['0%','100%'] }), backgroundColor: cfg.couleur }]} /></View>
          <Text style={[styles.tempsTxt, { color: colors.textMuted }]}>{formatTemps(podcast.dureeSecondes)}</Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity onPress={() => handleSkip(-15)}><View style={styles.skipBtn}><MaterialCommunityIcons name="rewind-15" size={28} color={colors.textSecondary} /></View></TouchableOpacity>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}><TouchableOpacity style={[styles.playBtn, { backgroundColor: cfg.couleur }]} onPress={handlePlayPause}><MaterialCommunityIcons name={isPlaying ? 'pause' : 'play'} size={40} color="#ECEEF3" /></TouchableOpacity></Animated.View>
          <TouchableOpacity onPress={() => handleSkip(15)}><View style={styles.skipBtn}><MaterialCommunityIcons name="fast-forward-15" size={28} color={colors.textSecondary} /></View></TouchableOpacity>
        </View>

        <View style={styles.secondControls}>
          <TouchableOpacity style={[styles.vitesseBox, { backgroundColor: colors.card }]} onPress={handleVitesse}><Text style={[styles.vitesseTxt, { color: colors.primary }]}>{vitesse}×</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.scriptToggle, { backgroundColor: showScript ? colors.primary + '20' : colors.card, borderColor: showScript ? colors.primary : colors.border }]} onPress={() => setShowScript(!showScript)}><MaterialCommunityIcons name="text" size={18} color={showScript ? colors.primary : colors.textMuted} /><Text style={[styles.scriptToggleTxt, { color: showScript ? colors.primary : colors.textMuted }]}>Transcription</Text></TouchableOpacity>
        </View>

        {showScript && <View style={[styles.fenetreCard, { backgroundColor: colors.card }]}>{fenetre.map((phrase, i) => { const absIdx = fenetreStart + i; const isActive = absIdx === phraseIdx; const sCouleur = SECTION_COLORS[podcast.scriptPodcast[phraseToSection[absIdx]]?.type || 'intro']; return <Text key={absIdx} style={[styles.phraseTxt, { color: isActive ? colors.text : colors.textMuted }, isActive && { backgroundColor: sCouleur + '20', color: sCouleur, fontWeight: '700' }]}>{phrase}</Text>; })}</View>}

        <View style={[styles.sectionsCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionsTitre, { color: colors.text }]}>📋 Sections</Text>
          {podcast.scriptPodcast.map((s, i) => {
            const isActive = i === (phraseToSection[phraseIdx] ?? 0);
            const couleur = SECTION_COLORS[s.type];
            return <TouchableOpacity key={i} style={[styles.sectionRow, { backgroundColor: isActive ? couleur + '15' : 'transparent', borderLeftColor: couleur }]} onPress={() => handleSection(i)}><Text style={[styles.sectionType, { color: couleur }]}>{s.type.toUpperCase()}{isActive && isPlaying ? ' 🔊' : ''}</Text><Text style={[styles.sectionPreview, { color: colors.textSecondary }]} numberOfLines={2}>{s.texte}</Text><Text style={[styles.sectionDuree, { color: colors.textMuted }]}>{s.dureeSec}s</Text></TouchableOpacity>;
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 16, gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center', alignSelf: 'flex-start' },
  headerInfo: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  headerEmoji: { fontSize: 36 },
  headerTitre: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  headerMeta: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 4 },
  sectionBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  sectionBadgeTxt: { fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  progressWrapper: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tempsTxt: { fontSize: 11, width: 40 },
  progressBg: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 32 },
  skipBtn: { width: 56, height: 56, justifyContent: 'center', alignItems: 'center' },
  playBtn: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', elevation: 6 },
  secondControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  vitesseBox: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  vitesseTxt: { fontSize: 15, fontWeight: 'bold' },
  scriptToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  scriptToggleTxt: { fontSize: 13, fontWeight: '600' },
  fenetreCard: { borderRadius: 20, padding: 16, gap: 8 },
  phraseTxt: { fontSize: 14, lineHeight: 22, padding: 6, borderRadius: 8 },
  sectionsCard: { borderRadius: 20, padding: 16, gap: 10 },
  sectionsTitre: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  sectionRow: { borderLeftWidth: 3, paddingLeft: 10, paddingVertical: 8, borderRadius: 8, gap: 4 },
  sectionType: { fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },
  sectionPreview: { fontSize: 12, lineHeight: 18 },
  sectionDuree: { fontSize: 10 },
});
