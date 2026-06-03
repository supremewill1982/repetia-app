import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { MATIERE_CONFIG } from '../../../types/podcast.types';

export default function AudioPhotoResultat({ route, navigation }: any) {
  const { colors } = useTheme();
  const { podcast } = route.params || {};
  const scale = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 4, tension: 60, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  if (!podcast) return null;
  const cfg = MATIERE_CONFIG[podcast.matiere as keyof typeof MATIERE_CONFIG];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={[cfg.couleur + '30', colors.background]} style={styles.gradient}>
        <Animated.View style={{ transform: [{ scale }], alignItems: 'center', gap: 12 }}>
          <Text style={styles.successEmoji}>✅</Text>
          <Text style={[styles.successTitre, { color: colors.text }]}>Podcast créé !</Text>
          <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
            <View style={[styles.cfgBadge, { backgroundColor: cfg.couleur + '20' }]}>
              <Text style={styles.cfgEmoji}>{cfg.emoji}</Text>
              <Text style={[styles.cfgNom, { color: cfg.couleur }]}>{podcast.matiere}</Text>
            </View>
            <Text style={[styles.podcastTitre, { color: colors.text }]}>{podcast.titreChapitre}</Text>
            {podcast.titreSection && <Text style={[styles.podcastSection, { color: colors.textSecondary }]}>📝 {podcast.titreSection}</Text>}
            <View style={styles.metaRow}>
              <MaterialCommunityIcons name="clock" size={14} color={colors.textMuted} />
              <Text style={[styles.metaTxt, { color: colors.textMuted }]}>{Math.round(podcast.dureeSecondes / 60)} min</Text>
              <MaterialCommunityIcons name="earth" size={14} color={podcast.estPublic ? '#6BAE98' : colors.textMuted} />
              <Text style={[styles.metaTxt, { color: podcast.estPublic ? '#6BAE98' : colors.textMuted }]}>{podcast.estPublic ? 'Partagé' : 'Privé'}</Text>
            </View>
          </View>
        </Animated.View>
        <Animated.View style={[styles.btns, { opacity: fade }]}>
          <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: cfg.couleur }]} onPress={() => navigation.replace('AudioPhotoLecteur', { podcast })}>
            <MaterialCommunityIcons name="play-circle" size={24} color="#ECEEF3" />
            <Text style={styles.btnPrimaryTxt}>▶️ Écouter maintenant</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btnSecondary, { borderColor: colors.border }]} onPress={() => navigation.navigate('AudioPhotoBibliotheque')}>
            <MaterialCommunityIcons name="bookshelf" size={20} color={colors.primary} />
            <Text style={[styles.btnSecondaryTxt, { color: colors.primary }]}>📚 Voir ma bibliothèque</Text>
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 40 },
  successEmoji: { fontSize: 80 },
  successTitre: { fontSize: 28, fontWeight: 'bold' },
  infoCard: { borderRadius: 24, padding: 20, alignItems: 'center', gap: 10, width: '100%' },
  cfgBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  cfgEmoji: { fontSize: 22 },
  cfgNom: { fontSize: 15, fontWeight: '700' },
  podcastTitre: { fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
  podcastSection: { fontSize: 14, textAlign: 'center' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaTxt: { fontSize: 12 },
  btns: { width: '100%', gap: 12 },
  btnPrimary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 18, borderRadius: 18 },
  btnPrimaryTxt: { color: '#ECEEF3', fontSize: 17, fontWeight: 'bold' },
  btnSecondary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16, borderRadius: 16, borderWidth: 1 },
  btnSecondaryTxt: { fontSize: 15, fontWeight: '600' },
});
