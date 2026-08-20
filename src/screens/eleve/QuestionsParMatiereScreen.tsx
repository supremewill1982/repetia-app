import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { getSessionsEnfantFirebase } from '../../services/firebaseEnfantService';
import { getMatiereInfoWithFallback } from '../../services/matieresService';
import { feedback } from '../../services/feedbackService';
import AnimatedWrapper from '../../components/AnimatedWrapper';
import AnimatedCard from '../../components/AnimatedCard';
import ModernLoader from '../../components/ModernLoader';
interface Question {
  id: string;
  question: string;
  reponse: string;
  note: number;
  feedback: string;
  date: string;
  score?: number;
  scoreMax?: number;
  sessionId: string;
}
interface FirebaseQuestion {
  question?: string;
  reponse?: string;
  note?: number;
  feedback?: string;
}



export default function QuestionsParMatiereScreen({ route, navigation }: any) {
  const { colors } = useTheme();
  const { matiere, matiereIcone, matiereCouleur } = route.params;
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [searchText, setSearchText] = useState('');
  const [filter, setFilter] = useState('all'); // all, rate0, rate1
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, moyenne: 0, réussite: 0 });

  const matiereInfo = getMatiereInfoWithFallback(matiere);

  useEffect(() => {
    chargerQuestions();
  }, []);

  useEffect(() => {
    filterQuestions();
  }, [searchText, filter, questions]);

  const chargerQuestions = async () => {
    try {
      setLoading(true);
      const sessions = await getSessionsEnfantFirebase();
      const questionsListe: Question[] = [];

      sessions.forEach(session => {
        if (session.matiere === matiere || (session.type === 'devoir' && matiere === 'Devoir') || (session.type === 'revision' && matiere === 'Révision')) {
          if (session.questions && Array.isArray(session.questions)) {
            session.questions.forEach((q: FirebaseQuestion, idx) => {
              if ((q.note ?? 0) < 2) {
                questionsListe.push({
                  id: `${session.id}_${idx}`,
                  question: q.question ?? "",
                  reponse: q.reponse ?? "",
                  note: q.note ?? 0,
                  feedback: q.feedback ?? "",
                  date: String(session.date),
                  score: session.scoreTotal,
                  scoreMax: session.scoreMax,
                  sessionId: String(session.id ?? ""),
                });
              }
            });
          }
        }
      });

      // Trier par date décroissante
      questionsListe.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setQuestions(questionsListe);
      
      // Calculer des stats
      const total = questionsListe.length;
      const totalPoints = questionsListe.reduce((acc, q) => acc + q.note, 0);
      const moyenne = total > 0 ? (totalPoints / (total * 2)) * 100 : 0;
      setStats({ total, moyenne: Math.round(moyenne), réussite: total - questionsListe.filter(q => q.note === 2).length });
    } catch (error) {
      console.error('Erreur chargement questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterQuestions = () => {
    let filtered = [...questions];
    if (searchText.trim()) {
      filtered = filtered.filter(q => q.question.toLowerCase().includes(searchText.toLowerCase()));
    }
    if (filter === 'rate0') {
      filtered = filtered.filter(q => q.note === 0);
    } else if (filter === 'rate1') {
      filtered = filtered.filter(q => q.note === 1);
    }
    setFilteredQuestions(filtered);
  };

  const getNoteColor = (note: number) => {
    if (note === 0) return colors.error;
    if (note === 1) return colors.warning;
    return colors.success;
  };

  const handleQuestionPress = (q: Question) => {
    feedback('tap');
    navigation.navigate('QuestionDetail', {
      question: q.question,
      reponse: q.reponse,
      correction: q.feedback,
      matiere: matiere,
      date: q.date,
    });
  };

  if (loading) {
    return <ModernLoader visible={true} type="book" message="Chargement des questions..." subMessage="Analyse de tes erreurs" />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={[styles.matiereBadge, { backgroundColor: matiereInfo.couleur + '40' }]}>
            <MaterialCommunityIcons name={matiereInfo.icone as any} size={20} color="white" />
            <Text style={styles.matiereTitle}>{matiere}</Text>
          </View>
          <Text style={styles.statsText}>
            {stats.total} question{stats.total > 1 ? 's' : ''} • {stats.moyenne}% de réussite
          </Text>
        </View>
      </LinearGradient>

      {/* Barre de recherche et filtres */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <View style={[styles.searchBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Rechercher une question..."
            placeholderTextColor={colors.textMuted}
           
            onChangeText={setSearchText}
          />
          {searchText !== '' && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterChip, filter === 'all' && { backgroundColor: colors.primary }]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && { color: 'white' }]}>Toutes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filter === 'rate0' && { backgroundColor: colors.error }]}
            onPress={() => setFilter('rate0')}
          >
            <Text style={[styles.filterText, filter === 'rate0' && { color: 'white' }]}>0 point</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filter === 'rate1' && { backgroundColor: colors.warning }]}
            onPress={() => setFilter('rate1')}
          >
            <Text style={[styles.filterText, filter === 'rate1' && { color: 'white' }]}>1 point</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {filteredQuestions.length === 0 ? (
          <View style={[styles.emptyContainer, { backgroundColor: colors.surface }]}>
            <MaterialCommunityIcons name="checkbox-blank-circle-outline" size={60} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.text }]}>Aucune question à revoir</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Continue tes révisions, tu progresses !
            </Text>
          </View>
        ) : (
          filteredQuestions.map((q, index) => (
            <AnimatedWrapper key={q.id} type="fade" delay={index * 50}>
              <AnimatedCard>
                <TouchableOpacity style={[styles.questionCard, { backgroundColor: colors.surface }]} onPress={() => handleQuestionPress(q)} activeOpacity={0.7}>
                  <View style={styles.questionHeader}>
                    <View style={[styles.notePill, { backgroundColor: getNoteColor(q.note) + '20' }]}>
                      <Text style={[styles.noteText, { color: getNoteColor(q.note) }]}>{q.note}/2</Text>
                    </View>
                    <Text style={[styles.dateText, { color: colors.textSecondary }]}>{new Date(q.date).toLocaleDateString('fr-FR')}</Text>
                  </View>
                  <Text style={[styles.questionText, { color: colors.text }]} numberOfLines={2}>
                    {q.question}
                  </Text>
                  {q.reponse && (
                    <View style={[styles.answerPreview, { backgroundColor: colors.background }]}>
                      <Text style={[styles.answerPreviewText, { color: colors.textSecondary }]} numberOfLines={1}>
                        ✍️ Ta réponse : {q.reponse}
                      </Text>
                    </View>
                  )}
                  <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} style={styles.arrowIcon} />
                </TouchableOpacity>
              </AnimatedCard>
            </AnimatedWrapper>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  headerContent: { alignItems: 'center' },
  matiereBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 30, gap: 8, marginBottom: 12 },
  matiereTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  statsText: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  searchContainer: { marginHorizontal: 16, marginTop: -20, padding: 12, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  searchBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
  filterRow: { flexDirection: 'row', marginTop: 12, gap: 10, justifyContent: 'center' },
  filterChip: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f0f0f0' },
  filterText: { fontSize: 13, fontWeight: '500' },
  scrollContent: { padding: 16, paddingBottom: 30 },
  emptyContainer: { padding: 40, borderRadius: 20, alignItems: 'center' },
  emptyText: { fontSize: 18, fontWeight: '600', marginTop: 20, marginBottom: 8 },
  emptySubtext: { fontSize: 14, textAlign: 'center' },
  questionCard: { borderRadius: 16, padding: 16, marginBottom: 12, position: 'relative' },
  questionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  notePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  noteText: { fontSize: 12, fontWeight: 'bold' },
  dateText: { fontSize: 11 },
  questionText: { fontSize: 15, fontWeight: '500', lineHeight: 20, marginBottom: 8, flex: 1 },
  answerPreview: { padding: 8, borderRadius: 12, marginTop: 4 },
  answerPreviewText: { fontSize: 12, fontStyle: 'italic' },
  arrowIcon: { position: 'absolute', right: 16, top: '50%', marginTop: -10 },
});
