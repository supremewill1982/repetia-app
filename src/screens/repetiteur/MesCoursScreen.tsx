import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/firebaseConfig';
import { collection, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const MesCoursScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const { userId } = useAuth();
  const [cours, setCours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCours();
  }, [userId]);

  const fetchCours = async () => {
    try {
      setLoading(true);
      if (!userId) return;

      const q = query(collection(db, 'contributions'), where('auteur.userId', '==', userId));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCours(data);
    } catch (error) {
      console.error('Erreur chargement cours:', error);
      Alert.alert('Erreur', 'Impossible de charger vos cours');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Supprimer le cours',
      'Êtes-vous sûr de vouloir supprimer ce cours ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'contributions', id));
              setCours(cours.filter(c => c.id !== id));
              Alert.alert('Succès', 'Cours supprimé avec succès');
            } catch (error) {
              console.error('Erreur suppression:', error);
              Alert.alert('Erreur', 'Impossible de supprimer le cours');
            }
          }
        }
      ]
    );
  };

  const getStatutColor = (statut: string) => {
    const colorsMap: Record<string, string> = {
      en_attente: colors.warning,
      en_modération: colors.info,
      validé: colors.success,
      rejeté: colors.error,
      modification_demandée: colors.warning,
    };
    return colorsMap[statut] || colors.textMuted;
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Mes Contributions</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('ContribuerCours')}
        >
          <MaterialCommunityIcons name="plus" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {cours.length === 0 ? (
        <View style={[styles.emptyContainer, { backgroundColor: colors.surface }]}>
          <MaterialCommunityIcons name="file-document-outline" size={48} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            Vous n'avez aucune contribution
          </Text>
          <TouchableOpacity
            style={[styles.emptyButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('ContribuerCours')}
          >
            <Text style={styles.emptyButtonText}>Ajouter une contribution</Text>
          </TouchableOpacity>
        </View>
      ) : (
        cours.map((coursItem) => (
          <View key={coursItem.id} style={[styles.coursCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity
              style={styles.coursHeader}
              onPress={() => navigation.navigate('ContributionDetails', { contributionId: coursItem.id })}
            >
              <View style={styles.coursInfo}>
                <Text style={[styles.coursTitle, { color: colors.text }]} numberOfLines={1}>
                  {coursItem.titre}
                </Text>
                <Text style={[styles.coursMeta, { color: colors.textMuted }]}>
                  {coursItem.matiere} - {coursItem.niveau}
                </Text>
                <View style={styles.coursTags}>
                  {coursItem.tags.slice(0, 3).map((tag: string) => (
                    <View key={tag} style={[styles.tag, { backgroundColor: colors.primary + '20' }]}>
                      <Text style={[styles.tagText, { color: colors.primary }]}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View style={[styles.statutBadge, { backgroundColor: getStatutColor(coursItem.statut) + '20' }]}>
                <Text style={[styles.statutText, { color: getStatutColor(coursItem.statut) }]}>
                  {coursItem.statut.replace('_', ' ')}
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.coursStats}>
              <View style={styles.stat}>
                <MaterialCommunityIcons name="download" size={16} color={colors.textMuted} />
                <Text style={[styles.statValue, { color: colors.text }]}>{coursItem.telechargements || 0}</Text>
              </View>
              <View style={styles.stat}>
                <MaterialCommunityIcons name="currency-usd" size={16} color={colors.success} />
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {(coursItem.revenus_generes || 0).toLocaleString()} FCFA
                </Text>
              </View>
              <View style={styles.stat}>
                <MaterialCommunityIcons name="star" size={16} color="#FFD700" />
                <Text style={[styles.statValue, { color: colors.text }]}>{coursItem.notes_moyenne || 0}/5</Text>
              </View>
            </View>

            <View style={styles.coursActions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.info + '20' }]}
                onPress={() => navigation.navigate('EditContribution', { contributionId: coursItem.id })}
              >
                <MaterialCommunityIcons name="pencil" size={16} color={colors.info} />
                <Text style={[styles.actionButtonText, { color: colors.info }]}>Modifier</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.error + '20' }]}
                onPress={() => handleDelete(coursItem.id)}
              >
                <MaterialCommunityIcons name="delete" size={16} color={colors.error} />
                <Text style={[styles.actionButtonText, { color: colors.error }]}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  coursCard: {
    padding: 16,
    marginBottom: 1,
    borderBottomWidth: 1,
  },
  coursHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  coursTags: {
    flexDirection: 'row',
    marginTop: 8,
  },
  tag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 4,
  },
  tagText: {
    fontSize: 10,
  },
  statutBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statutText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  coursStats: {
    flexDirection: 'row',
    marginTop: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statValue: {
    marginLeft: 4,
    fontSize: 12,
  },
  coursActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  actionButtonText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '500',
  },
});

export default MesCoursScreen;
