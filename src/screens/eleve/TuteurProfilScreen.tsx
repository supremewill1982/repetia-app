import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Alert, ActivityIndicator, Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { AGENTS } from '../../services/iaServiceOpenRouter';
import {
  getTuteur, getAvisTuteur, creerReservation,
  Tuteur, Avis,
} from '../../services/tuteurService';

type Onglet = 'profil' | 'reserver' | 'avis';

export default function TuteurProfilScreen({ route, navigation }: any) {
  const { colors }   = useTheme();
  const { userData } = useAuth();
  const { tuteurId, tuteur: tuteurParam } = route.params || {};

  const [tuteur, setTuteur]         = useState<Tuteur | null>(tuteurParam || null);
  const [avis, setAvis]             = useState<Avis[]>([]);
  const [onglet, setOnglet]         = useState<Onglet>('profil');
  const [loading, setLoading]       = useState(!tuteurParam);
  const [reserving, setReserving]   = useState(false);

  // Formulaire réservation
  const [dureeChoisie, setDuree]    = useState(30);
  const [dateChoisie, setDate]      = useState('');
  const [heureChoisie, setHeure]    = useState('');
  const [matChoisie, setMat]        = useState('');
  const [message, setMessage]       = useState('');

  useEffect(() => {
    const init = async () => {
      if (!tuteurParam && tuteurId) {
        const t = await getTuteur(tuteurId);
        setTuteur(t);
        setLoading(false);
      }
      if (tuteurId) {
        const a = await getAvisTuteur(tuteurId);
        setAvis(a);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (tuteur && tuteur.matieres.length > 0) {
      setMat(tuteur.matieres[0]);
    }
  }, [tuteur]);

  const renderEtoiles = (note: number, taille = 16) => Array.from({ length: 5 }, (_, i) => (
    <MaterialCommunityIcons
      key={i}
      name={i < Math.round(note) ? 'star' : 'star-outline'}
      size={taille}
      color="#7BA89A"
    />
  ));

  const handleReserver = async () => {
    if (!dateChoisie || !heureChoisie) {
      Alert.alert('Infos manquantes', 'Entre une date et une heure pour la session.');
      return;
    }
    if (!tuteur) return;

    setReserving(true);
    try {
      const prix = dureeChoisie === 30 ? tuteur.prix30min : tuteur.prix60min;

      // Créer la réservation dans Firestore
      await creerReservation({
        eleveId:      (userData as any)?.uid || '',
        elevePrénom:  (userData as any)?.prenom || 'Élève',
        tuteurId:     tuteur.uid,
        tuteurNom:    `${tuteur.prenom} ${tuteur.nom}`,
        matiere:      matChoisie,
        dureeMin:     dureeChoisie,
        prix,
        date:         dateChoisie,
        heure:        heureChoisie,
        message:      message || 'Session de révision',
      });

      // Rediriger vers WhatsApp du répétiteur
      const msg = `Bonjour ${tuteur.prenom} ! 👋\n\n` +
        `Je souhaite réserver une session via RÉPÉTIA.\n\n` +
        `📚 Matière : ${matChoisie}\n` +
        `⏱️ Durée : ${dureeChoisie} minutes\n` +
        `📅 Date : ${dateChoisie} à ${heureChoisie}\n` +
        `💰 Tarif : ${prix.toLocaleString()} CFA\n\n` +
        (message ? `💬 Message : ${message}\n\n` : '') +
        `Comment procéder au paiement ?`;

      const url = `https://wa.me/${tuteur.whatsapp}?text=${encodeURIComponent(msg)}`;

      Alert.alert(
        '✅ Demande envoyée !',
        `Ta demande a été enregistrée. Tu vas maintenant contacter ${tuteur.prenom} sur WhatsApp pour confirmer.`,
        [{
          text: 'Ouvrir WhatsApp',
          onPress: () => Linking.openURL(url),
        }]
      );
    } catch (e) {
      Alert.alert('Erreur', 'Impossible d\'envoyer la demande. Réessaie.');
    } finally {
      setReserving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!tuteur) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.errTxt, { color: colors.text }]}>Répétiteur introuvable</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: colors.primary }}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const agentPrincipal = AGENTS.find(a => a.matiere === tuteur.matieres[0]);
  const couleur = agentPrincipal?.couleur || colors.primary;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header gradient */}
      <LinearGradient colors={[couleur, '#ECEEF3']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>

        {/* Avatar + nom */}
        <View style={styles.headerContent}>
          <View style={[styles.avatar, { borderColor: 'rgba(255,255,255,0.4)' }]}>
            <Text style={styles.avatarEmoji}>{tuteur.avatar}</Text>
          </View>
          <Text style={styles.nom}>{tuteur.prenom} {tuteur.nom}</Text>
          <View style={styles.certifRow}>
            <MaterialCommunityIcons name="check-decagram" size={16} color={colors.primary} />
            <Text style={styles.certifTxt}>Certifié RÉPÉTIA · Score {tuteur.scoreTest}%</Text>
          </View>
          <View style={styles.etoilesRow}>
            {renderEtoiles(tuteur.noteGlobale, 18)}
            <Text style={styles.noteHdr}>{tuteur.noteGlobale.toFixed(1)} ({tuteur.nbAvis} avis)</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Onglets */}
      <View style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {(['profil','reserver','avis'] as Onglet[]).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, onglet === t && { borderBottomColor: couleur, borderBottomWidth: 2.5 }]}
            onPress={() => setOnglet(t)}
          >
            <Text style={[styles.tabTxt, { color: onglet === t ? couleur : colors.textMuted }]}>
              {t === 'profil' ? '👤 Profil' : t === 'reserver' ? '📅 Réserver' : `⭐ Avis (${avis.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* ── PROFIL ── */}
        {onglet === 'profil' && (
          <>
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <Text style={[styles.cardTitre, { color: colors.text }]}>📖 Présentation</Text>
              <Text style={[styles.bio, { color: colors.textSecondary }]}>{tuteur.bio}</Text>
            </View>

            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <Text style={[styles.cardTitre, { color: colors.text }]}>📚 Matières enseignées</Text>
              <View style={styles.matieresWrap}>
                {tuteur.matieres.map((m, i) => {
                  const a = AGENTS.find(ag => ag.matiere === m);
                  return (
                    <View key={i} style={[styles.matiereTag, { backgroundColor: (a?.couleur || colors.primary) + '20' }]}>
                      <Text>{a?.emoji || '📚'}</Text>
                      <Text style={[styles.matiereTagTxt, { color: a?.couleur || colors.primary }]}>{m}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <Text style={[styles.cardTitre, { color: colors.text }]}>🎓 Formation</Text>
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="school" size={18} color={colors.textMuted} />
                <Text style={[styles.infoTxt, { color: colors.textSecondary }]}>{tuteur.diplome}</Text>
              </View>
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="domain" size={18} color={colors.textMuted} />
                <Text style={[styles.infoTxt, { color: colors.textSecondary }]}>{tuteur.universite}</Text>
              </View>
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="clock" size={18} color={colors.textMuted} />
                <Text style={[styles.infoTxt, { color: colors.textSecondary }]}>{tuteur.anneeExp} ans d'expérience</Text>
              </View>
            </View>

            {/* Statistiques */}
            <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
              <View style={styles.statBox}>
                <Text style={[styles.statVal, { color: couleur }]}>{tuteur.nbSessions}</Text>
                <Text style={[styles.statLbl, { color: colors.textMuted }]}>Sessions</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statVal, { color: couleur }]}>{tuteur.noteGlobale.toFixed(1)}</Text>
                <Text style={[styles.statLbl, { color: colors.textMuted }]}>Note /5</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statVal, { color: couleur }]}>{tuteur.nbAvis}</Text>
                <Text style={[styles.statLbl, { color: colors.textMuted }]}>Avis</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statVal, { color: couleur }]}>{tuteur.scoreTest}%</Text>
                <Text style={[styles.statLbl, { color: colors.textMuted }]}>Test IA</Text>
              </View>
            </View>

            {/* Tarifs */}
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <Text style={[styles.cardTitre, { color: colors.text }]}>💰 Tarifs</Text>
              {[
                { label: 'Session 30 min', prix: tuteur.prix30min },
                { label: 'Session 1 heure', prix: tuteur.prix60min },
                { label: 'Suivi mensuel', prix: tuteur.prixMensuel },
              ].map((item, i) => (
                <View key={i} style={[styles.tarifRow, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.tarifLabel, { color: colors.textSecondary }]}>{item.label}</Text>
                  <Text style={[styles.tarifPrix, { color: couleur }]}>
                    {item.prix.toLocaleString()} CFA
                  </Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.reserverBtnGros, { backgroundColor: couleur }]}
              onPress={() => setOnglet('reserver')}
            >
              <MaterialCommunityIcons name="calendar-plus" size={22} color="white" />
              <Text style={styles.reserverBtnTxt}>Réserver une session</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ── RÉSERVATION ── */}
        {onglet === 'reserver' && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitre, { color: colors.text }]}>📅 Réserver une session</Text>

            <Text style={[styles.fieldLbl, { color: colors.textSecondary }]}>Matière</Text>
            <View style={styles.matChoix}>
              {tuteur.matieres.map((m, i) => {
                const a = AGENTS.find(ag => ag.matiere === m);
                return (
                  <TouchableOpacity
                    key={i}
                    style={[styles.matChip, {
                      backgroundColor: matChoisie === m ? (a?.couleur || couleur) + '25' : colors.surface,
                      borderColor:     matChoisie === m ? (a?.couleur || couleur) : colors.border,
                    }]}
                    onPress={() => setMat(m)}
                  >
                    <Text>{a?.emoji}</Text>
                    <Text style={[styles.matChipTxt, { color: matChoisie === m ? (a?.couleur || couleur) : colors.textSecondary }]}>
                      {m.split('-')[0].trim()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.fieldLbl, { color: colors.textSecondary }]}>Durée</Text>
            <View style={styles.dureeRow}>
              {[
                { min: 30, prix: tuteur.prix30min },
                { min: 60, prix: tuteur.prix60min },
              ].map(({ min, prix }) => (
                <TouchableOpacity
                  key={min}
                  style={[styles.dureeChip, {
                    backgroundColor: dureeChoisie === min ? couleur + '25' : colors.surface,
                    borderColor:     dureeChoisie === min ? couleur : colors.border,
                    flex: 1,
                  }]}
                  onPress={() => setDuree(min)}
                >
                  <Text style={[styles.dureeMin, { color: dureeChoisie === min ? couleur : colors.text }]}>
                    {min} min
                  </Text>
                  <Text style={[styles.dureePrix, { color: colors.textMuted }]}>
                    {prix.toLocaleString()} CFA
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.fieldLbl, { color: colors.textSecondary }]}>Date souhaitée (YYYY-MM-DD)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="Ex: 2025-06-20"
              placeholderTextColor={colors.textMuted}
              value={dateChoisie}
              onChangeText={setDate}
            />

            <Text style={[styles.fieldLbl, { color: colors.textSecondary }]}>Heure souhaitée</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="Ex: 17h00"
              placeholderTextColor={colors.textMuted}
              value={heureChoisie}
              onChangeText={setHeure}
            />

            <Text style={[styles.fieldLbl, { color: colors.textSecondary }]}>Message (optionnel)</Text>
            <TextInput
              style={[styles.input, styles.inputMulti, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="Ex: Je bloque sur les dérivées composées..."
              placeholderTextColor={colors.textMuted}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={3}
            />

            {/* Récapitulatif */}
            <View style={[styles.recapCard, { backgroundColor: couleur + '15', borderColor: couleur }]}>
              <Text style={[styles.recapTitre, { color: couleur }]}>📋 Récapitulatif</Text>
              <Text style={[styles.recapLigne, { color: colors.text }]}>
                {matChoisie} · {dureeChoisie} min
              </Text>
              <Text style={[styles.recapPrix, { color: couleur }]}>
                💰 {(dureeChoisie === 30 ? tuteur.prix30min : tuteur.prix60min).toLocaleString()} CFA
              </Text>
              <Text style={[styles.recapNote, { color: colors.textMuted }]}>
                Paiement via Mobile Money après confirmation WhatsApp
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.reserverBtnGros, { backgroundColor: couleur }]}
              onPress={handleReserver}
              disabled={reserving}
            >
              {reserving ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <MaterialCommunityIcons name="whatsapp" size={22} color="white" />
                  <Text style={styles.reserverBtnTxt}>Envoyer la demande via WhatsApp</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* ── AVIS ── */}
        {onglet === 'avis' && (
          <>
            {/* Note globale */}
            <View style={[styles.noteGlobaleCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.noteGlobaleVal, { color: couleur }]}>
                {tuteur.noteGlobale.toFixed(1)}
              </Text>
              <View>
                <View style={styles.etoilesRow}>{renderEtoiles(tuteur.noteGlobale, 24)}</View>
                <Text style={[styles.nbAvis, { color: colors.textMuted }]}>
                  Basé sur {tuteur.nbAvis} avis
                </Text>
              </View>
            </View>

            {/* Liste des avis */}
            {avis.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={{ fontSize: 40 }}>⭐</Text>
                <Text style={[styles.emptyTxt, { color: colors.textSecondary }]}>
                  Pas encore d'avis. Sois le premier !
                </Text>
              </View>
            ) : (
              avis.map((a, i) => (
                <View key={i} style={[styles.avisCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.avisHeader}>
                    <Text style={[styles.avisNom, { color: colors.text }]}>{a.elevePrénom}</Text>
                    <View style={styles.etoilesRow}>{renderEtoiles(a.note, 14)}</View>
                  </View>
                  <Text style={[styles.avisMatiere, { color: couleur }]}>{a.matiere}</Text>
                  <Text style={[styles.avisComment, { color: colors.textSecondary }]}>{a.commentaire}</Text>
                  <Text style={[styles.avisDate, { color: colors.textMuted }]}>
                    {new Date(a.date).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errTxt: { fontSize: 18, marginBottom: 12 },
  header: { paddingTop: 50, paddingBottom: 24, paddingHorizontal: 20, alignItems: 'center' },
  backBtn: { position: 'absolute', top: 50, left: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  headerContent: { alignItems: 'center', gap: 8 },
  avatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  avatarEmoji: { fontSize: 48 },
  nom: { fontSize: 24, fontWeight: 'bold', color: 'white' },
  certifRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  certifTxt: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '600' },
  etoilesRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  noteHdr: { color: 'white', fontSize: 13, marginLeft: 4 },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabTxt: { fontSize: 12, fontWeight: '600' },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  card: { borderRadius: 20, padding: 18, gap: 12 },
  cardTitre: { fontSize: 15, fontWeight: '700' },
  bio: { fontSize: 14, lineHeight: 22 },
  matieresWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  matiereTag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, gap: 6 },
  matiereTagTxt: { fontSize: 13, fontWeight: '600' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoTxt: { fontSize: 14 },
  statsCard: { borderRadius: 20, padding: 18, flexDirection: 'row' },
  statBox: { flex: 1, alignItems: 'center', gap: 4 },
  statVal: { fontSize: 24, fontWeight: 'bold' },
  statLbl: { fontSize: 11 },
  tarifRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  tarifLabel: { fontSize: 14 },
  tarifPrix: { fontSize: 16, fontWeight: 'bold' },
  reserverBtnGros: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16, borderRadius: 16 },
  reserverBtnTxt: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  fieldLbl: { fontSize: 13, fontWeight: '600' },
  matChoix: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  matChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  matChipTxt: { fontSize: 12, fontWeight: '600' },
  dureeRow: { flexDirection: 'row', gap: 10 },
  dureeChip: { padding: 14, borderRadius: 14, borderWidth: 1, alignItems: 'center', gap: 4 },
  dureeMin: { fontSize: 16, fontWeight: 'bold' },
  dureePrix: { fontSize: 11 },
  input: { borderRadius: 14, borderWidth: 1, padding: 14, fontSize: 15 },
  inputMulti: { minHeight: 80, textAlignVertical: 'top' },
  recapCard: { borderRadius: 16, padding: 14, borderWidth: 1, gap: 6 },
  recapTitre: { fontSize: 13, fontWeight: '700' },
  recapLigne: { fontSize: 15, fontWeight: '600' },
  recapPrix: { fontSize: 20, fontWeight: 'bold' },
  recapNote: { fontSize: 11, fontStyle: 'italic' },
  noteGlobaleCard: { borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 20 },
  noteGlobaleVal: { fontSize: 56, fontWeight: 'bold' },
  nbAvis: { fontSize: 12, marginTop: 4 },
  avisCard: { borderRadius: 18, padding: 16, borderWidth: 1, gap: 6 },
  avisHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  avisNom: { fontSize: 15, fontWeight: '700' },
  avisMatiere: { fontSize: 12, fontWeight: '600' },
  avisComment: { fontSize: 14, lineHeight: 20 },
  avisDate: { fontSize: 11 },
  emptyBox: { alignItems: 'center', paddingTop: 40, gap: 12 },
  emptyTxt: { fontSize: 14, textAlign: 'center' },
});
