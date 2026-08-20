import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import {
  creerReservation,
  Tuteur,
} from '../../services/tuteurService';
import { getInfosEnfant } from '../../services/firebaseEnfantService';

const MATIERES = [
  'Mathématiques',
  'Physique-Chimie',
  'Français',
  'Anglais',
  'Histoire-Géographie',
  'SVT',
  'Philosophie',
  'Informatique',
];

const DUREES = [
  { label: '30 minutes', value: 30 },
  { label: '1 heure', value: 60 },
];

export default function ParentReservationScreen({ route, navigation }: any) {
  const { colors } = useTheme();
  const { userId } = useAuth();

  const tuteur: Tuteur | null = route?.params?.tuteur || null;
  const tuteurId = route?.params?.tuteurId || tuteur?.uid;

  const [enfantPrenom, setEnfantPrenom] = useState('');
  const [enfantId, setEnfantId] = useState('');
  const [matiere, setMatiere] = useState(tuteur?.matieres?.[0] || '');
  const [duree, setDuree] = useState(60);
  const [date, setDate] = useState('');
  const [heure, setHeure] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    chargerEnfant();
  }, []);

  const chargerEnfant = async () => {
    try {
      const infos = await getInfosEnfant();

      if (infos) {
        setEnfantPrenom(infos.prenom || '');
        setEnfantId((infos as any).id || userId || '');
      }
    } catch (error) {
      console.error('Erreur chargement enfant:', error);
    } finally {
      setLoading(false);
    }
  };

  const prix = duree === 30
    ? (tuteur?.prix30min || 0)
    : (tuteur?.prix60min || 0);

  const confirmerReservation = async () => {
    if (!userId) {
      Alert.alert('Connexion requise', 'Veuillez vous connecter pour réserver.');
      return;
    }

    if (!tuteurId) {
      Alert.alert('Erreur', 'Répétiteur introuvable.');
      return;
    }

    if (!enfantPrenom.trim()) {
      Alert.alert('Enfant', 'Impossible de déterminer l’enfant concerné.');
      return;
    }

    if (!matiere) {
      Alert.alert('Matière', 'Sélectionnez une matière.');
      return;
    }

    if (!date.trim() || !heure.trim()) {
      Alert.alert(
        'Créneau',
        'Indiquez le jour et l’heure souhaités.'
      );
      return;
    }

    try {
      setSubmitting(true);

      const selectedDateTime = new Date(`${date}T${heure}`);
      if (!isNaN(selectedDateTime.getTime()) && selectedDateTime < new Date()) {
        setSubmitting(false);
        Alert.alert('Créneau passé', 'Choisissez une date et une heure à venir.');
        return;
      }


      await creerReservation({
        eleveId: enfantId || userId,
        elevePrénom: enfantPrenom.trim(),
        tuteurId,
        tuteurNom: tuteur
          ? `${tuteur.prenom} ${tuteur.nom}`
          : 'Répétiteur',
        matiere,
        dureeMin: duree,
        prix,
        date: date.trim(),
        heure: heure.trim(),
        message: message.trim(),
      });

      Alert.alert(
        'Demande envoyée ✅',
        'Votre demande de réservation a été envoyée au répétiteur. Vous serez informé dès qu’il aura répondu.',
        [
          {
            text: 'Voir mes réservations',
            onPress: () => {
              navigation.navigate('MesReservationsParent');
            },
          },
          {
            text: 'OK',
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      console.error('Erreur réservation:', error);
      Alert.alert(
        'Erreur',
        'Impossible d’envoyer la demande. Veuillez réessayer.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* RÉPÉTITEUR */}
      <View style={[styles.profileCard, { backgroundColor: colors.surface }]}>
        <View
          style={[
            styles.avatar,
            { backgroundColor: colors.primary + '20' },
          ]}
        >
          <Text style={styles.avatarText}>
            {tuteur?.avatar || '👨🏾‍🏫'}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.tuteurName, { color: colors.text }]}>
            {tuteur
              ? `${tuteur.prenom} ${tuteur.nom}`
              : 'Répétiteur'}
          </Text>

          <Text style={[styles.tuteurInfo, { color: colors.textMuted }]}>
            ⭐ {tuteur?.noteGlobale?.toFixed(1) || '—'} ·{' '}
            {tuteur?.nbAvis || 0} avis
          </Text>
        </View>
      </View>

      {/* ENFANT */}
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          👤 Élève concerné
        </Text>

        <View
          style={[
            styles.selectedBox,
            {
              backgroundColor: colors.primary + '10',
              borderColor: colors.primary + '30',
            },
          ]}
        >
          <MaterialCommunityIcons
            name="account-school"
            size={22}
            color={colors.primary}
          />

          <View style={{ flex: 1 }}>
            <Text style={[styles.selectedName, { color: colors.text }]}>
              {enfantPrenom || 'Élève'}
            </Text>
            <Text style={[styles.helper, { color: colors.textMuted }]}>
              Élève associé à votre compte parent
            </Text>
          </View>
        </View>
      </View>

      {/* MATIÈRE */}
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          📚 Matière
        </Text>

        <View style={styles.optionsWrap}>
          {(tuteur?.matieres?.length ? tuteur.matieres : MATIERES).map(
            (item) => (
              <TouchableOpacity
                key={item}
                onPress={() => setMatiere(item)}
                style={[
                  styles.option,
                  {
                    backgroundColor:
                      matiere === item
                        ? colors.primary
                        : colors.background,
                    borderColor:
                      matiere === item
                        ? colors.primary
                        : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    {
                      color:
                        matiere === item
                          ? 'white'
                          : colors.text,
                    },
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>
      </View>

      {/* DURÉE */}
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          ⏱️ Durée du cours
        </Text>

        <View style={styles.durationRow}>
          {DUREES.map((item) => {
            const selected = duree === item.value;
            const itemPrice =
              item.value === 30
                ? tuteur?.prix30min || 0
                : tuteur?.prix60min || 0;

            return (
              <TouchableOpacity
                key={item.value}
                onPress={() => setDuree(item.value)}
                style={[
                  styles.durationCard,
                  {
                    backgroundColor: selected
                      ? colors.primary + '12'
                      : colors.background,
                    borderColor: selected
                      ? colors.primary
                      : colors.border,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={22}
                  color={selected ? colors.primary : colors.textMuted}
                />

                <Text
                  style={[
                    styles.durationLabel,
                    { color: colors.text },
                  ]}
                >
                  {item.label}
                </Text>

                <Text
                  style={[
                    styles.durationPrice,
                    { color: colors.primary },
                  ]}
                >
                  {itemPrice.toLocaleString()} FCFA
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* CRÉNEAU */}
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          📅 Créneau souhaité
        </Text>

        <Text style={[styles.label, { color: colors.textSecondary }]}>
          Jour
        </Text>

        <TextInput
          value={date}
          onChangeText={setDate}
          placeholder="Ex : Samedi 22 août"
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
              color: colors.text,
            },
          ]}
        />

        <Text
          style={[
            styles.label,
            { color: colors.textSecondary, marginTop: 12 },
          ]}
        >
          Heure
        </Text>

        <TextInput
          value={heure}
          onChangeText={setHeure}
          placeholder="Ex : 16:00"
          placeholderTextColor={colors.textMuted}
          keyboardType="numbers-and-punctuation"
          style={[
            styles.input,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
              color: colors.text,
            },
          ]}
        />

        <View
          style={[
            styles.infoBox,
            { backgroundColor: colors.primary + '10' },
          ]}
        >
          <MaterialCommunityIcons
            name="information-outline"
            size={19}
            color={colors.primary}
          />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Le créneau sera confirmé par le répétiteur. Les disponibilités
            précises pourront être synchronisées automatiquement ensuite.
          </Text>
        </View>
      </View>

      {/* MESSAGE */}
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          💬 Message au répétiteur
        </Text>

        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Ex : Mon enfant souhaite revoir les dérivées avant son prochain devoir."
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          style={[
            styles.textArea,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
              color: colors.text,
            },
          ]}
        />
      </View>

      {/* RÉCAPITULATIF */}
      <View
        style={[
          styles.summary,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.summaryTitle, { color: colors.text }]}>
          Récapitulatif
        </Text>

        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>
            Élève
          </Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>
            {enfantPrenom || '—'}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>
            Matière
          </Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>
            {matiere || '—'}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>
            Durée
          </Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>
            {duree} minutes
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>
            Créneau
          </Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>
            {date && heure ? `${date} à ${heure}` : 'À préciser'}
          </Text>
        </View>

        <View
          style={[
            styles.totalRow,
            { borderTopColor: colors.border },
          ]}
        >
          <Text style={[styles.totalLabel, { color: colors.text }]}>
            Total estimé
          </Text>

          <Text style={[styles.totalPrice, { color: colors.primary }]}>
            {prix.toLocaleString()} FCFA
          </Text>
        </View>
      </View>

      {/* CONFIRMATION */}

      <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.summaryTitle, { color: colors.text }]}>
          Récapitulatif de la réservation
        </Text>

        <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
          👨‍🏫 {tuteur?.prenom} {tuteur?.nom}
        </Text>
        <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
          👤 Élève sélectionné
        </Text>
        <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
          📚 {matiere || 'Matière à sélectionner'}
        </Text>
        <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
          📅 {date || 'Date à sélectionner'} · {heure || 'Heure à sélectionner'}
        </Text>
        <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
          ⏱️ {duree} minutes
        </Text>

        <View style={styles.summaryTotal}>
          <Text style={[styles.summaryTotalLabel, { color: colors.text }]}>
            Total
          </Text>
          <Text style={[styles.summaryTotalPrice, { color: colors.primary }]}>
            {prix.toLocaleString()} FCFA
          </Text>
        </View>
      </View>

      <TouchableOpacity
        disabled={submitting}
        onPress={confirmerReservation}
        style={[
          styles.confirmButton,
          {
            backgroundColor: submitting
              ? colors.textMuted
              : colors.primary,
          },
        ]}
      >
        {submitting ? (
          <ActivityIndicator color="white" />
        ) : (
          <>
            <MaterialCommunityIcons
              name="calendar-check"
              size={23}
              color="white"
            />
            <Text style={styles.confirmText}>
              Envoyer la demande
            </Text>
          </>
        )}
      </TouchableOpacity>

      <Text style={[styles.footerNote, { color: colors.textMuted }]}>
        Aucun paiement n’est effectué à cette étape. La demande doit d’abord
        être acceptée par le répétiteur.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    marginTop: 16,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 14,
    marginBottom: 7,
  },
  summaryTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: '800',
  },
  summaryTotalPrice: {
    fontSize: 19,
    fontWeight: '900',
  },

  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCard: {
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 14,
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
  },
  tuteurName: {
    fontSize: 18,
    fontWeight: '800',
  },
  tuteurInfo: {
    fontSize: 13,
    marginTop: 5,
  },
  card: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 13,
  },
  selectedBox: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectedName: {
    fontSize: 15,
    fontWeight: '700',
  },
  helper: {
    fontSize: 11,
    marginTop: 3,
  },
  optionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  option: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  optionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  durationRow: {
    flexDirection: 'row',
    gap: 10,
  },
  durationCard: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 13,
    alignItems: 'center',
    gap: 6,
  },
  durationLabel: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  durationPrice: {
    fontSize: 13,
    fontWeight: '800',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 48,
    paddingHorizontal: 13,
    fontSize: 14,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 110,
    padding: 13,
    fontSize: 14,
  },
  infoBox: {
    flexDirection: 'row',
    gap: 8,
    padding: 11,
    borderRadius: 12,
    marginTop: 13,
  },
  infoText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 17,
  },
  summary: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 9,
    gap: 12,
  },
  summaryLabel: {
    fontSize: 13,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
    flex: 1,
  },
  totalRow: {
    borderTopWidth: 1,
    marginTop: 7,
    paddingTop: 13,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: '900',
  },
  confirmButton: {
    minHeight: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 9,
  },
  confirmText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
  },
  footerNote: {
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 12,
  },
});
