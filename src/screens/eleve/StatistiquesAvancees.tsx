import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { getSessionsEnfantFirebase } from '../../services/firebaseEnfantService';
import { getMatiereInfoWithFallback } from '../../services/matieresService';
import { useTimeTracking } from '../../hooks/useTimeTracking';
import { useFocusEffect } from '@react-navigation/native';
import ModernLoader from '../../components/ModernLoader';

export default function StatistiquesAvancees({ navigation }: any) {
  const { colors } = useTheme();
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const { timeSummary, timePerSubject, refresh: refreshTime } = useTimeTracking();
  const [stats, setStats] = useState({
    totalSessions: 0, totalQuestions: 0, moyenneGlobale: 0,
    devoirs: { count: 0, moyenne: 0, questions: 0 },
    revisions: { count: 0, moyenne: 0, questions: 0 },
      performancesParMatiere: [] as any[],
      dernieresSessions: [] as any[]
  });
  const [showAllPerf, setShowAllPerf] = useState(false);
  const [showAllSessions, setShowAllSessions] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      refreshTime();
      chargerStatistiques();
      
      const interval = setInterval(() => {
        refreshTime();
      }, 10000);
      
      return () => clearInterval(interval);
    }, [])
  );

  const noteSur20 = (noteSur2: number) => Math.round(noteSur2 * 10);
  const getNoteColor = (note: number) => {
    if (note < 10) return '#f44336';
    if (note < 15) return '#FF9800';
    return '#4CAF50';
  };

  const chargerStatistiques = async () => {
    try {
      setLoading(true);
      
      const sessions = await getSessionsEnfantFirebase(true);
      if (sessions.length === 0) { setLoading(false); return; }

      let totalPointsDevoirs = 0, totalQuestionsDevoirs = 0, devoirsCount = 0;
      let totalPointsRevisions = 0, totalQuestionsRevisions = 0, revisionsCount = 0;
      const statsParMatiere: Record<string, { questions: number; points: number }> = {};

      sessions.forEach(session => {
        const isDevoir = session.type === 'devoir';
        if (isDevoir) devoirsCount++;
        else revisionsCount++;
        
        if (session.questions) {
          session.questions.forEach(q => {
            const note = q.note || 0;
            if (isDevoir) { totalPointsDevoirs += note; totalQuestionsDevoirs++; }
            else { totalPointsRevisions += note; totalQuestionsRevisions++; }
          });
        }
        
        const matiere = session.matiere || (isDevoir ? 'Devoir' : 'Révision');
        if (!statsParMatiere[matiere]) statsParMatiere[matiere] = { questions: 0, points: 0 };
        session.questions?.forEach(q => {
          statsParMatiere[matiere].questions++;
          statsParMatiere[matiere].points += (q.note || 0);
        });
      });

      const moyenneDevoirs = totalQuestionsDevoirs > 0 ? noteSur20(totalPointsDevoirs / totalQuestionsDevoirs) : 0;
      const moyenneRevisions = totalQuestionsRevisions > 0 ? noteSur20(totalPointsRevisions / totalQuestionsRevisions) : 0;
      const moyenneGlobale = (totalPointsDevoirs + totalPointsRevisions) > 0 ? Math.round(((totalPointsDevoirs + totalPointsRevisions) / ((totalQuestionsDevoirs + totalQuestionsRevisions) * 2)) * 20) : 0;

      const performancesParMatiere = Object.entries(statsParMatiere)
        .map(([nom, data]) => {
          const noteSur2 = data.questions > 0 ? data.points / data.questions : 0;
          const note = noteSur20(noteSur2);
          const matiereInfo = getMatiereInfoWithFallback(nom);
          return { nom, note, pourcentage: Math.round((data.points / (data.questions * 2)) * 100), icone: matiereInfo.icone, couleur: matiereInfo.couleur, totalQuestions: data.questions, points: data.points };
        })
        .sort((a, b) => b.note - a.note);

      const dernieresSessions = sessions.slice(-8).reverse().map(s => {
        const matiereInfo = getMatiereInfoWithFallback(s.matiere || (s.type === 'devoir' ? 'Devoir' : 'Révision'));
        const note = s.scoreTotal && s.scoreMax ? noteSur20(s.scoreTotal / s.scoreMax) : 0;
          const heureDebut = s.date ? new Date(s.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';
        return { 
          id: s.id,
          date: new Date(s.date).toLocaleDateString('fr-FR'), 
          heure: heureDebut,
          matiere: s.matiere || (s.type === 'devoir' ? 'Devoir' : 'Révision'), 
          note, 
          type: s.type || 'revision', 
          couleur: matiereInfo.couleur, 
          icone: matiereInfo.icone
        };
      });

      setStats({ totalSessions: sessions.length, totalQuestions: totalQuestionsDevoirs + totalQuestionsRevisions, moyenneGlobale, devoirs: { count: devoirsCount, moyenne: moyenneDevoirs, questions: totalQuestionsDevoirs }, revisions: { count: revisionsCount, moyenne: moyenneRevisions, questions: totalQuestionsRevisions }, performancesParMatiere, dernieresSessions });
    } catch (error) { console.error('Erreur:', error); } finally { setLoading(false); }
  };

  if (loading) return <ModernLoader visible={true} type="brain" message="Analyse des statistiques..." />;

  const displayedPerf = showAllPerf ? stats.performancesParMatiere : stats.performancesParMatiere.slice(0, 5);
  const displayedSessions = showAllSessions ? stats.dernieresSessions : stats.dernieresSessions.slice(0, 5);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Statistiques avancées</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>{String(userData?.prenom || "Élève")}, ta progression en détail</Text>
      </LinearGradient>

      {/* Section Temps - 4 indicateurs */}
      <View style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>⏱️ TEMPS PASSÉ</Text>
        <View style={styles.tempsGrid}>
          <View style={styles.tempsItem}>
            <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.tempsIconBg}>
              <MaterialCommunityIcons name="clock-outline" size={20} color="white" />
            </LinearGradient>
            <Text style={[styles.tempsValue, { color: colors.primary }]}>{timeSummary.global}</Text>
            <Text style={[styles.tempsLabel, { color: colors.textSecondary }]}>Total</Text>
          </View>
          <View style={styles.tempsItem}>
            <LinearGradient colors={['#4CAF50', '#66BB6A']} style={styles.tempsIconBg}>
              <MaterialCommunityIcons name="book-open" size={20} color="white" />
            </LinearGradient>
            <Text style={[styles.tempsValue, { color: '#4CAF50' }]}>{timeSummary.revisions}</Text>
            <Text style={[styles.tempsLabel, { color: colors.textSecondary }]}>Révisions</Text>
          </View>
          <View style={styles.tempsItem}>
            <LinearGradient colors={['#FF9800', '#FFB74D']} style={styles.tempsIconBg}>
              <MaterialCommunityIcons name="file-document" size={20} color="white" />
            </LinearGradient>
            <Text style={[styles.tempsValue, { color: '#FF9800' }]}>{timeSummary.devoirs}</Text>
            <Text style={[styles.tempsLabel, { color: colors.textSecondary }]}>Devoirs</Text>
          </View>
          <View style={styles.tempsItem}>
            <LinearGradient colors={['#2196F3', '#64B5F6']} style={styles.tempsIconBg}>
              <MaterialCommunityIcons name="compass" size={20} color="white" />
            </LinearGradient>
            <Text style={[styles.tempsValue, { color: '#2196F3' }]}>{timeSummary.navigation}</Text>
            <Text style={[styles.tempsLabel, { color: colors.textSecondary }]}>Navigation</Text>
          </View>
        </View>
      </View>

      {/* Temps par matière */}
      {timePerSubject.length > 0 && (
        <View style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeaderWithButton}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>📊 Temps par matière</Text>
            {timePerSubject.length > 5 && (
              <TouchableOpacity onPress={() => navigation.navigate('ToutesMatieres')}>
                <Text style={[styles.voirToutText, { color: colors.primary }]}>Voir tout →</Text>
              </TouchableOpacity>
            )}
          </View>
          {timePerSubject.slice(0, 5).map((item, idx) => (
            <View key={idx} style={styles.tempsMatiereRow}>
              <Text style={[styles.tempsMatiereNom, { color: colors.text }]}>{item.matiere}</Text>
              <View style={styles.tempsMatiereBarres}>
                <View style={[styles.tempsMatiereBarre, { backgroundColor: '#4CAF50', width: `${Math.min((item.revision / (item.total || 1)) * 100, 100)}%` }]} />
                <View style={[styles.tempsMatiereBarre, { backgroundColor: '#FF9800', width: `${Math.min((item.devoir / (item.total || 1)) * 100, 100)}%` }]} />
              </View>
              <Text style={[styles.tempsMatiereTotal, { color: colors.textSecondary }]}>{Math.round(item.total)}min</Text>
            </View>
          ))}
        </View>
      )}

      {/* Performances par matière */}
      {stats.performancesParMatiere.length > 0 && (
        <View style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeaderWithButton}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>📈 Performances par matière</Text>
            {stats.performancesParMatiere.length > 5 && (
              <TouchableOpacity onPress={() => setShowAllPerf(!showAllPerf)}>
                <Text style={[styles.voirToutText, { color: colors.primary }]}>{showAllPerf ? 'Voir moins ↑' : 'Voir tout →'}</Text>
              </TouchableOpacity>
            )}
          </View>
          {displayedPerf.map((matiere, idx) => (
            <View key={idx} style={styles.matiereRow}>
              <View style={styles.matiereHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <MaterialCommunityIcons name={matiere.icone} size={16} color={matiere.couleur} />
                  <Text style={[styles.matiereNom, { color: colors.text }]}>{matiere.nom}</Text>
                </View>
                <Text style={[styles.matiereNote, { color: getNoteColor(matiere.note) }]}>{matiere.note}/20</Text>
              </View>
              <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                <View style={[styles.progressFill, { width: `${matiere.pourcentage}%`, backgroundColor: getNoteColor(matiere.note) }]} />
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Dernières sessions */}
      {stats.dernieresSessions.length > 0 && (
        <View style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeaderWithButton}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>📋 Dernières sessions</Text>
            {stats.dernieresSessions.length > 5 && (
              <TouchableOpacity onPress={() => navigation.navigate('HistoriqueComplet')}>
                <Text style={[styles.voirToutText, { color: colors.primary }]}>Voir tout →</Text>
              </TouchableOpacity>
            )}
          </View>
          {displayedSessions.map((session, index) => (
            <View key={index} style={styles.sessionRow}>
              <View style={styles.sessionDateContainer}>
                <Text style={[styles.sessionDate, { color: colors.textSecondary }]}>{session.date}</Text>
                {session.heure && <Text style={[styles.sessionHeure, { color: colors.textMuted }]}>{session.heure}</Text>}
              </View>
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

      <TouchableOpacity style={styles.backButtonBottom} onPress={() => navigation.goBack()}>
        <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.backButtonGradient}>
          <MaterialCommunityIcons name="arrow-left" size={20} color="white" />
          <Text style={styles.backButtonText}>Retour</Text>
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 50, paddingBottom: 25, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: 'white', marginBottom: 5 },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.9)' },
  sectionCard: { marginHorizontal: 16, marginBottom: 16, padding: 20, borderRadius: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  sectionHeaderWithButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  voirToutText: { fontSize: 13, fontWeight: '500' },
  tempsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', gap: 16 },
  tempsItem: { alignItems: 'center', width: '22%' },
  tempsIconBg: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  tempsValue: { fontSize: 18, fontWeight: 'bold' },
  tempsLabel: { fontSize: 10, marginTop: 2 },
  tempsMatiereRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  tempsMatiereNom: { fontSize: 13, fontWeight: '500', width: 90 },
  tempsMatiereBarres: { flex: 1, height: 8, backgroundColor: '#eee', borderRadius: 4, marginHorizontal: 8, flexDirection: 'row', overflow: 'hidden' },
  tempsMatiereBarre: { height: '100%' },
  tempsMatiereTotal: { fontSize: 11, width: 45, textAlign: 'right' },
  matiereRow: { marginBottom: 16 },
  matiereHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  matiereNom: { fontSize: 14, fontWeight: '500' },
  matiereNote: { fontSize: 16, fontWeight: 'bold' },
  progressBar: { height: 6, borderRadius: 3 },
  progressFill: { height: '100%', borderRadius: 3 },
  sessionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  sessionDateContainer: { width: 70 },
  sessionDate: { fontSize: 11 },
  sessionHeure: { fontSize: 9, marginTop: 2 },
  sessionInfo: { flex: 1, marginLeft: 8 },
  sessionMatiere: { fontSize: 13, fontWeight: '500' },
  typeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, marginLeft: 6 },
  typeText: { fontSize: 10, fontWeight: '600' },
  sessionNote: { fontSize: 14, fontWeight: 'bold', minWidth: 45, textAlign: 'right' },
  backButtonBottom: { marginHorizontal: 16, marginBottom: 30, borderRadius: 16, overflow: 'hidden' },
  backButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, gap: 8 },
  backButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
});
