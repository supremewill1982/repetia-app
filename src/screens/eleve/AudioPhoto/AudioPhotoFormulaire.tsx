import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Image, Switch, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import { MATIERES, MATIERE_CONFIG, Matiere } from '../../../types/podcast.types';

export default function AudioPhotoFormulaire({ route, navigation }: any) {
  const { colors }   = useTheme();
  const { userData } = useAuth();
  const { imageUri, imageBase64 } = route.params || {};

  const [matiere, setMatiere]         = useState<Matiere>('Maths');
  const [titreChapitre, setTitre]     = useState('');
  const [titreSection, setSection]    = useState('');
  const [estPublic, setEstPublic]     = useState(true);

  const cfg        = MATIERE_CONFIG[matiere];
  const peutGenerer = titreChapitre.trim().length > 0 && !!imageBase64;

  const handleGenerer = () => {
    if (!peutGenerer) return;
    navigation.navigate('AudioPhotoGeneration', {
      imageBase64,
      matiere,
      titreChapitre: titreChapitre.trim(),
      titreSection: titreSection.trim() || null,
      estPublic,
      userPrenom: (userData as any)?.prenom || 'Élève',
    });
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient colors={['#0A1030','#ECEEF3']} style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitre, { color: colors.text }]}>Configurer le podcast</Text>
        </LinearGradient>

        <ScrollView contentContainerStyle={styles.content}>
          {imageUri && (
            <View style={styles.photoWrapper}>
              <Image source={{ uri: imageUri }} style={styles.photo} resizeMode="cover" />
              <View style={[styles.photoBadge, { backgroundColor: colors.primary }]}>
                <MaterialCommunityIcons name="check" size={14} color="#ECEEF3" />
                <Text style={styles.photoBadgeTxt}>Photo prête</Text>
              </View>
            </View>
          )}

          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>📚 Matière</Text>
            <View style={styles.matieresGrid}>
              {MATIERES.map(m => {
                const c = MATIERE_CONFIG[m];
                const sel = m === matiere;
                return (
                  <TouchableOpacity key={m} style={[styles.matiereChip, { backgroundColor: sel ? c.couleur + '25' : colors.surface, borderColor: sel ? c.couleur : colors.border, borderWidth: sel ? 2 : 1 }]} onPress={() => setMatiere(m)}>
                    <Text style={styles.matiereEmoji}>{c.emoji}</Text>
                    <Text style={[styles.matiereTxt, { color: sel ? c.couleur : colors.textSecondary }]}>{m}</Text>
                    {sel && <MaterialCommunityIcons name="check-circle" size={12} color={c.couleur} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>📖 Titre du chapitre <Text style={{ color: colors.error }}>*</Text></Text>
            <TextInput style={[styles.input, { backgroundColor: colors.surface, borderColor: titreChapitre ? cfg.couleur : colors.border, color: colors.text }]} placeholder="Ex: Les dérivées, La photosynthèse..." placeholderTextColor={colors.textMuted} value={titreChapitre} onChangeText={setTitre} maxLength={100} />
            <Text style={[styles.compteurChars, { color: colors.textMuted }]}>{titreChapitre.length}/100</Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>📝 Section / Partie <Text style={[styles.optionnel, { color: colors.textMuted }]}>(optionnel)</Text></Text>
            <TextInput style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]} placeholder="Ex: 1.2 Formules clés..." placeholderTextColor={colors.textMuted} value={titreSection} onChangeText={setSection} maxLength={80} />
          </View>

          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.switchLabel, { color: colors.text }]}>🌍 Partager avec les autres élèves</Text>
                <Text style={[styles.switchDesc, { color: colors.textMuted }]}>{estPublic ? 'Visible dans Découverte. Les autres peuvent écouter.' : '🔒 Privé — visible uniquement par toi.'}</Text>
              </View>
              <Switch value={estPublic} onValueChange={setEstPublic} trackColor={{ false: colors.border, true: colors.primary + '80' }} thumbColor={estPublic ? colors.primary : colors.textMuted} />
            </View>
          </View>

          <TouchableOpacity style={[styles.genBtn, { backgroundColor: peutGenerer ? cfg.couleur : colors.border }]} onPress={handleGenerer} disabled={!peutGenerer}>
            <MaterialCommunityIcons name="microphone" size={24} color={peutGenerer ? '#ECEEF3' : colors.textMuted} />
            <Text style={[styles.genBtnTxt, { color: peutGenerer ? '#ECEEF3' : colors.textMuted }]}>Générer le podcast</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,215,0,0.1)', justifyContent: 'center', alignItems: 'center' },
  headerTitre: { fontSize: 18, fontWeight: 'bold', color: 'white' },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  photoWrapper: { position: 'relative', borderRadius: 20, overflow: 'hidden' },
  photo: { width: '100%', height: 180, borderRadius: 20 },
  photoBadge: { position: 'absolute', bottom: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  photoBadgeTxt: { color: '#ECEEF3', fontSize: 11, fontWeight: 'bold' },
  card: { borderRadius: 20, padding: 18, gap: 12 },
  label: { fontSize: 13, fontWeight: '700' },
  matieresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  matiereChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  matiereEmoji: { fontSize: 16 },
  matiereTxt: { fontSize: 12, fontWeight: '600' },
  input: { borderRadius: 14, borderWidth: 1.5, padding: 14, fontSize: 15 },
  compteurChars: { fontSize: 11, textAlign: 'right' },
  optionnel: { fontSize: 11, fontWeight: '400' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  switchLabel: { fontSize: 14, fontWeight: '600' },
  switchDesc: { fontSize: 12, marginTop: 4, lineHeight: 18 },
  genBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 18, borderRadius: 18 },
  genBtnTxt: { fontSize: 17, fontWeight: 'bold' },
});
