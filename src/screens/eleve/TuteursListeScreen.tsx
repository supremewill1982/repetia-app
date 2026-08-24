import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, TextInput, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { AGENTS } from '../../services/iaServiceOpenRouter';
import { getTuteursDisponibles, Tuteur } from '../../services/tuteurService';

export default function TuteursListeScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [tuteurs, setTuteurs] = useState<Tuteur[]>([]);
  const [recherche, setRecherche] = useState('');
  const [matiere, setMatiere] = useState('');
  const [loading, setLoading] = useState(true);

  const charger = useCallback(async () => {
    setLoading(true);
    const liste = await getTuteursDisponibles();
    setTuteurs(liste);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { charger(); }, [charger]));

  const filtres = tuteurs.filter(t => {
    const q = recherche.trim().toLowerCase();
    const texte = `${t.prenom || ''} ${t.nom || ''} ${t.bio || ''} ${(t.matieres || []).join(' ')}`.toLowerCase();
    return (!q || texte.includes(q)) && (!matiere || (t.matieres || []).includes(matiere));
  });

  const renderTuteur = ({ item: t }: { item: Tuteur }) => {
    const agent = AGENTS.find(a => a.matiere === t.matieres?.[0]);
    const accent = agent?.couleur || colors.primary;
    return (
      <TouchableOpacity activeOpacity={0.9} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => navigation.navigate('TuteurProfil', { tuteurId: t.uid, tuteur: t })}>
        <View style={styles.cardTop}>
          <LinearGradient colors={[accent + '35', accent + '10']} style={[styles.avatar, { borderColor: accent }]}>{t.profileImage ? <Image source={{uri:t.profileImage}} style={styles.avatarImage}/> : <Text style={styles.avatarText}>👨🏾‍🏫</Text>}</LinearGradient>
          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}><Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{t.prenom} {t.nom}</Text>{t.statut === 'certifie' && <MaterialCommunityIcons name="check-decagram" size={17} color={colors.primary} />}</View>
            <View style={styles.ratingRow}><MaterialCommunityIcons name="star" size={14} color={colors.warning} /><Text style={[styles.meta, { color: colors.text }]}>{Number(t.noteGlobale || 0).toFixed(1)}</Text><Text style={[styles.meta, { color: colors.textMuted }]}>({t.nbAvis || 0} avis)</Text></View>
            <Text style={[styles.meta, { color: colors.textMuted }]}>{t.anneeExp || 0} an(s) d'expérience</Text>
          </View>
          <View style={[styles.status, { backgroundColor: t.disponible ? '#4CAF5020' : colors.border }]}><Text style={{ fontSize: 10, color: t.disponible ? '#2E7D32' : colors.textMuted, fontWeight: '700' }}>{t.disponible ? 'Disponible' : 'Indisponible'}</Text></View>
        </View>
        <View style={styles.tags}>{(t.matieres || []).slice(0, 3).map(m => <View key={m} style={[styles.tag, { backgroundColor: accent + '18' }]}><Text style={{ color: accent, fontSize: 11, fontWeight: '700' }}>{m}</Text></View>)}</View>
        <Text style={[styles.bio, { color: colors.textSecondary }]} numberOfLines={2}>{t.bio || 'Profil de répétiteur en cours de complétion.'}</Text>
        <View style={[styles.footer, { borderTopColor: colors.border }]}><Text style={[styles.price, { color: accent }]}>{Number(t.prix30min || 0).toLocaleString()} FCFA / 30 min</Text><Text style={[styles.sessions, { color: colors.textMuted }]}>{t.nbSessions || 0} session(s)</Text><MaterialCommunityIcons name="chevron-right" size={22} color={accent} /></View>
      </TouchableOpacity>
    );
  };

  const matieres = Array.from(new Set(tuteurs.flatMap(t => t.matieres || [])));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={[colors.surface, colors.background]} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}><MaterialCommunityIcons name="arrow-left" size={23} color={colors.text} /></TouchableOpacity>
        <View style={{ flex: 1 }}><Text style={[styles.title, { color: colors.text }]}>Répétiteurs</Text><Text style={[styles.subtitle, { color: colors.textMuted }]}>{filtres.length} profil(s)</Text></View>
      </LinearGradient>
      <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border }]}><MaterialCommunityIcons name="magnify" size={20} color={colors.textMuted} /><TextInput value={recherche} onChangeText={setRecherche} placeholder="Rechercher un répétiteur..." placeholderTextColor={colors.textMuted} style={[styles.searchInput, { color: colors.text }]} /></View>
      <FlatList horizontal data={[{ id: '', label: 'Tous' }, ...matieres.map(m => ({ id: m, label: m }))]} keyExtractor={x => x.id || 'tous'} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters} renderItem={({ item }) => <TouchableOpacity onPress={() => setMatiere(item.id)} style={[styles.chip, { backgroundColor: matiere === item.id ? colors.primary : colors.surface, borderColor: matiere === item.id ? colors.primary : colors.border }]}><Text style={{ color: matiere === item.id ? 'white' : colors.text, fontSize: 11, fontWeight: '700' }}>{item.label}</Text></TouchableOpacity>} />
      {loading ? <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View> : <FlatList data={filtres} keyExtractor={x => x.uid} renderItem={renderTuteur} contentContainerStyle={styles.list} refreshing={loading} onRefresh={charger} ListEmptyComponent={<View style={styles.center}><MaterialCommunityIcons name="account-search-outline" size={52} color={colors.textMuted} /><Text style={[styles.empty, { color: colors.textMuted }]}>Aucun répétiteur trouvé.</Text></View>} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, header: { paddingTop: 14, paddingHorizontal: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }, back: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }, title: { fontSize: 23, fontWeight: '900' }, subtitle: { fontSize: 12, marginTop: 2 }, search: { marginHorizontal: 14, borderWidth: 1, borderRadius: 14, minHeight: 48, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, gap: 9 }, searchInput: { flex: 1, fontSize: 14 }, filters: { paddingHorizontal: 14, paddingVertical: 10, gap: 7 }, chip: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 11, paddingVertical: 8 }, list: { padding: 14, gap: 12, paddingBottom: 32 }, card: { borderWidth: 1, borderRadius: 18, padding: 15, gap: 11 }, cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 11 }, avatar: { width: 58, height: 58, borderRadius: 29, borderWidth: 2, alignItems: 'center', justifyContent: 'center', overflow:'hidden' }, avatarImage:{width:'100%',height:'100%'}, avatarText: { fontSize: 28 }, nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 }, name: { flex: 1, fontSize: 16, fontWeight: '800' }, ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }, meta: { fontSize: 11 }, status: { paddingHorizontal: 7, paddingVertical: 4, borderRadius: 9 }, tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 }, tag: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 9 }, bio: { fontSize: 12, lineHeight: 18 }, footer: { borderTopWidth: 1, paddingTop: 10, flexDirection: 'row', alignItems: 'center', gap: 9 }, price: { flex: 1, fontSize: 12, fontWeight: '800' }, sessions: { fontSize: 11 }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10 }, empty: { fontSize: 14, textAlign: 'center' },
});
