import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Animated, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { AGENTS } from '../../services/iaServiceOpenRouter';
import {
  genererTestValidation, sauvegarderScoreTest,
  QuestionTest,
} from '../../services/tuteurService';

type Phase = 'choix' | 'loading' | 'test' | 'resultat';

export default function TestValidationScreen({ navigation }: any) {
  const { colors } = useTheme();

  const [phase, setPhase]               = useState<Phase>('choix');
  const [agentChoisi, setAgent]         = useState(AGENTS[0]);
  const [questions, setQuestions]       = useState<QuestionTest[]>([]);
  const [qIdx, setQIdx]                 = useState(0);
  const [reponses, setReponses]         = useState<number[]>([]); // index réponse choisie
  const [reponseChoisie, setChoisie]    = useState<number | null>(null);
  const [montreFeedback, setFeedback]   = useState(false);
  const [score, setScore]               = useState(0);
  const [certifie, setCertifie]         = useState(false);
  const [saving, setSaving]             = useState(false);

  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (questions.length > 0) {
      Animated.timing(progressAnim, {
        toValue: (qIdx + 1) / questions.length,
        duration: 400,
        useNativeDriver: false,
      }).start();
    }
  }, [qIdx]);

  const handleLancerTest = async () => {
    setPhase('loading');
    try {
      const qs = await genererTestValidation(agentChoisi.matiere);
      setQuestions(qs);
      setPhase('test');
    } catch {
      Alert.alert('Erreur', 'Impossible de générer le test. Réessaie.');
      setPhase('choix');
    }
  };

  const handleChoisirReponse = (idx: number) => {
    if (montreFeedback) return;
    setChoisie(idx);
    setFeedback(true);

    const estBonne = idx === questions[qIdx].bonne;
    if (estBonne) setScore(s => s + 1);
    setReponses(r => [...r, idx]);

    setTimeout(async () => {
      setFeedback(false);
      setChoisie(null);

      if (qIdx + 1 >= questions.length) {
        // Fin du test
        setSaving(true);
        const scorePct = Math.round(((score + (estBonne ? 1 : 0)) / questions.length) * 100);
        const ok = await sauvegarderScoreTest(scorePct, agentChoisi.matiere);
        setCertifie(ok);
        setScore(scorePct);
        setPhase('resultat');
        setSaving(false);
      } else {
        setQIdx(i => i + 1);
      }
    }, 1800);
  };

  const optionColor = (i: number) => {
    if (!montreFeedback || reponseChoisie === null) return colors.card;
    if (i === questions[qIdx].bonne) return '#4CAF5025';
    if (i === reponseChoisie && i !== questions[qIdx].bonne) return '#f4433625';
    return colors.card;
  };

  const optionBorder = (i: number) => {
    if (!montreFeedback || reponseChoisie === null) return colors.border;
    if (i === questions[qIdx].bonne) return '#4CAF50';
    if (i === reponseChoisie && i !== questions[qIdx].bonne) return '#f44336';
    return colors.border;
  };

  // ── CHOIX MATIÈRE ──
  if (phase === 'choix') return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={['#ECEEF3','#ECEEF3']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitre, { color: colors.text }]}>🧠 Test de Certification</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <Text style={styles.infoEmoji}>🎯</Text>
          <Text style={[styles.infoTitre, { color: colors.text }]}>Comment ça marche ?</Text>
          <Text style={[styles.infoTxt, { color: colors.textSecondary }]}>
            L'IA génère 20 questions QCM sur la matière choisie.{'\n'}
            Tu dois obtenir au moins <Text style={{ color: colors.primary, fontWeight: 'bold' }}>85%</Text> pour être certifié.{'\n'}
            Tu peux repasser le test autant de fois que tu veux.
          </Text>
        </View>

        <Text style={[styles.sectionTitre, { color: colors.text }]}>Choisis ta matière principale</Text>
        {AGENTS.map(a => {
          const sel = a.id === agentChoisi.id;
          return (
            <TouchableOpacity
              key={a.id}
              style={[styles.agentRow, {
                backgroundColor: sel ? a.couleur + '20' : colors.card,
                borderColor: sel ? a.couleur : colors.border,
                borderWidth: sel ? 2 : 1,
              }]}
              onPress={() => setAgent(a)}
            >
              <Text style={{ fontSize: 32 }}>{a.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.agentNom, { color: sel ? a.couleur : colors.text }]}>{a.matiere}</Text>
                <Text style={[styles.agentSig, { color: colors.textMuted }]}>"{a.signature}"</Text>
              </View>
              {sel && <MaterialCommunityIcons name="check-circle" size={24} color={a.couleur} />}
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          style={[styles.lancerBtn, { backgroundColor: agentChoisi.couleur }]}
          onPress={handleLancerTest}
        >
          <MaterialCommunityIcons name="play-circle" size={24} color="white" />
          <Text style={styles.lancerBtnTxt}>Lancer le test · {agentChoisi.matiere}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  // ── CHARGEMENT ──
  if (phase === 'loading') return (
    <View style={[styles.center, { backgroundColor: colors.background }]}>
      <Text style={{ fontSize: 48, marginBottom: 20 }}>{agentChoisi.emoji}</Text>
      <ActivityIndicator size="large" color={agentChoisi.couleur} />
      <Text style={[styles.loadingTxt, { color: colors.textSecondary }]}>
        L'IA prépare ton test de {agentChoisi.matiere}...
      </Text>
    </View>
  );

  // ── RÉSULTAT ──
  if (phase === 'resultat') return (
    <View style={[styles.center, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={certifie ? ['#7BA89A','#FF8C00'] : ['#607D8B','#455A64']}
        style={styles.resultCercle}
      >
        <Text style={styles.resultEmoji}>{certifie ? '🏅' : '📚'}</Text>
        <Text style={styles.resultScore}>{score}%</Text>
      </LinearGradient>

      <Text style={[styles.resultTitre, { color: certifie ? colors.primary : colors.text }]}>
        {certifie ? 'Félicitations ! Tu es certifié !' : 'Pas encore...'}
      </Text>
      <Text style={[styles.resultSous, { color: colors.textSecondary }]}>
        {certifie
          ? `Ton badge "Certifié RÉPÉTIA" en ${agentChoisi.matiere} est actif. Les élèves peuvent maintenant te trouver !`
          : `Tu as obtenu ${score}%. Il faut 85% pour être certifié. Révise et réessaie !`
        }
      </Text>

      {certifie ? (
        <TouchableOpacity
          style={[styles.lancerBtn, { backgroundColor: colors.primary, marginTop: 24 }]}
          onPress={() => navigation.navigate('TuteurDashboard')}
        >
          <Text style={styles.lancerBtnTxt}>Voir mon tableau de bord répétiteur</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.lancerBtn, { backgroundColor: agentChoisi.couleur, marginTop: 24 }]}
          onPress={() => { setPhase('choix'); setQIdx(0); setScore(0); setReponses([]); }}
        >
          <MaterialCommunityIcons name="refresh" size={20} color={colors.primary} />
          <Text style={styles.lancerBtnTxt}>Repasser le test</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // ── TEST ──
  const q = questions[qIdx];
  if (!q) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={[agentChoisi.couleur, '#ECEEF3']} style={styles.testHeader}>
        <Text style={styles.testQ}>Q{qIdx + 1}/{questions.length}</Text>
        <View style={[styles.progressBg, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
          <Animated.View
            style={[styles.progressFill, {
              width: progressAnim.interpolate({ inputRange:[0,1], outputRange:['0%','100%'] }),
            }]}
          />
        </View>
        <Text style={[styles.testScore, { color: 'rgba(255,255,255,0.8)' }]}>
          ✓ {reponses.filter((r,i) => r === questions[i]?.bonne).length} bonnes
        </Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.testContent}>
        <View style={[styles.qCard, { backgroundColor: colors.card }]}>
          <Text style={{ fontSize: 28, textAlign: 'center', marginBottom: 8 }}>{agentChoisi.emoji}</Text>
          <Text style={[styles.qTexte, { color: colors.text }]}>{q.texte}</Text>
        </View>

        {q.options.map((opt, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.optionBtn, {
              backgroundColor: optionColor(i),
              borderColor:     optionBorder(i),
            }]}
            onPress={() => handleChoisirReponse(i)}
            disabled={montreFeedback}
          >
            <View style={[styles.optionLettre, { backgroundColor: agentChoisi.couleur + '30' }]}>
              <Text style={[styles.optionLettreTxt, { color: agentChoisi.couleur }]}>
                {['A','B','C','D'][i]}
              </Text>
            </View>
            <Text style={[styles.optionTxt, { color: colors.text }]}>{opt}</Text>
            {montreFeedback && i === q.bonne && (
              <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" />
            )}
            {montreFeedback && i === reponseChoisie && i !== q.bonne && (
              <MaterialCommunityIcons name="close-circle" size={20} color="#f44336" />
            )}
          </TouchableOpacity>
        ))}

        {montreFeedback && (
          <View style={[styles.explicationCard, { backgroundColor: colors.surface, borderLeftColor: reponseChoisie === q.bonne ? '#4CAF50' : '#FF9800' }]}>
            <MaterialCommunityIcons name="lightbulb" size={18} color="#FF9800" />
            <Text style={[styles.explicationTxt, { color: colors.textSecondary }]}>{q.explication}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 16 },
  header: { paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,215,0,0.1)', justifyContent: 'center', alignItems: 'center' },
  headerTitre: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  infoCard: { borderRadius: 20, padding: 20, alignItems: 'center', gap: 10 },
  infoEmoji: { fontSize: 40 },
  infoTitre: { fontSize: 18, fontWeight: 'bold' },
  infoTxt: { fontSize: 14, lineHeight: 22, textAlign: 'center' },
  sectionTitre: { fontSize: 15, fontWeight: '700', marginTop: 8 },
  agentRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 18, gap: 14, borderWidth: 1 },
  agentNom: { fontSize: 16, fontWeight: '700' },
  agentSig: { fontSize: 12, fontStyle: 'italic', marginTop: 2 },
  lancerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16, borderRadius: 16, marginTop: 8 },
  lancerBtnTxt: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  loadingTxt: { fontSize: 15, marginTop: 16, textAlign: 'center' },
  testHeader: { paddingTop: 50, paddingBottom: 16, paddingHorizontal: 20, gap: 8 },
  testQ: { color: 'white', fontSize: 13, fontWeight: '600' },
  progressBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: 'white', borderRadius: 3 },
  testScore: { fontSize: 12 },
  testContent: { padding: 16, gap: 12, paddingBottom: 40 },
  qCard: { borderRadius: 20, padding: 20 },
  qTexte: { fontSize: 17, lineHeight: 26, fontWeight: '500', textAlign: 'center' },
  optionBtn: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 14, borderWidth: 1.5, gap: 12 },
  optionLettre: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  optionLettreTxt: { fontSize: 16, fontWeight: 'bold' },
  optionTxt: { flex: 1, fontSize: 15, lineHeight: 22 },
  explicationCard: { borderRadius: 14, padding: 14, borderLeftWidth: 4, flexDirection: 'row', gap: 10 },
  explicationTxt: { flex: 1, fontSize: 13, lineHeight: 20 },
  resultCercle: { width: 160, height: 160, borderRadius: 80, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  resultEmoji: { fontSize: 48 },
  resultScore: { fontSize: 32, fontWeight: 'bold', color: 'white' },
  resultTitre: { fontSize: 26, fontWeight: 'bold', textAlign: 'center' },
  resultSous: { fontSize: 15, textAlign: 'center', lineHeight: 24 },
});
