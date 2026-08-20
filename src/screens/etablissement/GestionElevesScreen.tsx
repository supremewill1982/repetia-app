import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal, ActivityIndicator
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

const GestionElevesScreen = ({ navigation }: { navigation: { goBack: () => void } }) => {
  const { colors } = useTheme();
  const [eleves, setEleves] = useState([
    { id: '1', nom: 'Dupont', prenom: 'Jean', classe: 'Terminale C', email: 'jean@email.com', telephone: '+241 012345678', date_inscription: '2024-01-15' },
    { id: '2', nom: 'Martin', prenom: 'Marie', classe: '1ère D', email: 'marie@email.com', telephone: '+241 087654321', date_inscription: '2024-02-20' },
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEleve, setNewEleve] = useState({ nom: '', prenom: '', classe: '', email: '', telephone: '' });
  const [submitting, setSubmitting] = useState(false);
  const classes = [...new Set(eleves.map(e => e.classe))].sort();

  const filteredEleves = eleves.filter(eleve =>
    eleve.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
    eleve.prenom.toLowerCase().includes(searchQuery.toLowerCase()) ||
    eleve.classe.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddEleve = () => {
    if (!newEleve.nom.trim() || !newEleve.prenom.trim() || !newEleve.classe.trim()) {
      Alert.alert('Erreur', 'Les champs nom, prénom et classe sont obligatoires');
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      const newId = (Math.max(...eleves.map(e => parseInt(e.id)), 0) + 1).toString();
      setEleves([...eleves, { ...newEleve, id: newId, date_inscription: new Date().toISOString().split('T')[0] }]);
      Alert.alert('Succès', 'Élève ajouté avec succès');
      setShowAddModal(false);
      setNewEleve({ nom: '', prenom: '', classe: '', email: '', telephone: '' });
      setSubmitting(false);
    }, 1000);
  };

  const handleDeleteEleve = (id: string) => {
    Alert.alert('Supprimer', 'Êtes-vous sûr ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => setEleves(eleves.filter(e => e.id !== id)) }
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Gestion des Élèves</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)}>
          <MaterialCommunityIcons name="plus" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <MaterialCommunityIcons name="magnify" size={20} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
          placeholder="Rechercher..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView style={styles.listContainer}>
        {filteredEleves.length === 0 ? (
          <View style={[styles.emptyContainer, { backgroundColor: colors.surface }]}>
            <MaterialCommunityIcons name="account-search" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>Aucun élève trouvé</Text>
          </View>
        ) : (
          filteredEleves.map((eleve) => (
            <View key={eleve.id} style={[styles.eleveCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.eleveInfo}>
                <Text style={[styles.eleveName, { color: colors.text }]}>{eleve.nom} {eleve.prenom}</Text>
                <Text style={[styles.eleveClasse, { color: colors.textMuted }]}>{eleve.classe}</Text>
              </View>
              <View style={styles.eleveActions}>
                <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.info + '20' }]}>
                  <MaterialCommunityIcons name="eye" size={18} color={colors.info} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.error + '20' }]} onPress={() => handleDeleteEleve(eleve.id)}>
                  <MaterialCommunityIcons name="delete" size={18} color={colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={showAddModal} transparent={true} animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Ajouter un élève</Text>
            <Text style={[styles.modalLabel, { color: colors.text, marginTop: 16 }]}>Nom *</Text>
            <TextInput style={[styles.modalInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]} placeholder="Nom" value={newEleve.nom} onChangeText={(text) => setNewEleve({...newEleve, nom: text})} />
            <Text style={[styles.modalLabel, { color: colors.text, marginTop: 12 }]}>Prénom *</Text>
            <TextInput style={[styles.modalInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]} placeholder="Prénom" value={newEleve.prenom} onChangeText={(text) => setNewEleve({...newEleve, prenom: text})} />
            <Text style={[styles.modalLabel, { color: colors.text, marginTop: 12 }]}>Classe *</Text>
            <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Picker selectedValue={newEleve.classe} onValueChange={(itemValue) => setNewEleve({...newEleve, classe: itemValue})} style={{ color: colors.text }}>
                <Picker.Item label="Sélectionnez" value="" />
                {classes.map((classe) => <Picker.Item key={classe} label={classe} value={classe} />)}
              </Picker>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.textMuted + '20' }]} onPress={() => setShowAddModal(false)}>
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.primary }]} onPress={handleAddEleve} disabled={submitting}>
                {submitting ? <ActivityIndicator color="white" /> : <Text style={styles.modalButtonText}>Ajouter</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, fontSize: 14 },
  listContainer: { flex: 1 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, borderRadius: 12, margin: 16 },
  emptyText: { fontSize: 16, marginTop: 16, textAlign: 'center' },
  eleveCard: { flexDirection: 'row', padding: 16, marginBottom: 1, borderBottomWidth: 1 },
  eleveInfo: { flex: 1 },
  eleveName: { fontSize: 16, fontWeight: 'bold' },
  eleveClasse: { fontSize: 14, marginTop: 2 },
  eleveActions: { flexDirection: 'row', alignItems: 'center' },
  actionButton: { padding: 8, marginLeft: 4, borderRadius: 6 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: '80%', padding: 20, borderRadius: 12, maxWidth: 400 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  modalLabel: { fontSize: 14, fontWeight: '500', marginBottom: 8 },
  modalInput: { padding: 12, borderRadius: 8, borderWidth: 1, fontSize: 14, marginBottom: 12 },
  pickerContainer: { padding: 12, borderRadius: 8, borderWidth: 1, marginBottom: 12 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
  modalButton: { padding: 12, borderRadius: 8, flex: 1, marginHorizontal: 8, alignItems: 'center' },
  modalButtonText: { color: 'white', fontWeight: 'bold' }
});

export default GestionElevesScreen;
