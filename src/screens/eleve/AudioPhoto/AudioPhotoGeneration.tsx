import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, BackHandler } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import { auth } from '../../../services/firebaseConfig';
import { genererPodcastPhoto } from '../../../services/podcastService';
import { MATIERE_CONFIG } from '../../../types/podcast.types';

const ETAPES = [
  { num: 1, icone: '📖', msg: 'Lecture du texte...', detail: 'Gemini lit ta photo' },
  { num: 2, icone: '🤖', msg: 'L\'IA structure...', detail: 'Création du script' },
  { num: 3, icone: '🎙️', msg: 'Préparation audio...', detail: 'Découpage en phrases' },
  { num: 4, icone: '💾', msg: 'Sauvegarde...', detail: 'Local + cloud' },
];

export default function AudioPhotoGeneration({ route, navigation }: any) {
  const { colors } = useTheme();
  const { userData } = useAuth();
  const { imageBase64, matiere, titreChapitre, titreSection, estPublic, userPrenom } = route.params || {};

  const [etapeIdx, setEtapeIdx] = useState(0);
  const [erreur, setErreur] = useState('');
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const cfg = MATIERE_CONFIG[matiere as keyof typeof MATIERE_CONFIG] || MATIERE_CONFIG['Maths'];

  useEffect(() => {
    const back = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => back.remove();
  }, []);

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.08, duration: 700, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
    ])).start();
  }, []);

  useEffect(() => {
    Animated.timing(progressAnim, { toValue: (etapeIdx + 1) / ETAPES.length, duration: 400, useNativeDriver: false }).start();
  }, [etapeIdx]);

  useEffect(() => { lancer(); }, []);

  const lancer = async () => {
    try {
      const userId = auth.currentUser?.uid || 'anon';
      const prenom = userPrenom || (userData as any)?.prenom || 'Élève';

      const podcast = await genererPodcastPhoto(
        imageBase64, matiere, titreChapitre, titreSection,
        estPublic, userId, prenom,
        (step) => setEtapeIdx(step - 1)
      );
      navigation.replace('AudioPhotoResultat', { podcast });
    } catch (e: any) {
      setErreur(e.message || 'Erreur lors de la génération');
    }
  };

  if (erreur) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={styles.errEmoji}>😔</Text>
        <Text style={[styles.errTitre, { color: colors.error }]}>Génération échouée</Text>
        <Text style={[styles.errMsg, { color: colors.textSecondary }]}>{erreur}</Text>
        <Text style={[styles.retourLink, { color: colors.primary }]} onPress={() => navigation.goBack()}>← Retour</Text>
      </View>
    );
  }

  const etape = ETAPES[etapeIdx] || ETAPES[0];

  return (
    <LinearGradient colors={['#ECEEF3', '#E8F2EE', '#ECEEF3']} style={styles.container}>
      <Animated.Text style={[styles.iconeAnim, { transform: [{ scale: pulseAnim }] }]}>{etape.icone}</Animated.Text>
      <View style={styles.infoBox}>
        <Text style={styles.cfgEmoji}>{cfg.emoji}</Text>
        <Text style={styles.titrePodcast} numberOfLines={2}>{titreChapitre}</Text>
        <Text style={[styles.matiereTxt, { color: cfg.couleur }]}>{matiere}</Text>
      </View>
      <View style={styles.etapeBox}>
        <Text style={styles.etapeMsg}>{etape.msg}</Text>
        <Text style={[styles.etapeDetail, { color: 'rgba(255,255,255,0.5)' }]}>{etape.detail}</Text>
      </View>
      <View style={styles.progressWrapper}>
        <View style={styles.progressBg}>
          <Animated.View style={[styles.progressFill, { width: progressAnim.interpolate({ inputRange: [0,1], outputRange: ['0%','100%'] }), backgroundColor: cfg.couleur }]} />
        </View>
        <Text style={styles.progressPct}>{Math.round(((etapeIdx + 1) / ETAPES.length) * 100)}%</Text>
      </View>
      <View style={styles.etapesListe}>
        {ETAPES.map((e, i) => (
          <View key={i} style={styles.etapeLigne}>
            <View style={[styles.etapeDot, { backgroundColor: i < etapeIdx ? cfg.couleur : i === etapeIdx ? 'white' : 'rgba(255,255,255,0.2)' }]} />
            <Text style={[styles.etapeLblTxt, { color: i <= etapeIdx ? 'white' : 'rgba(255,255,255,0.4)', fontWeight: i === etapeIdx ? '700' : '400' }]}>{e.icone} {e.msg}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.note}>Ne ferme pas l'application</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 20 },
  iconeAnim: { fontSize: 72, marginBottom: 8 },
  infoBox: { alignItems: 'center', gap: 4 },
  cfgEmoji: { fontSize: 32 },
  titrePodcast: { color: 'white', fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
  matiereTxt: { fontSize: 13, fontWeight: '600' },
  etapeBox: { alignItems: 'center', gap: 4 },
  etapeMsg: { color: 'white', fontSize: 17, fontWeight: '600', textAlign: 'center' },
  etapeDetail: { fontSize: 13, textAlign: 'center' },
  progressWrapper: { width: '100%', gap: 8 },
  progressBg: { width: '100%', height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressPct: { color: 'white', fontSize: 13, textAlign: 'right', fontWeight: '600' },
  etapesListe: { width: '100%', gap: 10 },
  etapeLigne: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  etapeDot: { width: 10, height: 10, borderRadius: 5 },
  etapeLblTxt: { fontSize: 14 },
  note: { color: 'rgba(255,255,255,0.4)', fontSize: 11, textAlign: 'center', marginTop: 16 },
  errEmoji: { fontSize: 56, textAlign: 'center' },
  errTitre: { fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
  errMsg: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  retourLink: { fontSize: 16, fontWeight: '600', marginTop: 16 },
});
