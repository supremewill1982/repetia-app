import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { getFirestore, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { auth } from '../../services/firebaseConfig';

export default function RevisionsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [revisions, setRevisions] = useState<any[]>([]);
  const [dernieresRevisions, setDernieresRevisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const stats = {
    total: revisions.length,
    moyenne: revisions.length > 0 
      ? Math.round(revisions.reduce((acc, r) => acc + (r.note || 0), 0) / revisions.length * 10) / 10
      : 0,
    serie: 0,
  };

  const chargerRevisions = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const db = getFirestore();
      const q = query(
        collection(db, 'revisions'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRevisions(data);
      setDernieresRevisions(data.slice(0, 5));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { chargerRevisions(); }, []));

  const onRefresh = () => {
    setRefreshing(true);
    chargerRevisions();
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
    >
      <LinearGradient colors={['#E8F2EE', '#ECEEF3']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>📚 Mes révisions</Text>
      </LinearGradient>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.statNumber, { color: colors.primary }]}>{stats.total}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Révisions</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.statNumber, { color: colors.primary }]}>{stats.moyenne}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Moyenne</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.statNumber, { color: colors.warning }]}>{stats.serie}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Série</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.newButton}
        onPress={() => navigation.navigate('PrisePhotoCours')}
      >
        <LinearGradient colors={['#7BA89A', '#5A8A7A']} style={styles.newGradient}>
          <MaterialCommunityIcons name="plus-circle" size={24} color="white" />
          <Text style={styles.newButtonText}>Nouvelle révision</Text>
        </LinearGradient>
      </TouchableOpacity>

      {dernieresRevisions.length > 0 && (
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>🕐 Dernières révisions</Text>
          {dernieresRevisions.map((revision) => (
            <TouchableOpacity
              key={revision.id}
              style={[styles.revisionCard, { borderBottomColor: colors.border }]}
              onPress={() => navigation.navigate('ResultatsRevision', { revision })}
            >
              <View style={styles.revisionInfo}>
                <Text style={[styles.revisionMatiere, { color: colors.primary }]}>{revision.matiere}</Text>
                <Text style={[styles.revisionDate, { color: colors.textMuted }]}>
                  {revision.createdAt?.toDate?.().toLocaleDateString() || new Date().toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.revisionStatus}>
                {revision.note ? (
                  <Text style={[styles.revisionNote, { color: colors.success }]}>{revision.note}/20</Text>
                ) : (
                  <Text style={[styles.revisionEnCours, { color: colors.warning }]}>En cours</Text>
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
  revisionCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  revisionInfo: { flex: 1 },
  revisionMatiere: { fontSize: 15, fontWeight: '600' },
  revisionDate: { fontSize: 12, marginTop: 2 },
  revisionStatus: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  revisionNote: { fontSize: 15, fontWeight: 'bold' },
  revisionEnCours: { fontSize: 13, fontWeight: '500' },
});
