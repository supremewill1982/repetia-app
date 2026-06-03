import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth }  from '../../context/AuthContext';
import {
  getEnfantsLies, getSessionsEnfant, calculerScoreBienEtre,
  calculerPredictionBac, buildTimeline, ecouterActiviteLive,
  EnfantLie, ScoreBienEtre, PredictionBac, EvenementTimeline,
} from '../../services/parentService';

export default function ParentDashboard({ navigation }: any) {
  const { colors }   = useTheme();
  const { userData } = useAuth();

  const [enfants, setEnfants]         = useState<EnfantLie[]>([]);
  const [enfantActif, setEnfantActif] = useState<EnfantLie | null>(null);
  const [sessions, setSessions]       = useState<any[]>([]);
  const [bienEtre, setBienEtre]       = useState<ScoreBienEtre | null>(null);
  const [prediction, setPrediction]   = useState<PredictionBac | null>(null);
  const [timeline, setTimeline]       = useState<EvenementTimeline[]>([]);
  const [loading, setLoading]         = useState(true);
  const [estActif, setEstActif]       = useState(false);
  const [detailActivite, setDetail]   = useState('');

  const unsubRef  = useRef<(() => void) | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.3, duration: 800, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1,   duration: 800, useNativeDriver: true }),
    ])).start();
  }, []);

  useFocusEffect(useCallback(() => {
    charger();
    return () => { unsubRef.current?.(); };
  }, []));

  const charger = async () => {
    setLoading(true);
    try {
      const liste = await getEnfantsLies();
      setEnfants(liste);

      if (liste.length === 0) { setLoading(false); return; }

      const enfant = liste[0];
      setEnfantActif(enfant);
      await chargerEnfant(enfant);
    } finally {
      setLoading(false);
    }
  };

  const chargerEnfant = async (enfant: EnfantLie) => {
    const sess  = await getSessionsEnfant(enfant.uid);
    setSessions(sess);

    const be   = calculerScoreBienEtre(sess);
    const pred = await calculerPredictionBac(sess, enfant.serie);
    const tl   = buildTimeline(sess, be.score < 40 ? 7 : 0);

    setBienEtre(be);
    setPrediction(pred);
    setTimeline(tl.slice(0, 4));

    // Live tracking
    unsubRef.current?.();
    unsubRef.current = ecouterActiviteLive(enfant.uid, (actif, detail) => {
      setEstActif(actif);
      setDetail(detail);
    });
  };

  const handleSelectEnfant = async (enfant: EnfantLie) => {
    setEnfantActif(enfant);
    setLoading(true);
    await chargerEnfant(enfant);
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingTxt, { color: colors.textMuted }]}>Chargement...</Text>
      </View>
    );
  }

  // Aucun enfant lié
  if (enfants.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ fontSize: 64 }}>👨‍👩‍👧</Text>
        <Text style={[styles.emptyTitre, { color: colors.text }]}>Aucun enfant lié</Text>
        <Text style={[styles.emptySous, { color: colors.textMuted }]}>
          Demandez à votre enfant de générer un code de liaison dans l'application RÉPÉTIA
        </Text>
        <TouchableOpacity
          style={[styles.lierBtn, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('ParentLier')}
        >
          <MaterialCommunityIcons name="link-plus" size={22} color="white" />
          <Text style={styles.lierBtnTxt}>Lier un compte enfant</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient colors={['#7BA89A', '#5A8A7A']} style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerBonjour}>Bonjour,</Text>
            <Text style={styles.headerPrenom}>{(userData as any)?.prenom || 'Parent'} 👋</Text>
          </View>
          <TouchableOpacity
            style={styles.lierHeaderBtn}
            onPress={() => navigation.navigate('ParentLier')}
          >
            <MaterialCommunityIcons name="plus" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Sélecteur enfants */}
        {enfants.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.enfantsScroll}>
            {enfants.map(e => (
              <TouchableOpacity
                key={e.uid}
                style={[styles.enfantChip, {
                  backgroundColor: e.uid === enfantActif?.uid
                    ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
                }]}
                onPress={() => handleSelectEnfant(e)}
              >
                <Text style={styles.enfantChipTxt}>{e.prenom}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Live Indicator ── */}
        <View style={[styles.liveCard, {
          backgroundColor: estActif ? '#EEF7F3' : colors.surface,
          borderColor:     estActif ? colors.primary : colors.border,
        }]}>
          <Animated.View style={[
            styles.liveDot,
            { backgroundColor: estActif ? '#6BAE98' : '#DDE1E8',
              transform: estActif ? [{ scale: pulseAnim }] : [] },
          ]} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.liveNom, { color: colors.text }]}>
              {enfantActif?.prenom}
            </Text>
            <Text style={[styles.liveDetail, { color: estActif ? colors.primary : colors.textMuted }]}>
              {detailActivite || 'Chargement...'}
            </Text>
          </View>
          <Text style={[styles.liveClasse, { color: colors.textMuted }]}>
            {enfantActif?.classe} {enfantActif?.serie}
          </Text>
        </View>

        {/* ── Score Bien-être ── */}
        {bienEtre && (
          <View style={[styles.bienEtreCard, { backgroundColor: colors.surface }]}>
            <View style={styles.bienEtreHeader}>
              <Text style={[styles.bienEtreTitre, { color: colors.text }]}>
                Score de bien-être scolaire
              </Text>
              <Text style={styles.bienEtreEmoji}>{bienEtre.emoji}</Text>
            </View>
            {/* Barre de score */}
            <View style={[styles.scoreBg, { backgroundColor: colors.border }]}>
              <View style={[styles.scoreFill, {
                width: `${bienEtre.score}%`,
                backgroundColor: bienEtre.couleur,
              }]} />
            </View>
            <View style={styles.scoreRow}>
              <Text style={[styles.scoreVal, { color: bienEtre.couleur }]}>
                {bienEtre.score}/100
              </Text>
              <Text style={[styles.scoreNiveau, { color: bienEtre.couleur }]}>
                {bienEtre.niveau.charAt(0).toUpperCase() + bienEtre.niveau.slice(1)}
              </Text>
            </View>
            {/* Top facteurs */}
            {bienEtre.facteurs.slice(0, 2).map((f, i) => (
              <Text key={i} style={[styles.facteur, { color: colors.textSecondary }]}>{f}</Text>
            ))}
          </View>
        )}

        {/* ── Prédiction Bac ── */}
        {prediction && (
          <TouchableOpacity
            style={[styles.predCard, { backgroundColor: colors.surface }]}
            onPress={() => navigation.navigate('IACoach')}
          >
            <View style={styles.predHeader}>
              <Text style={[styles.predTitre, { color: colors.text }]}>
                🎯 Prédiction Bac {new Date().getFullYear()}
              </Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
            </View>
            <View style={styles.predRow}>
              <View>
                <Text style={[styles.predPct, { color: colors.primary }]}>
                  {prediction.pourcentage}%
                </Text>
                <Text style={[styles.predLabel, { color: colors.textMuted }]}>
                  {prediction.label}
                </Text>
              </View>
              {/* Mini barres matières */}
              <View style={styles.predMatieres}>
                {prediction.parMatiere.slice(0, 3).map((m, i) => (
                  <View key={i} style={styles.predMatiereRow}>
                    <Text style={[styles.predMatiereName, { color: colors.textSecondary }]} numberOfLines={1}>
                      {m.matiere.split('-')[0].split(' ')[0]}
                    </Text>
                    <View style={[styles.predBarBg, { backgroundColor: colors.border }]}>
                      <View style={[styles.predBarFill, {
                        width: `${(m.moyenne / 20) * 100}%`,
                        backgroundColor: m.alerte ? '#E55C5C' : colors.primary,
                      }]} />
                    </View>
                    <Text style={[styles.predMatiereNote, {
                      color: m.alerte ? '#E55C5C' : colors.text,
                    }]}>
                      {m.moyenne.toFixed(0)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
            {prediction.alerteOracle.length > 0 && (
              <View style={[styles.oracleAlert, { backgroundColor: '#FEF3C7' }]}>
                <MaterialCommunityIcons name="alert" size={14} color="#92400E" />
                <Text style={styles.oracleAlertTxt} numberOfLines={2}>
                  {prediction.alerteOracle[0]}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* ── Aperçu Timeline ── */}
        <View style={[styles.timelineCard, { backgroundColor: colors.surface }]}>
          <View style={styles.timelineHeader}>
            <Text style={[styles.timelineTitre, { color: colors.text }]}>Activité récente</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Timeline')}>
              <Text style={[styles.voirTout, { color: colors.primary }]}>Tout voir →</Text>
            </TouchableOpacity>
          </View>
          {timeline.length === 0 ? (
            <Text style={[styles.emptyTimeline, { color: colors.textMuted }]}>
              Aucune activité récente
            </Text>
          ) : (
            timeline.slice(0, 3).map((ev, i) => (
              <View key={i} style={[styles.evRow, i < 2 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                <View style={[styles.evIconBox, { backgroundColor: ev.couleur + '20' }]}>
                  <MaterialCommunityIcons name={ev.icone as any} size={18} color={ev.couleur} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.evTitre, { color: colors.text }]} numberOfLines={1}>
                    {ev.titre}
                  </Text>
                  <Text style={[styles.evDesc, { color: colors.textMuted }]} numberOfLines={1}>
                    {ev.description}
                  </Text>
                </View>
                <View style={styles.evMeta}>
                  {ev.score !== undefined && (
                    <Text style={[styles.evScore, { color: ev.couleur }]}>{ev.score}/20</Text>
                  )}
                  <Text style={[styles.evDate, { color: colors.textMuted }]}>{ev.heure}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* ── Actions rapides ── */}
        <View style={styles.actionsRow}>
          {[
            { icon: 'brain',         label: 'Analyse IA', route: 'IACoach',      bg: '#EEF7F3', color: '#5A8A7A' },
            { icon: 'hand-heart',    label: 'Coup de pouce', route: 'CoupDePouce', bg: '#F3EEF7', color: '#7A6A9A' },
            { icon: 'file-document', label: 'Rapport',    route: 'ParentRapport', bg: '#EEF0F7', color: '#6A7A9A' },
          ].map((a, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.actionCard, { backgroundColor: a.bg }]}
              onPress={() => navigation.navigate(a.route, { enfant: enfantActif, sessions, bienEtre, prediction })}
            >
              <MaterialCommunityIcons name={a.icon as any} size={26} color={a.color} />
              <Text style={[styles.actionLabel, { color: a.color }]}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, padding: 32 },
  loadingTxt: { fontSize: 14, marginTop: 8 },
  emptyTitre: { fontSize: 22, fontWeight: '700', textAlign: 'center' },
  emptySous:  { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  lierBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16, marginTop: 8 },
  lierBtnTxt: { color: 'white', fontSize: 15, fontWeight: '700' },
  header: { paddingTop: 52, paddingBottom: 20, paddingHorizontal: 20, gap: 16 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerBonjour: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  headerPrenom:  { color: 'white', fontSize: 24, fontWeight: '800' },
  lierHeaderBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center' },
  enfantsScroll:  { marginTop: 4 },
  enfantChip:     { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, marginRight: 8 },
  enfantChipTxt:  { color: 'white', fontSize: 13, fontWeight: '600' },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  liveCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, borderWidth: 1.5, gap: 12 },
  liveDot:    { width: 12, height: 12, borderRadius: 6 },
  liveNom:    { fontSize: 15, fontWeight: '700' },
  liveDetail: { fontSize: 12, marginTop: 2 },
  liveClasse: { fontSize: 11 },
  bienEtreCard: { borderRadius: 20, padding: 18, gap: 10, elevation: 2, shadowColor: '#2B3A4A', shadowOffset: { width:0, height:2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  bienEtreHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bienEtreTitre:  { fontSize: 14, fontWeight: '700' },
  bienEtreEmoji:  { fontSize: 22 },
  scoreBg:   { height: 10, borderRadius: 5, overflow: 'hidden' },
  scoreFill: { height: '100%', borderRadius: 5 },
  scoreRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scoreVal:  { fontSize: 20, fontWeight: '800' },
  scoreNiveau: { fontSize: 13, fontWeight: '600' },
  facteur:   { fontSize: 12, lineHeight: 18 },
  predCard:   { borderRadius: 20, padding: 18, gap: 12, elevation: 2, shadowColor: '#2B3A4A', shadowOffset: { width:0, height:2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  predHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  predTitre:  { fontSize: 14, fontWeight: '700' },
  predRow:    { flexDirection: 'row', gap: 16, alignItems: 'center' },
  predPct:    { fontSize: 36, fontWeight: '800' },
  predLabel:  { fontSize: 13, fontWeight: '600' },
  predMatieres: { flex: 1, gap: 6 },
  predMatiereRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  predMatiereName: { width: 50, fontSize: 10 },
  predBarBg:  { flex: 1, height: 5, borderRadius: 3, overflow: 'hidden' },
  predBarFill: { height: '100%', borderRadius: 3 },
  predMatiereNote: { width: 22, fontSize: 11, fontWeight: '600', textAlign: 'right' },
  oracleAlert:    { flexDirection: 'row', alignItems: 'flex-start', gap: 6, padding: 10, borderRadius: 12 },
  oracleAlertTxt: { flex: 1, fontSize: 11, color: '#92400E', lineHeight: 16 },
  timelineCard:   { borderRadius: 20, padding: 16, gap: 4, elevation: 2, shadowColor: '#2B3A4A', shadowOffset: { width:0, height:2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  timelineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  timelineTitre:  { fontSize: 14, fontWeight: '700' },
  voirTout:       { fontSize: 12, fontWeight: '600' },
  evRow:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
  evIconBox:   { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  evTitre:     { fontSize: 13, fontWeight: '600' },
  evDesc:      { fontSize: 11, marginTop: 2 },
  evMeta:      { alignItems: 'flex-end', gap: 2 },
  evScore:     { fontSize: 13, fontWeight: '700' },
  evDate:      { fontSize: 10 },
  emptyTimeline: { fontSize: 13, textAlign: 'center', padding: 16 },
  actionsRow:  { flexDirection: 'row', gap: 10 },
  actionCard:  { flex: 1, borderRadius: 18, padding: 16, alignItems: 'center', gap: 8, elevation: 2, shadowColor: '#2B3A4A', shadowOffset: { width:0, height:2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  actionLabel: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
});
