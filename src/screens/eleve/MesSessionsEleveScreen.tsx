import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ActivityIndicator, Alert, Linking,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { getFirestore, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { Reservation } from '../../services/tuteurService';

export default function MesSessionsEleveScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { userId } = useAuth();
  const [sessions, setSessions] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) charger();
  }, [userId]);

  const charger = async () => {
    setLoading(true);
    try {
      const db = getFirestore();
      const q = query(
        collection(db, 'reservations'),
        where('eleveId', '==', userId),
        limit(20)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ ...d.data(), id: d.id }) as Reservation);
      // Trier par date de création (en local si besoin)
      setSessions(list);
    } catch (e) {
      console.error(e);
      Alert.alert('Erreur', 'Impossible de charger l\'historique des réservations.');
    } finally {
      setLoading(false);
    }
  };

  const contacterTuteur = (whatsapp: string, item: Reservation) => {
    const msg = `Bonjour ! 👋\nJe vous contacte concernant notre cours de ${item.matiere} réservé sur RÉPÉTIA.`;
    const url = `https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Erreur', 'Impossible d\'ouvrir WhatsApp. Vérifiez que l\'application est installée.');
    });
  };

  const renderItem = ({ item }: { item: Reservation }) => {
    const statutCouleur = 
      item.statut === 'confirmee' ? '#4CAF50' :
      item.statut === 'terminee' ? colors.primary :
      item.statut === 'annulee' ? colors.error : '#FF9800';

    const statutLabel = 
      item.statut === 'confirmee' ? 'Confirmée' :
      item.statut === 'terminee' ? 'Terminée' :
      item.statut === 'annulee' ? 'Annulée' : 'En attente';

    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.tuteurNom, { color: colors.text }]}>{item.tuteurNom}</Text>
          <View style={[styles.statutBadge, { backgroundColor: statutCouleur + '20' }]}>
            <Text style={[styles.statutTxt, { color: statutCouleur }]}>{statutLabel}</Text>
          </View>
        </View>

        <Text style={[styles.details, { color: colors.textSecondary }]}>
          📚 {item.matiere} · ⏱️ {item.dureeMin} minutes
        </Text>
        <Text style={[styles.details, { color: colors.textSecondary }]}>
          📅 Le {item.date} à {item.heure}
        </Text>
        <Text style={[styles.prix, { color: colors.primary }]}>
          💰 {item.prix.toLocaleString()} CFA
        </Text>

        {item.statut === 'confirmee' && (
          <TouchableOpacity
            style={[styles.btnAction, { backgroundColor: '#25D366' }]}
            onPress={() => contacterTuteur('', item)}
          >
            <MaterialCommunityIcons name="whatsapp" size={18} color="white" />
            <Text style={styles.btnText}>Discuter sur WhatsApp</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>📅 Mes Sessions de Cours</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id!}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="calendar-blank" size={64} color={colors.textMuted} />
            <Text style={[styles.emptyTxt, { color: colors.textSecondary }]}>
              Vous n'avez pas encore réservé de cours avec un répétiteur.
            </Text>
            <TouchableOpacity
              style={[styles.btnChercher, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('TuteursList')}
            >
              <Text style={styles.btnChercherTxt}>Trouver un répétiteur</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', padding: 16, paddingTop: 50, borderBottomWidth: 1, alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, gap: 14 },
  card: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tuteurNom: { fontSize: 16, fontWeight: 'bold' },
  statutBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statutTxt: { fontSize: 11, fontWeight: '700' },
  details: { fontSize: 13 },
  prix: { fontSize: 15, fontWeight: 'bold', marginTop: 4 },
  btnAction: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: 12, marginTop: 8 },
  btnText: { color: 'white', fontSize: 13, fontWeight: '700' },
  empty: { alignItems: 'center', justifyContent: 'center', marginTop: 100, gap: 16, paddingHorizontal: 32 },
  emptyTxt: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  btnChercher: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  btnChercherTxt: { color: 'white', fontSize: 14, fontWeight: '700' },
});
