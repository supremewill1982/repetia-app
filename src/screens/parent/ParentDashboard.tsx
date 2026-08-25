import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import {
  getEnfantsLies,
  getSessionsEnfant,
  calculerScoreBienEtre,
  EnfantLie,
  ScoreBienEtre,
} from '../../services/parentService';

export default function ParentDashboard({ navigation }: any) {
  const { colors } = useTheme();
  const { userData } = useAuth();
  const [enfants, setEnfants] = useState<EnfantLie[]>([]);
  const [enfantActif, setEnfantActif] = useState<EnfantLie | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [bienEtre, setBienEtre] = useState<ScoreBienEtre | null>(null);
  const [loading, setLoading] = useState(true);

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const liste = await getEnfantsLies();
      setEnfants(liste);
      const enfant = liste[0];
      setEnfantActif(enfant || null);
      if (enfant) {
        const data = await getSessionsEnfant(enfant.uid);
        setSessions(data);
        setBienEtre(calculerScoreBienEtre(data));
      } else {
        setSessions([]);
        setBienEtre(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { charger(); }, [charger]));

  const changerEnfant = async (enfant: EnfantLie) => {
    setEnfantActif(enfant);
    const data = await getSessionsEnfant(enfant.uid);
    setSessions(data);
    setBienEtre(calculerScoreBienEtre(data));
  };

  if (loading) {
    return <View style={[styles.center, { backgroundColor: colors.background }]}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  if (!enfantActif) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, padding: 28 }]}>
        <View style={[styles.emptyIcon, { backgroundColor: colors.primary + '18' }]}><MaterialCommunityIcons name="account-child-outline" size={44} color={colors.primary} /></View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>Commençons par votre enfant</Text>
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>Liez un compte enfant pour suivre ses progrès, ses cours et recevoir les recommandations RÉPETIA.</Text>
        <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate('ParentLier')}>
          <MaterialCommunityIcons name="link-plus" size={21} color="#fff" />
          <Text style={styles.primaryButtonText}>Lier un enfant</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const prenomParent = (userData as any)?.prenom || 'Parent';
  const moyenne = sessions.length
    ? sessions.reduce((sum, s) => sum + Number(s.score ?? s.note ?? 0), 0) / sessions.length
    : 0;
  const derniers = sessions.slice(0, 3);
  const attention = bienEtre?.facteurs?.[0] || 'Continuez le rythme actuel : la régularité fait la différence.';
  const progression = Math.min(100, Math.max(0, Math.round((moyenne / 20) * 100)));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <View>
            <Text style={[styles.kicker, { color: colors.textMuted }]}>ESPACE PARENT</Text>
            <Text style={[styles.greeting, { color: colors.text }]}>Bonjour, {prenomParent} 👋</Text>
          </View>
          <TouchableOpacity style={[styles.headerButton, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => navigation.navigate('Profil')}>
            <MaterialCommunityIcons name="account-outline" size={21} color={colors.text} />
          </TouchableOpacity>
        </View>

        {enfants.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.childSelector}>
            {enfants.map(e => (
              <TouchableOpacity key={e.uid} onPress={() => changerEnfant(e)} style={[styles.childChip, { backgroundColor: e.uid === enfantActif.uid ? colors.primary : colors.surface, borderColor: e.uid === enfantActif.uid ? colors.primary : colors.border }]}>
                <MaterialCommunityIcons name="account-child" size={18} color={e.uid === enfantActif.uid ? '#fff' : colors.primary} />
                <Text style={[styles.childChipText, { color: e.uid === enfantActif.uid ? '#fff' : colors.text }]}>{e.prenom}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <View style={[styles.hero, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.heroTop}>
            <View style={[styles.statusIcon, { backgroundColor: colors.primary + '18' }]}>
              <MaterialCommunityIcons name="chart-timeline-variant" size={25} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.heroEyebrow, { color: colors.textMuted }]}>ÉTAT DE LA SEMAINE</Text>
              <Text style={[styles.heroTitle, { color: colors.text }]}>{enfantActif.prenom} progresse</Text>
            </View>
            <Text style={[styles.heroScore, { color: colors.primary }]}>{progression}%</Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: colors.border }]}><View style={[styles.progressFill, { width: `${progression}%`, backgroundColor: colors.primary }]} /></View>
          <Text style={[styles.heroText, { color: colors.textSecondary }]}>Une vue simple de la progression basée sur les dernières activités enregistrées.</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Suivi')}><Text style={[styles.link, { color: colors.primary }]}>Voir le suivi détaillé →</Text></TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <Stat icon="book-open-variant" label="Séances" value={String(sessions.length)} colors={colors} />
          <Stat icon="clock-outline" label="Rythme" value={sessions.length >= 3 ? 'Bon' : 'À renforcer'} colors={colors} />
          <Stat icon="school-outline" label="Classe" value={enfantActif.classe || '—'} colors={colors} />
        </View>

        <SectionTitle title="Ce qui mérite votre attention" action="Voir le suivi" onPress={() => navigation.navigate('Suivi')} colors={colors} />
        <View style={[styles.attentionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.attentionIcon, { backgroundColor: '#FFF4E5' }]}><MaterialCommunityIcons name="lightbulb-on-outline" size={22} color="#C98228" /></View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Le prochain petit pas</Text>
            <Text style={[styles.cardText, { color: colors.textSecondary }]}>{attention}</Text>
          </View>
        </View>

        <SectionTitle title="Votre enfant cette semaine" action="Rapport" onPress={() => navigation.navigate('Suivi')} colors={colors} />
        <View style={[styles.activityCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {derniers.length === 0 ? (
            <Text style={[styles.cardText, { color: colors.textMuted }]}>Aucune activité récente. Une première séance permettra de construire le suivi.</Text>
          ) : derniers.map((s, index) => (
            <View key={s.id || index} style={[styles.activityRow, index < derniers.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
              <View style={[styles.activityIcon, { backgroundColor: colors.primary + '14' }]}><MaterialCommunityIcons name="check-circle-outline" size={19} color={colors.primary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.activityTitle, { color: colors.text }]} numberOfLines={1}>{s.matiere || s.titre || 'Séance de travail'}</Text>
                <Text style={[styles.activityMeta, { color: colors.textMuted }]}>{s.date ? new Date(s.date).toLocaleDateString('fr-FR') : 'Récemment'}</Text>
              </View>
              {s.score != null && <Text style={[styles.activityScore, { color: colors.primary }]}>{s.score}/20</Text>}
            </View>
          ))}
        </View>

        <SectionTitle title="RÉPETIA recommande" colors={colors} />
        <View style={[styles.recommendation, { backgroundColor: colors.primary }]}>
          <View style={styles.recoIcon}><MaterialCommunityIcons name="sparkles" size={22} color="#fff" /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.recoTitle}>Un accompagnement qui reste simple</Text>
            <Text style={styles.recoText}>Consultez le suivi après chaque cours pour voir les progrès et décider rapidement s'il faut réviser, réserver ou simplement continuer.</Text>
          </View>
        </View>

        <View style={styles.quickRow}>
          <Quick icon="account-school-outline" label="Répétiteurs" onPress={() => navigation.navigate('Répétiteurs')} colors={colors} />
          <Quick icon="calendar-check-outline" label="Réserver" onPress={() => navigation.navigate('Réservations')} colors={colors} />
          <Quick icon="account-plus-outline" label="Ajouter un enfant" onPress={() => navigation.navigate('ParentLier')} colors={colors} />
        </View>
      </ScrollView>
    </View>
  );
}

