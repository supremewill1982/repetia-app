import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

const GestionProfesseursScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const [professeurs, setProfesseurs] = useState<any[]>([
    { id: '1', nom: 'Dupont', prenom: 'Jean', matieres: ['Mathématiques', 'Physique'], email: 'jean@email.com', telephone: '+241 012345678', niveau: 'diamant' },
    { id: '2', nom: 'Martin', prenom: 'Marie', matieres: ['Français', 'Histoire'], email: 'marie@email.com', telephone: '+241 087654321', niveau: 'or' },
    { id: '3', nom: 'Durand', prenom: 'Pierre', matieres: ['Mathématiques', 'Informatique'], email: 'pierre@email.com', telephone: '+241 019283746', niveau: 'argent' },
    { id: '4', nom: 'Legrand', prenom: 'Sophie', matieres: ['Anglais', 'SVT'], email: 'sophie@email.com', telephone: '+241 034567890', niveau: 'bronze' },
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProfesseur, setNewProfesseur] = useState({
    nom: '',
    prenom: '',
    matieres: [] as string[],
    email: '',
    telephone: '',
  });
  const [selectedMatiere, setSelectedMatiere] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const matieresDisponibles = ['Mathématiques', 'Physique-Chimie', 'Français', 'Anglais', 'Histoire-Géographie', 'SVT', 'Philosophie', 'Informatique'];

  const filteredProfesseurs = professeurs.filter(prof =>
    prof.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
    prof.prenom.toLowerCase().includes(searchQuery.toLowerCase()) ||
    prof.matieres.some((m: string) => m.toLowerCase().includes(searchQuery.toLowerCase())) ||
    prof.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddProfesseur = () => {
    if (!newProfesseur.nom.trim() || !newProfesseur.prenom.trim() || newProfesseur.matieres.length === 0) {
      Alert.alert('Erreur', 'Les champs nom, prénom et au moins une matière sont obligatoires');
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      const newId = (Math.max(...professeurs.map(p => parseInt(p.id))) + 1).toString();
      setProfesseurs([...professeurs, { ...newProfesseur, id: newId, niveau: 'bronze' }]);
      Alert.alert('Succès', 'Professeur ajouté avec succès');
      setShowAddModal(false);
      setNewProfesseur({ nom: '', prenom: '', matieres: [], email: '', telephone: '' });
      setSubmitting(false);
    }, 1000);
  };

  const handleAddMatiere = () => {
    if (selectedMatiere && !newProfesseur.matieres.includes(selectedMatiere)) {
      setNewProfesseur({...newProfesseur, matieres: [...newProfesseur.matieres, selectedMatiere]});
    }
  };

  const handleRemoveMatiere = (matiere: string) => {
    setNewProfesseur({
      ...newProfesseur,
      matieres: newProfesseur.matieres.filter(m => m !== matiere)
    });
  };

  const getNiveauBadge = (niveau: string) => {
    const badges: Record<string, { emoji: string; color: string }> = {
      bronze: { emoji: '🥉', color: '#CD7F32' },
      argent: { emoji: '🥈', color: '#C0C0C0' },
      or: { emoji: '🥇', color: '#FFD700' },
      diamant: { emoji: '💎', color: '#1E90FF' },
      maitre: { emoji: '👑', color: '#9400D3' },
    };
    return badges[niveau.toLowerCase()] || badges.bronze;
  };

  const handleDeleteProfesseur = (id: string) => {
    Alert.alert(
      'Supprimer le professeur',
      'Êtes-vous sûr de vouloir supprimer ce professeur ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            setProfesseurs(professeurs.filter(p => p.id !== id));
            Alert.alert('Succès', 'Professeur supprimé avec succès');
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Gestion des Professeurs</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)}>
          <MaterialCommunityIcons name="plus" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <MaterialCommunityIcons name="magnify" size={20} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
          placeholder="Rechercher un professeur..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView style={styles.listContainer}>
        {filteredProfesseurs.length === 0 ? (
          <View style={[styles.emptyContainer, { backgroundColor: colors.surface }]}>
            <MaterialCommunityIcons name="account-tie" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Aucun professeur trouvé
            </Text>
          </View>
        ) : (
          filteredProfesseurs.map((prof) => {
            const badge = getNiveauBadge(prof.niveau);
            return (
              <View key={prof.id} style={[styles.profCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.profInfo}>
                  <Text style={[styles.profName, { color: colors.text }]}>
                    {prof.nom} {prof.prenom}
                  </Text>
                  <View style={styles.profDetails}>
                    <View style={[styles.badge, { backgroundColor: badge.color + '20' }]}>
                      <Text style={{ fontSize: 16 }}>{badge.emoji}</Text>
                      <Text style={[styles.badgeText, { color: badge.color }]}>
                        {prof.niveau}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.profMatieres, { color: colors.textMuted }]}>
                    Matières: {prof.matieres.join(', ')}
                  </Text>
                  <Text style={[styles.profContact, { color: colors.textMuted }]}>
                    {prof.email} - {prof.telephone}
                  </Text>
                </View>
                <View style={styles.profActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.info + '20' }]}
                    onPress={() => navigation.navigate('ProfesseurDetails', { professeur: prof })}
                  >
                    <MaterialCommunityIcons name="eye" size={18} color={colors.info} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.warning + '20' }]}
                    onPress={() => navigation.navigate('EditProfesseur', { professeur: prof })}
                  >
                    <MaterialCommunityIcons name="pencil" size={18} color={colors.warning} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.error + '20' }]}
                    onPress={() => handleDeleteProfesseur(prof.id)}
                  >
                    <MaterialCommunityIcons name="delete" size={18} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {showAddModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <ScrollView>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Ajouter un professeur</Text>

              <Text style={[styles.modalLabel, { color: colors.text, marginTop: 16 }]}>Nom *</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                placeholder="Nom de famille"
                value={newProfesseur.nom}
                onChangeText={(text) => setNewProfesseur({...newProfesseur, nom: text})}
              />

              <Text style={[styles.modalLabel, { color: colors.text, marginTop: 12 }]}>Prénom *</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                placeholder="Prénom"
                value={newProfesseur.prenom}
                onChangeText={(text) => setNewProfesseur({...newProfesseur, prenom: text})}
              />

              <Text style={[styles.modalLabel, { color: colors.text, marginTop: 12 }]}>Matières *</Text>
              <View style={styles.matieresContainer}>
                <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Picker
                    selectedValue={selectedMatiere}
                    onValueChange={(itemValue) => setSelectedMatiere(itemValue)}
                    style={{ color: colors.text }}
                  >
                    <Picker.Item label="Sélectionnez une matière" value="" />
                    {matieresDisponibles.map((m) => (
                      <Picker.Item key={m} label={m} value={m} />
                    ))}
                  </Picker>
                </View>
                <TouchableOpacity
                  style={[styles.addMatiereButton, { backgroundColor: colors.primary }]}
                  onPress={handleAddMatiere}
                  disabled={!selectedMatiere}
                >
                  <MaterialCommunityIcons name="plus" size={18} color="white" />
                </TouchableOpacity>
              </View>

              {newProfesseur.matieres.length > 0 && (
                <View style={styles.selectedMatieresContainer}>
                  {newProfesseur.matieres.map((matiere) => (
                    <View key={matiere} style={[styles.selectedMatiere, { backgroundColor: colors.primary + '20' }]}>
                      <Text style={[styles.selectedMatiereText, { color: colors.primary }]}>{matiere}</Text>
                      <TouchableOpacity onPress={() => handleRemoveMatiere(matiere)}>
                        <MaterialCommunityIcons name="close" size={16} color={colors.primary} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              <Text style={[styles.modalLabel, { color: colors.text, marginTop: 12 }]}>Email</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                placeholder="email@exemple.com"
                value={newProfesseur.email}
                onChangeText={(text) => setNewProfesseur({...newProfesseur, email: text})}
                keyboardType="email-address"
              />

              <Text style={[styles.modalLabel, { color: colors.text, marginTop: 12 }]}>Téléphone</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                placeholder="+241 012345678"
                value={newProfesseur.telephone}
                onChangeText={(text) => setNewProfesseur({...newProfesseur, telephone: text})}
                keyboardType="phone-pad"
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.textMuted + '20' }]}
                  onPress={() => setShowAddModal(false)}
                >
                  <Text style={[styles.modalButtonText, { color: colors.text }]}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.primary }]}
                  onPress={handleAddProfesseur}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.modalButtonText}>Ajouter</Text>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
  },
  listContainer: {
    flex: 1,
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
  profCard: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 1,
    borderBottomWidth: 1,
  },
  profInfo: {
    flex: 1,
  },
  profName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  profDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 8,
  },
  badgeText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: 'bold',
  },
  profMatieres: {
    fontSize: 14,
    marginTop: 4,
  },
  profContact: {
    fontSize: 12,
    marginTop: 2,
  },
  profActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
    borderRadius: 6,
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
    width: '80%',
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
  modalLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  modalInput: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
    marginBottom: 12,
  },
  matieresContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  pickerContainer: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  addMatiereButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedMatieresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  selectedMatiere: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedMatiereText: {
    marginRight: 4,
    fontSize: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
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

export default GestionProfesseursScreen;
