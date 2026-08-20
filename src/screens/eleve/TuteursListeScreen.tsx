import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ActivityIndicator, TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { AGENTS } from '../../services/iaServiceOpenRouter';
import { getTuteursDisponibles, Tuteur } from '../../services/tuteurService';

export default function TuteursListeScreen({ navigation }: any) {
  const { colors } = useTheme();

  const [tuteurs, setTuteurs]       = useState<Tuteur[]>([]);
  const [filtres, setFiltres]       = useState<Tuteur[]>([]);
  const [loading, setLoading]       = useState(true);
  const [matiereFiltre, setMatiere] = useState('');
  const [recherche, setRecherche]   = useState('');

  useFocusEffect(
    useCallback(() => { chargerTuteurs(); }, [])
  );

  const chargerTuteurs = async () => {
    setLoading(true);
    const liste = await getTuteursDisponibles();
    setTuteurs(liste);
    setFiltres(liste);
    setLoading(false);
  };

  useEffect(() => {
    let resultat = tuteurs;
    if (matiereFiltre) {
      resultat = resultat.filter(t => t.matieres.includes(matiereFiltre));
    }
    if (recherche.trim()) {
      const q = recherche.toLowerCase();
      resultat = resultat.filter(t =>
        `${t.prenom} ${t.nom}`.toLowerCase().includes(q) ||
        t.matieres.some(m => m.toLowerCase().includes(q)) ||
        t.bio.toLowerCase().includes(q)
      );
    }
    setFiltres(resultat);
  }, [matiereFiltre, recherche, tuteurs]);

  const renderEtoiles = (note: number) => {
    const etoiles = [];
    for (let i = 1; i <= 5; i++) {
      etoiles.push(
        <MaterialCommunityIcons
          key={i}
          name={i <= Math.round(note) ? 'star' : 'star-outline'}
          size={12}
          color="#7BA89A"
        />
      );
    }
    return etoiles;
  };

  const renderTuteur = ({ item: t }: { item: Tuteur }) => {
    const agentPrincipal = AGENTS.find(a => a.matiere === t.matieres[0]);
    const couleur = agentPrincipal?.couleur || colors.primary;

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => navigation.navigate('TuteurProfil', { tuteurId: t.uid, tuteur: t })}
        activeOpacity={0.85}
      >
        {/* Badge disponible */}
        {!t.disponible && (
          <View style={styles.indisponibleBadge}>
            <Text style={styles.indisponibleTxt}>Indisponible</Text>
          </View>
        )}

        {/* En-tête */}
        <View style={styles.cardHeader}>
          <LinearGradient
            colors={[couleur + '30', couleur + '10']}
            style={[styles.avatar, { borderColor: couleur }]}
          >
            <Text style={styles.avatarEmoji}>{t.avatar}</Text>
          </LinearGradient>

          <View style={{ flex: 1 }}>
            <View style={styles.nomRow}>
              <Text style={[styles.nom, { color: colors.text }]}>
                {t.prenom} {t.nom}
              </Text>
              {t.scoreTest >= 85 && (
                <View style={[styles.certifBadge, { backgroundColor: colors.primary + '20' }]}>
                  <MaterialCommunityIcons name="check-decagram" size={12} color={colors.primary} />
                  <Text style={[styles.certifTxt, { color: colors.primary }]}>Certifié</Text>
                </View>
              )}
            </View>

            <View style={styles.etoilesRow}>
              {renderEtoiles(t.noteGlobale)}
              <Text style={[styles.noteText, { color: colors.textSecondary }]}>
                {t.noteGlobale.toFixed(1)} ({t.nbAvis} avis)
              </Text>
            </View>

            <Text style={[styles.diplome, { color: colors.textMuted }]} numberOfLines={1}>
              🎓 {t.diplome} · {t.anneeExp} ans d'exp.
            </Text>
          </View>
        </View>

        {/* Matières */}
        <View style={styles.matieresRow}>
          {t.matieres.slice(0, 3).map((m, i) => {
            const a = AGENTS.find(ag => ag.matiere === m);
            return (
              <View key={i} style={[styles.matiereTag, { backgroundColor: (a?.couleur || colors.primary) + '20' }]}>
                <Text style={{ fontSize: 11 }}>{a?.emoji || '📚'}</Text>
                <Text style={[styles.matiereTagTxt, { color: a?.couleur || colors.primary }]}>
                  {m.split('-')[0].trim()}
                </Text>
              </View>
            );
          })}
          {t.matieres.length > 3 && (
            <Text style={[styles.plusMatieres, { color: colors.textMuted }]}>+{t.matieres.length - 3}</Text>
          )}
        </View>

        {/* Bio */}
        <Text style={[styles.bio, { color: colors.textSecondary }]} numberOfLines={2}>
          {t.bio}
        </Text>

        {/* Stats + Prix */}
        <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="account-group" size={14} color={colors.textMuted} />
              <Text style={[styles.statTxt, { color: colors.textMuted }]}>{t.nbSessions} sessions</Text>
            </View>
          </View>

          <View style={styles.prixRow}>
            <Text style={[styles.prixLabel, { color: colors.textMuted }]}>À partir de</Text>
            <Text style={[styles.prix, { color: couleur }]}>
              {t.prix30min.toLocaleString()} CFA
            </Text>
            <Text style={[styles.prixDuree, { color: colors.textMuted }]}>/30min</Text>
          </View>

          <TouchableOpacity
            style={[styles.reserverBtn, { backgroundColor: t.disponible ? couleur : colors.border }]}
            onPress={() => t.disponible && navigation.navigate('TuteurProfil', { tuteurId: t.uid, tuteur: t })}
            disabled={!t.disponible}
          >
            <Text style={styles.reserverTxt}>
              {t.disponible ? 'Voir profil' : 'Indisponible'}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient colors={['#E8F2EE', '#ECEEF3']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>👩‍🏫 Répétiteurs</Text>
          <Text style={[styles.headerSub, { color: colors.textMuted }]}>
            {filtres.filter(t => t.disponible).length} disponibles maintenant
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.devenir, { borderColor: colors.primary }]}
          onPress={() => navigation.navigate('InscriptionTuteur')}
        >
          <Text style={[styles.devenirTxt, { color: colors.primary }]}>Devenir répétiteur</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Recherche */}
      <View style={[styles.searchBar, { backgroundColor: colors.surface }]}>
        <MaterialCommunityIcons name="magnify" size={20} color={colors.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Rechercher un répétiteur..."
          placeholderTextColor={colors.textMuted}
         
          onChangeText={setRecherche}
        />
        {recherche.length > 0 && (
          <TouchableOpacity onPress={() => setRecherche('')}>
            <MaterialCommunityIcons name="close" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filtres matières */}
      <FlatList
        data={[{ id: '', matiere: 'Tous', emoji: '🌟', couleur: colors.primary }, ...AGENTS.map(a => ({ id: a.id, matiere: a.matiere, emoji: a.emoji, couleur: a.couleur }))]}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.filtresRow}
        style={{ maxHeight: 52 }}
        renderItem={({ item }) => {
          const sel = matiereFiltre === item.matiere || (matiereFiltre === '' && item.id === '');
          return (
            <TouchableOpacity
              style={[styles.filtreChip, {
                backgroundColor: sel ? item.couleur + '25' : colors.card,
                borderColor:     sel ? item.couleur : colors.border,
                borderWidth: sel ? 2 : 1,
              }]}
              onPress={() => setMatiere(item.id === '' ? '' : item.matiere)}
            >
              <Text style={{ fontSize: 14 }}>{item.emoji}</Text>
              <Text style={[styles.filtreChipTxt, { color: sel ? item.couleur : colors.textSecondary }]}>
                {item.matiere === 'Tous' ? 'Tous' : item.matiere.split('-')[0].split(' ')[0]}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* Liste */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingTxt, { color: colors.textSecondary }]}>Chargement des répétiteurs...</Text>
        </View>
      ) : (
        <FlatList
          data={filtres}
          keyExtractor={t => t.uid}
          renderItem={renderTuteur}
          contentContainerStyle={styles.liste}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={{ fontSize: 48 }}>👩‍🏫</Text>
              <Text style={[styles.emptyTxt, { color: colors.textSecondary }]}>
                Aucun répétiteur trouvé pour cette matière.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,215,0,0.1)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  headerSub: { fontSize: 11, marginTop: 2 },
  devenir: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
  devenirTxt: { fontSize: 11, fontWeight: '600' },
  searchBar: { flexDirection: 'row', alignItems: 'center', margin: 12, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, gap: 10 },
  searchInput: { flex: 1, fontSize: 15 },
  filtresRow: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  filtreChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, gap: 5 },
  filtreChipTxt: { fontSize: 12, fontWeight: '600' },
  liste: { padding: 12, gap: 14, paddingBottom: 40 },
  card: { borderRadius: 24, padding: 18, borderWidth: 1, gap: 12 },
  indisponibleBadge: { position: 'absolute', top: 14, right: 14, backgroundColor: '#8A9AAA20', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  indisponibleTxt: { fontSize: 10, color: '#8A9AAA', fontWeight: '600' },
  cardHeader: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  avatar: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  avatarEmoji: { fontSize: 32 },
  nomRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  nom: { fontSize: 17, fontWeight: 'bold' },
  certifBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  certifTxt: { fontSize: 10, fontWeight: '700' },
  etoilesRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  noteText: { fontSize: 11, marginLeft: 2 },
  diplome: { fontSize: 11, marginTop: 4 },
  matieresRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  matiereTag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  matiereTagTxt: { fontSize: 11, fontWeight: '600' },
  plusMatieres: { fontSize: 11, paddingVertical: 4 },
  bio: { fontSize: 13, lineHeight: 19 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, gap: 8 },
  statsRow: { flex: 1 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statTxt: { fontSize: 11 },
  prixRow: { alignItems: 'flex-end' },
  prixLabel: { fontSize: 9 },
  prix: { fontSize: 16, fontWeight: 'bold' },
  prixDuree: { fontSize: 9 },
  reserverBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  reserverTxt: { color: '#ECEEF3', fontSize: 12, fontWeight: '700' },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingTxt: { fontSize: 14 },
  emptyBox: { alignItems: 'center', paddingTop: 60, gap: 16 },
  emptyTxt: { fontSize: 15, textAlign: 'center' },
});
