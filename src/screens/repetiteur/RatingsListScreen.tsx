import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, FlatList } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getRatingsForRepetiteur, Rating } from '../../services/ratingService';

interface ExtendedRating extends Rating {
  matiere?: string;
}

const RatingsListScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const { userId } = useAuth();
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'date' | 'rating'>('date');
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    if (userId) {
      fetchRatings(1, true);
    }
  }, [userId, sortBy, filterRating]);

  const fetchRatings = async (pageNumber = 1, shouldReset = false) => {
    try {
      if (pageNumber === 1) {
        setLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      if (!userId) return;

      const fetchedRatings = await getRatingsForRepetiteur(userId);

      // Appliquer le filtre
      let filteredRatings = [...fetchedRatings];
      if (filterRating !== null) {
        filteredRatings = filteredRatings.filter(r => Math.round(r.rating) === filterRating);
      }

      // Appliquer le tri
      if (sortBy === 'date') {
        filteredRatings.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      } else {
        filteredRatings.sort((a, b) => b.rating - a.rating);
      }

      // Calculer les éléments pour la page actuelle
      const startIndex = (pageNumber - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedRatings = filteredRatings.slice(startIndex, endIndex);

      if (shouldReset || pageNumber === 1) {
        setRatings(paginatedRatings);
      } else {
        setRatings(prev => [...prev, ...paginatedRatings]);
      }

      // Vérifier s'il y a plus d'éléments
      setHasMore(endIndex < filteredRatings.length);
      setPage(pageNumber);
    } catch (error) {
      console.error('Error fetching ratings:', error);
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  const loadMoreRatings = () => {
    if (!isLoadingMore && hasMore) {
      fetchRatings(page + 1);
    }
  };

  const renderRatingItem = ({ item }: { item: Rating }) => (
    <View style={[styles.ratingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.ratingHeader}>
        <View style={styles.starsRow}>
          {Array.from({ length: 5 }, (_, i) => (
            <MaterialCommunityIcons
              key={i}
              name={i < Math.round(item.rating) ? 'star' : 'star-outline'}
              size={18}
              color={colors.warning}
            />
          ))}
        </View>
        <Text style={[styles.ratingValue, { color: colors.text }]}>{item.rating.toFixed(1)}</Text>
      </View>

      {item.comment && (
        <Text style={[styles.commentText, { color: colors.textSecondary }]}>
          {item.comment}
        </Text>
      )}

      <View style={styles.ratingFooter}>
        <Text style={[styles.footerText, { color: colors.textMuted }]}>
          {new Date(item.createdAt).toLocaleDateString('fr-FR')}
        </Text>
        <Text style={[styles.footerText, { color: colors.textMuted }]}>
          {(item as any).matiere || 'Général'}
        </Text>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="star-outline" size={48} color={colors.textMuted} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>Aucun avis reçu</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
        Vos avis apparaîtront ici une fois que des élèves auront évalué vos services.
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Mes Avis</Text>
        <View style={styles.headerSpace} />
      </View>

      {/* Filtres */}
      <View style={[styles.filtersContainer, { backgroundColor: colors.surface }]}>
        <View style={styles.filterGroup}>
          <Text style={[styles.filterLabel, { color: colors.text }]}>Trier par:</Text>
          <View style={styles.filterButtons}>
            <TouchableOpacity
              style={[styles.filterButton, sortBy === 'date' && { backgroundColor: colors.primary + '20' }]}
              onPress={() => setSortBy('date')}
            >
              <Text style={[styles.filterButtonText, { color: sortBy === 'date' ? colors.primary : colors.text }]}>
                Date ✓
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, sortBy === 'rating' && { backgroundColor: colors.primary + '20' }]}
              onPress={() => setSortBy('rating')}
            >
              <Text style={[styles.filterButtonText, { color: sortBy === 'rating' ? colors.primary : colors.text }]}>
                Note ✓
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.filterGroup}>
          <Text style={[styles.filterLabel, { color: colors.text }]}>Filtrer par note:</Text>
          <View style={styles.starFilters}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                style={[styles.starFilterButton, filterRating === star && { backgroundColor: colors.warning + '20' }]}
                onPress={() => setFilterRating(filterRating === star ? null : star)}
              >
                <MaterialCommunityIcons
                  name={star <= (filterRating || 5) ? 'star' : 'star-outline'}
                  size={20}
                  color={filterRating === star ? colors.warning : colors.textMuted}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Liste des avis */}
      <FlatList
        data={ratings}
        renderItem={renderRatingItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.statsHeader}>
            <Text style={[styles.statsText, { color: colors.text }]}>
              {ratings.length} avis reçus
            </Text>
            {ratings.length > 0 && (
              <Text style={[styles.averageText, { color: colors.text }]}>
                Note moyenne: { (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1) }/5
              </Text>
            )}
          </View>
        }
        onEndReached={loadMoreRatings}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isLoadingMore ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ margin: 16 }} />
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSpace: {
    width: 24,
  },
  filtersContainer: {
    padding: 16,
    gap: 16,
  },
  filterGroup: {
    gap: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  filterButtonText: {
    fontSize: 14,
  },
  starFilters: {
    flexDirection: 'row',
    gap: 8,
  },
  starFilterButton: {
    padding: 6,
    borderRadius: 4,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  statsHeader: {
    marginBottom: 16,
    gap: 4,
  },
  statsText: {
    fontSize: 16,
    fontWeight: '600',
  },
  averageText: {
    fontSize: 14,
  },
  ratingCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  ratingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  ratingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  footerText: {
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default RatingsListScreen;