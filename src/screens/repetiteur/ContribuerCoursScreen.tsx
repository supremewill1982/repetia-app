import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { db, storage } from '../../services/firebaseConfig';
import { doc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

const MATIERES = ['Mathématiques', 'Physique-Chimie', 'Français', 'Anglais', 'Histoire-Géographie', 'SVT', 'Philosophie', 'Informatique'];
const NIVEAUX = ['6ème', '5ème', '4ème', '3ème', 'Seconde', '1ère', 'Terminale'];
const TYPES = [
  { label: 'Cours', value: 'cours' },
  { label: 'Devoir', value: 'devoir' },
  { label: 'Correction', value: 'correction' },
];

const ContribuerCoursScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const { userId, userData } = useAuth();
  const [formData, setFormData] = useState({
    titre: '',
    matiere: MATIERES[0],
    niveau: NIVEAUX[6],
    type: 'cours',
    description: '',
    tags: '',
    prix: 0,
    fichier: null as any,
  });
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'text/plain'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const fileInfo = await FileSystem.getInfoAsync(asset.uri);

        if (fileInfo.size > 10 * 1024 * 1024) {
          Alert.alert('Erreur', 'Le fichier est trop grand (max 10Mo)');
          return;
        }

        setFormData({...formData, fichier: asset.uri});
        setFileName(asset.name);
        setFileSize(Math.round(fileInfo.size / 1024));
      }
    } catch (error) {
      console.error('Erreur sélection fichier:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner le fichier');
    }
  };

  const handleSubmit = async () => {
    if (!formData.titre.trim()) {
      Alert.alert('Erreur', 'Le titre est obligatoire');
      return;
    }

    if (!formData.fichier) {
      Alert.alert('Erreur', 'Veuillez sélectionner un fichier');
      return;
    }

    setSubmitting(true);
    try {
      setLoading(true);

      // Upload du fichier
      const fileRef = ref(storage, `contributions/${userId}/${Date.now()}_${formData.titre.replace(/\s+/g, '_')}`);
      const fileBlob = await FileSystem.readAsStringAsync(formData.fichier);
      const blob = new Blob([fileBlob], { type: 'application/pdf' });
      await uploadBytes(fileRef, await blob.arrayBuffer());
      const fileUrl = await getDownloadURL(fileRef);

      // Sauvegarde dans Firestore
      await addDoc(collection(db, 'contributions'), {
        titre: formData.titre.trim(),
        matiere: formData.matiere,
        niveau: formData.niveau,
        type: formData.type,
        description: formData.description.trim(),
        tags: formData.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0),
        prix: formData.prix,
        fichier: {
          url: fileUrl,
          nom: fileName,
          taille: fileSize,
          type: fileName.split('.').pop().toLowerCase(),
        },
        auteur: {
          userId: userId,
          nom: userData?.nom || '',
          prenom: userData?.prenom || '',
          role: userData?.role || 'repetiteur',
        },
        statut: 'en_attente',
        date_soumission: serverTimestamp(),
        score_ia: 0,
        telechargements: 0,
        revenus_generes: 0,
      });

      Alert.alert(
        'Succès',
        'Votre contribution a été soumise avec succès ! Elle sera examinée par notre équipe sous 24-48h.'
      );
      navigation.navigate('MesCours');
    } catch (error) {
      console.error('Erreur soumission:', error);
      Alert.alert('Erreur', 'Impossible de soumettre votre contribution');
    } finally {
      setSubmitting(false);
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Contribuer un cours</Text>
        <View />
      </View>

      <View style={[styles.formContainer, { backgroundColor: colors.surface }]}>
        {/* Titre */}
        <Text style={[styles.label, { color: colors.text }]}>Titre *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
          placeholder="Titre de votre contribution"
          placeholderTextColor={colors.textMuted}
          selectedValue={formData.titre}
          onChangeText={(text) => setFormData({...formData, titre: text})}
        />

        {/* Type */}
        <Text style={[styles.label, { color: colors.text }]}>Type</Text>
        <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Picker
            selectedValue={formData.type}
            onValueChange={(itemValue) => setFormData({...formData, type: itemValue})}
            style={{ color: colors.text }}
          >
            {TYPES.map((t) => (
              <Picker.Item key={t.value} label={t.label} selectedValue={t.value} />
            ))}
          </Picker>
        </View>

        {/* Matière */}
        <Text style={[styles.label, { color: colors.text }]}>Matière</Text>
        <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Picker
            selectedValue={formData.matiere}
            onValueChange={(itemValue) => setFormData({...formData, matiere: itemValue})}
            style={{ color: colors.text }}
          >
            {MATIERES.map((m) => (
              <Picker.Item key={m} label={m} selectedValue={m} />
            ))}
          </Picker>
        </View>

        {/* Niveau */}
        <Text style={[styles.label, { color: colors.text }]}>Niveau</Text>
        <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Picker
            selectedValue={formData.niveau}
            onValueChange={(itemValue) => setFormData({...formData, niveau: itemValue})}
            style={{ color: colors.text }}
          >
            {NIVEAUX.map((n) => (
              <Picker.Item key={n} label={n} selectedValue={n} />
            ))}
          </Picker>
        </View>

        {/* Description */}
        <Text style={[styles.label, { color: colors.text }]}>Description</Text>
        <TextInput
          style={[styles.textArea, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
          placeholder="Décrivez le contenu de votre contribution..."
          placeholderTextColor={colors.textMuted}
          selectedValue={formData.description}
          onChangeText={(text) => setFormData({...formData, description: text})}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {/* Tags */}
        <Text style={[styles.label, { color: colors.text }]}>Tags (séparés par des virgules)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
          placeholder="Ex: dérivées, calcul, fonctions"
          placeholderTextColor={colors.textMuted}
          selectedValue={formData.tags}
          onChangeText={(text) => setFormData({...formData, tags: text})}
        />

        {/* Prix */}
        <Text style={[styles.label, { color: colors.text }]}>Prix (FCFA)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
          placeholder="Ex: 5000"
          placeholderTextColor={colors.textMuted}
          selectedValue={formData.prix.toString()}
          onChangeText={(text) => setFormData({...formData, prix: text ? parseInt(text) : 0})}
          keyboardType="numeric"
        />

        {/* Fichier */}
        <Text style={[styles.label, { color: colors.text }]}>Fichier *</Text>
        {formData.fichier ? (
          <View style={[styles.fileInfo, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="file-document" size={20} color={colors.primary} />
            <Text style={[styles.fileName, { color: colors.text }]} numberOfLines={1}>
              {fileName}
            </Text>
            <Text style={[styles.fileSize, { color: colors.textMuted }]}>
              {fileSize} Ko
            </Text>
            <TouchableOpacity onPress={handlePickDocument}>
              <MaterialCommunityIcons name="pencil" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.fileButton, { backgroundColor: colors.primary }]}
            onPress={handlePickDocument}
          >
            <MaterialCommunityIcons name="file-upload" size={20} color="white" />
            <Text style={styles.fileButtonText}>Sélectionner un fichier</Text>
          </TouchableOpacity>
        )}

        {/* Bouton de soumission */}
        <TouchableOpacity
          style={[styles.submitButton, {
            backgroundColor: colors.primary,
            opacity: submitting || !formData.titre.trim() || !formData.fichier ? 0.5 : 1
          }]}
          onPress={handleSubmit}
          disabled={submitting || !formData.titre.trim() || !formData.fichier}
        >
          {submitting || loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>Soumettre la contribution</Text>
          )}
        </TouchableOpacity>
      </View>
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
  formContainer: {
    flex: 1,
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
    marginBottom: 12,
  },
  textArea: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
    marginBottom: 12,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  fileName: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  fileSize: {
    marginRight: 8,
    fontSize: 12,
    color: '#666',
  },
  fileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  fileButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  submitButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 16,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ContribuerCoursScreen;
