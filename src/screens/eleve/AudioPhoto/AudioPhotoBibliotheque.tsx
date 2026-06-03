import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  Alert, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../../context/ThemeContext';
import { getPodcastsLocaux, supprimerPodcast, toggleFavori, exporterScriptTexte } from '../../../services/podcastService';
import { MATIERE_CONFIG, MATIERES, Matiere } from '../../../types/podcast.types';
import { PodcastEnregistre } from '../../../types/podcast.types';

type Filtre = 'recent' | 'favoris' | 'ecoutes';

export default function AudioPhotoBibliotheque({ navigation }: any) {
  const { colors } = useTheme();
  const [podcasts, setPodcasts] = useState<PodcastEnregistre[]>([]);
  const [filtre, setFiltre] = useState<Filtre>('recent');
  const [matiereFiltre, setMatiere] = useState<Matiere | 'Tout'>('Tout');
  const [menuPodcast, setMenu] = useState<PodcastEnregistre | null>(null);

  useFocusEffect(useCallback(() => { charger(); }, []));

  const charger = async () => { setPodcasts(await getPodcastsLocaux()); };

  const podcastsFiltres = podcasts
    .filter(p => matiereFiltre === 'Tout' || p.matiere === matiereFiltre)
    .filter(p => filtre !== 'favoris' || p.estFavori)
    .sort((a, b) => {
      if (filtre === 'ecoutes') return b.nbEcoute - a.nbEcoute;
      return new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime();
    });

  const handleSupprimer = (podcast: PodcastEnregistre) => {
    setMenu(null);
    Alert.alert('Supprimer ?', `"${podcast.titreChapitre}" sera définitivement supprimé.`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => { await supprimerPodcast(podcast); charger(); } },
    ]);
  };

  const handleFavori = async (podcast: PodcastEnregistre) => {
    setMenu(null);
    await toggleFavori(podcast.id);
    charger();
  };

  const handleExport = async (podcast: PodcastEnregistre) => {
    setMenu(null);
    try { await exporterScriptTexte(podcast); } catch (e: any) { Alert.alert('Erreur', e.message); }
  };

  const renderItem = ({ item: p }: { item: PodcastEnregistre }) => {
    const cfg = MATIERE_CONFIG[p.matiere];
    const dureeMin = Math.round(p.dureeSecondes / 60);
    return (
      <TouchableOpacity style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => navigation.navigate('AudioPhotoLecteur', { podcast: p })} activeOpacity={0.85}>
        <View style={[styles.emojiBox, { backgroundColor: cfg.couleur + '20' }]}><Text style={{ fontSize: 26 }}>{cfg.emoji}</Text></View>
        <View style={{ flex: 1 }}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitre, { color: colors.text }]} numberOfLines={1}>{p.titreChapitre}</Text>
            {p.estFavori && <MaterialCommunityIcons name="star" size={14} color="#7BA89A" />}
            {p.estPublic ? <MaterialCommunityIcons name="earth" size={12} color="#6BAE98" /> : <MaterialCommunityIcons name="lock" size={12} color={colors.textMuted} />}
          </View>
          {p.titreSection && <Text style={[styles.cardSection, { color: colors.textSecondary }]} numberOfLines={1}>{p.titreSection}</Text>}
          <Text style={[styles.cardMeta, { color: colors.textMuted }]}>{p.matiere} · {dureeMin} min · 👂 {p.nbEcoute}</Text>
        </View>
        <TouchableOpacity style={styles.menuBtn} onPress={() => setMenu(p)}><MaterialCommunityIcons name="dots-vertical" size={20} color={colors.textMuted} /></TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={['#0A1030','#ECEEF3']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}><MaterialCommunityIcons name="arrow-left" size={24} color={colors.primary} /></TouchableOpacity>
        <View style={{ flex: 1 }}><Text style={[styles.headerTitre, { color: colors.text }]}>📚 Mes podcasts</Text><Text style={[styles.headerSub, { color: colors.textMuted }]}>{podcasts.length}/15 créés</Text></View>
        <TouchableOpacity onPress={() => navigation.navigate('AudioPhotoAccueil')}><MaterialCommunityIcons name="plus-circle" size={28} color={colors.primary} /></TouchableOpacity>
      </LinearGradient>

      <View style={[styles.filtresBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {(['recent', 'favoris', 'ecoutes'] as Filtre[]).map(f => (
          <TouchableOpacity key={f} style={[styles.filtreBtn, filtre === f && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]} onPress={() => setFiltre(f)}>
            <Text style={[styles.filtreTxt, { color: filtre === f ? colors.primary : colors.textMuted }]}>{f === 'recent' ? '📅 Récent' : f === 'favoris' ? '⭐ Favoris' : '🎧 Populaires'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList data={['Tout' as const, ...MATIERES]} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8, gap: 8 }} style={{ maxHeight: 50 }} renderItem={({ item: m }) => {
        const cfg = m !== 'Tout' ? MATIERE_CONFIG[m] : null;
        const sel = matiereFiltre === m;
        return (
          <TouchableOpacity style={[styles.matiereTab, { backgroundColor: sel ? (cfg?.couleur || colors.primary) + '25' : colors.card, borderColor: sel ? (cfg?.couleur || colors.primary) : colors.border, borderWidth: sel ? 2 : 1 }]} onPress={() => setMatiere(m)}>
            <Text style={{ fontSize: 12 }}>{cfg?.emoji || '🌟'}</Text>
            <Text style={[styles.matiereTabTxt, { color: sel ? (cfg?.couleur || colors.primary) : colors.textSecondary }]}>{m === 'Tout' ? 'Tout' : m}</Text>
          </TouchableOpacity>
        );
      }} />

      <FlatList data={podcastsFiltres} keyExtractor={p => p.id} renderItem={renderItem} contentContainerStyle={styles.liste} ListEmptyComponent={<View style={styles.emptyBox}><Text style={{ fontSize: 48 }}>🎧</Text><Text style={[styles.emptyTxt, { color: colors.textSecondary }]}>Aucun podcast</Text></View>} />

      <Modal visible={menuPodcast !== null} transparent animationType="slide" onRequestClose={() => setMenu(null)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setMenu(null)}>
          <View style={[styles.menuCard, { backgroundColor: colors.surface }]}>
            {menuPodcast && (
              <>
                <Text style={[styles.menuTitre, { color: colors.text }]} numberOfLines={1}>{menuPodcast.titreChapitre}</Text>
                <TouchableOpacity style={styles.menuItem} onPress={() => handleFavori(menuPodcast)}>
                  <MaterialCommunityIcons name={menuPodcast.estFavori ? 'star' : 'star-outline'} size={20} color="#7BA89A" />
                  <Text style={[styles.menuItemTxt, { color: '#7BA89A' }]}>{menuPodcast.estFavori ? 'Retirer des favoris' : '⭐ Marquer favori'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={() => handleExport(menuPodcast)}>
                  <MaterialCommunityIcons name="file-document-outline" size={20} color={colors.primary} />
                  <Text style={[styles.menuItemTxt, { color: colors.primary }]}>📁 Exporter le script</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={() => handleSupprimer(menuPodcast)}>
                  <MaterialCommunityIcons name="delete-outline" size={20} color={colors.error} />
                  <Text style={[styles.menuItemTxt, { color: colors.error }]}>🗑️ Supprimer</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuAnnuler} onPress={() => setMenu(null)}><Text style={[styles.menuAnnulerTxt, { color: colors.textMuted }]}>Annuler</Text></TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,215,0,0.1)', justifyContent: 'center', alignItems: 'center' },
  headerTitre: { fontSize: 18, fontWeight: 'bold', color: 'white' },
  headerSub: { fontSize: 11, marginTop: 2 },
  filtresBar: { flexDirection: 'row', borderBottomWidth: 1 },
  filtreBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  filtreTxt: { fontSize: 12, fontWeight: '600' },
  matiereTab: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, borderWidth: 1 },
  matiereTabTxt: { fontSize: 11, fontWeight: '600' },
  liste: { padding: 12, gap: 10, paddingBottom: 40 },
  card: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 20, borderWidth: 1, gap: 12 },
  emojiBox: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  cardTitre: { fontSize: 14, fontWeight: '700', flex: 1 },
  cardSection: { fontSize: 12, marginTop: 2 },
  cardMeta: { fontSize: 11, marginTop: 4 },
  menuBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  emptyBox: { alignItems: 'center', paddingTop: 60, gap: 16 },
  emptyTxt: { fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  menuCard: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 4 },
  menuTitre: { fontSize: 15, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 14 },
  menuItemTxt: { fontSize: 15, fontWeight: '600' },
  menuAnnuler: { alignItems: 'center', padding: 14, marginTop: 8 },
  menuAnnulerTxt: { fontSize: 15 },
});
