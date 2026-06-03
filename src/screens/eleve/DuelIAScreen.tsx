import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, KeyboardAvoidingView, Platform, Alert,
  ActivityIndicator, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { genererQuestionsCours, evaluerReponseRevision } from '../../services/iaServiceOpenRouter';
import {
  sauvegarderScoreArena, ajouterAuHistorique,
  scoreKeba, getWeekKey, ScoreArena,
} from '../../services/arenaService';
import { auth } from '../../services/firebaseConfig';
import ModernLoader from '../../components/ModernLoader';

const DUREE_SECONDES = 300; // 5 minutes

export default function DuelIAScreen({ route, navigation }: any) {
  const { colors }   = useTheme();
  const { userData } = useAuth();
  const { agentId, matiereNom, agentCouleur, agentEmoji } = route.params || {};

  // ✅ Ref pour l'index courant (évite les problèmes de closure stale)
  const questionIdxRef = useRef(0);
  const questionsRef   = useRef<string[]>([]);
  const scoreRef       = useRef(0);
  const reponsesRef    = useRef<any[]>([]);
  const startTimeRef   = useRef(Date.now());
  const timerRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const isEndingRef    = useRef(false); // Empêche double appel à terminerDuel

  const [phase, setPhase]             = useState<'loading'|'duel'|'fin'>('loading');
  const [questions, setQuestions]     = useState<string[]>([]);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [reponse, setReponse]         = useState('');
  const [verification, setVerification] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [feedbackOk, setFeedbackOk]   = useState(true);
  const [scoreAffiche, setScoreAffiche] = useState(0);
  const [secondes, setSecondes]       = useState(DUREE_SECONDES);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const timerAnim    = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    genererQuestions();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // ✅ Animation progression basée sur l'index REF (pas state)
  useEffect(() => {
    if (questionsRef.current.length > 0) {
      Animated.timing(progressAnim, {
        toValue: (questionIdx + 1) / questionsRef.current.length,
        duration: 400,
        useNativeDriver: false,
      }).start();
    }
  }, [questionIdx]);

  const genererQuestions = async () => {
    try {
      const contenu = `Programme de ${matiereNom} niveau Terminale Gabon. 
        Génère 10 questions courtes et précises pour un quiz rapide.`;
      const qs = await genererQuestionsCours(contenu, matiereNom);
      // ✅ Toujours exactement 10 questions
      const textes = qs.slice(0, 10).map((q: any) => q.texte || q);

      // Compléter à 10 si moins généré
      while (textes.length < 10) {
        textes.push(`Question ${textes.length + 1} : Donne un exemple de notion importante en ${matiereNom}.`);
      }

      questionsRef.current = textes;
      setQuestions(textes);
      setPhase('duel');
      startTimeRef.current = Date.now();
      demarrerTimer();
    } catch {
      Alert.alert('Erreur', 'Impossible de générer les questions. Réessaie.');
      navigation.goBack();
    }
  };

  const demarrerTimer = () => {
    timerRef.current = setInterval(() => {
      setSecondes(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          // Temps écoulé → fin automatique
          if (!isEndingRef.current) terminerDuel();
          return 0;
        }
        if (prev === 30) {
          // Alerte dernières 30 secondes
          Animated.loop(
            Animated.sequence([
              Animated.timing(timerAnim, { toValue: 1.2, duration: 300, useNativeDriver: true }),
              Animated.timing(timerAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
            ]),
            { iterations: 60 }
          ).start();
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleValider = async () => {
    if (!reponse.trim() || verification || feedbackMsg !== '') return;

    setVerification(true);
    const reponseActuelle = reponse.trim();

    try {
      // ✅ Utiliser la REF pour l'index actuel (pas la state)
      const idxActuel   = questionIdxRef.current;
      const questionActuelle = questionsRef.current[idxActuel];

      if (!questionActuelle) {
        setVerification(false);
        return;
      }

      const resultat = await evaluerReponseRevision(
        questionActuelle, reponseActuelle, 1, matiereNom
      );
      const note = resultat.note;

      // Ajouter au score via ref
      scoreRef.current += note;
      setScoreAffiche(scoreRef.current);

      // Ajouter à l'historique des réponses
      reponsesRef.current.push({
        question: questionActuelle,
        reponse:  reponseActuelle,
        note,
        feedback: resultat.feedback,
      });

      // Afficher feedback
      const estBonne = note >= 1.5;
      setFeedbackOk(estBonne);
      setFeedbackMsg(
        estBonne
          ? `✅ ${resultat.feedback}`
          : `❌ ${resultat.feedback}`
      );
      setReponse('');

      // ✅ Calculer prochain index AVANT setState
      const prochainIdx = idxActuel + 1;
      const nbQuestions = questionsRef.current.length;

      setTimeout(() => {
        setFeedbackMsg('');
        setVerification(false);

        if (prochainIdx >= nbQuestions) {
          // ✅ C'était la dernière question
          if (timerRef.current) clearInterval(timerRef.current);
          if (!isEndingRef.current) terminerDuel();
        } else {
          // ✅ Passer à la question suivante via REF + state
          questionIdxRef.current = prochainIdx;
          setQuestionIdx(prochainIdx);
        }
      }, 1200);

    } catch {
      setFeedbackMsg('⚠️ Erreur réseau, question suivante...');
      setTimeout(() => {
        setFeedbackMsg('');
        setVerification(false);
        const prochainIdx = questionIdxRef.current + 1;
        if (prochainIdx >= questionsRef.current.length) {
          if (!isEndingRef.current) terminerDuel();
        } else {
          questionIdxRef.current = prochainIdx;
          setQuestionIdx(prochainIdx);
        }
      }, 1200);
    }
  };

  const handleIgnorer = () => {
    if (verification || feedbackMsg !== '') return;

    reponsesRef.current.push({
      question: questionsRef.current[questionIdxRef.current] || '',
      reponse:  '(ignorée)',
      note:     0,
      feedback: 'Ignorée',
    });

    const prochainIdx = questionIdxRef.current + 1;
    if (prochainIdx >= questionsRef.current.length) {
      if (timerRef.current) clearInterval(timerRef.current);
      if (!isEndingRef.current) terminerDuel();
    } else {
      questionIdxRef.current = prochainIdx;
      setQuestionIdx(prochainIdx);
    }
  };

  const terminerDuel = async () => {
    // ✅ Protection double appel
    if (isEndingRef.current) return;
    isEndingRef.current = true;

    if (timerRef.current) clearInterval(timerRef.current);
    setPhase('fin');

    const tempsMs     = Date.now() - startTimeRef.current;
    const nbQuestions = questionsRef.current.length;
    const scoreMax    = nbQuestions * 2;
    const noteSur20   = nbQuestions > 0
      ? Math.min(20, Math.round((scoreRef.current / scoreMax) * 20))
      : 0;
    const kebaScore   = scoreKeba(agentId || matiereNom);

    const score: ScoreArena = {
      uid:     auth.currentUser?.uid || '',
      prenom:  (userData as any)?.prenom || 'Élève',
      score:   noteSur20,
      points:  scoreRef.current,
      matiere: matiereNom,
      tempsMs,
      date:    new Date().toISOString(),
      weekKey: getWeekKey(),
    };

    await sauvegarderScoreArena(score);
    await ajouterAuHistorique(score);

    navigation.replace('ResultatDuel', {
      noteSur20,
      kebaScore,
      victoire:    noteSur20 >= kebaScore,
      tempsMs,
      matiere:     matiereNom,
      agentEmoji,
      agentCouleur,
      reponses:    reponsesRef.current,
      score,
    });
  };

  const formatTimer = (s: number) => {
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, '0')}`;
  };

  if (phase === 'loading') {
    return <ModernLoader visible type="brain" message={`KEBA prépare ton défi ${matiereNom}...`} />;
  }

  // ✅ Toujours lire depuis questionsRef pour éviter les désynchronisations
  const qActuelle    = questionsRef.current[questionIdxRef.current] || '';
  const nbTotal      = questionsRef.current.length;
  const timerColor   = secondes < 30 ? colors.error : secondes < 60 ? colors.warning : 'white';
  const scoreCourant = nbTotal > 0
    ? Math.min(20, Math.round((scoreAffiche / (nbTotal * 2)) * 20))
    : 0;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 60}
    >
      {/* Header */}
      <LinearGradient
        colors={[agentCouleur || colors.primary, '#ECEEF3']}
        style={styles.header}
      >
        {/* Timer */}
        <Animated.View style={[styles.timerBox, { transform: [{ scale: timerAnim }] }]}>
          <MaterialCommunityIcons name="timer" size={18} color={timerColor} />
          <Text style={[styles.timerTxt, { color: timerColor }]}>{formatTimer(secondes)}</Text>
        </Animated.View>

        {/* VS */}
        <View style={styles.vsRow}>
          <Text style={styles.vsNom}>{(userData as any)?.prenom || 'Toi'}</Text>
          <Text style={styles.vsIcone}>⚔️</Text>
          <Text style={styles.vsNom}>{agentEmoji} KEBA</Text>
        </View>

        {/* Progression */}
        <View style={styles.progressBox}>
          <Text style={styles.progressTxt}>
            Question {questionIdx + 1} / {nbTotal}
          </Text>
          <View style={[styles.progressBg, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Animated.View
              style={[
                styles.progressFill,
                { width: progressAnim.interpolate({ inputRange:[0,1], outputRange:['0%','100%'] }) },
              ]}
            />
          </View>
          <Text style={[styles.scoreTxt, { color: 'rgba(255,255,255,0.8)' }]}>
            Score : {scoreCourant}/20
          </Text>
        </View>
      </LinearGradient>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        {/* Question */}
        <View style={[styles.questionCard, {
          backgroundColor: colors.surface,
          borderLeftColor: agentCouleur || colors.primary,
        }]}>
          <Text style={[styles.questionLabel, { color: agentCouleur || colors.primary }]}>
            {agentEmoji} Question {questionIdx + 1}
          </Text>
          <Text style={[styles.questionTxt, { color: colors.text }]}>
            {qActuelle}
          </Text>
        </View>

        {/* Feedback */}
        {feedbackMsg !== '' && (
          <View style={[styles.feedbackCard, {
            backgroundColor: feedbackOk ? colors.success + '20' : colors.error + '20',
            borderLeftColor: feedbackOk ? colors.success : colors.error,
          }]}>
            <Text style={[styles.feedbackTxt, { color: colors.text }]}>{feedbackMsg}</Text>
          </View>
        )}

        {/* Réponse */}
        <View style={[styles.reponseCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.reponseLabel, { color: colors.textSecondary }]}>Ta réponse</Text>
          <TextInput
            style={[styles.input, {
              color: colors.text,
              backgroundColor: colors.background,
              borderColor: colors.border,
            }]}
            placeholder="Réponds rapidement..."
            placeholderTextColor={colors.textMuted}
            value={reponse}
            onChangeText={setReponse}
            multiline
            editable={!verification && feedbackMsg === ''}
          />
        </View>

        {/* Score courant */}
        <View style={[styles.scoreCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.scoreLabel, { color: colors.textSecondary }]}>
            Score : {scoreAffiche} pts → {scoreCourant}/20
          </Text>
          <View style={[styles.scoreBarBg, { backgroundColor: colors.border }]}>
            <View style={[styles.scoreBarFill, {
              width: `${(scoreAffiche / Math.max(nbTotal * 2, 1)) * 100}%`,
              backgroundColor: agentCouleur || colors.primary,
            }]} />
          </View>
        </View>
      </ScrollView>

      {/* Boutons bas */}
      <View style={[styles.footer, {
        backgroundColor: colors.surface,
        borderTopColor:  colors.border,
      }]}>
        <TouchableOpacity
          style={[styles.ignorerBtn, { borderColor: colors.border }]}
          onPress={handleIgnorer}
          disabled={verification || feedbackMsg !== ''}
        >
          <Text style={[styles.ignorerTxt, { color: colors.textMuted }]}>Ignorer</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.validerBtn, {
            backgroundColor: reponse.trim() && !verification && feedbackMsg === ''
              ? agentCouleur || colors.primary
              : colors.border,
            flex: 1,
          }]}
          onPress={handleValider}
          disabled={!reponse.trim() || verification || feedbackMsg !== ''}
        >
          {verification
            ? <ActivityIndicator size="small" color="white" />
            : <Text style={styles.validerTxt}>Valider →</Text>
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 50, paddingHorizontal: 20, paddingBottom: 16, gap: 10 },
  timerBox: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  timerTxt: { fontSize: 22, fontWeight: 'bold', letterSpacing: 2 },
  vsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 },
  vsNom: { color: 'white', fontSize: 15, fontWeight: 'bold' },
  vsIcone: { color: 'white', fontSize: 22 },
  progressBox: { gap: 4 },
  progressTxt: { color: 'rgba(255,255,255,0.85)', fontSize: 12, textAlign: 'center' },
  progressBg: { height: 5, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: 'white', borderRadius: 3 },
  scoreTxt: { fontSize: 11, textAlign: 'right' },
  content: { padding: 16, gap: 14, paddingBottom: 8 },
  questionCard: { borderRadius: 20, padding: 20, borderLeftWidth: 4, elevation: 2 },
  questionLabel: { fontSize: 13, fontWeight: '700', marginBottom: 10, letterSpacing: 0.5 },
  questionTxt: { fontSize: 17, lineHeight: 26, fontWeight: '500' },
  feedbackCard: { borderRadius: 14, padding: 14, borderLeftWidth: 4 },
  feedbackTxt: { fontSize: 14, lineHeight: 20 },
  reponseCard: { borderRadius: 20, padding: 16 },
  reponseLabel: { fontSize: 13, fontWeight: '600', marginBottom: 10 },
  input: { borderRadius: 12, borderWidth: 1, padding: 14, fontSize: 15, minHeight: 80, textAlignVertical: 'top' },
  scoreCard: { borderRadius: 16, padding: 12, gap: 8 },
  scoreLabel: { fontSize: 12, textAlign: 'center' },
  scoreBarBg: { height: 5, borderRadius: 3, overflow: 'hidden' },
  scoreBarFill: { height: '100%', borderRadius: 3 },
  footer: { flexDirection: 'row', padding: 14, paddingBottom: Platform.OS === 'ios' ? 32 : 14, borderTopWidth: 1, gap: 10 },
  ignorerBtn: { paddingHorizontal: 18, paddingVertical: 14, borderRadius: 14, borderWidth: 1, justifyContent: 'center' },
  ignorerTxt: { fontSize: 14, fontWeight: '600' },
  validerBtn: { padding: 14, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  validerTxt: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});
