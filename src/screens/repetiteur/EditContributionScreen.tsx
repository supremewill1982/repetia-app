import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { db, storage } from '../../services/firebaseConfig';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

const MATIERES = ['Mathématiques', 'Physique-Chimie', 'Français', 'Anglais', 'Histoire-Géographie', 'SVT', 'Philosophie', 'Informatique'];
const NIVEAUX = ['6ème', '5ème', '4ème', '3ème', 'Seconde', '1ère', 'Terminale'];

const EditContributionScreen = ({ navigation, route }: any) => {
  const { colors } = useTheme();
  const { userId, userData } = useAuth();
  const { contributionId } = route.params;
  const [formData, setFormData] = useState({
    titre: '',
    matiere: MATIERES[0],
    niveau: NIVEAUX[6],
    description: '',
    tags: '',
    prix: 0,
    fichier: null as any,
    fichierUrl: '',
    fichierNom: '',
  });
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchContribution();
  }, [contributionId]);

  const fetchContribution = async () => {
    try {
      setLoading(true);
      if (!contributionId) return;

      const docRef = doc(db, 'contributions', contributionId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setFormData({
          titre: data.titre || '',
          matiere: data.matiere || MATIERES[0],
          niveau: data.niveau || NIVEAUX[6],
          description: data.description || '',
          tags: data.tags?.join(', ') || '',
          prix: data.prix || 0,
          fichier: null,
          fichierUrl: data.fichier?.url || '',
          fichierNom: data.fichier?.nom || '',
        });
        setFileName(data.fichier?.nom || '');
        setFileSize(data.fichier?.taille || 0);
      }
    } catch (error) {
      console.error('Erreur chargement contribution:', error);
      Alert.alert('Erreur', 'Impossible de charger la contribution');
    } finally {
      setLoading(false);
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'text/plain'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const fileInfo = await FileSystem.getInfoAsync(asset.uri);

        if (fileInfo.exists && 'size' in fileInfo && typeof fileInfo.size === 'number' && fileInfo.size > 10 * 1024 * 1024) {
          Alert.alert('Erreur', 'Le fichier est trop grand (max 10Mo)');
          return;
        }

        setFormData({...formData, fichier: asset.uri});
        setFileName(asset.name);
        setFileSize(
            fileInfo.exists && 'size' in fileInfo && typeof fileInfo.size === 'number'
              ? Math.round(fileInfo.size / 1024)
              : 0
          );
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

    setSubmitting(true);
    try {
      setLoading(true);

      let fileUrl = formData.fichierUrl;
      let fichierNom = formData.fichierNom;

      // Si un nouveau fichier a été sélectionné
      if (formData.fichier) {
        // Supprimer l'ancien fichier si nécessaire
        if (fileUrl) {
          try {
            const oldFileRef = ref(storage, fileUrl);
            await deleteObject(oldFileRef);
          } catch (error) {
            console.warn('Impossible de supprimer l\'ancien fichier:', error);
          }
        }

        // Upload du nouveau fichier
        const fileRef = ref(storage, `contributions/${userId}/${Date.now()}_${formData.titre.replace(/\s+/g, '_')}`);
        const fileBlob = await FileSystem.readAsStringAsync(formData.fichier);
        const blob = new Blob([fileBlob], { type: 'application/pdf' });
        await uploadBytes(fileRef, await blob.arrayBuffer());
        fileUrl = await getDownloadURL(fileRef);
        fichierNom = fileName;
      }

      // Mettre à jour la contribution
      await updateDoc(doc(db, 'contributions', contributionId), {
        titre: formData.titre.trim(),
        matiere: formData.matiere,
        niveau: formData.niveau,
        description: formData.description.trim(),
        tags: formData.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0),
        prix: formData.prix,
        fichier: fileUrl ? {
          url: fileUrl,
          nom: fichierNom,
          taille: fileSize,
          type: fichierNom.split('.').pop()?.toLowerCase() || '',
        } : null,
        statut: 'en_modération',
        date_modification: serverTimestamp(),
      });

      Alert.alert('Succès', 'Votre contribution a été mise à jour avec succès !');
      navigation.navigate('MesCours');
    } catch (error) {
      console.error('Erreur mise à jour:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour votre contribution');
    } finally {
      setSubmitting(false);
      setLoading(false);
    }
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Modifier la contribution</Text>
        <View />
      </View>

      <View style={[styles.formContainer, { backgroundColor: colors.surface }]}>
        <Text style={[styles.label, { color: colors.text }]}>Titre *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
          placeholder="Titre de votre contribution"
          placeholderTextColor={colors.textMuted}
          value={formData.titre}
          onChangeText={(text) => setFormData({...formData, titre: text})}
        />

        <Text style={[styles.label, { color: colors.text }]}>Matière</Text>
        <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Picker
            selectedValue={formData.matiere}
            onValueChange={(itemValue) => setFormData({...formData, matiere: itemValue})}
            style={{ color: colors.text }}
          >
            {MATIERES.map((m) => (
              <Picker.Item key={m} label={m} value={m} />
            ))}
          </Picker>
        </View>

        <Text style={[styles.label, { color: colors.text }]}>Niveau</Text>
        <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Picker
            selectedValue={formData.niveau}
            onValueChange={(itemValue) => setFormData({...formData, niveau: itemValue})}
            style={{ color: colors.text }}
          >
            {NIVEAUX.map((n) => (
              <Picker.Item key={n} label={n} value={n} />
            ))}
          </Picker>
        </View>

        <Text style={[styles.label, { color: colors.text }]}>Description</Text>
        <TextInput
          style={[styles.textArea, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
          placeholder="Décrivez le contenu de votre contribution..."
          placeholderTextColor={colors.textMuted}
          value={formData.description}
          onChangeText={(text) => setFormData({...formData, description: text})}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <Text style={[styles.label, { color: colors.text }]}>Tags (séparés par des virgules)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
          placeholder="Ex: dérivées, calcul, fonctions"
          placeholderTextColor={colors.textMuted}
          value={formData.tags}
          onChangeText={(text) => setFormData({...formData, tags: text})}
        />

        <Text style={[styles.label, { color: colors.text }]}>Prix (FCFA)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
          placeholder="Ex: 5000"
          placeholderTextColor={colors.textMuted}
          value={formData.prix.toString()}
          onChangeText={(text) => setFormData({...formData, prix: text ? parseInt(text) : 0})}
          keyboardType="numeric"
        />

        <Text style={[styles.label, { color: colors.text }]}>Fichier</Text>
        {formData.fichier || fileName ? (
          <View style={[styles.fileInfo, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="file-document" size={20} color={colors.primary} />
            <Text style={[styles.fileName, { color: colors.text }]} numberOfLines={1}>
              {fileName || formData.fichierNom}
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

        <TouchableOpacity
          style={[styles.submitButton, {
            backgroundColor: colors.primary,
            opacity: submitting || !formData.titre.trim() ? 0.5 : 1
          }]}
          onPress={handleSubmit}
          disabled={submitting || !formData.titre.trim()}
        >
          {submitting || loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>Mettre à jour la contribution</Text>
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

export default EditContributionScreen;
