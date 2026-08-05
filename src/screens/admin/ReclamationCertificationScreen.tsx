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

const ReclamationCertificationScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const [reclamations, setReclamations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatut, setFilterStatut] = useState<string>('en_attente');
  const [selectedReclamation, setSelectedReclamation] = useState<any>(null);
  const [reponse, setReponse] = useState('');
  const [action, setAction] = useState<string>('valider');
  const [submitting, setSubmitting] = useState(false);

  const STATUTS = [
    { label: 'En attente', value: 'en_attente' },
    { label: 'En cours', value: 'en_cours' },
    { label: 'Résolue', value: 'resolue' },
    { label: 'Rejetée', value: 'rejetee' },
  ];

  const ACTIONS = [
    { label: 'Valider la réclamation', value: 'valider' },
    { label: 'Rejeter la réclamation', value: 'rejeter' },
    { label: 'Demander plus d\'infos', value: 'plus_infos' },
  ];

  useEffect(() => {
    fetchReclamations();
  }, [filterStatut]);

  const fetchReclamations = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'reclamations'),
        where('statut', '==', filterStatut)
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReclamations(data);
    } catch (error) {
      console.error('Erreur chargement réclamations:', error);
      Alert.alert('Erreur', 'Impossible de charger les réclamations');
    } finally {
      setLoading(false);
    }
  };

  const handleTraiter = async () => {
    if (!selectedReclamation) return;

    if (!reponse.trim() && action !== 'valider') {
      Alert.alert('Erreur', 'Veuillez fournir une réponse');
      return;
    }

    setSubmitting(true);
    try {
      const nouveauStatut = action === 'valider' ? 'resolue' : action === 'rejeter' ? 'rejetee' : 'en_cours';

      await updateDoc(doc(db, 'reclamations', selectedReclamation.id), {
        statut: nouveauStatut,
        reponse: reponse.trim(),
        date_traitement: new Date(),
        traite_par: 'admin_1',
      });

      Alert.alert('Succès', `Réclamation ${nouveauStatut} avec succès`);
      setSelectedReclamation(null);
      setReponse('');
      setAction('valider');
      fetchReclamations();
    } catch (error) {
      console.error('Erreur traitement:', error);
      Alert.alert('Erreur', 'Impossible de traiter la réclamation');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatutColor = (statut: string) => {
    const colorsMap: Record<string, string> = {
      en_attente: colors.warning,
      en_cours: colors.info,
      resolue: colors.success,
      rejetee: colors.error,
    };
    return colorsMap[statut] || colors.textMuted;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Réclamations de certification</Text>
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
      ) : reclamations.length === 0 ? (
        <View style={[styles.emptyContainer, { backgroundColor: colors.surface }]}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            Aucune réclamation à traiter
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.listContainer}>
          {reclamations.map((reclamation) => (
            <TouchableOpacity
              key={reclamation.id}
              style={[styles.reclamationCard, {
                backgroundColor: colors.surface,
                borderColor: colors.border
              }]}
              onPress={() => {
                setSelectedReclamation(reclamation);
                setAction('valider');
              }}
            >
              <View style={styles.reclamationInfo}>
                <Text style={[styles.reclamationTitle, { color: colors.text }]} numberOfLines={1}>
                  Réclamation #{reclamation.id.substring(0, 8)}
                </Text>
                <Text style={[styles.reclamationDetails, { color: colors.textMuted }]}>
                  Répétiteur: {reclamation.repetiteur_nom}
                </Text>
                <Text style={[styles.reclamationDetails, { color: colors.textMuted }]}>
                  Test: {reclamation.test_id} - {reclamation.matiere}
                </Text>
                <View style={[styles.reclamationStatut, { backgroundColor: getStatutColor(reclamation.statut) + '20' }]}>
                  <Text style={[styles.reclamationStatutText, { color: getStatutColor(reclamation.statut) }]}>
                    {reclamation.statut.replace('_', ' ')}
                  </Text>
                </View>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {selectedReclamation && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <ScrollView>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Traiter la réclamation #{selectedReclamation.id.substring(0, 8)}
              </Text>

              <View style={[styles.reclamationDetailsContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Répétiteur:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {selectedReclamation.repetiteur_nom}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Test:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {selectedReclamation.test_id} - {selectedReclamation.matiere}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Date:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {selectedReclamation.date?.toDate().toLocaleDateString('fr-FR')}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Commentaire:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {selectedReclamation.commentaire}
                  </Text>
                </View>
              </View>

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

              {(action === 'rejeter' || action === 'plus_infos') && (
                <View style={styles.reponseContainer}>
                  <Text style={[styles.reponseLabel, { color: colors.text }]}>Réponse</Text>
                  <TextInput
                    style={[styles.reponseInput, {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      color: colors.text
                    }]}
                    placeholder="Votre réponse..."
                    placeholderTextColor={colors.textMuted}
                    selectedValue={reponse}
                    onChangeText={setReponse}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.textMuted + '20' }]}
                  onPress={() => {
                    setSelectedReclamation(null);
                    setReponse('');
                    setAction('valider');
                  }}
                >
                  <Text style={[styles.modalButtonText, { color: colors.text }]}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.primary }]}
                  onPress={handleTraiter}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.modalButtonText}>Traiter</Text>
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
  reclamationCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 1,
    borderBottomWidth: 1,
  },
  reclamationInfo: {
    flex: 1,
  },
  reclamationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  reclamationDetails: {
    fontSize: 14,
    marginTop: 2,
  },
  reclamationStatut: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  reclamationStatutText: {
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
  reclamationDetailsContainer: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  detailRow: {
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    marginTop: 4,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  reponseContainer: {
    marginBottom: 16,
  },
  reponseLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  reponseInput: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
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

export default ReclamationCertificationScreen;
