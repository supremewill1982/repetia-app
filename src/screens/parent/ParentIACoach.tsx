import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import {
  getEnfantsLies, getSessionsEnfant, calculerScoreBienEtre,
  calculerPredictionBac, genererAnalyseIAParent,
} from '../../services/parentService';

export default function ParentIACoach({ navigation }: any) {
  const { colors }           = useTheme();
  const [analyse, setAnalyse] = useState('');
  const [loading, setLoading] = useState(false);
  const [enfantNom, setNom]   = useState('');
  const [bienEtreScore, setBE] = useState(0);
  const [predLabel, setPred]  = useState('');
  const [alertes, setAlertes] = useState<string[]>([]);
  const [generated, setGenerated] = useState(false);

  useFocusEffect(useCallback(() => {
    charger();
  }, []));

  const charger = async () => {
    const enfants = await getEnfantsLies();
    if (!enfants.length) return;
    setNom(enfants[0].prenom);
  };

  const generer = async () => {
    setLoading(true);
    setGenerated(false);
    try {
      const enfants = await getEnfantsLies();
      if (!enfants.length) return;
      const enfant  = enfants[0];
      const sess    = await getSessionsEnfant(enfant.uid);
      const be      = calculerScoreBienEtre(sess);
      const pred    = await calculerPredictionBac(sess, enfant.serie);
      const analyse = await genererAnalyseIAParent(enfant, sess, be, pred);

      setAnalyse(analyse);
      setBE(be.score);
      setPred(`${pred.pourcentage}% — ${pred.label}`);
      setAlertes(pred.alerteOracle.slice(0, 2));
      setGenerated(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={['#7BA89A', '#5A8A7A']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitre}>🤖 IA Coach Parent</Text>
          <Text style={[styles.headerSub, { color: 'rgba(255,255,255,0.8)' }]}>
            Analyse personnalisée de {enfantNom}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>

        {!generated && !loading && (
          <View style={[styles.introCard, { backgroundColor: colors.surface }]}>
            <Text style={styles.introEmoji}>🧠</Text>
            <Text style={[styles.introTitre, { color: colors.text }]}>
              Analyse IA personnalisée
            </Text>
            <Text style={[styles.introDesc, { color: colors.textSecondary }]}>
              L'IA analyse les vraies données de {enfantNom || 'votre enfant'} et génère un bilan pédagogique contextuel au programme du Bac Gabon.
            </Text>
            <TouchableOpacity
              style={[styles.genBtn, { backgroundColor: colors.primary }]}
              onPress={generer}
            >
              <MaterialCommunityIcons name="brain" size={22} color="white" />
              <Text style={styles.genBtnTxt}>Générer l'analyse</Text>
            </TouchableOpacity>
          </View>
        )}

        {loading && (
          <View style={styles.center}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>🔍</Text>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingTxt, { color: colors.textMuted }]}>
              L'IA analyse les données de {enfantNom}...
            </Text>
          </View>
        )}

        {generated && !loading && (
          <>
            {/* Mini stats */}
            <View style={styles.miniStats}>
              <View style={[styles.miniStat, { backgroundColor: colors.surface }]}>
                <Text style={[styles.miniStatVal, { color: colors.primary }]}>{bienEtreScore}/100</Text>
                <Text style={[styles.miniStatLbl, { color: colors.textMuted }]}>Bien-être</Text>
              </View>
              <View style={[styles.miniStat, { backgroundColor: colors.surface }]}>
                <Text style={[styles.miniStatVal, { color: colors.primary }]}>{predLabel.split(' — ')[0]}</Text>
                <Text style={[styles.miniStatLbl, { color: colors.textMuted }]}>Prédiction Bac</Text>
              </View>
            </View>

            {/* Alertes Oracle */}
            {alertes.length > 0 && (
              <View style={[styles.alertesCard, { backgroundColor: '#FEF3C7' }]}>
                <Text style={styles.alertesTitre}>⚠️ Alertes Oracle Bac</Text>
                {alertes.map((a, i) => (
                  <Text key={i} style={styles.alerteTxt}>{a}</Text>
                ))}
              </View>
            )}

            {/* Analyse IA */}
            <View style={[styles.analyseCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.analyseTxt, { color: colors.text }]}>{analyse}</Text>
            </View>

            {/* Regénérer */}
            <TouchableOpacity
              style={[styles.regenBtn, { borderColor: colors.primary }]}
              onPress={generer}
            >
              <MaterialCommunityIcons name="refresh" size={18} color={colors.primary} />
              <Text style={[styles.regenBtnTxt, { color: colors.primary }]}>Actualiser l'analyse</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 52, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 14 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerTitre: { fontSize: 18, fontWeight: '700', color: 'white' },
  headerSub: { fontSize: 12, marginTop: 2 },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  center: { paddingVertical: 60, alignItems: 'center', gap: 12 },
  loadingTxt: { fontSize: 14, textAlign: 'center' },
  introCard: { borderRadius: 24, padding: 24, alignItems: 'center', gap: 12, elevation: 2 },
  introEmoji: { fontSize: 56 },
  introTitre: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  introDesc: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  genBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16, marginTop: 8 },
  genBtnTxt: { color: 'white', fontSize: 16, fontWeight: '700' },
  miniStats: { flexDirection: 'row', gap: 12 },
  miniStat:  { flex: 1, borderRadius: 16, padding: 16, alignItems: 'center', gap: 4, elevation: 2 },
  miniStatVal: { fontSize: 22, fontWeight: '800' },
  miniStatLbl: { fontSize: 11 },
  alertesCard:  { borderRadius: 16, padding: 14, gap: 8 },
  alertesTitre: { fontSize: 13, fontWeight: '700', color: '#92400E' },
  alerteTxt:    { fontSize: 12, color: '#78350F', lineHeight: 18 },
  analyseCard: { borderRadius: 20, padding: 20, elevation: 2 },
  analyseTxt:  { fontSize: 14, lineHeight: 24 },
  regenBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 16, borderWidth: 1 },
  regenBtnTxt: { fontSize: 14, fontWeight: '600' },
});
