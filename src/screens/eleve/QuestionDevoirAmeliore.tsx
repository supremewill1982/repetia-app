import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { analyserDevoirProfond, evaluerReponseDevoirPrecise, QuestionDevoir } from '../../services/iaDevoirAmelioreService';
import { startTimeTracking, stopTimeTracking, stopAndRestartNavigation } from '../../services/timeTrackingService';
import { feedback } from '../../services/feedbackService';
import { verifierEtDebloquerBadges } from '../../services/badgesService';
import ModernLoader from '../../components/ModernLoader';
import BadgeNotification from '../../components/BadgeNotification';

export default function QuestionDevoirAmeliore({ route, navigation }: any) {
  const { colors }  = useTheme();
  const { imageBase64, matiere, imageUri, analyseManuelle } = route.params || {};

  const [analyse, setAnalyse]                   = useState<any>(null);
  const [questions, setQuestions]               = useState<QuestionDevoir[]>([]);
  const [questionActuelle, setQuestionActuelle] = useState(0);
  const [reponse, setReponse]                   = useState('');
  const [reponses, setReponses]                 = useState<any[]>([]);
  const [scoreTotal, setScoreTotal]             = useState(0);
  const [essais, setEssais]                     = useState(0);
  const [feedbackMsg, setFeedbackMsg]           = useState('');
  const [correction, setCorrection]             = useState('');
  const [showCorrection, setShowCorrection]     = useState(false);
  const [loading, setLoading]                   = useState(true);
  const [analysing, setAnalysing]               = useState(true);
  // ✅ Temps: démarre au PREMIER submit
  const [timeStarted, setTimeStarted]           = useState(false);
  const [noteActuelle, setNoteActuelle]         = useState<number | null>(null);
  const [apiError, setApiError]                 = useState(false);
  const [nouveauBadge, setNouveauBadge]         = useState<any>(null);

  const bounceAnim  = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (analyseManuelle) {
      setAnalyse(analyseManuelle);
      setQuestions(analyseManuelle.questions);
      setAnalysing(false);
      setLoading(false);
    } else {
      analyserDevoir();
    }

    return () => {
      // ✅ Arrêt propre + redémarrage navigation
      stopAndRestartNavigation();
    };
  }, []);

  useEffect(() => {
    if (questions.length > 0) {
      Animated.timing(progressAnim, {
        toValue: (questionActuelle + 1) / questions.length,
        duration: 500,
        useNativeDriver: false,
      }).start();
    }
  }, [questionActuelle, questions.length]);

  const analyserDevoir = async () => {
    try {
      setAnalysing(true);
      setLoading(true);
      setApiError(false);
      const imageData = imageBase64 || imageUri;
      if (!imageData) throw new Error('Aucune image');

      let base64Data = imageData;
      if (imageUri && !imageBase64) {
        const res  = await fetch(imageUri);
        const blob = await res.blob();
        base64Data = await new Promise(resolve => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(blob);
        });
      }

      const analyseResult = await analyserDevoirProfond(base64Data, matiere);
      setAnalyse(analyseResult);
      if (analyseResult.questions?.length > 0) {
        setQuestions(analyseResult.questions);
      } else {
        setApiError(true);
      }
    } catch {
      setApiError(true);
    } finally {
      setAnalysing(false);
      setLoading(false);
    }
  };

  // ✅ Démarre le compteur devoir AU PREMIER SUBMIT
  const demarrerTempsDevoir = async () => {
    if (!timeStarted) {
      await startTimeTracking('devoir', matiere || 'Devoir');
      setTimeStarted(true);
    }
  };


  const handleIgnorerQuestion = async () => {
    if (loading) return;
    const question = questions[questionActuelle];
    const nouvelleReponse = { question: question?.texte || '', reponse: '(ignorée)', note: 0, feedback: 'Ignorée', correction: '' };
    const newReponses = [...reponses, nouvelleReponse];
    setReponses(newReponses);

    if (questionActuelle + 1 < questions.length) {
      setQuestionActuelle(questionActuelle + 1);
      setReponse('');
      setEssais(0);
      setFeedbackMsg('');
    } else {
      await stopTimeTracking();
      await startTimeTracking('navigation', 'Général');
      const noteMax = questions.length * 2;
      const noteSur20 = Math.min(20, Math.round((scoreTotal / noteMax) * 20));
      navigation.replace('ResultatRevision', {
        score: scoreTotal, scoreMax: noteMax, noteSur20,
        reponses: newReponses, matiere, type: 'devoir',
      });
    }
  };

  const handleVerifierReponse = async () => {
    if (!reponse.trim() || loading) return;

    // ✅ Démarrage temps au premier submit
    await demarrerTempsDevoir();

    animateButton();
    setLoading(true);

    try {
      const question = questions[questionActuelle];
      const resultat = await evaluerReponseDevoirPrecise(question, reponse, essais + 1);
      const note = resultat.note;

      setNoteActuelle(note);
      await feedback(note === 2 ? 'success' : note === 1 ? 'info' : 'error');

      // ✅ FIX: Réessai SANS ajouter au score
      if (note < 1.5 && essais + 1 < 3) {
        setEssais(essais + 1);
        setFeedbackMsg(resultat.feedback);
        setReponse('');
        setLoading(false);
        return;
      }

      // ✅ Ajouter au score seulement sur la réponse finale
      const nouvelleReponse = {
        question: question.texte,
        reponse,
        note,
        feedback:   resultat.feedback,
        correction: resultat.correction,
        essais: essais + 1,
      };
      const newReponses = [...reponses, nouvelleReponse];
      setReponses(newReponses);
      const newScore = scoreTotal + note;
      setScoreTotal(newScore);

      setCorrection(resultat.correction);
      setShowCorrection(true);

      setTimeout(async () => {
        setShowCorrection(false);
        if (questionActuelle + 1 < questions.length) {
          setQuestionActuelle(questionActuelle + 1);
          setReponse('');
          setEssais(0);
          setFeedbackMsg('');
          setLoading(false);
        } else {
          // Fin de session
          await stopTimeTracking();
          const nouveaux = await verifierEtDebloquerBadges();
          if (nouveaux.length > 0) setNouveauBadge(nouveaux[0]);
          await startTimeTracking('navigation', 'Général'); // ✅ Redémarrer navigation

          const noteMax    = questions.length * 2; // ✅ Basé sur questions réelles // ✅ Basé sur questions réelles
          const noteSur20  = Math.min(20, Math.round((newScore / noteMax) * 20)); // ✅ Clamp à 20
          navigation.replace('ResultatRevision', {
            score: newScore, scoreMax: noteMax, noteSur20,
            reponses: newReponses, matiere, type: 'devoir',
          });
        }
      }, 2000);
    } catch {
      Alert.alert('Erreur', "Impossible d'évaluer la réponse.");
      setLoading(false);
    }
  };

  const animateButton = () => {
    Animated.sequence([
      Animated.spring(bounceAnim, { toValue: 0.95, useNativeDriver: true, speed: 50 }),
      Animated.spring(bounceAnim, { toValue: 1, useNativeDriver: true, speed: 50 }),
    ]).start();
  };

  if (analysing) return <ModernLoader visible type="brain" message="Analyse de ton devoir..." subMessage="L'IA lit et extrait les questions" />;

  if (apiError && questions.length === 0) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <MaterialCommunityIcons name="robot-off" size={60} color={colors.error} />
        <Text style={[styles.errorTitle, { color: colors.text }]}>⚠️ Analyse impossible</Text>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>
          L'IA n'arrive pas à lire ton devoir. Prends une photo plus nette.
        </Text>
        <TouchableOpacity style={[styles.errorButton, { backgroundColor: colors.primary }]} onPress={analyserDevoir}>
          <Text style={styles.errorButtonText}>🔄 Réessayer</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.errorButton, { backgroundColor: colors.secondary }]}
          onPress={() => navigation.navigate('SaisieManuelleDevoir', { matiere })}
        >
          <Text style={styles.errorButtonText}>✏️ Saisir manuellement</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.errorButton, { backgroundColor: colors.error }]} onPress={() => navigation.goBack()}>
          <Text style={styles.errorButtonText}>← Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const questionCourante = questions[questionActuelle];
  const progression   = ((questionActuelle + 1) / questions.length) * 100;
  const scoreActuel   = Math.round((scoreTotal / (questions.length * 2)) * 20);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <BadgeNotification badge={nouveauBadge} onHide={() => setNouveauBadge(null)} />

      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={async () => {
              await stopAndRestartNavigation();
              navigation.goBack();
            }}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>📝 {analyse?.titre || 'Devoir'}</Text>
          <View style={styles.scoreHeader}>
            <Text style={styles.scoreHeaderText}>{scoreActuel}/20</Text>
          </View>
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              Question {questionActuelle + 1}/{questions.length}
            </Text>
            <View style={[styles.progressBar, { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
              <View style={[styles.progressFill, { width: `${progression}%` }]} />
            </View>
          </View>
        </LinearGradient>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {analyse?.consignes && questionActuelle === 0 && (
            <View style={[styles.consignesCard, { backgroundColor: colors.info + '10', borderLeftColor: colors.info }]}>
              <MaterialCommunityIcons name="information" size={20} color={colors.info} />
              <Text style={[styles.consignesText, { color: colors.textSecondary }]}>{analyse.consignes}</Text>
            </View>
          )}

          <View style={[styles.questionCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.questionLabel, { color: colors.primary }]}>
              📖 Question {questionActuelle + 1}
            </Text>
            <Text style={[styles.questionTexte, { color: colors.text }]}>{questionCourante?.texte}</Text>
          </View>

          <View style={[styles.reponseCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.reponseLabel, { color: colors.textSecondary }]}>✏️ Ta réponse</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              placeholder="Écris ta réponse..."
              placeholderTextColor={colors.textMuted}
              selectedValue={reponse}
              onChangeText={setReponse}
              multiline
              numberOfLines={6}
              editable={!loading}
            />
          </View>

          {feedbackMsg !== '' && (
            <View style={[styles.feedbackCard, { backgroundColor: colors.info + '20' }]}>
              <MaterialCommunityIcons name="lightbulb" size={20} color={colors.info} />
              <Text style={[styles.feedbackText, { color: colors.textSecondary }]}>{feedbackMsg}</Text>
            </View>
          )}

          {noteActuelle !== null && (
            <Animated.View
              style={[
                styles.notePopup,
                {
                  transform: [{ scale: bounceAnim }],
                  backgroundColor: noteActuelle === 2 ? '#4CAF50' : noteActuelle === 1 ? '#FF9800' : '#f44336',
                },
              ]}
            >
              <MaterialCommunityIcons
                name={noteActuelle === 2 ? 'check-circle' : noteActuelle === 1 ? 'progress-check' : 'close-circle'}
                size={24}
                color="white"
              />
              <Text style={styles.notePopupText}>
                {noteActuelle === 2 ? '✓ Bonne réponse ! +2 pts' : noteActuelle === 1 ? '⚠️ Réponse partielle +1 pt' : '✗ Réponse incorrecte +0 pt'}
              </Text>
            </Animated.View>
          )}

          {showCorrection && correction !== '' && (
            <View style={[styles.correctionCard, { backgroundColor: colors.success + '10', borderLeftColor: colors.success }]}>
              <MaterialCommunityIcons name="check-circle" size={20} color={colors.success} />
              <View style={styles.correctionContent}>
                <Text style={[styles.correctionTitle, { color: colors.success }]}>📝 Correction :</Text>
                <Text style={[styles.correctionText, { color: colors.text }]}>{correction}</Text>
              </View>
            </View>
          )}

          <View style={[styles.buttonsContainer, { flexDirection: 'row', gap: 12 }]}>
            <TouchableOpacity
              style={[styles.validateButton, { backgroundColor: colors.primary, flex: 1 }]}
              onPress={handleVerifierReponse}
              disabled={loading || !reponse.trim()}
            >
              {loading
                ? <ActivityIndicator size="small" color="white" />
                : <Text style={styles.validateButtonText}>Valider ✓</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.ignoreButton, { backgroundColor: '#f4433615', borderColor: '#f4433640' }]}
              onPress={handleIgnorerQuestion}
              disabled={loading}
            >
              <Text style={{ color: '#f44336', fontWeight: '600', fontSize: 14 }}>Ignorer</Text>
            </TouchableOpacity>
          </View>

          {essais > 0 && essais < 3 && (
            <View style={styles.essaisContainer}>
              <MaterialCommunityIcons name="repeat" size={14} color={colors.warning} />
              <Text style={[styles.essaisText, { color: colors.warning }]}>Essai {essais + 1}/3</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: 'white', marginBottom: 5 },
  scoreHeader: { position: 'absolute', right: 20, top: 55, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  scoreHeaderText: { color: 'white', fontSize: 14, fontWeight: 'bold' },
  progressContainer: { marginTop: 10 },
  progressText: { color: 'white', fontSize: 12, marginBottom: 5 },
  progressBar: { height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2, backgroundColor: 'white' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  consignesCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 16, gap: 10, borderLeftWidth: 3 },
  consignesText: { flex: 1, fontSize: 13, lineHeight: 18 },
  questionCard: { borderRadius: 20, padding: 20, marginBottom: 16, elevation: 3 },
  questionLabel: { fontSize: 14, fontWeight: '600', marginBottom: 10 },
  questionTexte: { fontSize: 18, lineHeight: 26, fontWeight: '500' },
  reponseCard: { borderRadius: 20, padding: 20, marginBottom: 16 },
  reponseLabel: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
  textInput: { borderRadius: 12, borderWidth: 1, padding: 14, fontSize: 16, minHeight: 120, textAlignVertical: 'top' },
  feedbackCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 16, gap: 10 },
  feedbackText: { flex: 1, fontSize: 13 },
  notePopup: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 30, marginBottom: 16, gap: 8 },
  notePopupText: { color: 'white', fontSize: 14, fontWeight: '600' },
  correctionCard: { flexDirection: 'row', padding: 14, borderRadius: 12, marginBottom: 16, gap: 10, borderLeftWidth: 3 },
  correctionContent: { flex: 1 },
  correctionTitle: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  correctionText: { fontSize: 14, lineHeight: 20 },
  ignoreButton: { paddingHorizontal: 18, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  buttonsContainer: { marginBottom: 16 },
  validateButton: { padding: 14, borderRadius: 12, alignItems: 'center' },
  validateButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  essaisContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8 },
  essaisText: { fontSize: 12, fontWeight: '500' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorTitle: { fontSize: 22, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
  errorText: { fontSize: 16, textAlign: 'center', marginBottom: 20 },
  errorButton: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, marginVertical: 8, width: '80%', alignItems: 'center' },
  errorButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
});
