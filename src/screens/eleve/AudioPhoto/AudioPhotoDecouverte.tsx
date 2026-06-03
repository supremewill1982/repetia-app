import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../../context/ThemeContext';
import { getPodcastsPublics } from '../../../services/podcastService';
import { toggleLike, getLikeInfo } from '../../../services/likeService';
import { MATIERE_CONFIG, MATIERES, Matiere } from '../../../types/podcast.types';
import { PodcastEnregistre } from '../../../types/podcast.types';

type Tri = 'recent' | 'populaire';

export default function AudioPhotoDecouverte({ navigation }: any) {
  const { colors } = useTheme();
  const [podcasts, setPodcasts] = useState<PodcastEnregistre[]>([]);
  const [loading, setLoading] = useState(true);
  const [tri, setTri] = useState<Tri>('recent');
  const [filtre, setFiltre] = useState<Matiere | 'Tout'>('Tout');
  const [likesMap, setLikesMap] = useState<Record<string, boolean>>({});
  const [liking, setLiking] = useState<string | null>(null);
  const [quotaRestant, setQuota] = useState(20);

  useFocusEffect(useCallback(() => { charger(); }, [tri, filtre]));

  const charger = async () => {
    setLoading(true);
    try {
      const liste = await getPodcastsPublics(filtre === 'Tout' ? undefined : filtre, tri);
      setPodcasts(liste);
      let quota = 20;
      for (const p of liste.slice(0, 10)) { const info = await getLikeInfo(p.id); if (info.restants < quota) quota = info.restants; }
      setQuota(quota);
    } catch { setPodcasts([]); } finally { setLoading(false); }
  };

  const handleLike = async (podcast: PodcastEnregistre) => {
    if (liking) return;
    setLiking(podcast.id);
    try {
      const { success, liked, message } = await toggleLike(podcast.id);
      if (!success && message) Alert.alert('Limite atteinte', message);
      else if (success) {
        setLikesMap(prev => ({ ...prev, [podcast.id]: liked }));
        setPodcasts(prev => prev.map(p => p.id === podcast.id ? { ...p, likesCount: p.likesCount + (liked ? 1 : -1) } : p));
        setQuota(q => liked ? Math.max(0, q - 1) : q + 1);
      }
    } finally { setLiking(null); }
  };

  const renderPodcast = ({ item: p }: { item: PodcastEnregistre }) => {
    const cfg = MATIERE_CONFIG[p.matiere];
    const liked = likesMap[p.id] || false;
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardTop}><View style={[styles.cfgBadge, { backgroundColor: cfg.couleur + '20' }]}><Text style={{ fontSize: 16 }}>{cfg.emoji}</Text><Text style={[styles.cfgNom, { color: cfg.couleur }]}>{p.matiere}</Text></View><Text style={[styles.userNom, { color: colors.textMuted }]}>{p.userPrenom}</Text></View>
        <Text style={[styles.podcastTitre, { color: colors.text }]} numberOfLines={2}>{p.titreChapitre}</Text>
        {p.titreSection && <Text style={[styles.podcastSection, { color: colors.textSecondary }]} numberOfLines={1}>📝 {p.titreSection}</Text>}
        <View style={styles.metaRow}><MaterialCommunityIcons name="clock" size={12} color={colors.textMuted} /><Text style={[styles.metaTxt, { color: colors.textMuted }]}>{Math.round(p.dureeSecondes / 60)} min</Text><MaterialCommunityIcons name="headphones" size={12} color={colors.textMuted} /><Text style={[styles.metaTxt, { color: colors.textMuted }]}>{p.nbEcoute}</Text></View>
        <View style={[styles.cardActions, { borderTopColor: colors.border }]}>
          <TouchableOpacity style={[styles.ecouterBtn, { backgroundColor: cfg.couleur }]} onPress={() => navigation.navigate('AudioPhotoLecteur', { podcast: p })}><MaterialCommunityIcons name="play" size={16} color="#ECEEF3" /><Text style={styles.ecouterTxt}>Écouter</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.likeBtn, liked && { backgroundColor: '#FF6B9D20' }]} onPress={() => handleLike(p)} disabled={!!liking}>{liking === p.id ? <ActivityIndicator size="small" color="#FF6B9D" /> : <MaterialCommunityIcons name={liked ? 'heart' : 'heart-outline'} size={20} color={liked ? '#FF6B9D' : colors.textMuted} />}<Text style={[styles.likeTxt, { color: liked ? '#FF6B9D' : colors.textMuted }]}>{p.likesCount || 0}</Text></TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={['#ECEEF3','#ECEEF3']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}><MaterialCommunityIcons name="arrow-left" size={24} color={colors.primary} /></TouchableOpacity>
        <View style={{ flex: 1 }}><Text style={[styles.headerTitre, { color: colors.text }]}>🌍 Découverte</Text><Text style={[styles.headerSub, { color: colors.textMuted }]}>Podcasts partagés · ❤️ {quotaRestant} likes restants</Text></View>
      </LinearGradient>

      <View style={[styles.triBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {[{ val: 'recent' as Tri, label: '🆕 Nouveautés' }, { val: 'populaire' as Tri, label: '🔥 Populaires' }].map(({ val, label }) => (<TouchableOpacity key={val} style={[styles.triBtn, tri === val && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]} onPress={() => setTri(val)}><Text style={[styles.triTxt, { color: tri === val ? colors.primary : colors.textMuted }]}>{label}</Text></TouchableOpacity>))}
      </View>

      <FlatList data={['Tout' as const, ...MATIERES]} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8, gap: 8 }} style={{ maxHeight: 50 }} renderItem={({ item: m }) => { const cfg = m !== 'Tout' ? MATIERE_CONFIG[m] : null; const sel = filtre === m; return (<TouchableOpacity style={[styles.filtreChip, { backgroundColor: sel ? (cfg?.couleur || colors.primary) + '25' : colors.card, borderColor: sel ? (cfg?.couleur || colors.primary) : colors.border, borderWidth: sel ? 2 : 1 }]} onPress={() => setFiltre(m)}><Text style={{ fontSize: 12 }}>{cfg?.emoji || '🌟'}</Text><Text style={[styles.filtreChipTxt, { color: sel ? (cfg?.couleur || colors.primary) : colors.textSecondary }]}>{m === 'Tout' ? 'Tout' : m}</Text></TouchableOpacity>); }} />

      {loading ? (<View style={styles.loadingBox}><ActivityIndicator size="large" color={colors.primary} /><Text style={[styles.loadingTxt, { color: colors.textSecondary }]}>Chargement...</Text></View>) : (<FlatList data={podcasts} keyExtractor={p => p.id} renderItem={renderPodcast} contentContainerStyle={styles.liste} ListEmptyComponent={<View style={styles.emptyBox}><Text style={{ fontSize: 48 }}>🌍</Text><Text style={[styles.emptyTxt, { color: colors.textSecondary }]}>Aucun podcast partagé</Text></View>} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,215,0,0.1)', justifyContent: 'center', alignItems: 'center' },
  headerTitre: { fontSize: 18, fontWeight: 'bold', color: 'white' },
  headerSub: { fontSize: 11, marginTop: 2 },
  triBar: { flexDirection: 'row', borderBottomWidth: 1 },
  triBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  triTxt: { fontSize: 13, fontWeight: '600' },
  filtreChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14 },
  filtreChipTxt: { fontSize: 11, fontWeight: '600' },
  liste: { padding: 12, gap: 12, paddingBottom: 40 },
  card: { borderRadius: 20, padding: 16, borderWidth: 1, gap: 8 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cfgBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14 },
  cfgNom: { fontSize: 12, fontWeight: '700' },
  userNom: { fontSize: 12 },
  podcastTitre: { fontSize: 16, fontWeight: '700' },
  podcastSection: { fontSize: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaTxt: { fontSize: 11 },
  cardActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: 1 },
  ecouterBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 14 },
  ecouterTxt: { color: '#ECEEF3', fontSize: 13, fontWeight: 'bold' },
  likeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14 },
  likeTxt: { fontSize: 14, fontWeight: '600' },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingTxt: { fontSize: 14 },
  emptyBox: { alignItems: 'center', paddingTop: 60, gap: 16 },
  emptyTxt: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
});
