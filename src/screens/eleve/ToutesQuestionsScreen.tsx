import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { getSessionsEnfantFirebase } from '../../services/firebaseEnfantService';
import { getMatiereInfoWithFallback } from '../../services/matieresService';
import ModernLoader from '../../components/ModernLoader';
import { feedback } from '../../services/feedbackService';

export default function ToutesQuestionsScreen({ navigation }) {
  const { colors } = useTheme();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    chargerQuestions();
  }, []);

  const chargerQuestions = async () => {
    try {
      setLoading(true);
      const sessions = await getSessionsEnfantFirebase();
      const toutesQuestions = [];
      sessions.forEach(session => {
        const matiere = session.matiere || (session.type === 'devoir' ? 'Devoir' : 'Révision');
        const matiereInfo = getMatiereInfoWithFallback(matiere);
        if (session.questions && Array.isArray(session.questions)) {
          session.questions.forEach((q, index) => {
            if (q && q.note < 2) {
              toutesQuestions.push({
                id: `${session.id}_${index}`,
                question: q.question,
                reponse: q.reponse,
                note: q.note,
                feedback: q.feedback,
                date: session.date,
                matiere: matiere,
                matiereIcone: matiereInfo.icone,
                matiereCouleur: matiereInfo.couleur,
              });
            }
          });
        }
      });
      const grouped = {};
      toutesQuestions.forEach(q => {
        if (!grouped[q.matiere]) {
          grouped[q.matiere] = {
            matiere: q.matiere,
            icone: q.matiereIcone,
            couleur: q.matiereCouleur,
            questions: []
          };
        }
        grouped[q.matiere].questions.push(q);
      });
      setQuestions(Object.values(grouped).sort((a, b) => b.questions.length - a.questions.length));
    } catch (error) {
      console.error('Erreur chargement questions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ModernLoader visible={true} type="book" message="Chargement des questions..." subMessage="Récupération de toutes les questions à réviser" />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Questions à revoir</Text>
        <Text style={styles.headerSubtitle}>
          {questions.reduce((acc, g) => acc + g.questions.length, 0)} questions à réviser
        </Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {questions.length === 0 ? (
          <View style={[styles.emptyContainer, { backgroundColor: colors.surface }]}>
            <MaterialCommunityIcons name="check-circle" size={60} color={colors.success} />
            <Text style={[styles.emptyText, { color: colors.text }]}>Félicitations !</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Tu n'as aucune question à réviser pour le moment</Text>
          </View>
        ) : (
          questions.map((groupe, idx) => (
            <View key={idx} style={[styles.groupeCard, { backgroundColor: colors.surface }]}>
              <View style={styles.groupeHeader}>
                <View style={[styles.groupeIcone, { backgroundColor: groupe.couleur + '20' }]}>
                  <MaterialCommunityIcons name={groupe.icone} size={24} color={groupe.couleur} />
                </View>
                <View style={styles.groupeInfo}>
                  <Text style={[styles.groupeNom, { color: colors.text }]}>{groupe.matiere}</Text>
                  <Text style={[styles.groupeCount, { color: colors.textSecondary }]}>{groupe.questions.length} question{groupe.questions.length > 1 ? 's' : ''}</Text>
                </View>
              </View>
              {groupe.questions.slice(0, 3).map((q, qIdx) => (
                <TouchableOpacity key={qIdx} style={[styles.questionItem, { borderBottomColor: colors.border }]} onPress={() => navigation.navigate('QuestionDetail', { question: q.question, reponse: q.reponse, correction: q.feedback, matiere: q.matiere, date: q.date })}>
                  <Text style={[styles.questionTexte, { color: colors.text }]} numberOfLines={2}>{q.question}</Text>
                  <View style={styles.questionFooter}>
                    <View style={[styles.noteBadge, { backgroundColor: q.note === 0 ? colors.error + '20' : colors.warning + '20' }]}>
                      <Text style={[styles.noteText, { color: q.note === 0 ? colors.error : colors.warning }]}>{q.note}/2</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
                  </View>
                </TouchableOpacity>
              ))}
              {groupe.questions.length > 3 && (
                <TouchableOpacity style={styles.voirPlusButton} onPress={() => navigation.navigate('QuestionsParMatiere', { matiere: groupe.matiere, matiereIcone: groupe.icone, matiereCouleur: groupe.couleur })}>
                  <Text style={[styles.voirPlusText, { color: colors.primary }]}>Voir les {groupe.questions.length - 3} autres questions</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 50, paddingBottom: 25, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: 'white', marginBottom: 5 },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.9)' },
  scrollContent: { padding: 16, paddingBottom: 30 },
  emptyContainer: { padding: 40, borderRadius: 20, alignItems: 'center' },
  emptyText: { fontSize: 20, fontWeight: 'bold', marginTop: 20, marginBottom: 8 },
  emptySubtext: { fontSize: 14, textAlign: 'center', paddingHorizontal: 20 },
  groupeCard: { borderRadius: 20, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  groupeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  groupeIcone: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  groupeInfo: { flex: 1 },
  groupeNom: { fontSize: 18, fontWeight: 'bold' },
  groupeCount: { fontSize: 12, marginTop: 2 },
  questionItem: { paddingVertical: 12, borderBottomWidth: 1 },
  questionTexte: { fontSize: 14, marginBottom: 8 },
  questionFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  noteBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  noteText: { fontSize: 12, fontWeight: '600' },
  voirPlusButton: { marginTop: 10, alignItems: 'center', paddingVertical: 8 },
  voirPlusText: { fontSize: 14, fontWeight: '500' },
});
