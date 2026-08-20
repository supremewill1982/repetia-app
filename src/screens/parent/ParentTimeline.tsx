import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import {
  getEnfantsLies, getSessionsEnfant, calculerScoreBienEtre,
  buildTimeline, EvenementTimeline,
} from '../../services/parentService';

export default function ParentTimeline({ navigation }: any) {
  const { colors }           = useTheme();
  const [timeline, setTL]   = useState<EvenementTimeline[]>([]);
  const [loading, setLoading]= useState(true);
  const [enfantNom, setNom] = useState('');

  useFocusEffect(useCallback(() => { charger(); }, []));

  const charger = async () => {
    setLoading(true);
    const enfants = await getEnfantsLies();
    if (!enfants.length) { setLoading(false); return; }
    const enfant  = enfants[0];
    setNom(enfant.prenom);
    const sess    = await getSessionsEnfant(enfant.uid);
    const be      = calculerScoreBienEtre(sess);
    const joursAbs = be.score < 40 ? 7 : be.score < 60 ? 3 : 0;
    setTL(buildTimeline(sess, joursAbs));
    setLoading(false);
  };

  const renderItem = ({ item: ev, index }: { item: EvenementTimeline; index: number }) => (
    <TouchableOpacity
      style={[styles.evCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => ev.sessionData && navigation.navigate('ParentSessionDetail', { session: ev.sessionData })}
      activeOpacity={ev.sessionData ? 0.8 : 1}
    >
      {/* Ligne verticale */}
      <View style={styles.timelineLeft}>
        <View style={[styles.dot, { backgroundColor: ev.couleur }]} />
        {index < timeline.length - 1 && (
          <View style={[styles.line, { backgroundColor: colors.border }]} />
        )}
      </View>

      {/* Contenu */}
      <View style={[styles.evContent, { borderColor: ev.couleur + '30' }]}>
        <View style={styles.evHeader}>
          <View style={[styles.evIconBox, { backgroundColor: ev.couleur + '20' }]}>
            <MaterialCommunityIcons name={ev.icone as any} size={16} color={ev.couleur} />
          </View>
          <Text style={[styles.evDate, { color: colors.textMuted }]}>
            {ev.date} {ev.heure && `— ${ev.heure}`}
          </Text>
          {ev.score !== undefined && (
            <View style={[styles.scoreBadge, { backgroundColor: ev.couleur + '20' }]}>
              <Text style={[styles.scoreBadgeTxt, { color: ev.couleur }]}>{ev.score}/20</Text>
            </View>
          )}
        </View>
        <Text style={[styles.evTitre, { color: colors.text }]}>{ev.titre}</Text>
        <Text style={[styles.evDesc, { color: colors.textSecondary }]}>{ev.description}</Text>
        {ev.dureeMin && (
          <Text style={[styles.evDuree, { color: colors.textMuted }]}>⏱ {ev.dureeMin} min</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={['#7BA89A', '#5A8A7A']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitre}>📅 Activité de {enfantNom}</Text>
      </LinearGradient>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={timeline}
          keyExtractor={(_, i) => i.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={{ fontSize: 48 }}>📅</Text>
              <Text style={[styles.emptyTxt, { color: colors.textSecondary }]}>Aucune activité</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 52, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 14 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerTitre: { fontSize: 18, fontWeight: '700', color: 'white' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyTxt: { fontSize: 15 },
  list: { padding: 16, paddingBottom: 40 },
  evCard: { flexDirection: 'row', marginBottom: 8 },
  timelineLeft: { width: 32, alignItems: 'center', paddingTop: 6 },
  dot: { width: 12, height: 12, borderRadius: 6, zIndex: 1 },
  line: { width: 2, flex: 1, marginTop: 4 },
  evContent: { flex: 1, borderRadius: 16, borderWidth: 1, padding: 14, marginLeft: 8, gap: 6 },
  evHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  evIconBox: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  evDate:    { fontSize: 11, flex: 1 },
  scoreBadge:    { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  scoreBadgeTxt: { fontSize: 11, fontWeight: '700' },
  evTitre: { fontSize: 14, fontWeight: '700' },
  evDesc:  { fontSize: 12, lineHeight: 18 },
  evDuree: { fontSize: 11 },
});
