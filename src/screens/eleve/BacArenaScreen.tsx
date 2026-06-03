import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Animated, ActivityIndicator, FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { AGENTS } from '../../services/iaServiceOpenRouter';
import {
  getClassementSemaine, getMonMeilleurScore,
  getHistoriqueDuels, getWeekKey, ScoreArena,
} from '../../services/arenaService';

type Onglet = 'duel' | 'classement' | 'historique';

export default function BacArenaScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { userData } = useAuth();

  const [onglet, setOnglet] = useState<Onglet>('duel');
  const [classement, setClassement] = useState<ScoreArena[]>([]);
  const [monScore, setMonScore] = useState<ScoreArena | null>(null);
  const [historique, setHistorique] = useState<ScoreArena[]>([]);
  const [loadingClass, setLoadingClass] = useState(false);
  const [agentChoisi, setAgentChoisi] = useState(AGENTS[0]);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animation pulse sur le bouton DUEL
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      chargerDonnees();
    }, [])
  );

  const chargerDonnees = async () => {
    setLoadingClass(true);
    const [cl, ms, hist] = await Promise.all([
      getClassementSemaine(),
      getMonMeilleurScore(),
      getHistoriqueDuels(),
    ]);
    setClassement(cl);
    setMonScore(ms);
    setHistorique(hist);
    setLoadingClass(false);
  };

  const lancerDuel = () => {
    navigation.navigate('DuelIA', {
      agentId: agentChoisi.id,
      matiereNom: agentChoisi.matiere,
      agentCouleur: agentChoisi.couleur,
      agentEmoji: agentChoisi.emoji,
    });
  };

  // ── Ma position dans le classement ──
  const maPosition = classement.findIndex(s => s.uid === (userData as any)?.uid) + 1;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient colors={['#E8F2EE', '#ECEEF3']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>⚔️ BacArena</Text>
          <Text style={[styles.headerSub, { color: colors.textMuted }]}>
            Semaine {getWeekKey().split('_W')[1]} · Défie KEBA !
          </Text>
        </View>
        {monScore && (
          <View style={[styles.myScoreBadge, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.myScoreText, { color: colors.primary }]}>
              🏅 {monScore.score}/20
            </Text>
          </View>
        )}
      </LinearGradient>

      {/* Onglets */}
      <View style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {(['duel', 'classement', 'historique'] as Onglet[]).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, onglet === t && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setOnglet(t)}
          >
            <Text style={[
              styles.tabText,
              { color: onglet === t ? colors.primary : colors.textMuted },
            ]}>
              {t === 'duel' ? '⚔️ Duel' : t === 'classement' ? '🏆 Classement' : '📋 Historique'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>

        {/* ── ONGLET DUEL ── */}
        {onglet === 'duel' && (
          <>
            {/* KEBA */}
            <LinearGradient colors={['#E8F2EE', '#F5F6FA']} style={styles.kebaCard}>
              <View style={styles.kebaRow}>
                <View>
                  <Text style={styles.kebaLabel}>Ton adversaire</Text>
                  <Text style={styles.kebaName}>🦁 KEBA</Text>
                  <Text style={[styles.kebaSub, { color: colors.textMuted }]}>
                    Intelligence Artificielle · Niveau Expert
                  </Text>
                </View>
                <View style={styles.kebaStats}>
                  <Text style={[styles.kebaStatVal, { color: colors.primary }]}>~15</Text>
                  <Text style={[styles.kebaStatLabel, { color: colors.textMuted }]}>/20 moy.</Text>
                </View>
              </View>
              <View style={styles.kebaRules}>
                <Text style={[styles.ruleItem, { color: colors.textSecondary }]}>⏱️ 5 minutes chrono</Text>
                <Text style={[styles.ruleItem, { color: colors.textSecondary }]}>❓ 10 questions</Text>
                <Text style={[styles.ruleItem, { color: colors.textSecondary }]}>🎯 Réponds vite et bien</Text>
              </View>
            </LinearGradient>

            {/* Choix matière */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Choisis ta matière</Text>
            <FlatList
              data={AGENTS}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={a => a.id}
              contentContainerStyle={{ gap: 10, paddingHorizontal: 16 }}
              style={{ marginBottom: 20 }}
              renderItem={({ item }) => {
                const sel = item.id === agentChoisi.id;
                return (
                  <TouchableOpacity
                    style={[
                      styles.agentChip,
                      {
                        backgroundColor: sel ? item.couleur + '30' : colors.card,
                        borderColor: sel ? item.couleur : colors.border,
                        borderWidth: sel ? 2 : 1,
                      },
                    ]}
                    onPress={() => setAgentChoisi(item)}
                  >
                    <Text style={styles.agentEmoji}>{item.emoji}</Text>
                    <Text style={[styles.agentNom, { color: sel ? item.couleur : colors.textSecondary }]}>
                      {item.matiere.split('-')[0].trim()}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />

            {/* Bouton DUEL */}
            <Animated.View style={{ transform: [{ scale: pulseAnim }], marginHorizontal: 16 }}>
              <TouchableOpacity onPress={lancerDuel} activeOpacity={0.85}>
                <LinearGradient
                  colors={[agentChoisi.couleur, agentChoisi.couleur + 'AA']}
                  style={styles.duelBtn}
                >
                  <Text style={styles.duelBtnEmoji}>{agentChoisi.emoji}</Text>
                  <View>
                    <Text style={styles.duelBtnTxt}>LANCER LE DUEL</Text>
                    <Text style={styles.duelBtnSub}>{agentChoisi.matiere} · KEBA t'attend !</Text>
                  </View>
                  <MaterialCommunityIcons name="sword-cross" size={28} color="white" />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* Mon score cette semaine */}
            {monScore && (
              <View style={[styles.monScoreCard, { backgroundColor: colors.card, borderColor: colors.primary }]}>
                <Text style={[styles.monScoreTitre, { color: colors.primary }]}>
                  🏅 Mon meilleur score cette semaine
                </Text>
                <Text style={[styles.monScoreVal, { color: colors.text }]}>
                  {monScore.score}/20 en {monScore.matiere}
                </Text>
                {maPosition > 0 && (
                  <Text style={[styles.maPosition, { color: colors.textSecondary }]}>
                    Position : #{maPosition} au classement
                  </Text>
                )}
              </View>
            )}
          </>
        )}

        {/* ── ONGLET CLASSEMENT ── */}
        {onglet === 'classement' && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              🏆 Top de la semaine
            </Text>
            {loadingClass ? (
              <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 40 }} />
            ) : (
              classement.map((entry, idx) => {
                const isMe = entry.uid === (userData as any)?.uid;
                const medals = ['🥇', '🥈', '🥉'];
                return (
                  <View
                    key={idx}
                    style={[
                      styles.rankRow,
                      {
                        backgroundColor: isMe ? colors.primary + '15' : colors.card,
                        borderColor: isMe ? colors.primary : colors.border,
                        borderWidth: isMe ? 1.5 : 1,
                      },
                    ]}
                  >
                    <Text style={styles.rankPos}>
                      {idx < 3 ? medals[idx] : `#${idx + 1}`}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.rankNom, { color: isMe ? colors.primary : colors.text }]}>
                        {entry.prenom} {isMe ? '(toi)' : ''}
                      </Text>
                      <Text style={[styles.rankMatiere, { color: colors.textMuted }]}>
                        {entry.matiere}
                      </Text>
                    </View>
                    <View>
                      <Text style={[styles.rankScore, { color: idx < 3 ? '#7BA89A' : colors.text }]}>
                        {entry.score}/20
                      </Text>
                      <Text style={[styles.rankTemps, { color: colors.textMuted }]}>
                        {Math.floor(entry.tempsMs / 60000)}m{String(Math.floor((entry.tempsMs % 60000) / 1000)).padStart(2,'0')}s
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
            {!loadingClass && classement.length === 0 && (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyEmoji}>🏆</Text>
                <Text style={[styles.emptyTxt, { color: colors.textSecondary }]}>
                  Sois le premier à rejoindre le classement cette semaine !
                </Text>
                <TouchableOpacity
                  style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
                  onPress={() => setOnglet('duel')}
                >
                  <Text style={styles.emptyBtnTxt}>Lancer un duel</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {/* ── ONGLET HISTORIQUE ── */}
        {onglet === 'historique' && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>📋 Mes derniers duels</Text>
            {historique.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyEmoji}>⚔️</Text>
                <Text style={[styles.emptyTxt, { color: colors.textSecondary }]}>
                  Tu n'as pas encore joué de duel. Lance-toi !
                </Text>
              </View>
            ) : (
              historique.map((h, i) => {
                const couleurAgent = AGENTS.find(a => a.matiere === h.matiere)?.couleur || '#7BA89A';
                return (
                  <View key={i} style={[styles.histRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={[styles.histEmoji, { backgroundColor: couleurAgent + '20' }]}>
                      <Text style={{ fontSize: 22 }}>
                        {AGENTS.find(a => a.matiere === h.matiere)?.emoji || '📚'}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.histMatiere, { color: colors.text }]}>{h.matiere}</Text>
                      <Text style={[styles.histDate, { color: colors.textMuted }]}>
                        {new Date(h.date).toLocaleDateString('fr-FR')}
                      </Text>
                    </View>
                    <View style={styles.histScore}>
                      <Text style={[
                        styles.histScoreVal,
                        { color: h.score >= 14 ? colors.success : h.score >= 10 ? colors.warning : colors.error },
                      ]}>
                        {h.score}/20
                      </Text>
                      <Text style={[styles.histScoreSub, { color: colors.textMuted }]}>
                        {h.score >= 14 ? 'Victoire 🏆' : h.score >= 10 ? 'Moyen' : 'Défaite'}
                      </Text>
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
  header: {
    paddingTop: 50, paddingBottom: 20, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,215,0,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: 'white' },
  headerSub: { fontSize: 12, marginTop: 2 },
  myScoreBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  myScoreText: { fontSize: 13, fontWeight: 'bold' },

  tabBar: {
    flexDirection: 'row', borderBottomWidth: 1,
  },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabText: { fontSize: 13, fontWeight: '600' },

  content: { padding: 16, paddingBottom: 40 },

  kebaCard: {
    borderRadius: 24, padding: 20, marginBottom: 20,
  },
  kebaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  kebaLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 11, letterSpacing: 1, marginBottom: 4 },
  kebaName: { color: 'white', fontSize: 28, fontWeight: 'bold' },
  kebaSub: { fontSize: 12, marginTop: 4 },
  kebaStats: { alignItems: 'center' },
  kebaStatVal: { fontSize: 32, fontWeight: 'bold' },
  kebaStatLabel: { fontSize: 12 },
  kebaRules: { gap: 6 },
  ruleItem: { fontSize: 14 },

  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },

  agentChip: {
    alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 16, gap: 6, minWidth: 80,
  },
  agentEmoji: { fontSize: 26 },
  agentNom: { fontSize: 11, fontWeight: '600', textAlign: 'center' },

  duelBtn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20, borderRadius: 24, gap: 16, marginBottom: 20,
  },
  duelBtnEmoji: { fontSize: 36 },
  duelBtnTxt: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  duelBtnSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },

  monScoreCard: {
    padding: 16, borderRadius: 20, borderWidth: 1.5, gap: 6,
  },
  monScoreTitre: { fontSize: 13, fontWeight: '600' },
  monScoreVal: { fontSize: 20, fontWeight: 'bold' },
  maPosition: { fontSize: 13 },

  rankRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, borderRadius: 16, marginBottom: 8,
    borderWidth: 1, gap: 12,
  },
  rankPos: { fontSize: 22, width: 36, textAlign: 'center' },
  rankNom: { fontSize: 15, fontWeight: '600' },
  rankMatiere: { fontSize: 12, marginTop: 2 },
  rankScore: { fontSize: 18, fontWeight: 'bold', textAlign: 'right' },
  rankTemps: { fontSize: 11, textAlign: 'right' },

  histRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, borderRadius: 16, marginBottom: 8,
    borderWidth: 1, gap: 12,
  },
  histEmoji: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  histMatiere: { fontSize: 15, fontWeight: '600' },
  histDate: { fontSize: 12, marginTop: 2 },
  histScore: { alignItems: 'flex-end' },
  histScoreVal: { fontSize: 18, fontWeight: 'bold' },
  histScoreSub: { fontSize: 11 },

  emptyBox: { alignItems: 'center', paddingTop: 40, gap: 16 },
  emptyEmoji: { fontSize: 56 },
  emptyTxt: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  emptyBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 },
  emptyBtnTxt: { color: '#ECEEF3', fontWeight: 'bold', fontSize: 15 },
});
