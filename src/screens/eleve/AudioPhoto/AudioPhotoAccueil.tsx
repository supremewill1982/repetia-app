import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import { getPodcastsLocaux, peutCreerPodcast } from '../../../services/podcastService';
import { MATIERE_CONFIG } from '../../../types/podcast.types';

export default function AudioPhotoAccueil({ navigation }: any) {
  const { colors }   = useTheme();
  const { userData } = useAuth();

  const [stats, setStats]       = useState({ total: 0, ecoutes: 0, likesRecus: 0 });
  const [podcasts, setPodcasts] = useState<any[]>([]);

  useFocusEffect(useCallback(() => { charger(); }, []));

  const charger = async () => {
    const liste = await getPodcastsLocaux();
    const totalEcoutes = liste.reduce((a, p) => a + p.nbEcoute, 0);
    const totalLikes   = liste.reduce((a, p) => a + (p.likesCount || 0), 0);
    setStats({ total: liste.length, ecoutes: totalEcoutes, likesRecus: totalLikes });
    setPodcasts(liste.slice(0, 3));
  };

  const handlePrendrePhoto = async () => {
    const { peutCreer, message } = await peutCreerPodcast();
    if (!peutCreer) { Alert.alert('Limite atteinte 🎧', message!); return; }

    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission requise', 'Autorise l\'accès à la caméra.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      navigation.navigate('AudioPhotoFormulaire', {
        imageUri: asset.uri,
        imageBase64: asset.base64,
      });
    }
  };

  const handleGalerie = async () => {
    const { peutCreer, message } = await peutCreerPodcast();
    if (!peutCreer) { Alert.alert('Limite atteinte 🎧', message!); return; }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      navigation.navigate('AudioPhotoFormulaire', {
        imageUri: asset.uri,
        imageBase64: asset.base64,
      });
    }
  };

  const progressPct = (stats.total / 15) * 100;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={['#E8F2EE', '#ECEEF3']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitre, { color: colors.text }]}>🎧 AudioRévision Photo</Text>
          <Text style={[styles.headerSub, { color: colors.textMuted }]}>Transforme tes cours en podcasts</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('AudioPhotoDecouverte')}>
          <MaterialCommunityIcons name="earth" size={26} color={colors.primary} />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.compteurCard, { backgroundColor: colors.card }]}>
          <View style={styles.compteurRow}>
            <Text style={[styles.compteurTitre, { color: colors.text }]}>📚 Mes podcasts</Text>
            <Text style={[styles.compteurVal, { color: colors.primary }]}>{stats.total}/15</Text>
          </View>
          <View style={[styles.progressBg, { backgroundColor: colors.border }]}>
            <View style={[styles.progressFill, { width: `${progressPct}%`, backgroundColor: progressPct >= 80 ? colors.error : colors.primary }]} />
          </View>
        </View>

        <View style={styles.statsRow}>
          {[
            { label: 'Écoutes', val: stats.ecoutes, icon: 'headphones', color: '#4DA6FF' },
            { label: 'Likes reçus', val: stats.likesRecus, icon: 'heart', color: '#FF6B9D' },
            { label: 'Créés', val: stats.total, icon: 'microphone', color: '#6BAE98' },
          ].map(({ label, val, icon, color }) => (
            <View key={label} style={[styles.statBox, { backgroundColor: colors.card }]}>
              <MaterialCommunityIcons name={icon as any} size={20} color={color} />
              <Text style={[styles.statVal, { color: colors.text }]}>{val}</Text>
              <Text style={[styles.statLbl, { color: colors.textMuted }]}>{label}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={[styles.btnPhoto, { backgroundColor: colors.primary }]} onPress={handlePrendrePhoto}>
          <MaterialCommunityIcons name="camera" size={28} color="#ECEEF3" />
          <View>
            <Text style={styles.btnPhotoTitre}>📸 Prendre en photo mon cours</Text>
            <Text style={styles.btnPhotoSous}>L'IA lit et transforme en podcast</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btnGalerie, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={handleGalerie}>
          <MaterialCommunityIcons name="image-multiple" size={22} color={colors.primary} />
          <Text style={[styles.btnGalerieTxt, { color: colors.primary }]}>Choisir depuis la galerie</Text>
        </TouchableOpacity>

        <View style={styles.accesRapides}>
          <TouchableOpacity style={[styles.accesBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => navigation.navigate('AudioPhotoBibliotheque')}>
            <MaterialCommunityIcons name="bookshelf" size={22} color={colors.primary} />
            <Text style={[styles.accesBtnTxt, { color: colors.text }]}>Bibliothèque</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.accesBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => navigation.navigate('AudioPhotoDecouverte')}>
            <MaterialCommunityIcons name="earth" size={22} color={colors.secondary || '#7BA89A'} />
            <Text style={[styles.accesBtnTxt, { color: colors.text }]}>Découverte</Text>
          </TouchableOpacity>
        </View>

        {podcasts.length > 0 && (
          <View style={[styles.recentsCard, { backgroundColor: colors.card }]}>
            <View style={styles.recentsHeader}>
              <Text style={[styles.recentsTitre, { color: colors.text }]}>🕐 Récents</Text>
              <TouchableOpacity onPress={() => navigation.navigate('AudioPhotoBibliotheque')}>
                <Text style={[styles.voirTout, { color: colors.primary }]}>Voir tout</Text>
              </TouchableOpacity>
            </View>
            {podcasts.map(p => {
              const cfg = MATIERE_CONFIG[p.matiere as keyof typeof MATIERE_CONFIG];
              return (
                <TouchableOpacity key={p.id} style={styles.recentRow} onPress={() => navigation.navigate('AudioPhotoLecteur', { podcast: p })}>
                  <View style={[styles.recentEmoji, { backgroundColor: cfg.couleur + '20' }]}><Text style={{ fontSize: 22 }}>{cfg.emoji}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.recentTitre, { color: colors.text }]} numberOfLines={1}>{p.titreChapitre}</Text>
                    <Text style={[styles.recentMeta, { color: colors.textMuted }]}>{p.matiere} · {Math.round(p.dureeSecondes / 60)} min · {p.nbEcoute} écoute{p.nbEcoute > 1 ? 's' : ''}</Text>
                  </View>
                  <MaterialCommunityIcons name="play-circle" size={28} color={cfg.couleur} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,215,0,0.1)', justifyContent: 'center', alignItems: 'center' },
  headerTitre: { fontSize: 18, fontWeight: 'bold', color: 'white' },
  headerSub: { fontSize: 11, marginTop: 2 },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  compteurCard: { borderRadius: 20, padding: 18, gap: 10 },
  compteurRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  compteurTitre: { fontSize: 15, fontWeight: '700' },
  compteurVal: { fontSize: 20, fontWeight: 'bold' },
  progressBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statBox: { flex: 1, borderRadius: 16, padding: 14, alignItems: 'center', gap: 6 },
  statVal: { fontSize: 20, fontWeight: 'bold' },
  statLbl: { fontSize: 10 },
  btnPhoto: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 20, borderRadius: 20 },
  btnPhotoTitre: { color: '#ECEEF3', fontSize: 16, fontWeight: 'bold' },
  btnPhotoSous: { color: '#2A1A0A', fontSize: 11, marginTop: 2 },
  btnGalerie: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 14, borderRadius: 16, borderWidth: 1 },
  btnGalerieTxt: { fontSize: 15, fontWeight: '600' },
  accesRapides: { flexDirection: 'row', gap: 10 },
  accesBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 16, borderWidth: 1 },
  accesBtnTxt: { fontSize: 14, fontWeight: '600' },
  recentsCard: { borderRadius: 20, padding: 16, gap: 12 },
  recentsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recentsTitre: { fontSize: 14, fontWeight: '700' },
  voirTout: { fontSize: 13, fontWeight: '600' },
  recentRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  recentEmoji: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  recentTitre: { fontSize: 14, fontWeight: '600' },
  recentMeta: { fontSize: 11, marginTop: 2 },
});
