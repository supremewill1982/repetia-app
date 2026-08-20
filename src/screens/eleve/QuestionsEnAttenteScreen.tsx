import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';
import { getQuestionsEnAttente, getNombreQuestionsEnAttente, PendingQuestion } from '../../services/pendingQuestionsService';
import { getMatiereInfoWithFallback } from '../../services/matieresService';
import ModernLoader from '../../components/ModernLoader';
import { feedback } from '../../services/feedbackService';

export default function QuestionsEnAttenteScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [questions, setQuestions] = useState<PendingQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      chargerQuestions();
    }, [])
  );

  const chargerQuestions = async () => {
    try {
      setLoading(true);
      const qs = await getQuestionsEnAttente();
      setQuestions(qs);
      setTotalCount(qs.length);
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReprendreQuestion = (question: PendingQuestion) => {
    feedback('tap');
    navigation.navigate('RepriseQuestion', {
      questionId: question.id,
      question: question.question,
      matiere: question.matiere,
      type: question.type,
      tentativeActuelle: question.tentative,
      tentativesRestantes: question.maxTentatives - question.tentative,
      reponsesPrecedentes: question.reponsesPrecedentes
    });
  };

  const getTentativeColor = (tentative: number, max: number) => {
    const ratio = tentative / max;
    if (ratio < 0.33) return '#4CAF50';
    if (ratio < 0.66) return '#FF9800';
    return '#f44336';
  };

  if (loading) {
    return <ModernLoader visible={true} type="book" message="Chargement des questions en attente..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📝 Questions à reprendre</Text>
        <Text style={styles.headerSubtitle}>
          {totalCount} question{totalCount > 1 ? 's' : ''} en attente
        </Text>
      </LinearGradient>

      {totalCount === 0 ? (
        <View style={[styles.emptyContainer, { backgroundColor: colors.surface }]}>
          <MaterialCommunityIcons name="check-circle" size={60} color={colors.success} />
          <Text style={[styles.emptyText, { color: colors.text }]}>Félicitations !</Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Tu n'as aucune question à reprendre pour le moment.
          </Text>
          <TouchableOpacity
            style={[styles.emptyButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.emptyButtonText}>Retour à l'accueil</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {questions.map((q, index) => {
            const matiereInfo = getMatiereInfoWithFallback(q.matiere);
            const tentativeColor = getTentativeColor(q.tentative, q.maxTentatives);
            const tentativesRestantes = q.maxTentatives - q.tentative;
            
            return (
              <View key={q.id} style={[styles.questionCard, { backgroundColor: colors.surface }]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.matiereBadge, { backgroundColor: matiereInfo.couleur + '20' }]}>
                    <MaterialCommunityIcons name={matiereInfo.icone as any} size={14} color={matiereInfo.couleur} />
                    <Text style={[styles.matiereText, { color: matiereInfo.couleur }]}>{q.matiere}</Text>
                  </View>
                  <View style={[styles.tentativeBadge, { backgroundColor: tentativeColor + '20' }]}>
                    <MaterialCommunityIcons name="repeat" size={12} color={tentativeColor} />
                    <Text style={[styles.tentativeText, { color: tentativeColor }]}>
                      Essai {q.tentative}/{q.maxTentatives}
                    </Text>
                  </View>
                </View>
                
                <Text style={[styles.questionText, { color: colors.text }]} numberOfLines={3}>
                  {q.question}
                </Text>
                
                {q.reponsesPrecedentes.length > 0 && (
                  <View style={[styles.previousAnswers, { backgroundColor: colors.background }]}>
                    <Text style={[styles.previousLabel, { color: colors.textSecondary }]}>
                      Réponse précédente :
                    </Text>
                    <Text style={[styles.previousText, { color: colors.textMuted }]} numberOfLines={2}>
                      {q.reponsesPrecedentes[q.reponsesPrecedentes.length - 1]}
                    </Text>
                  </View>
                )}
                
                <TouchableOpacity
                  style={[styles.reprendreButton, { backgroundColor: colors.primary }]}
                  onPress={() => handleReprendreQuestion(q)}
                >
                  <MaterialCommunityIcons name="refresh" size={18} color="white" />
                  <Text style={styles.reprendreText}>
                    {tentativesRestantes === 1 ? 'Dernière tentative' : `Reprendre (${tentativesRestantes} essais restants)`}
                  </Text>
                  <MaterialCommunityIcons name="chevron-right" size={18} color="white" />
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 50, paddingBottom: 25, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: 'white', marginBottom: 5 },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.9)' },
  scrollContent: { padding: 16, paddingBottom: 30 },
  emptyContainer: { margin: 20, padding: 40, borderRadius: 20, alignItems: 'center' },
  emptyText: { fontSize: 20, fontWeight: 'bold', marginTop: 20, marginBottom: 8 },
  emptySubtext: { fontSize: 14, textAlign: 'center', marginBottom: 25 },
  emptyButton: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  emptyButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  questionCard: { borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  matiereBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 15, gap: 4 },
  matiereText: { fontSize: 12, fontWeight: '500' },
  tentativeBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, gap: 4 },
  tentativeText: { fontSize: 10, fontWeight: '600' },
  questionText: { fontSize: 15, lineHeight: 22, marginBottom: 12 },
  previousAnswers: { padding: 10, borderRadius: 10, marginBottom: 12 },
  previousLabel: { fontSize: 11, marginBottom: 4, fontWeight: '500' },
  previousText: { fontSize: 13, fontStyle: 'italic' },
  reprendreButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, gap: 8 },
  reprendreText: { color: 'white', fontSize: 14, fontWeight: '600' },
});
