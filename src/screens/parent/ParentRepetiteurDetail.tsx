import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { getTuteur, Tuteur } from '../../services/tuteurService';

export default function ParentRepetiteurDetailScreen({ route, navigation }: any) {
  const { colors } = useTheme();
  const [tuteur, setTuteur] = useState<Tuteur | null>(null);
  const [loading, setLoading] = useState(true);

  const tuteurId = route?.params?.tuteurId;

  useEffect(() => {
    chargerProfil();
  }, [tuteurId]);

  const chargerProfil = async () => {
    try {
      setLoading(true);

      if (!tuteurId) {
        setTuteur(route?.params?.tuteur || null);
        return;
      }

      const data = await getTuteur(tuteurId);
      setTuteur(data);
    } catch (error) {
      console.error('Erreur chargement répétiteur:', error);
    } finally {
      setLoading(false);
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
        <MaterialCommunityIcons
          name="account-alert-outline"
          size={64}
          color={colors.textMuted}
        />
        <Text style={[styles.errorText, { color: colors.text }]}>
          Profil du répétiteur introuvable.
        </Text>
      </View>
    );
  }

  const nomComplet = `${tuteur.prenom} ${tuteur.nom}`;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* PROFIL */}
      <View style={[styles.profileCard, { backgroundColor: colors.surface }]}>
        <View
          style={[
            styles.avatar,
            { backgroundColor: colors.primary + '20' },
          ]}
        >
          <Text style={styles.avatarText}>
            {tuteur.avatar || '👨🏾‍🏫'}
          </Text>
        </View>

        <Text style={[styles.name, { color: colors.text }]}>
          {nomComplet}
        </Text>

        <View style={styles.certifiedRow}>
          <View
            style={[
              styles.certifiedBadge,
              { backgroundColor: colors.primary + '18' },
            ]}
          >
            <MaterialCommunityIcons
              name="check-decagram"
              size={16}
              color={colors.primary}
            />
            <Text style={[styles.certifiedText, { color: colors.primary }]}>
              Répétiteur certifié
            </Text>
          </View>

          {tuteur.disponible && (
            <View style={styles.availableBadge}>
              <View style={styles.availableDot} />
              <Text style={styles.availableText}>Disponible</Text>
            </View>
          )}
        </View>

        <View style={styles.ratingRow}>
          <MaterialCommunityIcons
            name="star"
            size={21}
            color={colors.warning}
          />
          <Text style={[styles.rating, { color: colors.text }]}>
            {tuteur.noteGlobale.toFixed(1)}
          </Text>
          <Text style={[styles.reviews, { color: colors.textMuted }]}>
            ({tuteur.nbAvis} avis)
          </Text>
        </View>

        <Text style={[styles.location, { color: colors.textSecondary }]}>
          📍 En ligne · {tuteur.universite || 'Gabon'}
        </Text>
      </View>

      {/* ACTION PRINCIPALE */}
      <TouchableOpacity
        style={[styles.reserveButton, { backgroundColor: colors.primary }]}
        onPress={() =>
          navigation.navigate('ParentReservation', {
            tuteurId: tuteur.uid,
            tuteur,
          })
        }
      >
        <MaterialCommunityIcons
          name="calendar-check"
          size={22}
          color="white"
        />
        <Text style={styles.reserveButtonText}>
          Réserver un cours
        </Text>
      </TouchableOpacity>

      {/* À PROPOS */}
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          À propos
        </Text>

        <Text style={[styles.bio, { color: colors.textSecondary }]}>
          {tuteur.bio || 'Ce répétiteur n’a pas encore renseigné sa présentation.'}
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {tuteur.anneeExp}+
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>
              ans d’expérience
            </Text>
          </View>

          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {tuteur.nbSessions}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>
              cours réalisés
            </Text>
          </View>

          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {tuteur.scoreTest}%
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>
              certification
            </Text>
          </View>
        </View>
      </View>

      {/* MATIÈRES */}
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Matières enseignées
        </Text>

        <View style={styles.tagsContainer}>
          {tuteur.matieres.map((matiere) => (
            <View
              key={matiere}
              style={[
                styles.tag,
                { backgroundColor: colors.primary + '15' },
              ]}
            >
              <Text style={[styles.tagText, { color: colors.primary }]}>
                {matiere}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* NIVEAUX */}
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Niveaux accompagnés
        </Text>

        <View style={styles.infoLine}>
          <MaterialCommunityIcons
            name="school-outline"
            size={20}
            color={colors.primary}
          />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            {tuteur.niveaux.join(' · ') || 'Niveaux non renseignés'}
          </Text>
        </View>
      </View>

      {/* FORMATION */}
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Formation
        </Text>

        <View style={styles.infoLine}>
          <MaterialCommunityIcons
            name="school"
            size={20}
            color={colors.primary}
          />
          <View style={{ flex: 1 }}>
            <Text style={[styles.infoMain, { color: colors.text }]}>
              {tuteur.diplome || 'Diplôme non renseigné'}
            </Text>
            <Text style={[styles.infoSub, { color: colors.textMuted }]}>
              {tuteur.universite || 'Établissement non renseigné'}
            </Text>
          </View>
        </View>
      </View>

      {/* TARIFS */}
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Tarifs
        </Text>

        <View style={styles.priceRow}>
          <View>
            <Text style={[styles.priceLabel, { color: colors.textMuted }]}>
              30 minutes
            </Text>
            <Text style={[styles.price, { color: colors.text }]}>
              {tuteur.prix30min.toLocaleString()} FCFA
            </Text>
          </View>

          <View>
            <Text style={[styles.priceLabel, { color: colors.textMuted }]}>
              1 heure
            </Text>
            <Text style={[styles.price, { color: colors.text }]}>
              {tuteur.prix60min.toLocaleString()} FCFA
            </Text>
          </View>

          <View>
            <Text style={[styles.priceLabel, { color: colors.textMuted }]}>
              Mensuel
            </Text>
            <Text style={[styles.price, { color: colors.text }]}>
              {tuteur.prixMensuel.toLocaleString()} FCFA
            </Text>
          </View>
        </View>
      </View>

      {/* DISPONIBILITÉ */}
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <View style={styles.availabilityHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Disponibilité
          </Text>

          <MaterialCommunityIcons
            name={tuteur.disponible ? 'calendar-check' : 'calendar-remove'}
            size={24}
            color={tuteur.disponible ? colors.primary : colors.error}
          />
        </View>

        <Text style={[styles.availabilityText, { color: colors.textSecondary }]}>
          {tuteur.disponible
            ? 'Ce répétiteur accepte actuellement de nouvelles réservations.'
            : 'Ce répétiteur n’accepte pas actuellement de nouvelles réservations.'}
        </Text>

        <Text style={[styles.onlineText, { color: colors.primary }]}>
          💻 Cours disponibles en ligne
        </Text>
      </View>

      {/* SECOND CTA */}
      {tuteur.disponible && (
        <TouchableOpacity
          style={[styles.bottomButton, { backgroundColor: colors.primary }]}
          onPress={() =>
            navigation.navigate('ParentReservation', {
              tuteurId: tuteur.uid,
              tuteur,
            })
          }
        >
          <Text style={styles.bottomButtonText}>
            Choisir ce répétiteur
          </Text>
          <MaterialCommunityIcons
            name="arrow-right"
            size={21}
            color="white"
          />
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  errorText: {
    marginTop: 14,
    fontSize: 16,
    textAlign: 'center',
  },
  profileCard: {
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    marginBottom: 14,
  },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 48,
  },
  name: {
    fontSize: 23,
    fontWeight: '800',
    textAlign: 'center',
  },
  certifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 9,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  certifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  certifiedText: {
    fontSize: 12,
    fontWeight: '700',
  },
  availableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  availableDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#2E7D32',
  },
  availableText: {
    color: '#2E7D32',
    fontSize: 12,
    fontWeight: '700',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  rating: {
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 5,
  },
  reviews: {
    fontSize: 13,
    marginLeft: 4,
  },
  location: {
    fontSize: 13,
    marginTop: 8,
  },
  reserveButton: {
    minHeight: 54,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginBottom: 14,
  },
  reserveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
  },
  card: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 12,
  },
  bio: {
    fontSize: 14,
    lineHeight: 21,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 3,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '700',
  },
  infoLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  infoMain: {
    fontSize: 14,
    fontWeight: '700',
  },
  infoSub: {
    fontSize: 12,
    marginTop: 3,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  priceLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    fontWeight: '800',
  },
  availabilityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  availabilityText: {
    fontSize: 14,
    lineHeight: 20,
  },
  onlineText: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 12,
  },
  bottomButton: {
    minHeight: 54,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  bottomButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
  },
});
