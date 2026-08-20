import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { getContributionsValidees } from '../../services/contributionService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { Alert } from 'react-native';

const MATIERES = ['Mathématiques', 'Physique-Chimie', 'Français', 'Anglais', 'Histoire-Géographie', 'SVT', 'Philosophie', 'Informatique'];
const NIVEAUX = ['6ème', '5ème', '4ème', '3ème', 'Seconde', '1ère', 'Terminale'];

const GestionCoursScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const [cours, setCours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStats, setShowStats] = useState(false);
  const [filterMatiere, setFilterMatiere] = useState<string>('toutes');
  const [filterNiveau, setFilterNiveau] = useState<string>('tous');

  useEffect(() => {
    fetchCours();
  }, [filterMatiere, filterNiveau]);

  const fetchCours = async () => {
    try {
      setLoading(true);
      let data = await getContributionsValidees();

      if (filterMatiere !== 'toutes') {
        data = data.filter(c => c.matiere === filterMatiere);
      }
      if (filterNiveau !== 'tous') {
        data = data.filter(c => c.niveau === filterNiveau);
      }

      setCours(data);
    } catch (error) {
      console.error('Erreur chargement cours:', error);
      Alert.alert('Erreur', 'Impossible de charger les cours');
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: cours.length,
    parMatiere: MATIERES.map(matiere => ({
      matiere,
      count: cours.filter(c => c.matiere === matiere).length
    })).filter(s => s.count > 0),
    parNiveau: NIVEAUX.map(niveau => ({
      niveau,
      count: cours.filter(c => c.niveau === niveau).length
    })).filter(s => s.count > 0),
    telechargements: cours.reduce((sum, c) => sum + (c.telechargements || 0), 0),
    revenus: cours.reduce((sum, c) => sum + (c.revenus_generes || 0), 0),
  };

  const handleDesactiverCours = (id: string) => {
    Alert.alert(
      'Désactiver le cours',
      'Êtes-vous sûr de vouloir désactiver ce cours ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Désactiver',
          style: 'destructive',
          onPress: () => {
            setCours(cours.map(c => c.id === id ? {...c, statut: 'désactivé'} : c));
            Alert.alert('Succès', 'Cours désactivé');
          }
        }
      ]
    );
  };

  const handleActiverCours = (id: string) => {
    Alert.alert(
      'Activer le cours',
      'Êtes-vous sûr de vouloir activer ce cours ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Activer',
          onPress: () => {
            setCours(cours.map(c => c.id === id ? {...c, statut: 'validé'} : c));
            Alert.alert('Succès', 'Cours activé');
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Gestion des Cours</Text>
        <TouchableOpacity onPress={() => setShowStats(!showStats)}>
          <MaterialCommunityIcons name="chart-bar" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.filters, { backgroundColor: colors.surface }]}>
        <View style={styles.filterGroup}>
          <Text style={[styles.filterLabel, { color: colors.text }]}>Matière:</Text>
          <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Picker
              selectedValue={filterMatiere}
              onValueChange={(itemValue) => setFilterMatiere(itemValue)}
              style={{ color: colors.text, width: 150 }}
            >
              <Picker.Item label="Toutes" value="toutes" />
              {MATIERES.map((m) => (
                <Picker.Item key={m} label={m} value={m} />
              ))}
            </Picker>
          </View>
        </View>
        <View style={styles.filterGroup}>
          <Text style={[styles.filterLabel, { color: colors.text }]}>Niveau:</Text>
          <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Picker
              selectedValue={filterNiveau}
              onValueChange={(itemValue) => setFilterNiveau(itemValue)}
              style={{ color: colors.text, width: 150 }}
            >
              <Picker.Item label="Tous" value="tous" />
              {NIVEAUX.map((n) => (
                <Picker.Item key={n} label={n} value={n} />
              ))}
            </Picker>
          </View>
        </View>
      </View>

      {showStats && (
        <View style={[styles.statsContainer, { backgroundColor: colors.surface }]}>
          <Text style={[styles.statsTitle, { color: colors.text }]}>Statistiques</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.primary + '10' }]}>
              <MaterialCommunityIcons name="file-document-multiple" size={24} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.total}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Total cours</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.success + '10' }]}>
              <MaterialCommunityIcons name="download" size={24} color={colors.success} />
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.telechargements}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Téléchargements</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.info + '10' }]}>
              <MaterialCommunityIcons name="currency-usd" size={24} color={colors.info} />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {stats.revenus.toLocaleString()} FCFA
              </Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Revenus</Text>
            </View>
          </View>

          <Text style={[styles.statsSubtitle, { color: colors.text, marginTop: 16 }]}>Par matière</Text>
          <View style={styles.statsBarContainer}>
            {stats.parMatiere.map((s) => (
              <View key={s.matiere} style={styles.statsBarItem}>
                <Text style={[styles.statsBarLabel, { color: colors.text }]}>{s.matiere}</Text>
                <View style={styles.statsBar}>
                  <View style={[styles.statsBarFill, {
                    width: `${(s.count / stats.total) * 100}%`,
                    backgroundColor: colors.primary
                  }]} />
                </View>
                <Text style={[styles.statsBarValue, { color: colors.textMuted }]}>{s.count}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <ScrollView style={styles.listContainer}>
        {loading ? (
          <View style={[styles.loadingContainer, { backgroundColor: colors.surface }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ color: colors.textMuted, marginTop: 8 }}>Chargement...</Text>
          </View>
        ) : cours.length === 0 ? (
          <View style={[styles.emptyContainer, { backgroundColor: colors.surface }]}>
            <MaterialCommunityIcons name="file-document-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Aucun cours trouvé
            </Text>
          </View>
        ) : (
          cours.map((coursItem) => {
            const estActif = coursItem.statut === 'validé';
            return (
              <View key={coursItem.id} style={[styles.coursCard, {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                opacity: estActif ? 1 : 0.7
              }]}>
                <View style={styles.coursInfo}>
                  <Text style={[styles.coursTitle, { color: colors.text }]} numberOfLines={1}>
                    {coursItem.titre}
                  </Text>
                  <Text style={[styles.coursMeta, { color: colors.textMuted }]}>
                    {coursItem.matiere} - {coursItem.niveau}
                  </Text>
                  <Text style={[styles.coursMeta, { color: colors.textMuted }]}>
                    Auteur: {coursItem.auteur.nom} ({coursItem.auteur.role})
                  </Text>
                  <View style={styles.coursStats}>
                    <View style={styles.coursStat}>
                      <MaterialCommunityIcons name="download" size={14} color={colors.textMuted} />
                      <Text style={[styles.coursStatValue, { color: colors.text }]}>{coursItem.telechargements || 0}</Text>
                    </View>
                    <View style={styles.coursStat}>
                      <MaterialCommunityIcons name="currency-usd" size={14} color={colors.success} />
                      <Text style={[styles.coursStatValue, { color: colors.text }]}>
                        {(coursItem.revenus_generes || 0).toLocaleString()} FCFA
                      </Text>
                    </View>
                    <View style={styles.coursStat}>
                      <MaterialCommunityIcons name="star" size={14} color="#FFD700" />
                      <Text style={[styles.coursStatValue, { color: colors.text }]}>
                        {coursItem.notes_moyenne || 0}/5
                      </Text>
                    </View>
                  </View>
                  <View style={styles.coursTags}>
                    {coursItem.tags.slice(0, 3).map((tag: string) => (
                      <View key={tag} style={[styles.tag, { backgroundColor: colors.primary + '20' }]}>
                        <Text style={[styles.tagText, { color: colors.primary }]}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <View style={styles.coursActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.info + '20' }]}
                    onPress={() => navigation.navigate('ContributionDetails', { contributionId: coursItem.id })}
                  >
                    <MaterialCommunityIcons name="eye" size={18} color={colors.info} />
                  </TouchableOpacity>
                  {estActif ? (
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colors.warning + '20' }]}
                      onPress={() => handleDesactiverCours(coursItem.id)}
                    >
                      <MaterialCommunityIcons name="pause" size={18} color={colors.warning} />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colors.success + '20' }]}
                      onPress={() => handleActiverCours(coursItem.id)}
                    >
                      <MaterialCommunityIcons name="play" size={18} color={colors.success} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    borderBottomWidth: 1,
  },
  filterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  filterLabel: {
    marginRight: 8,
    fontSize: 14,
  },
  pickerContainer: {
    borderRadius: 8,
    borderWidth: 1,
  },
  listContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    borderRadius: 12,
    margin: 16,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  statsContainer: {
    padding: 16,
    borderBottomWidth: 1,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statsSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 16,
    marginBottom: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    width: '30%',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  statsBarContainer: {
    marginTop: 8,
  },
  statsBarItem: {
    marginBottom: 8,
  },
  statsBarLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statsBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 4,
  },
  statsBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  statsBarValue: {
    fontSize: 12,
    textAlign: 'right',
  },
  coursCard: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 1,
    borderBottomWidth: 1,
  },
  coursInfo: {
    flex: 1,
  },
  coursTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  coursMeta: {
    fontSize: 14,
    marginTop: 2,
  },
  coursStats: {
    flexDirection: 'row',
    marginTop: 8,
  },
  coursStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  coursStatValue: {
    marginLeft: 4,
    fontSize: 12,
  },
  coursTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 4,
    marginTop: 4,
  },
  tagText: {
    fontSize: 10,
  },
  coursActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
    borderRadius: 6,
  },
});

export default GestionCoursScreen;