function SectionTitle({ title, action, onPress, colors }: any) {
  return <View style={styles.sectionHeader}><Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>{action && <TouchableOpacity onPress={onPress}><Text style={[styles.link, { color: colors.primary }]}>{action}</Text></TouchableOpacity>}</View>;
}
function Stat({ icon, label, value, colors }: any) {
  return <View style={[styles.stat, { backgroundColor: colors.surface, borderColor: colors.border }]}><MaterialCommunityIcons name={icon} size={20} color={colors.primary} /><Text style={[styles.statValue, { color: colors.text }]} numberOfLines={1}>{value}</Text><Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text></View>;
}
function Quick({ icon, label, onPress, colors }: any) {
  return <TouchableOpacity style={[styles.quick, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={onPress}><MaterialCommunityIcons name={icon} size={21} color={colors.primary} /><Text style={[styles.quickText, { color: colors.text }]}>{label}</Text></TouchableOpacity>;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 18, paddingTop: 22, paddingBottom: 34 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  kicker: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  greeting: { fontSize: 25, fontWeight: '900', marginTop: 3 },
  headerButton: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  childSelector: { gap: 8, paddingBottom: 14 },
  childChip: { flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderRadius: 20, paddingHorizontal: 13, paddingVertical: 8 },
  childChipText: { fontSize: 13, fontWeight: '800' },
  hero: { borderWidth: 1, borderRadius: 24, padding: 18, marginBottom: 12 },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusIcon: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  heroEyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  heroTitle: { fontSize: 19, fontWeight: '900', marginTop: 3 },
  heroScore: { fontSize: 22, fontWeight: '900' },
  progressTrack: { height: 8, borderRadius: 8, overflow: 'hidden', marginTop: 16 },
  progressFill: { height: '100%', borderRadius: 8 },
  heroText: { fontSize: 12, lineHeight: 18, marginTop: 11 },
  link: { fontSize: 12, fontWeight: '800', marginTop: 9 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  stat: { flex: 1, borderWidth: 1, borderRadius: 17, padding: 12, minHeight: 82 },
  statValue: { fontSize: 16, fontWeight: '900', marginTop: 8 },
  statLabel: { fontSize: 10, marginTop: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9, marginTop: 3 },
  sectionTitle: { fontSize: 17, fontWeight: '900', flex: 1 },
  attentionCard: { borderWidth: 1, borderRadius: 19, padding: 15, flexDirection: 'row', gap: 12, marginBottom: 18 },
  attentionIcon: { width: 42, height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 14, fontWeight: '900' },
  cardText: { fontSize: 12, lineHeight: 18, marginTop: 4 },
  activityCard: { borderWidth: 1, borderRadius: 19, paddingHorizontal: 14, marginBottom: 18 },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13 },
  activityIcon: { width: 34, height: 34, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  activityTitle: { fontSize: 13, fontWeight: '800' },
  activityMeta: { fontSize: 10, marginTop: 3 },
  activityScore: { fontSize: 14, fontWeight: '900' },
  recommendation: { borderRadius: 20, padding: 16, flexDirection: 'row', gap: 12, marginBottom: 18 },
  recoIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center', alignItems: 'center' },
  recoTitle: { color: '#fff', fontSize: 14, fontWeight: '900' },
  recoText: { color: 'rgba(255,255,255,0.86)', fontSize: 11, lineHeight: 17, marginTop: 5 },
  quickRow: { flexDirection: 'row', gap: 8 },
  quick: { flex: 1, borderWidth: 1, borderRadius: 16, padding: 12, minHeight: 78, justifyContent: 'center', alignItems: 'center', gap: 7 },
  quickText: { fontSize: 10, fontWeight: '800', textAlign: 'center' },
  emptyIcon: { width: 82, height: 82, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  emptyTitle: { fontSize: 21, fontWeight: '900', textAlign: 'center' },
  emptyText: { fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 8, marginBottom: 18 },
  primaryButton: { minHeight: 50, paddingHorizontal: 22, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 8 },
  primaryButtonText: { color: '#fff', fontSize: 14, fontWeight: '900' },
});
