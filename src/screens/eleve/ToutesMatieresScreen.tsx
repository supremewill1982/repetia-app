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

export default function ToutesMatieresScreen({ navigation }) {
  const { colors } = useTheme();
  const [matieres, setMatieres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, moyenne: 0 });

  useEffect(() => {
    chargerDonnees();
  }, []);

  // Convertir une note sur 2 en note sur 20
  const noteSur20 = (noteSur2) => {
    return Math.round(noteSur2 * 10);
  };

  const chargerDonnees = async () => {
    try {
      setLoading(true);
      const sessions = await getSessionsEnfantFirebase();
      
      if (sessions.length === 0) {
        setLoading(false);
        return;
      }
      
      const statsParMatiere = {};
      
      sessions.forEach(session => {
        const matiere = session.matiere || (session.type === 'devoir' ? 'Devoir' : 'Révision');
        
        if (!statsParMatiere[matiere]) {
          statsParMatiere[matiere] = {
            totalPoints: 0,
            totalQuestions: 0,
            sessions: 0
          };
        }
        
        if (session.questions && session.questions.length > 0) {
          session.questions.forEach(q => {
            statsParMatiere[matiere].totalQuestions++;
            statsParMatiere[matiere].totalPoints += (q.note || 0);
          });
        }
        
        statsParMatiere[matiere].sessions++;
      });

      const matieresData = Object.entries(statsParMatiere)
        .map(([nom, data]) => {
          // Note moyenne sur 2
          const noteMoyenneSur2 = data.totalQuestions > 0 
            ? (data.totalPoints / data.totalQuestions) 
            : 0;
          
          // Convertir en note sur 20
          const noteMoyenneSur20 = noteSur20(noteMoyenneSur2);
          
          // Pourcentage de réussite (déjà sur 100)
          const pourcentage = data.totalQuestions > 0 
            ? Math.round((data.totalPoints / (data.totalQuestions * 2)) * 100) 
            : 0;
          
          const matiereInfo = getMatiereInfoWithFallback(nom);
          
          return {
            nom,
            noteMoyenneSur2: noteMoyenneSur2.toFixed(1),
            noteMoyenneSur20: noteMoyenneSur20,
            pourcentage,
            totalQuestions: data.totalQuestions,
            totalSessions: data.sessions,
            icone: matiereInfo.icone,
            couleur: matiereInfo.couleur
          };
        })
        .sort((a, b) => b.pourcentage - a.pourcentage);

      setMatieres(matieresData);
      
      // Moyenne générale sur 20
      let totalGeneralPoints = 0;
      let totalGeneralQuestions = 0;
      sessions.forEach(s => {
        if (s.questions) {
          s.questions.forEach(q => {
            totalGeneralPoints += (q.note || 0);
            totalGeneralQuestions++;
          });
        }
      });
      const moyenneGeneraleSur2 = totalGeneralQuestions > 0 
        ? (totalGeneralPoints / totalGeneralQuestions) 
        : 0;
      const moyenneGeneraleSur20 = noteSur20(moyenneGeneraleSur2);
      
      setStats({ total: sessions.length, moyenne: moyenneGeneraleSur20 });
      
    } catch (error) {
      console.error('Erreur chargement matières:', error);
    } finally {
      setLoading(false);
    }
  };

  const CarteMatiere = ({ matiere }) => (
    <TouchableOpacity
      style={[styles.matiereCard, { backgroundColor: colors.surface }]}
      onPress={() => {
        feedback('tap');
        navigation.navigate('PrisePhotoCours', { matiere: matiere.nom, type: 'revision' });
      }}
      activeOpacity={0.7}
    >
      <View style={styles.matiereHeader}>
        <View style={[styles.matiereIcone, { backgroundColor: matiere.couleur + '20' }]}>
          <MaterialCommunityIcons name={matiere.icone} size={30} color={matiere.couleur} />
        </View>
        <View style={styles.matiereInfo}>
          <Text style={[styles.matiereNom, { color: colors.text }]}>{matiere.nom}</Text>
          <Text style={[styles.matiereDetail, { color: colors.textSecondary }]}>
            {matiere.totalSessions} séance{matiere.totalSessions > 1 ? 's' : ''} • {matiere.totalQuestions} question{matiere.totalQuestions > 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      <View style={styles.matiereStats}>
        <View style={styles.matiereNoteContainer}>
          <Text style={[styles.matiereNoteLabel, { color: colors.textSecondary }]}>Note moyenne</Text>
          <Text style={[styles.matiereNote, { color: matiere.couleur }]}>{matiere.noteMoyenneSur20}/20</Text>
        </View>

        <View style={styles.matiereProgressContainer}>
          <View style={[styles.matiereProgressBar, { backgroundColor: colors.border }]}>
            <View 
              style={[
                styles.matiereProgressFill, 
                { width: `${matiere.pourcentage}%`, backgroundColor: matiere.couleur }
              ]} 
            />
          </View>
          <Text style={[styles.matiereProgressText, { color: colors.textSecondary }]}>
            {matiere.pourcentage}% de réussite
          </Text>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.matiereBouton, { backgroundColor: matiere.couleur }]}
        onPress={() => {
          feedback('tap');
          navigation.navigate('PrisePhotoCours', { matiere: matiere.nom, type: 'revision' });
        }}
      >
        <Text style={styles.matiereBoutonTexte}>Réviser cette matière</Text>
        <MaterialCommunityIcons name="arrow-right" size={18} color="white" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <ModernLoader 
        visible={true} 
        type="book"
        message="Chargement des matières..."
        subMessage="Analyse de tes performances par matière"
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Toutes les matières</Text>
        <Text style={styles.headerSubtitle}>
          {stats.total} révision{stats.total > 1 ? 's' : ''} • {stats.moyenne}/20 de moyenne
        </Text>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {matieres.length === 0 ? (
          <View style={[styles.emptyContainer, { backgroundColor: colors.surface }]}>
            <MaterialCommunityIcons name="book-open" size={60} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.text }]}>Aucune matière pour le moment</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Fais ta première révision pour voir apparaître les matières
            </Text>
            <TouchableOpacity
              style={[styles.emptyButton, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('ChoixMatiere', { type: 'revision' })}
            >
              <Text style={styles.emptyButtonText}>Commencer une révision</Text>
            </TouchableOpacity>
          </View>
        ) : (
          matieres.map((matiere, index) => (
            <CarteMatiere key={index} matiere={matiere} />
          ))
        )}

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textMuted }]}>
            {matieres.length} matière{matieres.length > 1 ? 's' : ''} suivie{matieres.length > 1 ? 's' : ''}
          </Text>
        </View>
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
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 30 },
  matiereCard: { borderRadius: 20, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  matiereHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  matiereIcone: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  matiereInfo: { flex: 1 },
  matiereNom: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  matiereDetail: { fontSize: 12 },
  matiereStats: { marginBottom: 15 },
  matiereNoteContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  matiereNoteLabel: { fontSize: 13 },
  matiereNote: { fontSize: 18, fontWeight: 'bold' },
  matiereProgressContainer: { gap: 5 },
  matiereProgressBar: { height: 6, borderRadius: 3 },
  matiereProgressFill: { height: '100%', borderRadius: 3 },
  matiereProgressText: { fontSize: 11, textAlign: 'right' },
  matiereBouton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, gap: 8 },
  matiereBoutonTexte: { color: 'white', fontSize: 14, fontWeight: '600' },
  emptyContainer: { padding: 40, borderRadius: 20, alignItems: 'center' },
  emptyText: { fontSize: 18, fontWeight: '600', marginTop: 20, marginBottom: 8 },
  emptySubtext: { fontSize: 14, textAlign: 'center', marginBottom: 25 },
  emptyButton: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  emptyButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  footer: { alignItems: 'center', marginTop: 10 },
  footerText: { fontSize: 12 },
});
