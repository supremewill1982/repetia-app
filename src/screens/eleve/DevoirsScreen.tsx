import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { getFirestore, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { auth } from '../../services/firebaseConfig';

export default function DevoirsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [devoirs, setDevoirs] = useState<any[]>([]);
  const [derniersDevoirs, setDerniersDevoirs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const stats = {
    total: devoirs.length,
    moyenne: devoirs.length > 0 
      ? Math.round(devoirs.reduce((acc, d) => acc + (d.note || 0), 0) / devoirs.length * 10) / 10
      : 0,
    encours: devoirs.filter(d => d.status === 'en_cours').length,
  };

  const chargerDevoirs = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const db = getFirestore();
      const q = query(
        collection(db, 'sessions'),
        where('enfantId', '==', user.uid)
      );

      const snapshot = await getDocs(q);

      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((session: any) => session.type === 'devoir')
        .sort((a: any, b: any) => {
          const da = a.createdAt?.toDate?.()?.getTime?.() || 0;
          const db = b.createdAt?.toDate?.()?.getTime?.() || 0;
          return db - da;
        })
        .map((session: any) => ({
          ...session,
          note: session.noteSur20 ?? session.note ?? (
            session.scoreMax
              ? Math.round(((session.score || 0) / session.scoreMax) * 20 * 10) / 10
              : 0
          ),
          status: session.status || 'termine',
        }));

      setDevoirs(data);
      setDerniersDevoirs(data.slice(0, 3));
    } catch (error) {
      console.error('Erreur chargement devoirs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { chargerDevoirs(); }, []));

  const onRefresh = () => {
    setRefreshing(true);
    chargerDevoirs();
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
    >
      {/* Header */}
      <LinearGradient colors={['#E8F2EE', '#ECEEF3']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>📝 Mes devoirs</Text>
      </LinearGradient>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.statNumber, { color: colors.primary }]}>{stats.total}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Devoirs</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.statNumber, { color: colors.primary }]}>{stats.moyenne}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Moyenne</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.statNumber, { color: colors.warning }]}>{stats.encours}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>En cours</Text>
        </View>
      </View>

      {/* Nouveau devoir */}
      <TouchableOpacity
        style={styles.newButton}
        onPress={() => navigation.navigate('PrisePhotoDevoir')}
      >
        <LinearGradient colors={['#7BA89A', '#5A8A7A']} style={styles.newGradient}>
          <MaterialCommunityIcons name="plus-circle" size={24} color="white" />
          <Text style={styles.newButtonText}>Nouveau devoir</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Derniers devoirs */}
      {derniersDevoirs.length > 0 && (
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>📋 Derniers devoirs</Text>
          {derniersDevoirs.map((devoir) => (
            <TouchableOpacity
              key={devoir.id}
              style={[styles.devoirCard, { borderBottomColor: colors.border }]}
              onPress={() => navigation.navigate('DetailsSessionScreen', { session: devoir })}
            >
              <View style={styles.devoirInfo}>
                <Text style={[styles.devoirMatiere, { color: colors.primary }]}>{devoir.matiere}</Text>
                <Text style={[styles.devoirDate, { color: colors.textMuted }]}>
                  {devoir.createdAt?.toDate?.().toLocaleDateString() || new Date().toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.devoirStatus}>
                {devoir.note ? (
                  <Text style={[styles.devoirNote, { color: colors.success }]}>{devoir.note}/20</Text>
                ) : (
                  <Text style={[styles.devoirEnCours, { color: colors.warning }]}>En attente</Text>
                )}
                <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(90,138,122,0.1)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 20, gap: 12 },
  statCard: { flex: 1, padding: 16, borderRadius: 16, alignItems: 'center', shadowColor: '#2B3A4A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  statNumber: { fontSize: 24, fontWeight: 'bold' },
  statLabel: { fontSize: 12, marginTop: 4 },
  newButton: { marginHorizontal: 20, marginTop: 20, borderRadius: 16, overflow: 'hidden' },
  newGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16 },
  newButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  section: { margin: 20, marginTop: 20, padding: 16, borderRadius: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  devoirCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  devoirInfo: { flex: 1 },
  devoirMatiere: { fontSize: 15, fontWeight: '600' },
  devoirDate: { fontSize: 12, marginTop: 2 },
  devoirStatus: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  devoirNote: { fontSize: 15, fontWeight: 'bold' },
  devoirEnCours: { fontSize: 13, fontWeight: '500' },
});
