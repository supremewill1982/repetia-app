import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { recommanderRepetiteurs, Repetiteur } from '../../services/repetiteursService';
import { AGENTS } from '../../services/iaServiceOpenRouter';

export default function RepetiteursScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [repetiteurs, setRepetiteurs] = useState<Repetiteur[]>([]);
  const [matiereFiltre, setMatiereFiltre] = useState('');

  const handleRechercher = async () => {
    setLoading(true);
    try {
      const recos = await recommanderRepetiteurs(matiereFiltre || undefined);
      setRepetiteurs(recos);
    } catch (e: any) {
      Alert.alert('Erreur', e.message || 'Impossible de charger les répétiteurs.');
    } finally {
      setLoading(false);
    }
  };

  const contacter = (contact: string) => {
    Linking.openURL(`tel:${contact}`).catch(() => Linking.openURL(`mailto:${contact}`));
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={['#0A2A1A', '#ECEEF3']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>👨‍🏫 Répétiteurs</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.filterCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterLabel, { color: colors.text }]}>Filtrer par matière (optionnel)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            placeholder="Ex: Mathématiques, Anglais..."
            placeholderTextColor={colors.textMuted}
           
            onChangeText={setMatiereFiltre}
          />
          <TouchableOpacity style={[styles.searchBtn, { backgroundColor: colors.primary }]} onPress={handleRechercher}>
            <MaterialCommunityIcons name="magnify" size={20} color="#ECEEF3" />
            <Text style={styles.searchTxt}>Trouver un répétiteur</Text>
          </TouchableOpacity>
        </View>

        {loading && <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />}

        {repetiteurs.map(r => (
          <View key={r.id} style={[styles.repCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.repHeader}>
              <View style={styles.repAvatar}>
                <Text style={styles.avatarText}>{r.nom.charAt(0)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.repNom, { color: colors.text }]}>{r.nom}</Text>
                <Text style={[styles.repMatiere, { color: colors.primary }]}>{r.matieres.join(', ')}</Text>
              </View>
              <View style={styles.noteContainer}>
                <MaterialCommunityIcons name="star" size={16} color="#7BA89A" />
                <Text style={[styles.note, { color: colors.text }]}>{r.note.toFixed(1)}</Text>
              </View>
            </View>
            <Text style={[styles.repDesc, { color: colors.textSecondary }]}>{r.description}</Text>
            <View style={styles.repFooter}>
              <View style={styles.location}>
                <MaterialCommunityIcons name={r.enLigne ? "web" : "map-marker"} size={14} color={colors.textMuted} />
                <Text style={[styles.locationTxt, { color: colors.textMuted }]}>{r.localisation}</Text>
              </View>
              <Text style={[styles.tarif, { color: '#4CAF50' }]}>{r.tarifHoraire.toLocaleString()} FCFA/h</Text>
            </View>
            <TouchableOpacity style={[styles.contactBtn, { backgroundColor: colors.primary + '20' }]} onPress={() => contacter(r.contact)}>
              <MaterialCommunityIcons name="phone" size={16} color={colors.primary} />
              <Text style={[styles.contactTxt, { color: colors.primary }]}>Contacter</Text>
            </TouchableOpacity>
          </View>
        ))}
        {repetiteurs.length === 0 && !loading && (
          <Text style={[styles.emptyTxt, { color: colors.textMuted }]}>Aucun répétiteur. Lance une recherche.</Text>
        )}
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
  filterCard: { borderRadius: 24, padding: 16, gap: 12 },
  filterLabel: { fontSize: 14, fontWeight: '600' },
  input: { borderRadius: 14, borderWidth: 1, padding: 12, fontSize: 15 },
  searchBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 40 },
  searchTxt: { fontSize: 16, fontWeight: 'bold', color: '#ECEEF3' },
  repCard: { borderRadius: 20, padding: 16, borderWidth: 1, gap: 12 },
  repHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  repAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#7BA89A40', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 24, fontWeight: 'bold', color: '#7BA89A' },
  repNom: { fontSize: 16, fontWeight: 'bold' },
  repMatiere: { fontSize: 12 },
  noteContainer: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.05)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  note: { fontSize: 14, fontWeight: 'bold' },
  repDesc: { fontSize: 13, lineHeight: 18 },
  repFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  location: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationTxt: { fontSize: 12 },
  tarif: { fontSize: 14, fontWeight: 'bold' },
  contactBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, borderRadius: 30 },
  contactTxt: { fontSize: 14, fontWeight: '600' },
  emptyTxt: { textAlign: 'center', marginTop: 40, fontSize: 14 },
});
