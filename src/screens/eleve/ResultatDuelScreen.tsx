import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

export default function ResultatDuelScreen({ route, navigation }: any) {
  const { colors } = useTheme();
  const {
    noteSur20, kebaScore, victoire, tempsMs,
    matiere, agentEmoji, agentCouleur, reponses,
  } = route.params || {};

  const scale = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 4, tension: 60, useNativeDriver: true }),
      Animated.timing(fadeIn, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const formatTemps = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return `${m}m${String(s % 60).padStart(2,'0')}s`;
  };

  const diff = noteSur20 - kebaScore;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>

        {/* Trophée animé */}
        <Animated.View style={[styles.trophy, { transform: [{ scale }] }]}>
          <LinearGradient
            colors={victoire ? ['#7BA89A', '#5A8A7A'] : ['#607D8B', '#455A64']}
            style={styles.trophyBg}
          >
            <Text style={styles.trophyEmoji}>{victoire ? '🏆' : '💪'}</Text>
          </LinearGradient>
        </Animated.View>

        <Animated.View style={{ opacity: fadeIn, alignItems: 'center' }}>
          <Text style={[styles.resultatTitre, { color: victoire ? '#7BA89A' : colors.text }]}>
            {victoire ? 'VICTOIRE !' : 'Bonne tentative !'}
          </Text>
          <Text style={[styles.resultatSous, { color: colors.textSecondary }]}>
            {victoire
              ? `Tu as battu KEBA en ${matiere} ! 🎉`
              : `KEBA était plus fort cette fois...`
            }
          </Text>
        </Animated.View>

        {/* Scores VS */}
        <Animated.View style={[styles.vsCard, { backgroundColor: colors.card, opacity: fadeIn }]}>
          <View style={styles.vsColonne}>
            <Text style={styles.vsNom}>Toi</Text>
            <Text style={[styles.vsScore, { color: victoire ? '#7BA89A' : colors.primary }]}>
              {noteSur20}/20
            </Text>
            <View style={[styles.vsBar, { backgroundColor: colors.border }]}>
              <View
                style={[styles.vsBarFill, {
                  height: `${(noteSur20 / 20) * 100}%`,
                  backgroundColor: victoire ? '#7BA89A' : colors.primary,
                }]}
              />
            </View>
          </View>

          <View style={styles.vsCentre}>
            <Text style={[styles.vsDiff, { color: diff > 0 ? colors.success : diff < 0 ? colors.error : colors.textMuted }]}>
              {diff > 0 ? `+${diff}` : diff < 0 ? `${diff}` : '='}
            </Text>
            <Text style={styles.vsVs}>VS</Text>
            <Text style={[styles.vsTemps, { color: colors.textMuted }]}>
              ⏱️ {formatTemps(tempsMs)}
            </Text>
          </View>

          <View style={styles.vsColonne}>
            <Text style={styles.vsNom}>{agentEmoji} KEBA</Text>
            <Text style={[styles.vsScore, { color: victoire ? colors.textSecondary : colors.error }]}>
              {kebaScore}/20
            </Text>
            <View style={[styles.vsBar, { backgroundColor: colors.border }]}>
              <View
                style={[styles.vsBarFill, {
                  height: `${(kebaScore / 20) * 100}%`,
                  backgroundColor: victoire ? colors.textMuted : colors.error,
                }]}
              />
            </View>
          </View>
        </Animated.View>

        {/* Détail des réponses */}
        {reponses?.length > 0 && (
          <Animated.View style={[styles.detailCard, { backgroundColor: colors.card, opacity: fadeIn }]}>
            <Text style={[styles.detailTitre, { color: colors.text }]}>Tes réponses</Text>
            {reponses.map((r: any, i: number) => (
              <View key={i} style={[styles.reponseRow, { borderBottomColor: colors.border }]}>
                <View style={[styles.noteBadge, {
                  backgroundColor: r.note === 2 ? colors.success + '20' : r.note === 1 ? colors.warning + '20' : colors.error + '20',
                }]}>
                  <Text style={[styles.noteText, {
                    color: r.note === 2 ? colors.success : r.note === 1 ? colors.warning : colors.error,
                  }]}>{r.note === 2 ? '✓' : r.note === 1 ? '~' : '✗'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.qText, { color: colors.textSecondary }]} numberOfLines={2}>
                    {r.question}
                  </Text>
                </View>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Boutons */}
        <TouchableOpacity
          style={[styles.btnPrimary, { backgroundColor: agentCouleur || '#7BA89A' }]}
          onPress={() => navigation.navigate('BacArena')}
        >
          <Text style={styles.btnPrimaryTxt}>⚔️ Rejouer</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btnSecondary, { borderColor: colors.border }]}
          onPress={() => navigation.navigate('Main')}
        >
          <Text style={[styles.btnSecondaryTxt, { color: colors.textSecondary }]}>
            Retour à l'accueil
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, alignItems: 'center', paddingBottom: 40 },
  trophy: { marginTop: 40, marginBottom: 24 },
  trophyBg: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center' },
  trophyEmoji: { fontSize: 60 },
  resultatTitre: { fontSize: 32, fontWeight: 'bold', marginBottom: 8, letterSpacing: 1 },
  resultatSous: { fontSize: 16, textAlign: 'center', marginBottom: 32 },
  vsCard: {
    width: '100%', borderRadius: 24, padding: 20,
    flexDirection: 'row', alignItems: 'flex-end', marginBottom: 24,
    gap: 16,
  },
  vsColonne: { flex: 1, alignItems: 'center', gap: 8 },
  vsNom: { color: 'white', fontSize: 14, fontWeight: '700' },
  vsScore: { fontSize: 28, fontWeight: 'bold' },
  vsBar: { width: 40, height: 80, borderRadius: 8, overflow: 'hidden', justifyContent: 'flex-end' },
  vsBarFill: { width: '100%', borderRadius: 8 },
  vsCentre: { alignItems: 'center', gap: 4 },
  vsDiff: { fontSize: 22, fontWeight: 'bold' },
  vsVs: { fontSize: 16, color: '#666', fontWeight: '600' },
  vsTemps: { fontSize: 11 },
  detailCard: { width: '100%', borderRadius: 20, padding: 16, marginBottom: 24 },
  detailTitre: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  reponseRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderBottomWidth: 1,
  },
  noteBadge: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  noteText: { fontSize: 16, fontWeight: 'bold' },
  qText: { fontSize: 13, lineHeight: 18 },
  btnPrimary: {
    width: '100%', padding: 16, borderRadius: 16,
    alignItems: 'center', marginBottom: 12,
  },
  btnPrimaryTxt: { color: '#ECEEF3', fontSize: 17, fontWeight: 'bold' },
  btnSecondary: {
    width: '100%', padding: 14, borderRadius: 16,
    alignItems: 'center', borderWidth: 1,
  },
  btnSecondaryTxt: { fontSize: 15 },
});
