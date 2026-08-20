import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { getSessionsEnfantFirebase } from '../../services/firebaseEnfantService';
import { getMatiereInfoWithFallback } from '../../services/matieresService';
import { useFocusEffect } from '@react-navigation/native';
import ModernLoader from '../../components/ModernLoader';

export default function HistoriqueCompletScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [sessions, setSessions] = useState<any[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [matieres, setMatieres] = useState<string[]>([]);
  const [selectedMatiere, setSelectedMatiere] = useState('all');

  useFocusEffect(
    React.useCallback(() => {
      chargerHistorique();
    }, [])
  );

  useEffect(() => {
    filterSessions();
  }, [searchText, filterType, selectedMatiere, sessions]);

  const chargerHistorique = async () => {
    try {
      setLoading(true);
      const sessionsData = await getSessionsEnfantFirebase(true);

      // Éviter les doublons par ID
      const sessionsMap = new Map();
      sessionsData.forEach(s => {
        if (s && s.id && !sessionsMap.has(s.id)) {
          sessionsMap.set(s.id, s);
        }
      });

      const sessionsUniques = Array.from(sessionsMap.values());

      const sessionsFormatees = sessionsUniques.map(s => {
        const matiereInfo = getMatiereInfoWithFallback(s.matiere || (s.type === 'devoir' ? 'Devoir' : 'Révision'));
        const noteMax = s.scoreMax || 10;
        const noteObtenue = s.scoreTotal || 0;
        const note = Math.round((noteObtenue / noteMax) * 20);
        const dateObj = new Date(s.date);
        const heureDebut = s.heureDebut ? new Date(s.heureDebut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';
        return {
          id: s.id,
          date: !isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString('fr-FR') : 'Date inconnue',
          dateTime: !isNaN(dateObj.getTime()) ? dateObj.toLocaleString('fr-FR') : 'Date inconnue',
          heure: heureDebut,
          matiere: s.matiere || (s.type === 'devoir' ? 'Devoir' : 'Révision'),
          type: s.type || 'revision',
          note: isNaN(note) ? 0 : note,
          scoreTotal: noteObtenue,
          scoreMax: noteMax,
          couleur: matiereInfo.couleur,
          icone: matiereInfo.icone,
          questions: s.questions || []
        };
      });

      // Trier par date décroissante
      sessionsFormatees.sort((a, b) => {
        const dateA = new Date(a.dateTime);
        const dateB = new Date(b.dateTime);
        if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) return 0;
        return dateB.getTime() - dateA.getTime();
      });

      setSessions(sessionsFormatees);

      const matieresUniques = [...new Set(sessionsFormatees.map(s => s.matiere))];
      setMatieres(matieresUniques);
    } catch (error) {
      console.error('Erreur chargement historique:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterSessions = () => {
    let filtered = [...sessions];

    if (searchText.trim()) {
      filtered = filtered.filter(s =>
        s.matiere.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(s => s.type === filterType);
    }

    if (selectedMatiere !== 'all') {
      filtered = filtered.filter(s => s.matiere === selectedMatiere);
    }

    setFilteredSessions(filtered);
  };

  const getNoteColor = (note: number) => {
    if (!note || isNaN(note)) return '#f44336';
    if (note < 10) return '#f44336';
    if (note < 15) return '#FF9800';
    return '#4CAF50';
  };

  const handleSessionPress = (session: any) => {
    // Naviguer vers l'écran de détail avec toutes les questions
    navigation.navigate('DetailsSessionScreen', {
      sessionId: session.id,
      matiere: session.matiere,
      date: session.date,
      questions: session.questions,
      note: session.note
    });
  };

  if (loading) {
    return <ModernLoader visible={true} type="book" message="Chargement de l'historique..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Historique complet</Text>
        <Text style={styles.headerSubtitle}>{filteredSessions.length} sessions</Text>
      </LinearGradient>

      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <View style={[styles.searchBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Rechercher une matière..."
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
            style={[styles.filterChip, filterType === 'all' && { backgroundColor: colors.primary }]}
            onPress={() => setFilterType('all')}
          >
            <Text style={[styles.filterText, filterType === 'all' && { color: 'white' }]}>Tous</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filterType === 'revision' && { backgroundColor: colors.accent }]}
            onPress={() => setFilterType('revision')}
          >
            <Text style={[styles.filterText, filterType === 'revision' && { color: 'white' }]}>📚 Révisions</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filterType === 'devoir' && { backgroundColor: colors.primary }]}
            onPress={() => setFilterType('devoir')}
          >
            <Text style={[styles.filterText, filterType === 'devoir' && { color: 'white' }]}>📝 Devoirs</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, { backgroundColor: colors.info + '20' }]}
            onPress={() => setShowFilterModal(true)}
          >
            <MaterialCommunityIcons name="filter-variant" size={16} color={colors.info} />
            <Text style={[styles.filterText, { color: colors.info }]}>Matière</Text>
          </TouchableOpacity>
        </View>

        {selectedMatiere !== 'all' && (
          <View style={styles.activeFilter}>
            <Text style={[styles.activeFilterText, { color: colors.primary }]}>
              Matière: {selectedMatiere}
            </Text>
            <TouchableOpacity onPress={() => setSelectedMatiere('all')}>
              <MaterialCommunityIcons name="close" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {filteredSessions.length === 0 ? (
          <View style={[styles.emptyContainer, { backgroundColor: colors.surface }]}>
            <MaterialCommunityIcons name="history" size={60} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.text }]}>Aucune session trouvée</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Modifie tes filtres pour voir plus de résultats
            </Text>
          </View>
        ) : (
          filteredSessions.map((session, index) => (
            <TouchableOpacity
              key={session.id || index}
              style={[styles.sessionCard, { backgroundColor: colors.surface }]}
              onPress={() => handleSessionPress(session)}
              activeOpacity={0.7}
            >
              <View style={styles.sessionHeader}>
                <View style={[styles.typeIcon, { backgroundColor: session.type === 'devoir' ? colors.primary + '20' : colors.accent + '20' }]}>
                  <MaterialCommunityIcons name={session.icone} size={20} color={session.couleur} />
                </View>
                <View style={styles.sessionInfo}>
                  <Text style={[styles.sessionMatiere, { color: session.couleur }]}>{session.matiere}</Text>
                  <Text style={[styles.sessionDate, { color: colors.textSecondary }]}>{session.date}</Text>
                </View>
                <View style={[styles.noteContainer, { backgroundColor: getNoteColor(session.note) + '20' }]}>
                  <Text style={[styles.noteText, { color: getNoteColor(session.note) }]}>{session.note}/20</Text>
                </View>
              </View>
              <View style={styles.sessionFooter}>
                <View style={[styles.typeBadge, { backgroundColor: session.type === 'devoir' ? colors.primary + '20' : colors.accent + '20' }]}>
                  <Text style={[styles.typeBadgeText, { color: session.type === 'devoir' ? colors.primary : colors.accent }]}>
                    {session.type === 'devoir' ? 'Devoir' : 'Révision'}
                  </Text>
                </View>
                {session.heure ? (
                  <Text style={[styles.heureText, { color: colors.textMuted }]}>{session.heure}</Text>
                ) : null}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Choisir une matière</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <TouchableOpacity
                style={[styles.matiereOption, selectedMatiere === 'all' && { backgroundColor: colors.primary + '20' }]}
                onPress={() => {
                  setSelectedMatiere('all');
                  setShowFilterModal(false);
                }}
              >
                <Text style={[styles.matiereOptionText, { color: colors.text }]}>Toutes les matières</Text>
              </TouchableOpacity>
              {matieres.map((matiere, idx) => {
                const matiereInfo = getMatiereInfoWithFallback(matiere);
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.matiereOption, selectedMatiere === matiere && { backgroundColor: matiereInfo.couleur + '20' }]}
                    onPress={() => {
                      setSelectedMatiere(matiere);
                      setShowFilterModal(false);
                    }}
                  >
                    <MaterialCommunityIcons name={matiereInfo.icone as any} size={20} color={matiereInfo.couleur} />
                    <Text style={[styles.matiereOptionText, { color: colors.text }]}>{matiere}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 50, paddingBottom: 25, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: 'white', marginBottom: 5 },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.9)' },
  searchContainer: { marginHorizontal: 16, marginTop: -20, padding: 12, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  searchBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
  filterRow: { flexDirection: 'row', marginTop: 12, gap: 10, flexWrap: 'wrap' },
  filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f0f0f0', gap: 4 },
  filterText: { fontSize: 12, fontWeight: '500' },
  activeFilter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#e3f2fd', borderRadius: 20 },
  activeFilterText: { fontSize: 12, fontWeight: '500' },
  scrollContent: { padding: 16, paddingBottom: 30 },
  emptyContainer: { padding: 40, borderRadius: 20, alignItems: 'center' },
  emptyText: { fontSize: 18, fontWeight: '600', marginTop: 20, marginBottom: 8 },
  emptySubtext: { fontSize: 14, textAlign: 'center', paddingHorizontal: 20 },
  sessionCard: { borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  sessionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  typeIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  sessionInfo: { flex: 1 },
  sessionMatiere: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  sessionDate: { fontSize: 12, color: '#888' },
  noteContainer: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 15 },
  noteText: { fontSize: 14, fontWeight: 'bold' },
  sessionFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  typeBadgeText: { fontSize: 11, fontWeight: '600' },
  heureText: { fontSize: 11, color: '#888' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  matiereOption: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, gap: 12, marginBottom: 8 },
  matiereOptionText: { fontSize: 16, fontWeight: '500' },
});
