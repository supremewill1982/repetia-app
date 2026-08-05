import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, TextInput, Alert
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { db } from '../../services/firebaseConfig';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

const ModerationScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const [contributions, setContributions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatut, setFilterStatut] = useState<string>('en_attente');
  const [selectedContribution, setSelectedContribution] = useState<any>(null);
  const [commentaire, setCommentaire] = useState('');
  const [action, setAction] = useState<string>('valider');
  const [submitting, setSubmitting] = useState(false);

  const STATUTS = [
    { label: 'En attente', value: 'en_attente' },
    { label: 'En modération', value: 'en_modération' },
    { label: 'Modification demandée', value: 'modification_demandée' },
    { label: 'Validé', value: 'validé' },
    { label: 'Rejeté', value: 'rejeté' },
  ];

  const ACTIONS = [
    { label: 'Valider', value: 'valider' },
    { label: 'Rejeter', value: 'rejeter' },
    { label: 'Demander modification', value: 'modification_demandée' },
  ];

  useEffect(() => {
    fetchContributions();
  }, [filterStatut]);

  const fetchContributions = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'contributions'),
        where('statut', '==', filterStatut)
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setContributions(data);
    } catch (error) {
      console.error('Erreur chargement contributions:', error);
      Alert.alert('Erreur', 'Impossible de charger les contributions');
    } finally {
      setLoading(false);
    }
  };

  const handleModerer = async () => {
    if (!selectedContribution) return;

    if (action === 'rejeter' && !commentaire.trim()) {
      Alert.alert('Erreur', 'Veuillez fournir un commentaire pour le rejet');
      return;
    }

    setSubmitting(true);
    try {
      const nouveauStatut = action === 'valider' ? 'validé' : action;

      await updateDoc(doc(db, 'contributions', selectedContribution.id), {
        statut: nouveauStatut,
        commentaire_modération: action !== 'valider' ? commentaire.trim() : null,
        date_modération: new Date(),
        modérateur_id: 'admin_1',
      });

      Alert.alert('Succès', `Contribution ${nouveauStatut} avec succès`);
      setSelectedContribution(null);
      setCommentaire('');
      setAction('valider');
      fetchContributions();
    } catch (error) {
      console.error('Erreur modération:', error);
      Alert.alert('Erreur', 'Impossible de modérer la contribution');
    } finally {
      setSubmitting(false);
    }
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Modération</Text>
        <View />
      </View>

      <View style={[styles.filters, { backgroundColor: colors.surface }]}>
        <Text style={[styles.filterLabel, { color: colors.text }]}>Statut:</Text>
        <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Picker
            selectedValue={filterStatut}
            onValueChange={(itemValue) => setFilterStatut(itemValue)}
            style={{ color: colors.text, width: 180 }}
          >
            {STATUTS.map((s) => (
              <Picker.Item key={s.value} label={s.label} selectedValue={s.value} />
            ))}
          </Picker>
        </View>
      </View>

      {loading ? (
        <View style={[styles.loadingContainer, { backgroundColor: colors.surface }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.textMuted, marginTop: 8 }}>Chargement...</Text>
        </View>
      ) : contributions.length === 0 ? (
        <View style={[styles.emptyContainer, { backgroundColor: colors.surface }]}>
          <MaterialCommunityIcons name="file-document-outline" size={48} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            Aucune contribution à modérer
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.listContainer}>
          {contributions.map((contrib) => (
            <TouchableOpacity
              key={contrib.id}
              style={[styles.contribCard, {
                backgroundColor: colors.surface,
                borderColor: colors.border
              }]}
              onPress={() => {
                setSelectedContribution(contrib);
                setAction('valider');
              }}
            >
              <View style={styles.contribInfo}>
                <Text style={[styles.contribTitle, { color: colors.text }]} numberOfLines={1}>
                  {contrib.titre}
                </Text>
                <Text style={[styles.contribMeta, { color: colors.textMuted }]}>
                  {contrib.matiere} - {contrib.niveau}
                </Text>
                <Text style={[styles.contribAuthor, { color: colors.textMuted }]}>
                  Auteur: {contrib.auteur.nom} {contrib.auteur.prenom}
                </Text>
                <View style={[styles.contribStatut, { backgroundColor: getStatutColor(contrib.statut) + '20' }]}>
                  <Text style={[styles.contribStatutText, { color: getStatutColor(contrib.statut) }]}>
                    {contrib.statut.replace('_', ' ')}
                  </Text>
                </View>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {selectedContribution && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <ScrollView>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Modérer: {selectedContribution.titre}
              </Text>

              <View style={[styles.contribDetails, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Matière:</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {selectedContribution.matiere} - {selectedContribution.niveau}
                </Text>

                <Text style={[styles.detailLabel, { color: colors.textMuted, marginTop: 8 }]}>Auteur:</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {selectedContribution.auteur.nom} {selectedContribution.auteur.prenom}
                </Text>

                <Text style={[styles.detailLabel, { color: colors.textMuted, marginTop: 8 }]}>Description:</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {selectedContribution.description || 'Aucune description'}
                </Text>

                <Text style={[styles.detailLabel, { color: colors.textMuted, marginTop: 8 }]}>Tags:</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {selectedContribution.tags?.join(', ') || 'Aucun'}
                </Text>

                <Text style={[styles.detailLabel, { color: colors.textMuted, marginTop: 8 }]}>Prix:</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {selectedContribution.prix.toLocaleString()} FCFA
                </Text>
              </View>

              {action !== 'valider' && (
                <View style={styles.commentaireContainer}>
                  <Text style={[styles.commentaireLabel, { color: colors.text }]}>Commentaire</Text>
                  <TextInput
                    style={[styles.commentaireInput, {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      color: colors.text
                    }]}
                    placeholder="Expliquez la raison du rejet ou de la demande de modification..."
                    placeholderTextColor={colors.textMuted}
                    selectedValue={commentaire}
                    onChangeText={setCommentaire}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>
              )}

              <Text style={[styles.actionLabel, { color: colors.text, marginTop: 16 }]}>Action:</Text>
              <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border, marginBottom: 16 }]}>
                <Picker
                  selectedValue={action}
                  onValueChange={(itemValue) => setAction(itemValue)}
                  style={{ color: colors.text }}
                >
                  {ACTIONS.map((a) => (
                    <Picker.Item key={a.value} label={a.label} selectedValue={a.value} />
                  ))}
                </Picker>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.textMuted + '20' }]}
                  onPress={() => {
                    setSelectedContribution(null);
                    setCommentaire('');
                    setAction('valider');
                  }}
                >
                  <Text style={[styles.modalButtonText, { color: colors.text }]}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.primary }]}
                  onPress={handleModerer}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.modalButtonText}>Appliquer</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      )}
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
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
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
  contribCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 1,
    borderBottomWidth: 1,
  },
  contribInfo: {
    flex: 1,
  },
  contribTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  contribMeta: {
    fontSize: 14,
    marginTop: 2,
  },
  contribAuthor: {
    fontSize: 12,
    marginTop: 2,
  },
  contribStatut: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  contribStatutText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  contribDetails: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    marginTop: 4,
  },
  commentaireContainer: {
    marginBottom: 16,
  },
  commentaireLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  commentaireInput: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default ModerationScreen;
