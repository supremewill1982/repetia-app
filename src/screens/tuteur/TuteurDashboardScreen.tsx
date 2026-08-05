import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Switch, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import {
  getMonProfilTuteur, getMesReservationsTuteur,
  basculerDisponibilite, Tuteur, Reservation,
} from '../../services/tuteurService';
import { AGENTS } from '../../services/iaServiceOpenRouter';

export default function TuteurDashboardScreen({ navigation }: any) {
  const { colors } = useTheme();

  const [tuteur, setTuteur]               = useState<Tuteur | null>(null);
  const [reservations, setReservations]   = useState<Reservation[]>([]);
  const [loading, setLoading]             = useState(true);
  const [toggling, setToggling]           = useState(false);

  useFocusEffect(
    useCallback(() => { charger(); }, [])
  );

  const charger = async () => {
    setLoading(true);
    const [t, r] = await Promise.all([
      getMonProfilTuteur(),
      getMesReservationsTuteur(),
    ]);
    setTuteur(t);
    setReservations(r);
    setLoading(false);
  };

  const handleToggleDispo = async (val: boolean) => {
    setToggling(true);
    await basculerDisponibilite(val);
    setTuteur(t => t ? { ...t, disponible: val } : null);
    setToggling(false);
  };

  if (loading) return (
    <View style={[styles.center, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );

  if (!tuteur) return (
    <View style={[styles.center, { backgroundColor: colors.background }]}>
      <Text style={{ fontSize: 48, marginBottom: 16 }}>👩‍🏫</Text>
      <Text style={[styles.errTxt, { color: colors.text }]}>Profil répétiteur non trouvé</Text>
      <TouchableOpacity
        style={[styles.btn, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('InscriptionTuteur')}
      >
        <Text style={{ color: '#ECEEF3', fontWeight: 'bold' }}>S'inscrire comme répétiteur</Text>
      </TouchableOpacity>
    </View>
  );

  const agentPrincipal = AGENTS.find(a => a.matiere === tuteur.matieres[0]);
  const couleur = agentPrincipal?.couleur || colors.primary;

  const revenusMois = tuteur.revenuMois.toLocaleString();
  const revenus     = tuteur.revenuTotal.toLocaleString();

  const enAttente   = reservations.filter(r => r.statut === 'en_attente');
  const confirmees  = reservations.filter(r => r.statut === 'confirmee');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={[couleur, '#ECEEF3']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.avatar}>{tuteur.avatar}</Text>
          <Text style={styles.nom}>{tuteur.prenom} {tuteur.nom}</Text>
          {tuteur.statut === 'certifie' && (
            <View style={styles.certifBadge}>
              <MaterialCommunityIcons name="check-decagram" size={14} color={colors.primary} />
              <Text style={[styles.certifTxt, { color: colors.primary }]}>Certifié RÉPÉTIA</Text>
            </View>
          )}
        </View>

        {/* Disponibilité toggle */}
        <View style={[styles.dispoRow, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
          <Text style={styles.dispoTxt}>
            {tuteur.disponible ? '🟢 Disponible' : '🔴 Indisponible'}
          </Text>
          {toggling ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Switch
              selectedValue={tuteur.disponible}
              onValueChange={handleToggleDispo}
              trackColor={{ false: '#607D8B', true: '#4CAF50' }}
              thumbColor="white"
            />
          )}
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Revenus */}
        <View style={styles.revenusRow}>
          <LinearGradient colors={['#7BA89A30', '#7BA89A15']} style={[styles.revenuCard, { borderColor: '#7BA89A' }]}>
            <Text style={[styles.revenuLabel, { color: colors.textMuted }]}>Ce mois</Text>
            <Text style={[styles.revenuVal, { color: '#7BA89A' }]}>{revenusMois}</Text>
            <Text style={[styles.revenuLabel, { color: colors.textMuted }]}>CFA</Text>
          </LinearGradient>
          <LinearGradient colors={['#6BAE9830', '#6BAE9815']} style={[styles.revenuCard, { borderColor: '#6BAE98' }]}>
            <Text style={[styles.revenuLabel, { color: colors.textMuted }]}>Total gagné</Text>
            <Text style={[styles.revenuVal, { color: '#6BAE98' }]}>{revenus}</Text>
            <Text style={[styles.revenuLabel, { color: colors.textMuted }]}>CFA</Text>
          </LinearGradient>
        </View>

        {/* Stats */}
        <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
          {[
            { label: 'Sessions', val: tuteur.nbSessions, icon: 'account-multiple', color: couleur },
            { label: 'Note', val: `${tuteur.noteGlobale.toFixed(1)}/5`, icon: 'star', color: '#7BA89A' },
            { label: 'Avis', val: tuteur.nbAvis, icon: 'comment', color: '#4DA6FF' },
            { label: 'Test', val: `${tuteur.scoreTest}%`, icon: 'brain', color: '#5A8A7A' },
          ].map(({ label, val, icon, color }) => (
            <View key={label} style={styles.statBox}>
              <MaterialCommunityIcons name={icon as any} size={22} color={color} />
              <Text style={[styles.statVal, { color: colors.text }]}>{val}</Text>
              <Text style={[styles.statLbl, { color: colors.textMuted }]}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Demandes en attente */}
        {enAttente.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitre, { color: colors.text }]}>
              🔔 Demandes en attente ({enAttente.length})
            </Text>
            {enAttente.map((r, i) => (
              <View key={i} style={[styles.resaRow, { borderBottomColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.resaNom, { color: colors.text }]}>{r.elevePrénom}</Text>
                  <Text style={[styles.resMeta, { color: colors.textSecondary }]}>
                    {r.matiere} · {r.dureeMin}min · {r.date} à {r.heure}
                  </Text>
                  <Text style={[styles.resaPrix, { color: couleur }]}>
                    {r.prix.toLocaleString()} CFA → toi: {Math.round(r.prix * 0.7).toLocaleString()} CFA
                  </Text>
                </View>
                <View style={[styles.statutBadge, { backgroundColor: '#FF980020' }]}>
                  <Text style={[styles.statutTxt, { color: '#FF9800' }]}>En attente</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Sessions confirmées */}
        {confirmees.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitre, { color: colors.text }]}>
              ✅ Sessions confirmées ({confirmees.length})
            </Text>
            {confirmees.map((r, i) => (
              <View key={i} style={[styles.resaRow, { borderBottomColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.resaNom, { color: colors.text }]}>{r.elevePrénom}</Text>
                  <Text style={[styles.resMeta, { color: colors.textSecondary }]}>
                    {r.matiere} · {r.date} à {r.heure}
                  </Text>
                </View>
                <View style={[styles.statutBadge, { backgroundColor: '#4CAF5020' }]}>
                  <Text style={[styles.statutTxt, { color: '#4CAF50' }]}>Confirmée</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Passer le test si pas certifié */}
        {tuteur.statut !== 'certifie' && (
          <TouchableOpacity
            style={[styles.testBtn, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('TestValidation')}
          >
            <MaterialCommunityIcons name="brain" size={22} color="#ECEEF3" />
            <View>
              <Text style={styles.testBtnTxt}>Passer le test de certification</Text>
              <Text style={styles.testBtnSub}>85% requis pour être certifié RÉPÉTIA</Text>
            </View>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  errTxt: { fontSize: 18 },
  btn: { padding: 14, borderRadius: 14, paddingHorizontal: 24 },
  header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center', alignSelf: 'flex-start' },
  headerContent: { alignItems: 'center', gap: 6 },
  avatar: { fontSize: 48 },
  nom: { fontSize: 22, fontWeight: 'bold', color: 'white' },
  certifBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,215,0,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  certifTxt: { fontSize: 12, fontWeight: '600' },
  dispoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 14 },
  dispoTxt: { color: 'white', fontSize: 15, fontWeight: '600' },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  revenusRow: { flexDirection: 'row', gap: 12 },
  revenuCard: { flex: 1, borderRadius: 20, padding: 18, alignItems: 'center', gap: 4, borderWidth: 1 },
  revenuLabel: { fontSize: 11, fontWeight: '600' },
  revenuVal: { fontSize: 26, fontWeight: 'bold' },
  statsCard: { borderRadius: 20, padding: 16, flexDirection: 'row' },
  statBox: { flex: 1, alignItems: 'center', gap: 4 },
  statVal: { fontSize: 18, fontWeight: 'bold' },
  statLbl: { fontSize: 10 },
  section: { borderRadius: 20, padding: 16, gap: 10 },
  sectionTitre: { fontSize: 14, fontWeight: '700' },
  resaRow: { paddingVertical: 12, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  resaNom: { fontSize: 15, fontWeight: '600' },
  resMeta: { fontSize: 12, marginTop: 2 },
  resaPrix: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  statutBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statutTxt: { fontSize: 11, fontWeight: '600' },
  testBtn: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 18 },
  testBtnTxt: { color: '#ECEEF3', fontSize: 15, fontWeight: 'bold' },
  testBtnSub: { color: '#2A1A0A', fontSize: 11, marginTop: 2 },
});
