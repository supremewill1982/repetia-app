import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { genererApkInfo, exporterMetadonnees } from '../../services/playStoreService';
import * as Updates from 'expo-updates';

export default function PlayStoreScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [apkInfo, setApkInfo] = useState<any>(null);

  useEffect(() => {
    genererApkInfo().then(setApkInfo);
  }, []);

  const handleBuild = () => {
    Alert.alert(
      'Construction APK',
      'Utilise la commande suivante dans le terminal :\n\neas build -p android --profile preview',
      [{ text: 'Copier', onPress: () => Alert.alert('Commande copiée') }, { text: 'OK' }]
    );
  };

  const handleMetadata = async () => {
    await exporterMetadonnees();
  };

  const handleCheckUpdates = async () => {
    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        Alert.alert('Mise à jour', 'Une nouvelle version est disponible. Redémarre l\'app.');
        await Updates.fetchUpdateAsync();
      } else {
        Alert.alert('À jour', 'Tu as la dernière version.');
      }
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de vérifier les mises à jour.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={['#E8F2EE', '#ECEEF3']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📦 Play Store</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <MaterialCommunityIcons name="google-play" size={48} color="#4CAF50" />
          <Text style={[styles.version, { color: colors.text }]}>Version {apkInfo?.version} (build {apkInfo?.buildNumber})</Text>
          <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }]} onPress={handleBuild}>
            <MaterialCommunityIcons name="android" size={20} color="#ECEEF3" />
            <Text style={styles.btnTxt}>Générer l'APK (EAS Build)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, { borderColor: colors.border, borderWidth: 1 }]} onPress={handleMetadata}>
            <MaterialCommunityIcons name="file-document" size={20} color={colors.primary} />
            <Text style={[styles.btnTxt, { color: colors.primary }]}>Exporter métadonnées Play Store</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, { backgroundColor: colors.surface }]} onPress={handleCheckUpdates}>
            <MaterialCommunityIcons name="update" size={20} color={colors.textSecondary} />
            <Text style={[styles.btnTxt, { color: colors.textSecondary }]}>Vérifier les mises à jour OTA</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.guideCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.guideTitle, { color: colors.text }]}>📝 Étapes de publication</Text>
          <Text style={[styles.guideStep, { color: colors.textSecondary }]}>1. Génère l'APK avec EAS Build</Text>
          <Text style={[styles.guideStep, { color: colors.textSecondary }]}>2. Récupère le fichier .apk ou .aab</Text>
          <Text style={[styles.guideStep, { color: colors.textSecondary }]}>3. Connecte-toi à la Google Play Console</Text>
          <Text style={[styles.guideStep, { color: colors.textSecondary }]}>4. Crée une nouvelle application</Text>
          <Text style={[styles.guideStep, { color: colors.textSecondary }]}>5. Remplis la fiche (description, images, catégories)</Text>
          <Text style={[styles.guideStep, { color: colors.textSecondary }]}>6. Téléverse le fichier et publie en test fermé</Text>
          <Text style={[styles.guideStep, { color: colors.textSecondary }]}>7. Valide la publication finale</Text>
          <TouchableOpacity style={[styles.linkBtn, { backgroundColor: colors.primary + '20' }]} onPress={() => Alert.alert('Lien', 'https://play.google.com/console')}>
            <Text style={[styles.linkTxt, { color: colors.primary }]}>Ouvrir Google Play Console</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,215,0,0.1)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: 'white' },
  content: { padding: 16, gap: 16 },
  card: { borderRadius: 24, padding: 20, alignItems: 'center', gap: 16 },
  version: { fontSize: 16, fontWeight: '500' },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 40, width: '100%' },
  btnTxt: { fontSize: 16, fontWeight: 'bold' },
  guideCard: { borderRadius: 20, padding: 16, gap: 8 },
  guideTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  guideStep: { fontSize: 14, marginBottom: 6 },
  linkBtn: { marginTop: 12, paddingVertical: 10, borderRadius: 30, alignItems: 'center' },
  linkTxt: { fontSize: 14, fontWeight: '600' },
});
