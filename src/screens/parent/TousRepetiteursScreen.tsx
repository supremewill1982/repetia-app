import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { getTuteursDisponibles, Tuteur } from '../../services/tuteurService';

const MATIERES = [
  'Toutes',
  'Mathématiques',
  'Physique-Chimie',
  'Français',
  'Anglais',
  'Histoire-Géographie',
  'SVT',
  'Philosophie',
  'Informatique',
];

const NIVEAUX = [
  'Tous',
  '6ème',
  '5ème',
  '4ème',
  '3ème',
  'Seconde',
  'Première',
  'Terminale',
];

type Tri = 'recommande' | 'note' | 'prix';

export default function TousRepetiteursScreen({ navigation }: any) {
  const { colors } = useTheme();

  const [tuteurs, setTuteurs] = useState<Tuteur[]>([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [matiere, setMatiere] = useState('Toutes');
  const [niveau, setNiveau] = useState('Tous');
  const [disponiblesSeulement, setDisponiblesSeulement] = useState(true);
  const [tri, setTri] = useState<Tri>('recommande');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    chargerTuteurs();
  }, []);

  const chargerTuteurs = async () => {
    try {
      setLoading(true);
      const data = await getTuteursDisponibles();
      setTuteurs(data);
    } catch (error) {
      console.error('Erreur chargement répétiteurs:', error);
    } finally {
      setLoading(false);
    }
  };

  const resultat = useMemo(() => {
    const terme = recherche.trim().toLowerCase();

    const filtered = tuteurs.filter((tuteur) => {
      const texte = [
        tuteur.nom,
        tuteur.prenom,
        tuteur.bio,
        ...(tuteur.matieres || []),
      ].join(' ').toLowerCase();

      const matchRecherche = !terme || texte.includes(terme);

      const matchMatiere =
        matiere === 'Toutes' ||
        (tuteur.matieres || []).includes(matiere);

      const matchNiveau =
        niveau === 'Tous' ||
        (tuteur.niveaux || []).includes(niveau);

      const matchDisponibilite =
        !disponiblesSeulement || tuteur.disponible;

      return (
        matchRecherche &&
        matchMatiere &&
        matchNiveau &&
        matchDisponibilite
      );
    });

    return [...filtered].sort((a, b) => {
      if (tri === 'note') {
        return (b.noteGlobale || 0) - (a.noteGlobale || 0);
      }

      if (tri === 'prix') {
        return (a.prix60min || 0) - (b.prix60min || 0);
      }

      return (
        (b.noteGlobale || 0) * 10 +
        (b.nbSessions || 0) / 100
      ) - (
        (a.noteGlobale || 0) * 10 +
        (a.nbSessions || 0) / 100
      );
    });
  }, [
    tuteurs,
    recherche,
    matiere,
    niveau,
    disponiblesSeulement,
    tri,
  ]);

  const renderTuteur = ({ item }: { item: Tuteur }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
      onPress={() =>
        navigation.navigate('ParentRepetiteurDetail', {
          tuteurId: item.uid,
        })
      }
    >
      <View style={styles.cardTop}>
        <View
          style={[
            styles.avatar,
            { backgroundColor: colors.primary + '18' },
          ]}
        >
          <Text style={styles.avatarText}>
            {item.avatar || '👨🏾‍🏫'}
          </Text>
        </View>

        <View style={styles.identity}>
          <View style={styles.nameRow}>
            <Text
              style={[styles.name, { color: colors.text }]}
              numberOfLines={1}
            >
              {item.prenom} {item.nom}
            </Text>

            {item.statut === 'certifie' && (
              <MaterialCommunityIcons
                name="check-decagram"
                size={18}
                color={colors.primary}
              />
            )}
          </View>

          <View style={styles.ratingRow}>
            <MaterialCommunityIcons
              name="star"
              size={16}
              color={colors.warning}
            />
            <Text
              style={[styles.rating, { color: colors.text }]}
            >
              {item.noteGlobale?.toFixed(1) || '0.0'}
            </Text>

            <Text
              style={[
                styles.reviews,
                { color: colors.textMuted },
              ]}
            >
              ({item.nbAvis || 0} avis)
            </Text>
          </View>

          <Text
            style={[
              styles.experience,
              { color: colors.textSecondary },
            ]}
          >
            {item.anneeExp || 0} an(s) d'expérience
          </Text>
        </View>

        <View
          style={[
            styles.availableBadge,
            {
              backgroundColor: item.disponible
                ? '#4CAF5020'
                : colors.error + '18',
            },
          ]}
        >
          <View
            style={[
              styles.dot,
              {
                backgroundColor: item.disponible
                  ? '#4CAF50'
                  : colors.error,
              },
            ]}
          />
          <Text
            style={{
              color: item.disponible
                ? '#4CAF50'
                : colors.error,
              fontSize: 10,
              fontWeight: '700',
            }}
          >
            {item.disponible ? 'Disponible' : 'Indisponible'}
          </Text>
        </View>
      </View>

      <View style={styles.subjects}>
        {(item.matieres || []).slice(0, 3).map((m) => (
          <View
            key={m}
            style={[
              styles.subject,
              { backgroundColor: colors.primary + '15' },
            ]}
          >
            <Text
              style={[
                styles.subjectText,
                { color: colors.primary },
              ]}
            >
              {m}
            </Text>
          </View>
        ))}
      </View>

      <Text
        style={[styles.bio, { color: colors.textSecondary }]}
        numberOfLines={2}
      >
        {item.bio || 'Répétiteur disponible pour accompagner votre enfant.'}
      </Text>

      <View
        style={[
          styles.cardBottom,
          { borderTopColor: colors.border },
        ]}
      >
        <View>
          <Text
            style={[
              styles.priceLabel,
              { color: colors.textMuted },
            ]}
          >
            À partir de
          </Text>
          <Text
            style={[
              styles.price,
              { color: colors.primary },
            ]}
          >
            {item.prix60min?.toLocaleString() || '—'} FCFA
            <Text style={styles.priceUnit}> / h</Text>
          </Text>
        </View>

        <View style={styles.sessions}>
          <MaterialCommunityIcons
            name="account-group"
            size={17}
            color={colors.textMuted}
          />
          <Text
            style={[
              styles.sessionsText,
              { color: colors.textMuted },
            ]}
          >
            {item.nbSessions || 0} sessions
          </Text>
        </View>

        <MaterialCommunityIcons
          name="chevron-right"
          size={25}
          color={colors.primary}
        />
      </View>
    </TouchableOpacity>
  );

  const resetFilters = () => {
    setMatiere('Toutes');
    setNiveau('Tous');
    setDisponiblesSeulement(true);
    setTri('recommande');
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
    >
      <View
        style={[
          styles.header,
          { backgroundColor: colors.surface },
        ]}
      >
        <View>
          <Text
            style={[styles.title, { color: colors.text }]}
          >
            Tous les répétiteurs
          </Text>
          <Text
            style={[
              styles.subtitle,
              { color: colors.textMuted },
            ]}
          >
            Trouvez l'accompagnement idéal
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.filterButton,
            { backgroundColor: colors.primary + '15' },
          ]}
          onPress={() => setShowFilters(true)}
        >
          <MaterialCommunityIcons
            name="tune-variant"
            size={22}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.searchContainer,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <MaterialCommunityIcons
          name="magnify"
          size={22}
          color={colors.textMuted}
        />

        <TextInput
          value={recherche}
          onChangeText={setRecherche}
          placeholder="Rechercher un répétiteur..."
          placeholderTextColor={colors.textMuted}
          style={[
            styles.searchInput,
            { color: colors.text },
          ]}
        />

        {recherche.length > 0 && (
          <TouchableOpacity
            onPress={() => setRecherche('')}
          >
            <MaterialCommunityIcons
              name="close-circle"
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.quickFilters}
      >
        {MATIERES.slice(0, 5).map((m) => (
          <TouchableOpacity
            key={m}
            onPress={() => setMatiere(m)}
            style={[
              styles.quickChip,
              {
                backgroundColor:
                  matiere === m
                    ? colors.primary
                    : colors.surface,
                borderColor:
                  matiere === m
                    ? colors.primary
                    : colors.border,
              },
            ]}
          >
            <Text
              style={{
                color:
                  matiere === m
                    ? 'white'
                    : colors.text,
                fontSize: 12,
                fontWeight: '600',
              }}
            >
              {m}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.resultHeader}>
        <Text
          style={[
            styles.resultCount,
            { color: colors.text },
          ]}
        >
          {resultat.length} répétiteur(s)
        </Text>

        <TouchableOpacity
          onPress={() => {
            setTri(
              tri === 'recommande'
                ? 'note'
                : tri === 'note'
                ? 'prix'
                : 'recommande'
            );
          }}
        >
          <Text
            style={[
              styles.sortText,
              { color: colors.primary },
            ]}
          >
            {tri === 'recommande'
              ? 'Recommandés'
              : tri === 'note'
              ? 'Mieux notés'
              : 'Moins chers'}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color={colors.primary}
          />
          <Text
            style={[
              styles.loadingText,
              { color: colors.textMuted },
            ]}
          >
            Recherche des répétiteurs...
          </Text>
        </View>
      ) : (
        <FlatList
          data={resultat}
          keyExtractor={(item) => item.uid}
          renderItem={renderTuteur}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={chargerTuteurs}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons
                name="account-search-outline"
                size={60}
                color={colors.textMuted}
              />
              <Text
                style={[
                  styles.emptyTitle,
                  { color: colors.text },
                ]}
              >
                Aucun répétiteur trouvé
              </Text>
              <Text
                style={[
                  styles.emptyText,
                  { color: colors.textMuted },
                ]}
              >
                Essayez de modifier vos filtres ou votre recherche.
              </Text>

              <TouchableOpacity
                onPress={resetFilters}
                style={[
                  styles.resetButton,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Text style={styles.resetText}>
                  Réinitialiser les filtres
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      <Modal
        visible={showFilters}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modal,
              { backgroundColor: colors.surface },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text
                style={[
                  styles.modalTitle,
                  { color: colors.text },
                ]}
              >
                Filtres
              </Text>

              <TouchableOpacity
                onPress={() => setShowFilters(false)}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={25}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <Text
                style={[
                  styles.filterTitle,
                  { color: colors.text },
                ]}
              >
                Matière
              </Text>

              <View style={styles.options}>
                {MATIERES.map((m) => (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setMatiere(m)}
                    style={[
                      styles.option,
                      {
                        backgroundColor:
                          matiere === m
                            ? colors.primary
                            : colors.background,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color:
                          matiere === m
                            ? 'white'
                            : colors.text,
                        fontSize: 13,
                      }}
                    >
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text
                style={[
                  styles.filterTitle,
                  { color: colors.text },
                ]}
              >
                Niveau
              </Text>

              <View style={styles.options}>
                {NIVEAUX.map((n) => (
                  <TouchableOpacity
                    key={n}
                    onPress={() => setNiveau(n)}
                    style={[
                      styles.option,
                      {
                        backgroundColor:
                          niveau === n
                            ? colors.primary
                            : colors.background,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color:
                          niveau === n
                            ? 'white'
                            : colors.text,
                        fontSize: 13,
                      }}
                    >
                      {n}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text
                style={[
                  styles.filterTitle,
                  { color: colors.text },
                ]}
              >
                Disponibilité
              </Text>

              <TouchableOpacity
                onPress={() =>
                  setDisponiblesSeulement(
                    !disponiblesSeulement
                  )
                }
                style={styles.toggleRow}
              >
                <View>
                  <Text
                    style={[
                      styles.toggleLabel,
                      { color: colors.text },
                    ]}
                  >
                    Disponible maintenant
                  </Text>
                  <Text
                    style={[
                      styles.toggleDescription,
                      { color: colors.textMuted },
                    ]}
                  >
                    Afficher uniquement les répétiteurs disponibles
                  </Text>
                </View>

                <MaterialCommunityIcons
                  name={
                    disponiblesSeulement
                      ? 'toggle-switch'
                      : 'toggle-switch-off-outline'
                  }
                  size={38}
                  color={
                    disponiblesSeulement
                      ? colors.primary
                      : colors.textMuted
                  }
                />
              </TouchableOpacity>

              <Text
                style={[
                  styles.filterTitle,
                  { color: colors.text },
                ]}
              >
                Trier par
              </Text>

              {[
                ['recommande', 'Recommandés'],
                ['note', 'Mieux notés'],
                ['prix', 'Prix croissant'],
              ].map(([value, label]) => (
                <TouchableOpacity
                  key={value}
                  onPress={() => setTri(value as Tri)}
                  style={styles.sortOption}
                >
                  <MaterialCommunityIcons
                    name={
                      tri === value
                        ? 'radiobox-marked'
                        : 'radiobox-blank'
                    }
                    size={22}
                    color={
                      tri === value
                        ? colors.primary
                        : colors.textMuted
                    }
                  />
                  <Text
                    style={{
                      color: colors.text,
                      fontSize: 14,
                    }}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={[
                styles.applyButton,
                { backgroundColor: colors.primary },
              ]}
              onPress={() => setShowFilters(false)}
            >
              <Text style={styles.applyText}>
                Voir {resultat.length} répétiteur(s)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 3,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    marginHorizontal: 16,
    marginTop: 10,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  quickFilters: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  quickChip: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  resultHeader: {
    paddingHorizontal: 17,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultCount: {
    fontSize: 14,
    fontWeight: '700',
  },
  sortText: {
    fontSize: 12,
    fontWeight: '700',
  },
  list: {
    padding: 16,
    paddingTop: 4,
    gap: 12,
  },
  card: {
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 30,
  },
  identity: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  name: {
    fontSize: 16,
    fontWeight: '800',
    maxWidth: '80%',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 3,
  },
  rating: {
    fontSize: 13,
    fontWeight: '700',
  },
  reviews: {
    fontSize: 11,
  },
  experience: {
    fontSize: 11,
    marginTop: 3,
  },
  availableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  subjects: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 13,
  },
  subject: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  subjectText: {
    fontSize: 10,
    fontWeight: '700',
  },
  bio: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },
  cardBottom: {
    marginTop: 13,
    paddingTop: 12,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 9,
  },
  price: {
    fontSize: 15,
    fontWeight: '800',
  },
  priceUnit: {
    fontSize: 10,
    fontWeight: '500',
  },
  sessions: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  sessionsText: {
    fontSize: 10,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
  },
  empty: {
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 70,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginTop: 15,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 6,
  },
  resetButton: {
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
  },
  resetText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modal: {
    maxHeight: '88%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 21,
    fontWeight: '800',
  },
  filterTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 15,
    marginBottom: 9,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  option: {
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  toggleDescription: {
    fontSize: 11,
    marginTop: 3,
    maxWidth: 270,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 10,
  },
  applyButton: {
    marginTop: 14,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  applyText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '800',
  },
});
