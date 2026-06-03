import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useTheme } from '../../context/ThemeContext';
import { feedback } from '../../services/feedbackService';

export default function PrisePhotoCours({ route, navigation }) {
  const { colors } = useTheme();
  const { matiere } = route.params || {};
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const prendrePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Nous avons besoin de la caméra');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const choisirPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Accès à la galerie nécessaire');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.8 });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const validerPhoto = async () => {
    if (!image) return;
    setLoading(true);
    try {
      const file = new File([await fetch(image).then(r => r.blob())], 'cours.jpg');
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(file);
      });
      navigation.navigate('QuestionRevision', { imageBase64: base64, matiere });
    } catch (error) {
      Alert.alert('Erreur', "Impossible de traiter l'image");
    } finally {
      setLoading(false);
    }
  };


  const handlePickPDF = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets[0]) {
        const base64 = await FileSystem.readAsStringAsync(result.assets[0].uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        navigation.navigate('QuestionRevision', {
          imageBase64: base64,
          imageUri:    result.assets[0].uri,
          matiere,
          isPDF: true,
          pdfName: result.assets[0].name,
        });
      }
    } catch {
      Alert.alert('Erreur', 'Impossible de lire le PDF.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Prendre en photo ton cours</Text>
      
      {matiere && (
        <View style={[styles.matiereBadge, { backgroundColor: colors.primary + '20' }]}>
          <Text style={[styles.matiereBadgeText, { color: colors.primary }]}>Matière : {matiere}</Text>
        </View>
      )}

      {!image ? (
        <>
          <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={prendrePhoto}>
            <Text style={styles.buttonText}>📸 Prendre une photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, { backgroundColor: colors.accent }]} onPress={choisirPhoto}>
            <Text style={styles.buttonText}>🖼️ Choisir dans la galerie</Text>
          </TouchableOpacity>

        <TouchableOpacity
          style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 }}
          onPress={handlePickPDF}
        >
          <MaterialCommunityIcons name="file-pdf-box" size={24} color="#E55C5C" />
          <Text style={{ color: colors.text, fontSize: 15, fontWeight: '600' }}>📄 Importer un PDF</Text>
        </TouchableOpacity>
        </>
      ) : (
        <>
          <Image source={{ uri: image }} style={styles.preview} />
          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.buttonSmall, { backgroundColor: colors.error }]} onPress={() => setImage(null)}>
              <Text style={styles.buttonText}>Reprendre</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.buttonSmall, { backgroundColor: colors.success }]} onPress={validerPhoto} disabled={loading}>
              <Text style={styles.buttonText}>{loading ? 'Traitement...' : 'Valider'}</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  matiereBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 30,
  },
  matiereBadgeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    marginVertical: 10,
    width: '80%',
    alignItems: 'center',
  },
  buttonSmall: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
  preview: {
    width: 300,
    height: 300,
    borderRadius: 10,
    marginBottom: 20,
  },
});
