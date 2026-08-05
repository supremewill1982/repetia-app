import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { evaluerReponseRevision } from '../../services/iaServiceOpenRouter';
import { enregistrerNouvelleTentative, supprimerQuestionEnAttente } from '../../services/pendingQuestionsService';
import { feedback } from '../../services/feedbackService';
import { getMatiereInfoWithFallback } from '../../services/matieresService';

export default function RepriseQuestionScreen({ route, navigation }) {
  const { colors } = useTheme();
  const {
    questionId,
    question,
    matiere,
    type,
    tentativeActuelle,
    tentativesRestantes,
    reponsesPrecedentes
  } = route.params || {};

  const [reponse, setReponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  
  const matiereInfo = getMatiereInfoWithFallback(matiere || 'Révision');
  
  // Valeurs par défaut
  const safeQuestion = question || "Question non disponible";
  const safeTentativeActuelle = tentativeActuelle || 1;
  const safeTentativesRestantes = tentativesRestantes || 2;
  const safeReponsesPrecedentes = reponsesPrecedentes || [];

  const handleValiderReponse = async () => {
    if (!reponse.trim()) {
      Alert.alert('Info', 'Écris ta réponse avant de valider');
      return;
    }

    setLoading(true);
    await feedback('tap');

    try {
      const resultat = await evaluerReponseRevision(safeQuestion, reponse, safeTentativeActuelle + 1, matiere);
      const reussie = resultat.note >= 1.5;

      if (reussie) {
        await feedback('success');
        if (questionId) {
          await supprimerQuestionEnAttente(questionId);
        }
        
        Alert.alert(
          '🎉 Bravo !',
          `Ta réponse est correcte ! Cette question est maintenant réussie.\n\n${resultat.feedback}`,
          [
            {
              text: 'Continuer',
              onPress: () => {
                navigation.goBack();
              }
            }
          ]
        );
      } else {
        if (questionId) {
          const { termine, tentativeRestante } = await enregistrerNouvelleTentative(questionId, reponse, false, resultat.feedback);
          
          if (termine) {
            await feedback('error');
            Alert.alert(
              '❌ Dommage',
              `Tu as utilisé toutes tes tentatives pour cette question.\n\n${resultat.feedback}\n\nLa question reste dans ta liste pour une future révision.`,
              [
                {
                  text: 'OK',
                  onPress: () => navigation.goBack()
                }
              ]
            );
          } else {
            await feedback('error');
            setFeedbackMsg(resultat.feedback);
            setReponse('');
            
            Alert.alert(
              '⚠️ Réponse incorrecte',
              `${resultat.feedback}\n\nIl te reste ${tentativeRestante} tentative${tentativeRestante > 1 ? 's' : ''}.`,
              [{ text: 'Réessayer' }]
            );
          }
        } else {
          await feedback('error');
          setFeedbackMsg(resultat.feedback);
          setReponse('');
        }
      }
    } catch (error) {
      console.error('Erreur évaluation:', error);
      Alert.alert('Erreur', 'Impossible d\'évaluer ta réponse. Réessaie.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerBadge}>
            <MaterialCommunityIcons name={matiereInfo.icone} size={20} color="white" />
            <Text style={styles.headerMatiere}>{matiere || 'Révision'}</Text>
          </View>
          <View style={[styles.tentativeHeader, { backgroundColor: colors.warning + '30' }]}>
            <MaterialCommunityIcons name="repeat" size={14} color="white" />
            <Text style={styles.tentativeHeaderText}>
              Essai {safeTentativeActuelle}/3
            </Text>
          </View>
        </LinearGradient>

        <View style={[styles.questionCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.questionLabel, { color: colors.primary }]}>📖 Question à reprendre</Text>
          <Text style={[styles.questionText, { color: colors.text }]}>{safeQuestion}</Text>
        </View>

        {safeReponsesPrecedentes.length > 0 && (
          <View style={[styles.historiqueCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.historiqueLabel, { color: colors.textSecondary }]}>
              📝 Historique de tes réponses
            </Text>
            {safeReponsesPrecedentes.map((rep, idx) => {
              // CORRECTION: Vérifier que rep existe avant substring
              const reponseText = rep || "Réponse non enregistrée";
              const reponseDisplay = reponseText.length > 80 ? reponseText.substring(0, 80) + "..." : reponseText;
              return (
                <Text key={idx} style={[styles.historiqueText, { color: colors.textMuted }]}>
                  Essai {idx + 1}: {reponseDisplay}
                </Text>
              );
            })}
          </View>
        )}

        <View style={[styles.reponseCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.reponseLabel, { color: colors.textSecondary }]}>✏️ Ta nouvelle réponse</Text>
          <TextInput
            style={[styles.textInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
            placeholder="Écris ta réponse ici..."
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

        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.validateButton, { backgroundColor: colors.primary }]}
            onPress={handleValiderReponse}
            disabled={loading || !reponse.trim()}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <MaterialCommunityIcons name="check" size={20} color="white" />
                <Text style={styles.validateText}>Valider ma réponse</Text>
              </>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.ignoreButton, { backgroundColor: colors.error + '20' }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.ignoreText, { color: colors.error }]}>Passer</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.info + '10' }]}>
          <MaterialCommunityIcons name="information" size={16} color={colors.info} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Tu as {safeTentativesRestantes} tentative{safeTentativesRestantes > 1 ? 's' : ''} restante{safeTentativesRestantes > 1 ? 's' : ''} pour cette question.
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
  headerMatiere: { color: 'white', fontSize: 14, fontWeight: '500' },
  tentativeHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 15, gap: 4 },
  tentativeHeaderText: { color: 'white', fontSize: 11, fontWeight: '600' },
  questionCard: { margin: 16, padding: 20, borderRadius: 20 },
  questionLabel: { fontSize: 14, fontWeight: '600', marginBottom: 10 },
  questionText: { fontSize: 18, lineHeight: 26, fontWeight: '500' },
  historiqueCard: { marginHorizontal: 16, marginBottom: 16, padding: 16, borderRadius: 16 },
  historiqueLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  historiqueText: { fontSize: 12, marginBottom: 4, fontStyle: 'italic' },
  reponseCard: { marginHorizontal: 16, marginBottom: 16, padding: 20, borderRadius: 20 },
  reponseLabel: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
  textInput: { borderRadius: 12, borderWidth: 1, padding: 14, fontSize: 16, minHeight: 120, textAlignVertical: 'top' },
  feedbackCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 16, padding: 12, borderRadius: 12, gap: 8 },
  feedbackText: { flex: 1, fontSize: 13 },
  buttonsContainer: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 16, gap: 12 },
  validateButton: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, gap: 8 },
  validateText: { color: 'white', fontSize: 16, fontWeight: '600' },
  ignoreButton: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12 },
  ignoreText: { fontSize: 16, fontWeight: '600' },
  infoCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 30, padding: 12, borderRadius: 12, gap: 8 },
  infoText: { flex: 1, fontSize: 12 },
});
