import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { getBadgesDeBloques, BADGES_LIST, calculerStatsPourBadges } from '../../services/badgesService';
import BadgeCard from '../../components/BadgeCard';
import { feedback } from '../../services/feedbackService';
import ModernLoader from '../../components/ModernLoader';

export default function BadgesScreen({ navigation }) {
  const { colors } = useTheme();
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    chargerBadges();
  }, []);

  const chargerBadges = async () => {
    try {
      setLoading(true);
      const badgesObtenus = await getBadgesDeBloques();
      const statsBadges = await calculerStatsPourBadges();
      setStats(statsBadges);
      setBadges(badgesObtenus);
    } catch (error) {
      console.error('Erreur chargement badges:', error);
    } finally {
      setLoading(false);
    }
  };

  // Badges non débloqués
  const badgesNonDebloques = BADGES_LIST.filter(
    badge => !badges.some(b => b.id === badge.id)
  );

  if (loading) {
    return (
      <ModernLoader 
        visible={true} 
        type="lightbulb"
        message="Chargement de tes badges..."
        subMessage="Prépare-toi à découvrir tes récompenses"
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => {
            feedback('tap');
            navigation.goBack();
          }}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Mes badges</Text>
        <Text style={styles.headerSubtitle}>
          {badges.length} badge{badges.length > 1 ? 's' : ''} débloqué{badges.length > 1 ? 's' : ''}
        </Text>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        
        {badges.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              🎖️ Badges obtenus
            </Text>
            {badges.map((badge) => (
              <BadgeCard key={badge.id} badge={badge} />
            ))}
          </View>
        )}

        {badgesNonDebloques.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              🔒 Badges à débloquer
            </Text>
            {badgesNonDebloques.map((badge) => (
              <View key={badge.id} style={[styles.lockedBadge, { backgroundColor: colors.surface }]}>
                <View style={[styles.lockedIcon, { backgroundColor: colors.border }]}>
                  <MaterialCommunityIcons name="lock" size={24} color={colors.textSecondary} />
                </View>
                <View style={styles.lockedInfo}>
                  <Text style={[styles.lockedNom, { color: colors.textSecondary }]}>{badge.nom}</Text>
                  <Text style={[styles.lockedDescription, { color: colors.textMuted }]}>
                    {badge.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {stats && (
          <View style={[styles.statsCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statsTitle, { color: colors.text }]}>Progression</Text>
            <View style={styles.statsRow}>
              <View style={styles.statsItem}>
                <Text style={[styles.statsValue, { color: colors.primary }]}>{stats.totalRevisions || 0}</Text>
                <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>Révisions</Text>
              </View>
              <View style={styles.statsItem}>
                <Text style={[styles.statsValue, { color: colors.accent }]}>{stats.totalQuestions || 0}</Text>
                <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>Questions</Text>
              </View>
              <View style={styles.statsItem}>
                <Text style={[styles.statsValue, { color: colors.warning }]}>{stats.serie || 0}</Text>
                <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>Série</Text>
              </View>
            </View>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    opacity: 0.6,
  },
  lockedIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  lockedInfo: {
    flex: 1,
  },
  lockedNom: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  lockedDescription: {
    fontSize: 12,
  },
  statsCard: {
    padding: 20,
    borderRadius: 20,
    marginTop: 8,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statsItem: {
    alignItems: 'center',
  },
  statsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 12,
  },
});
