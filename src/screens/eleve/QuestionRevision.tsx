import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Alert,
  ActivityIndicator, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import {
  extraireTexteCours, genererQuestionsCours,
  evaluerReponseRevision, setNiveauEleve,
} from '../../services/iaServiceOpenRouter';
import { getMatiereInfoWithFallback } from '../../services/matieresService';
import { getInfosEnfant } from '../../services/firebaseEnfantService';
import { feedback } from '../../services/feedbackService';
import { startTimeTracking, stopTimeTracking, stopAndRestartNavigation } from '../../services/timeTrackingService';
import { ajouterQuestionEnAttente } from '../../services/pendingQuestionsService';
import ModernLoader from '../../components/ModernLoader';

export default function QuestionRevision({ route, navigation }: any) {
  const { colors } = useTheme();
  const { imageBase64, matiere, imageUri } = route.params || {};

  const [questions, setQuestions]               = useState<any[]>([]);
  const [questionActuelle, setQuestionActuelle] = useState(0);
  const [reponse, setReponse]                   = useState('');
  const [reponses, setReponses]                 = useState<any[]>([]);
  const [scoreTotal, setScoreTotal]             = useState(0);
  const [essais, setEssais]                     = useState(0);
  const [feedbackMsg, setFeedbackMsg]           = useState('');
  const [loading, setLoading]                   = useState(true);
  const [extractionEnCours, setExtractionEnCours] = useState(true);
  const [verification, setVerification]         = useState(false);
  const [noteActuelle, setNoteActuelle]         = useState<number | null>(null);
  const [timeStarted, setTimeStarted]           = useState(false);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim   = useRef(new Animated.Value(1)).current;
  const fadeAnim     = useRef(new Animated.Value(0)).current;
  const noteAnim     = useRef(new Animated.Value(0)).current;
  const sessionId    = useRef(Date.now().toString()).current;

  const matiereInfo = getMatiereInfoWithFallback(matiere || 'Révision');

  // Nombre de questions effectives (dynamique selon ce que l'IA génère)
  const NB_QUESTIONS = questions.length || 8;
  const POINTS_MAX   = NB_QUESTIONS * 2;

  useEffect(() => {
    const init = async () => {
      const infos = await getInfosEnfant();
      if (infos) setNiveauEleve(infos.classe || 'Terminale');
      await analyserCoursEtGenererQuestions();
    };
    init();
    return () => { stopAndRestartNavigation(); };
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

  useEffect(() => {
    if (feedbackMsg) {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(2500),
        Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => setFeedbackMsg(''));
    }
  }, [feedbackMsg]);

  useEffect(() => {
    if (noteActuelle !== null) {
      Animated.sequence([
        Animated.timing(noteAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(1200),
        Animated.timing(noteAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => setNoteActuelle(null));
    }
  }, [noteActuelle]);

  const analyserCoursEtGenererQuestions = async () => {
    try {
      setExtractionEnCours(true);
      setLoading(true);
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
      const contenu = await extraireTexteCours(base64Data, matiere);
      const qs      = await genererQuestionsCours(contenu, matiere);
      // Limiter à 8 questions maximum
      setQuestions(qs.slice(0, 8));
    } catch (e) {
      console.error('Erreur génération questions:', e);
      Alert.alert('Erreur', "Impossible d'analyser l'image. Réessaie.");
      navigation.goBack();
    } finally {
      setExtractionEnCours(false);
      setLoading(false);
    }
  };

  const demarrerTempsRevision = async () => {
    if (!timeStarted) {
      await startTimeTracking('revision', matiere || 'Révision');
      setTimeStarted(true);
    }
  };

  const handleVerifierReponse = async () => {
    if (!reponse.trim() || verification) return;

    // ✅ Démarrer le temps au premier submit
    await demarrerTempsRevision();

    Animated.sequence([
      Animated.spring(bounceAnim, { toValue: 0.95, useNativeDriver: true, speed: 50 }),
      Animated.spring(bounceAnim, { toValue: 1,    useNativeDriver: true, speed: 50 }),
    ]).start();

    setVerification(true);

    try {
      const questionTexte = questions[questionActuelle]?.texte || questions[questionActuelle];
      const resultat = await evaluerReponseRevision(questionTexte, reponse, essais + 1, matiere);
      const note = resultat.note;

      setNoteActuelle(note);
      await feedback(note === 2 ? 'success' : note === 1 ? 'info' : 'error');

      // ✅ FIX SCORE : Si raté et encore des essais → réessayer SANS ajouter au score
      if (note < 1.5 && essais + 1 < 3) {
        setEssais(essais + 1);
        setFeedbackMsg(resultat.feedback);
        setReponse('');
        setVerification(false);
        return; // Ne pas ajouter au score, ne pas avancer
      }

      // ✅ Ajouter au score UNE SEULE FOIS (réponse finale pour cette question)
      const nouvelleReponse = {
        question: questionTexte,
        reponse,
        note,
        feedback: resultat.feedback,
        essais: essais + 1,
      };
      const newReponses = [...reponses, nouvelleReponse];
      setReponses(newReponses);
      const newScore = scoreTotal + note;
      setScoreTotal(newScore);

      // Question ratée au 3ème essai → file d'attente
      if (note < 1.5) {
        await ajouterQuestionEnAttente(
          questionTexte, matiere || 'Révision', 'revision', sessionId, reponse, resultat.feedback
        );
      }

      if (questionActuelle + 1 < questions.length) {
        // Question suivante
        setTimeout(() => {
          setQuestionActuelle(q => q + 1);
          setReponse('');
          setEssais(0);
          setFeedbackMsg('');
        }, 600);
      } else {
        // ✅ Fin de session — arrêt du temps, navigation vers résultat
        // Les badges sont gérés dans ResultatRevision (pas ici)
        await stopTimeTracking();
        await startTimeTracking('navigation', 'Général');

        const scoreMax   = questions.length * 2; // ✅ Basé sur questions réelles
        const noteSur20  = Math.min(20, Math.round((newScore / scoreMax) * 20));

        navigation.replace('ResultatRevision', {
          score: newScore,
          scoreMax,
          noteSur20,
          reponses: newReponses,
          matiere,
          type: 'revision',
        });
      }
    } catch (e) {
      console.error('Erreur vérification:', e);
      setFeedbackMsg('Erreur réseau, réessaie');
    } finally {
      setVerification(false);
    }
  };

  const handleIgnorer = () => {
    Alert.alert('Ignorer la question ?', 'Tu n\'auras pas de point.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Ignorer',
        style: 'destructive',
        onPress: async () => {
          await demarrerTempsRevision();
          const questionTexte = questions[questionActuelle]?.texte || questions[questionActuelle];
          await ajouterQuestionEnAttente(
            questionTexte, matiere || 'Révision', 'revision', sessionId, '(ignorée)', 'Ignorée'
          );
          const nouvelleReponse = { question: questionTexte, reponse: '(ignorée)', note: 0, feedback: 'Ignorée', essais: 0 };
          const newReponses = [...reponses, nouvelleReponse];
          setReponses(newReponses);

          if (questionActuelle + 1 < questions.length) {
            setQuestionActuelle(q => q + 1);
            setReponse('');
            setEssais(0);
          } else {
            await stopTimeTracking();
            await startTimeTracking('navigation', 'Général');
            const scoreMax  = questions.length * 2;
            const noteSur20 = Math.min(20, Math.round((scoreTotal / scoreMax) * 20));
            navigation.replace('ResultatRevision', {
              score: scoreTotal, scoreMax, noteSur20,
              reponses: newReponses, matiere, type: 'revision',
            });
          }
        },
      },
    ]);
  };

  if (extractionEnCours) return <ModernLoader visible type="brain" message="L'IA analyse ton cours..." />;
  if (loading || questions.length === 0) return <ModernLoader visible type="book" message="Préparation des questions..." />;

  const questionCourante = questions[questionActuelle]?.texte || questions[questionActuelle];
  const scoreMax         = questions.length * 2;
  const noteSur20Actuel  = Math.min(20, Math.round((scoreTotal / scoreMax) * 20));
  const noteColor        = noteSur20Actuel >= 16 ? '#4CAF50' : noteSur20Actuel >= 12 ? '#FF9800' : '#f44336';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={async () => { await stopAndRestartNavigation(); navigation.goBack(); }}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.matiereBadge}>
              <MaterialCommunityIcons name={matiereInfo.icone as any} size={16} color="white" />
              <Text style={styles.matiereText}>{matiere || 'Révision'}</Text>
            </View>
            <View style={[styles.noteBadge, { backgroundColor: noteColor + '40' }]}>
              <Text style={styles.noteBadgeText}>{noteSur20Actuel}/20</Text>
            </View>
          </View>
          <View style={styles.progressContainer}>
            <View style={styles.progressLabels}>
              <Text style={styles.progressText}>Q {questionActuelle + 1}/{questions.length}</Text>
              <Text style={styles.scoreText}>{scoreTotal}/{scoreMax} pts</Text>
            </View>
            <View style={[styles.progressBar, { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
              <Animated.View
                style={[
                  styles.progressFill,
                  { width: progressAnim.interpolate({ inputRange: [0,1], outputRange: ['0%','100%'] }) },
                ]}
              />
            </View>
            {essais > 0 && (
              <Text style={styles.essaiText}>⚠️ Essai {essais + 1}/3</Text>
            )}
          </View>
        </LinearGradient>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Question */}
          <View style={[styles.questionCard, { backgroundColor: colors.surface }]}>
            <View style={styles.questionHeader}>
              <MaterialCommunityIcons name="help-circle" size={22} color={colors.primary} />
              <Text style={[styles.questionNumber, { color: colors.primary }]}>
                Question {questionActuelle + 1}
              </Text>
            </View>
            <Text style={[styles.questionTexte, { color: colors.text }]}>{questionCourante}</Text>
          </View>

          {/* Feedback */}
          {feedbackMsg !== '' && (
            <Animated.View style={[styles.feedbackCard, { backgroundColor: colors.info + '20', opacity: fadeAnim }]}>
              <MaterialCommunityIcons name="lightbulb" size={18} color={colors.info} />
              <Text style={[styles.feedbackText, { color: colors.textSecondary }]}>{feedbackMsg}</Text>
            </Animated.View>
          )}

          {/* Note popup */}
          {noteActuelle !== null && (
            <Animated.View style={[
              styles.notePopup,
              {
                opacity: noteAnim,
                transform: [{ scale: noteAnim }],
                backgroundColor: noteActuelle === 2 ? '#4CAF50' : noteActuelle === 1 ? '#FF9800' : '#f44336',
              },
            ]}>
              <Text style={styles.notePopupText}>
                {noteActuelle === 2 ? '✅ Bonne réponse ! +2 pts'
                  : noteActuelle === 1 ? '⚠️ Partielle +1 pt'
                  : '❌ Incorrect +0 pt'}
              </Text>
            </Animated.View>
          )}

          {/* Réponse */}
          <View style={[styles.reponseCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.reponseLabel, { color: colors.textSecondary }]}>Ta réponse</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              placeholder="Écris ta réponse ici..."
              placeholderTextColor={colors.textMuted}
              value={reponse}
              onChangeText={setReponse}
              multiline
              numberOfLines={4}
              editable={!verification}
            />
          </View>

          {/* Boutons */}
          <View style={styles.buttonsRow}>
            <Animated.View style={{ transform: [{ scale: bounceAnim }], flex: 1 }}>
              <TouchableOpacity
                style={[styles.validateButton, { backgroundColor: reponse.trim() && !verification ? colors.primary : colors.border }]}
                onPress={handleVerifierReponse}
                disabled={verification || !reponse.trim()}
              >
                {verification
                  ? <ActivityIndicator size="small" color="white" />
                  : <Text style={styles.validateButtonText}>Valider ✓</Text>
                }
              </TouchableOpacity>
            </Animated.View>
            <TouchableOpacity
              style={[styles.ignoreButton, { backgroundColor: colors.error + '15', borderColor: colors.error + '40' }]}
              onPress={handleIgnorer}
              disabled={verification}
            >
              <Text style={[styles.ignoreButtonText, { color: colors.error }]}>Ignorer</Text>
            </TouchableOpacity>
          </View>

          {/* Score bar */}
          <View style={styles.scoreSummary}>
            <Text style={[styles.scoreSummaryText, { color: colors.textMuted }]}>
              Score : {scoreTotal}/{scoreMax} pts → {noteSur20Actuel}/20
            </Text>
            <View style={[styles.scoreBar, { backgroundColor: colors.border }]}>
              <View style={[styles.scoreFill, { width: `${(scoreTotal / scoreMax) * 100}%`, backgroundColor: noteColor }]} />
            </View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  matiereBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
  matiereText: { color: 'white', fontSize: 12, fontWeight: '600' },
  noteBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  noteBadgeText: { fontSize: 14, fontWeight: 'bold', color: 'white' },
  progressContainer: { gap: 6 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  progressText: { color: 'white', fontSize: 13 },
  scoreText: { color: 'white', fontSize: 13, fontWeight: '600' },
  progressBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: 'white', borderRadius: 3 },
  essaiText: { color: 'rgba(255,255,255,0.9)', fontSize: 12, textAlign: 'center' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  questionCard: { borderRadius: 20, padding: 20, marginBottom: 16, elevation: 2 },
  questionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  questionNumber: { fontSize: 14, fontWeight: '700' },
  questionTexte: { fontSize: 17, lineHeight: 26, fontWeight: '500' },
  feedbackCard: { flexDirection: 'row', alignItems: 'flex-start', borderRadius: 14, padding: 14, marginBottom: 14, gap: 10, borderLeftWidth: 3, borderLeftColor: '#2196F3' },
  feedbackText: { flex: 1, fontSize: 14, lineHeight: 20 },
  notePopup: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 30, marginBottom: 14, gap: 8 },
  notePopupText: { color: 'white', fontSize: 14, fontWeight: '600' },
  reponseCard: { borderRadius: 20, padding: 16, marginBottom: 16 },
  reponseLabel: { fontSize: 13, fontWeight: '600', marginBottom: 10 },
  textInput: { borderRadius: 12, borderWidth: 1, padding: 14, fontSize: 15, minHeight: 100, textAlignVertical: 'top' },
  buttonsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  validateButton: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  validateButtonText: { color: 'white', fontSize: 16, fontWeight: '700' },
  ignoreButton: { paddingHorizontal: 20, paddingVertical: 14, borderRadius: 14, alignItems: 'center', borderWidth: 1 },
  ignoreButtonText: { fontSize: 14, fontWeight: '600' },
  scoreSummary: { gap: 8 },
  scoreSummaryText: { fontSize: 12, textAlign: 'center' },
  scoreBar: { height: 4, borderRadius: 2, overflow: 'hidden' },
  scoreFill: { height: '100%', borderRadius: 2 },
});
