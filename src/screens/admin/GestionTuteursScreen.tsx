import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { useTheme } from '../../context/ThemeContext';
import { Tuteur } from '../../services/tuteurService';

export default function GestionTuteursScreen() {
  const { colors } = useTheme();
  const [tuteurs, setTuteurs] = useState<Tuteur[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const charger = async () => {
    try {
      setLoading(true);
      const snap = await getDocs(query(collection(db, 'tuteurs'), where('statut', '==', 'en_attente')));
      setTuteurs(snap.docs.map(d => ({ ...d.data(), uid: d.id }) as Tuteur));
    } catch (e) {
      console.error('Erreur chargement tuteurs:', e);
      Alert.alert('Erreur', 'Impossible de charger les inscriptions répétiteurs.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { charger(); }, []));

  const certifier = async (uid: string) => {
    try {
      setProcessing(uid);
      await updateDoc(doc(db, 'tuteurs', uid), { statut: 'certifie', dateCertification: new Date() });
      setTuteurs(prev => prev.filter(t => t.uid !== uid));
      Alert.alert('Succès', 'Répétiteur certifié.');
    } catch (e) {
      console.error('Erreur certification:', e);
      Alert.alert('Erreur', 'Impossible de certifier ce répétiteur.');
    } finally {
      setProcessing(null);
    }
  };

  const renderItem = ({ item }: { item: Tuteur }) => (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.identity}>
        <View style={[styles.avatar, { backgroundColor: colors.primary + '18' }]}>
          <Text style={styles.avatarText}>{item.avatar || '👨🏾‍🏫'}</Text>
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.text }]}>{item.prenom} {item.nom}</Text>
          <Text style={[styles.meta, { color: colors.textMuted }]}>{item.email}</Text>
          <Text style={[styles.meta, { color: colors.textMuted }]}>{(item.matieres || []).join(' • ') || 'Matières non renseignées'}</Text>
          <View style={[styles.badge, { backgroundColor: colors.warning + '20' }]}>
            <Text style={{ color: colors.warning, fontWeight: '700', fontSize: 11 }}>En attente de validation</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary, opacity: processing === item.uid ? 0.6 : 1 }]}
        disabled={processing === item.uid}
        onPress={() => certifier(item.uid)}
      >
        {processing === item.uid ? <ActivityIndicator color="white" /> : <><MaterialCommunityIcons name="check-decagram" size={20} color="white" /><Text style={styles.buttonText}>Valider et certifier</Text></>}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Répétiteurs à valider</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>{tuteurs.length} inscription(s) en attente</Text>
        </View>
        <TouchableOpacity onPress={charger}><MaterialCommunityIcons name="refresh" size={24} color={colors.primary} /></TouchableOpacity>
      </View>
      {loading ? <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View> : (
        <FlatList
          data={tuteurs}
          keyExtractor={item => item.uid}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshing={loading}
          onRefresh={charger}
          ListEmptyComponent={<View style={styles.center}><MaterialCommunityIcons name="account-check-outline" size={52} color={colors.textMuted} /><Text style={[styles.empty, { color: colors.textMuted }]}>Aucune inscription en attente.</Text></View>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  title: { fontSize: 20, fontWeight: '700' },
  subtitle: { marginTop: 4, fontSize: 13 },
  list: { padding: 16 },
  card: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 12 },
  identity: { flexDirection: 'row' },
  avatar: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { fontSize: 28 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700' },
  meta: { fontSize: 12, marginTop: 3 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, marginTop: 7 },
  button: { marginTop: 14, borderRadius: 10, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  buttonText: { color: 'white', fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  empty: { marginTop: 12, textAlign: 'center' },
});
