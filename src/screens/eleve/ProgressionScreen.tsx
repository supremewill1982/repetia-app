import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { getSessionsEnfantFirebase } from '../../services/firebaseEnfantService';
import { getMatiereInfoWithFallback } from '../../services/matieresService';
import { useTimeTracking } from '../../hooks/useTimeTracking';
import { useFocusEffect } from '@react-navigation/native';
import ModernLoader from '../../components/ModernLoader';

export default function ProgressionScreen({ navigation }) {
  const { colors } = useTheme();
  const { userData } = useAuth();
  const { timeSummary, refresh: refreshTime } = useTimeTracking();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevisions: 0,
    totalDevoirs: 0,
    moyenneRevisions: 0,
    moyenneDevoirs: 0,
    serie: 0,
    questionsReussies: 0,
    questionsTotales: 0,
    meilleureMatiere: '',
    pireMatiere: '',
  });
  const [dernieresSessions, setDernieresSessions] = useState([]);

  useFocusEffect(
    React.useCallback(() => {
      refreshTime();
      chargerDonnees();
    }, [])
  );

  const chargerDonnees = async () => {
    try {
      setLoading(true);
      const sessions = await getSessionsEnfantFirebase(true);
      
      if (sessions.length === 0) {
        setLoading(false);
        return;
      }
      
      const revisions = sessions.filter(s => s.type !== 'devoir');
      const devoirs = sessions.filter(s => s.type === 'devoir');
      
      let totalPointsRevisions = 0, totalQuestionsRevisions = 0;
      let totalPointsDevoirs = 0, totalQuestionsDevoirs = 0;
      let questionsReussies = 0;
      const statsParMatiere = {};
      
      sessions.forEach(s => {
        const isDevoir = s.type === 'devoir';
        if (s.questions) {
          s.questions.forEach(q => {
            const note = q.note || 0;
            if (note === 2) questionsReussies++;
            if (isDevoir) {
              totalPointsDevoirs += note;
              totalQuestionsDevoirs++;
            } else {
              totalPointsRevisions += note;
              totalQuestionsRevisions++;
            }
          });
        }
        
        const matiere = s.matiere || (isDevoir ? 'Devoir' : 'Révision');
        if (!statsParMatiere[matiere]) statsParMatiere[matiere] = { points: 0, questions: 0 };
        if (s.questions) {
          s.questions.forEach(q => {
            statsParMatiere[matiere].points += (q.note || 0);
            statsParMatiere[matiere].questions++;
          });
        }
      });
      
      let meilleureMatiere = '', pireMatiere = '';
      let meilleureNote = 0, pireNote = 2;
      for (const [matiere, data] of Object.entries(statsParMatiere)) {
        const note = data.questions > 0 ? data.points / data.questions : 0;
        if (note > meilleureNote) { meilleureNote = note; meilleureMatiere = matiere; }
        if (note < pireNote && data.questions > 0) { pireNote = note; pireMatiere = matiere; }
      }
      
      const datesUniques = [...new Set(sessions.map(s => new Date(s.date).toLocaleDateString('fr-FR')))].sort();
      let serie = datesUniques.length > 0 ? 1 : 0;
      for (let i = 1; i < datesUniques.length; i++) {
        const diff = (new Date(datesUniques[i]) - new Date(datesUniques[i-1])) / (1000 * 60 * 60 * 24);
        if (diff <= 2) serie++; else serie = 1;
      }
      
      const moyenneRevisions = totalQuestionsRevisions > 0 ? Math.round((totalPointsRevisions / totalQuestionsRevisions) * 10) : 0;
      const moyenneDevoirs = totalQuestionsDevoirs > 0 ? Math.round((totalPointsDevoirs / totalQuestionsDevoirs) * 10) : 0;
      
      const dernieres = sessions.slice(-5).reverse().map(s => {
        const matiereInfo = getMatiereInfoWithFallback(s.matiere || (s.type === 'devoir' ? 'Devoir' : 'Révision'));
        const note = s.scoreTotal ? Math.round((s.scoreTotal / s.scoreMax) * 20) : 0;
        return {
          id: s.id,
          date: new Date(s.date).toLocaleDateString('fr-FR'),
          matiere: s.matiere || (s.type === 'devoir' ? 'Devoir' : 'Révision'),
          note,
          type: s.type || 'revision',
          couleur: matiereInfo.couleur,
          icone: matiereInfo.icone
        };
      });
      
      setStats({
        totalRevisions: revisions.length,
        totalDevoirs: devoirs.length,
        moyenneRevisions,
        moyenneDevoirs,
        serie,
        questionsReussies,
        questionsTotales: totalQuestionsRevisions + totalQuestionsDevoirs,
        meilleureMatiere: meilleureMatiere || 'Aucune',
        pireMatiere: pireMatiere || 'Aucune',
      });
      setDernieresSessions(dernieres);
    } catch (error) {
      console.error('Erreur chargement progression:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNoteColor = (note) => {
    if (note < 10) return '#f44336';
    if (note < 15) return '#FF9800';
    return '#4CAF50';
  };

  if (loading) return <ModernLoader visible={true} type="chart-line" message="Analyse de ta progression..." />;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.header}>
        <Text style={styles.headerTitle}>Ma progression</Text>
        <Text style={styles.headerSubtitle}>{userData?.prenom || 'Élève'}, voici tes statistiques</Text>
      </LinearGradient>

      {/* STATISTIQUES */}
      <View style={styles.statsContainer}>
        <View style={[styles.statBox, { backgroundColor: colors.surface }]}>
          <View style={[styles.statIconBg, { backgroundColor: colors.accent + '20' }]}>
            <MaterialCommunityIcons name="book-open" size={24} color={colors.accent} />
          </View>
          <Text style={[styles.statNumber, { color: colors.text }]}>{stats.totalDevoirs}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Devoirs</Text>
          <Text style={[styles.statNote, { color: getNoteColor(stats.moyenneDevoirs) }]}>{stats.moyenneDevoirs}/20</Text>
        </View>
        
        <View style={[styles.statBox, { backgroundColor: colors.surface }]}>
          <View style={[styles.statIconBg, { backgroundColor: colors.accent + '20' }]}>
            <MaterialCommunityIcons name="repeat" size={24} color={colors.accent} />
          </View>
          <Text style={[styles.statNumber, { color: colors.text }]}>{stats.totalRevisions}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Révisions</Text>
          <Text style={[styles.statNote, { color: getNoteColor(stats.moyenneRevisions) }]}>{stats.moyenneRevisions}/20</Text>
        </View>
        
        <View style={[styles.statBox, { backgroundColor: colors.surface }]}>
          <View style={[styles.statIconBg, { backgroundColor: colors.warning + '20' }]}>
            <MaterialCommunityIcons name="fire" size={24} color={colors.warning} />
          </View>
          <Text style={[styles.statNumber, { color: colors.text }]}>{stats.serie}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Série</Text>
        </View>
        
        <View style={[styles.statBox, { backgroundColor: colors.surface }]}>
          <View style={[styles.statIconBg, { backgroundColor: colors.info + '20' }]}>
            <MaterialCommunityIcons name="clock-outline" size={24} color={colors.info} />
          </View>
          <Text style={[styles.statNumber, { color: colors.text }]}>{timeSummary.global || '0min'}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Temps total</Text>
        </View>
      </View>

      {/* Analyse des matières */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>🏆 Analyse des matières</Text>
        <View style={styles.bestWorstRow}>
          <View style={styles.bestItem}>
            <MaterialCommunityIcons name="trophy" size={20} color={colors.success} />
            <Text style={[styles.bestLabel, { color: colors.textSecondary }]}>Meilleure</Text>
            <Text style={[styles.bestValue, { color: colors.success }]}>{stats.meilleureMatiere}</Text>
          </View>
          <View style={styles.worstItem}>
            <MaterialCommunityIcons name="alert" size={20} color={colors.error} />
            <Text style={[styles.worstLabel, { color: colors.textSecondary }]}>À travailler</Text>
            <Text style={[styles.worstValue, { color: colors.error }]}>{stats.pireMatiere}</Text>
          </View>
        </View>
      </View>

      {/* Taux de réussite */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>📊 Taux de réussite</Text>
        <View style={styles.rateContainer}>
          <View style={styles.rateRow}>
            <Text style={[styles.rateLabel, { color: colors.textSecondary }]}>Questions réussies :</Text>
            <Text style={[styles.rateValue, { color: colors.success }]}>{stats.questionsReussies}</Text>
          </View>
          <View style={styles.rateRow}>
            <Text style={[styles.rateLabel, { color: colors.textSecondary }]}>Questions totales :</Text>
            <Text style={[styles.rateValue, { color: colors.primary }]}>{stats.questionsTotales}</Text>
          </View>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View style={[styles.progressFill, { width: `${stats.questionsTotales > 0 ? (stats.questionsReussies / stats.questionsTotales) * 100 : 0}%`, backgroundColor: colors.success }]} />
          </View>
        </View>
      </View>

      {/* Dernières sessions */}
      {dernieresSessions.length > 0 && (
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>📋 Dernières sessions</Text>
            <TouchableOpacity onPress={() => navigation.navigate('HistoriqueComplet')}>
              <Text style={[styles.sectionLien, { color: colors.primary }]}>Voir tout →</Text>
            </TouchableOpacity>
          </View>
          {dernieresSessions.map((session, index) => (
            <View key={index} style={styles.sessionRow}>
              <Text style={[styles.sessionDate, { color: colors.textSecondary }]}>{session.date}</Text>
              <View style={styles.sessionInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <MaterialCommunityIcons name={session.icone} size={14} color={session.couleur} />
                  <Text style={[styles.sessionMatiere, { color: session.couleur }]}>{session.matiere}</Text>
                  <View style={[styles.typeBadge, { backgroundColor: session.type === 'devoir' ? colors.primary + '20' : colors.accent + '20' }]}>
                    <Text style={[styles.typeText, { color: session.type === 'devoir' ? colors.primary : colors.accent }]}>{session.type === 'devoir' ? '📝' : '📚'}</Text>
                  </View>
                </View>
              </View>
              <Text style={[styles.sessionNote, { color: getNoteColor(session.note) }]}>{session.note}/20</Text>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity style={styles.advancedButton} onPress={() => navigation.navigate('StatistiquesAvancees')}>
        <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.advancedButtonGradient}>
          <Text style={styles.advancedButtonText}>Statistiques détaillées</Text>
          <MaterialCommunityIcons name="arrow-right" size={20} color="white" />
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingBottom: 30, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: 'white', marginBottom: 8 },
  headerSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.9)' },
  statsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: -20, marginBottom: 20 },
  statBox: { width: '48%', padding: 15, borderRadius: 15, alignItems: 'center', marginBottom: 10 },
  statIconBg: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  statNumber: { fontSize: 24, fontWeight: 'bold', marginTop: 4 },
  statLabel: { fontSize: 12, marginTop: 2 },
  statNote: { fontSize: 14, fontWeight: '600', marginTop: 4 },
  section: { marginHorizontal: 20, marginBottom: 20, padding: 20, borderRadius: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionLien: { fontSize: 14, fontWeight: '500' },
  bestWorstRow: { flexDirection: 'row', justifyContent: 'space-around' },
  bestItem: { alignItems: 'center', gap: 4 },
  bestLabel: { fontSize: 12 },
  bestValue: { fontSize: 16, fontWeight: 'bold' },
  worstItem: { alignItems: 'center', gap: 4 },
  worstLabel: { fontSize: 12 },
  worstValue: { fontSize: 16, fontWeight: 'bold' },
  rateContainer: { gap: 10 },
  rateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rateLabel: { fontSize: 14 },
  rateValue: { fontSize: 16, fontWeight: '600' },
  progressBar: { height: 8, borderRadius: 4, marginTop: 10 },
  progressFill: { height: '100%', borderRadius: 4 },
  sessionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  sessionDate: { fontSize: 11, width: 70 },
  sessionInfo: { flex: 1, marginLeft: 8 },
  sessionMatiere: { fontSize: 14, fontWeight: '500' },
  typeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, marginLeft: 6 },
  typeText: { fontSize: 10, fontWeight: '600' },
  sessionNote: { fontSize: 14, fontWeight: 'bold', minWidth: 50, textAlign: 'right' },
  advancedButton: { marginHorizontal: 20, marginBottom: 30, borderRadius: 15, overflow: 'hidden' },
  advancedButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, gap: 10 },
  advancedButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
});
