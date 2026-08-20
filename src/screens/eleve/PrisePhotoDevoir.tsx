import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useTheme } from '../../context/ThemeContext';
import { feedback } from '../../services/feedbackService';

export default function PrisePhotoDevoir({ route, navigation }: any) {
  const { colors } = useTheme();
  const { matiere } = route.params || {};
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const prendrePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Nous avons besoin de la caméra');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ 
      allowsEditing: true, 
      quality: 0.9,
      base64: true
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const choisirPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Accès à la galerie nécessaire');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ 
      allowsEditing: true, 
      quality: 0.9,
      base64: true
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const validerPhoto = async () => {
    if (!image) return;
    setLoading(true);
    
    try {
      // Convertir l'image en base64 pour l'analyse
      const response = await fetch(image);
      const blob = await response.blob();
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result.split(',')[1] || '' : '');
          reader.readAsDataURL(blob);
        });
      
      navigation.navigate('QuestionDevoirAmeliore', { 
        imageBase64: base64, 
        matiere,
        imageUri: image
      });
    } catch (error) {
      console.error('Erreur validation image:', error);
      Alert.alert('Erreur', "Impossible de traiter l'image. Réessaie.");
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
          encoding: 'base64',
        });
        navigation.navigate('QuestionDevoirAmeliore', {
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
      <Text style={[styles.title, { color: colors.text }]}>📸 Prendre en photo ton devoir</Text>
      
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Assure-toi que le devoir soit bien lisible et cadré
      </Text>
      
      {matiere && (
        <View style={[styles.matiereBadge, { backgroundColor: colors.primary + '20' }]}>
          <Text style={[styles.matiereBadgeText, { color: colors.primary }]}>Matière : {matiere}</Text>
        </View>
      )}

      {!image ? (
        <>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors.primary }]} 
            onPress={prendrePhoto}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>📸 Prendre une photo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors.accent }]} 
            onPress={choisirPhoto}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>🖼️ Choisir dans la galerie</Text>
          </TouchableOpacity>

        <TouchableOpacity
          style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12, marginHorizontal: 20 }}
          onPress={handlePickPDF}
        >
          <MaterialCommunityIcons name="file-pdf-box" size={24} color="#E55C5C" />
          <Text style={{ color: colors.text, fontSize: 15, fontWeight: '600' }}>📄 Importer un PDF de devoir</Text>
        </TouchableOpacity>
        </>
      ) : (
        <>
          <Image source={{ uri: image }} style={styles.preview} />
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.buttonSmall, { backgroundColor: colors.error }]} 
              onPress={() => setImage(null)}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Reprendre</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.buttonSmall, { backgroundColor: colors.success }]} 
              onPress={validerPhoto} 
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.buttonText}>Analyser le devoir</Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
      
      <View style={styles.conseilContainer}>
        <MaterialCommunityIcons name="lightbulb" size={16} color={colors.info} />
        <Text style={[styles.conseilText, { color: colors.textMuted }]}>
          Astuce : Prends la photo en pleine lumière et cadre bien tout l'exercice
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 14, textAlign: 'center', marginBottom: 20, paddingHorizontal: 20 },
  matiereBadge: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginBottom: 30 },
  matiereBadgeText: { fontSize: 16, fontWeight: '600' },
  button: { paddingVertical: 15, paddingHorizontal: 30, borderRadius: 12, marginVertical: 10, width: '80%', alignItems: 'center' },
  buttonSmall: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginHorizontal: 5 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 20 },
  preview: { width: 300, height: 300, borderRadius: 10, marginBottom: 20 },
  conseilContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 30, gap: 8, paddingHorizontal: 20 },
  conseilText: { flex: 1, fontSize: 12, textAlign: 'center' },
});
