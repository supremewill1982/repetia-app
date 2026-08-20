import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { AGENTS } from '../../services/iaServiceOpenRouter';
import { inscrireTuteur } from '../../services/tuteurService';

const AVATARS = ['👩🏾‍🏫','👨🏾‍🏫','👩🏾‍🎓','👨🏾‍🎓','👩🏾‍🔬','👨🏾‍🔬','👩🏾‍💻','👨🏾‍💻'];

export default function InscriptionTuteurScreen({ navigation }: any) {
  const { colors } = useTheme();

  const [etape, setEtape]       = useState(1);
  const [loading, setLoading]   = useState(false);
  const [avatar, setAvatar]     = useState('👩🏾‍🏫');

  // Étape 1 — Infos perso
  const [prenom, setPrenom]     = useState('');
  const [nom, setNom]           = useState('');
  const [bio, setBio]           = useState('');
  const [tel, setTel]           = useState('');
  const [diplome, setDiplome]   = useState('');
  const [univ, setUniv]         = useState('');
  const [exp, setExp]           = useState('1');

  // Étape 2 — Matières + tarifs
  const [matieres, setMatieres] = useState<string[]>([]);
  const [prix30, setPrix30]     = useState('2000');
  const [prix60, setPrix60]     = useState('3500');
  const [prixM, setPrixM]       = useState('15000');

  const toggleMatiere = (m: string) => {
    setMatieres(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  };

  const handleSuivant = () => {
    if (etape === 1) {
      if (!prenom || !nom || !bio || !tel || !diplome) {
        Alert.alert('Champs manquants', 'Remplis tous les champs obligatoires.');
        return;
      }
    }
    if (etape === 2) {
      if (matieres.length === 0) {
        Alert.alert('Matières requises', 'Choisis au moins une matière.');
        return;
      }
      handleInscrire();
      return;
    }
    setEtape(e => e + 1);
  };

  const handleInscrire = async () => {
    setLoading(true);
    try {
      await inscrireTuteur({
        prenom, nom, bio,
        email:        '',
        telephone:    tel,
        whatsapp:     tel,
        matieres,
        niveaux:      ['3ème', 'Seconde', 'Première', 'Terminale'],
        diplome,
        universite:   univ,
        anneeExp:     parseInt(exp) || 1,
        prix30min:    parseInt(prix30) || 2000,
        prix60min:    parseInt(prix60) || 3500,
        prixMensuel:  parseInt(prixM)  || 15000,
        disponible:   true,
        dateCreation: new Date().toISOString(),
        avatar,
      });

      setEtape(3); // Étape succès
    } catch (e: any) {
      Alert.alert('Erreur', e.message || 'Inscription impossible. Réessaie.');
    } finally {
      setLoading(false);
    }
  };

  // ── Étape 3 : Succès ──
  if (etape === 3) {
    return (
      <View style={[styles.successContainer, { backgroundColor: colors.background }]}>
        <Text style={styles.successEmoji}>🎉</Text>
        <Text style={[styles.successTitre, { color: colors.primary }]}>Inscription envoyée !</Text>
        <Text style={[styles.successSous, { color: colors.textSecondary }]}>
          Ton profil est en attente de validation.{'\n'}
          Pour être certifié RÉPÉTIA, passe le{'\n'}
          test de validation IA.
        </Text>
        <TouchableOpacity
          style={[styles.testBtn, { backgroundColor: colors.primary }]}
          onPress={() => navigation.replace('TestValidation')}
        >
          <MaterialCommunityIcons name="brain" size={22} color="#ECEEF3" />
          <Text style={styles.testBtnTxt}>Passer le test de validation</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Main')}>
          <Text style={[styles.plusTardTxt, { color: colors.textMuted }]}>Plus tard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient colors={['#E8F2EE', '#ECEEF3']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => etape > 1 ? setEtape(e => e-1) : navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primary} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.headerTitre, { color: colors.text }]}>Devenir Répétiteur</Text>
          <Text style={[styles.headerSub, { color: colors.textMuted }]}>Étape {etape}/2</Text>
        </View>
      </LinearGradient>

      {/* Indicateur étapes */}
      <View style={[styles.stepBar, { backgroundColor: colors.surface }]}>
        {[1,2].map(n => (
          <View key={n} style={[styles.step, { backgroundColor: n <= etape ? colors.primary : colors.border }]} />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* ── ÉTAPE 1 : Infos perso ── */}
        {etape === 1 && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitre, { color: colors.text }]}>👤 Ton profil</Text>

            {/* Choix avatar */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>Choisis ton avatar</Text>
            <View style={styles.avatarsRow}>
              {AVATARS.map(a => (
                <TouchableOpacity
                  key={a}
                  style={[styles.avatarChip, { backgroundColor: avatar === a ? colors.primary + '30' : colors.surface, borderColor: avatar === a ? colors.primary : colors.border }]}
                  onPress={() => setAvatar(a)}
                >
                  <Text style={{ fontSize: 28 }}>{a}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {[
              { label: 'Prénom *', val: prenom, set: setPrenom, ph: 'Marie' },
              { label: 'Nom *', val: nom, set: setNom, ph: 'Ondo' },
              { label: 'Numéro WhatsApp *', val: tel, set: setTel, ph: '241060000000', keyboard: 'numeric' as any },
              { label: 'Diplôme *', val: diplome, set: setDiplome, ph: 'Licence Mathématiques' },
              { label: 'Université', val: univ, set: setUniv, ph: 'Université Omar Bongo' },
              { label: 'Années d\'expérience *', val: exp, set: setExp, ph: '3', keyboard: 'numeric' as any },
            ].map(({ label, val, set, ph, keyboard }) => (
              <View key={label}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  placeholder={ph}
                  placeholderTextColor={colors.textMuted}
                  value={val}
                  onChangeText={set}
                  keyboardType={keyboard}
                />
              </View>
            ))}

            <Text style={[styles.label, { color: colors.textSecondary }]}>Présentation *</Text>
            <TextInput
              style={[styles.input, styles.inputMulti, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="Décris ton expérience, tes méthodes, tes succès avec les élèves..."
              placeholderTextColor={colors.textMuted}
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={4}
            />
          </View>
        )}

        {/* ── ÉTAPE 2 : Matières + tarifs ── */}
        {etape === 2 && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitre, { color: colors.text }]}>📚 Matières & tarifs</Text>

            <Text style={[styles.label, { color: colors.textSecondary }]}>Matières que tu enseignes *</Text>
            <View style={styles.matGrid}>
              {AGENTS.map(a => {
                const sel = matieres.includes(a.matiere);
                return (
                  <TouchableOpacity
                    key={a.id}
                    style={[styles.matChip, {
                      backgroundColor: sel ? a.couleur + '25' : colors.surface,
                      borderColor: sel ? a.couleur : colors.border,
                    }]}
                    onPress={() => toggleMatiere(a.matiere)}
                  >
                    <Text style={{ fontSize: 20 }}>{a.emoji}</Text>
                    <Text style={[styles.matChipTxt, { color: sel ? a.couleur : colors.textSecondary }]}>
                      {a.matiere.split('-')[0].trim()}
                    </Text>
                    {sel && <MaterialCommunityIcons name="check-circle" size={14} color={a.couleur} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.label, { color: colors.textSecondary }]}>Tes tarifs (CFA)</Text>
            {[
              { label: 'Session 30 min', val: prix30, set: setPrix30 },
              { label: 'Session 1 heure', val: prix60, set: setPrix60 },
              { label: 'Suivi mensuel', val: prixM,  set: setPrixM },
            ].map(({ label, val, set }) => (
              <View key={label} style={styles.tarifRow}>
                <Text style={[styles.tarifLbl, { color: colors.textSecondary }]}>{label}</Text>
                <View style={styles.tarifInput}>
                  <TextInput
                    style={[styles.input, styles.inputSmall, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                    value={val}
                    onChangeText={set}
                    keyboardType="numeric"
                  />
                  <Text style={[styles.cfaTxt, { color: colors.textMuted }]}>CFA</Text>
                </View>
              </View>
            ))}

            <View style={[styles.commissionInfo, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}>
              <MaterialCommunityIcons name="information" size={18} color={colors.primary} />
              <Text style={[styles.commissionTxt, { color: colors.textSecondary }]}>
                Tu reçois <Text style={{ color: colors.primary, fontWeight: 'bold' }}>70%</Text> de chaque session.
                RÉPÉTIA prend 30% de commission pour la plateforme.
              </Text>
            </View>
          </View>
        )}

        {/* Bouton suivant */}
        <TouchableOpacity
          style={[styles.suivantBtn, { backgroundColor: colors.primary }]}
          onPress={handleSuivant}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#ECEEF3" />
          ) : (
            <>
              <Text style={styles.suivantBtnTxt}>
                {etape === 2 ? "S'inscrire" : 'Suivant'}
              </Text>
              <MaterialCommunityIcons name="arrow-right" size={20} color="#ECEEF3" />
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,215,0,0.1)', justifyContent: 'center', alignItems: 'center' },
  headerTitre: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  headerSub: { fontSize: 12, marginTop: 2 },
  stepBar: { flexDirection: 'row', gap: 8, padding: 12 },
  step: { flex: 1, height: 4, borderRadius: 2 },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  card: { borderRadius: 24, padding: 20, gap: 14 },
  cardTitre: { fontSize: 16, fontWeight: '700' },
  label: { fontSize: 13, fontWeight: '600' },
  input: { borderRadius: 14, borderWidth: 1, padding: 14, fontSize: 15 },
  inputMulti: { minHeight: 100, textAlignVertical: 'top' },
  inputSmall: { flex: 1 },
  avatarsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  avatarChip: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  matGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  matChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  matChipTxt: { fontSize: 12, fontWeight: '600' },
  tarifRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tarifLbl: { fontSize: 14, flex: 1 },
  tarifInput: { flexDirection: 'row', alignItems: 'center', gap: 8, width: 130 },
  cfaTxt: { fontSize: 13, fontWeight: '600' },
  commissionInfo: { flexDirection: 'row', alignItems: 'flex-start', borderRadius: 14, padding: 12, borderWidth: 1, gap: 8 },
  commissionTxt: { flex: 1, fontSize: 13, lineHeight: 20 },
  suivantBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16, borderRadius: 16 },
  suivantBtnTxt: { color: '#ECEEF3', fontSize: 16, fontWeight: 'bold' },
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 16 },
  successEmoji: { fontSize: 72 },
  successTitre: { fontSize: 28, fontWeight: 'bold', textAlign: 'center' },
  successSous: { fontSize: 16, textAlign: 'center', lineHeight: 24 },
  testBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, borderRadius: 16, marginTop: 16 },
  testBtnTxt: { color: '#ECEEF3', fontSize: 16, fontWeight: 'bold' },
  plusTardTxt: { fontSize: 14, marginTop: 8 },
});
