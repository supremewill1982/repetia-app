import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/firebaseConfig';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const DashboardEtablissementScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const { userId, userData } = useAuth();
  const [stats, setStats] = useState({
    eleves: 0,
    professeurs: 0,
    cours: 0,
    revenus: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentContributions, setRecentContributions] = useState<any[]>([]);
  const [topRepetiteurs, setTopRepetiteurs] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (!userId) return;

      // Charger les statistiques
      const etablissementDoc = await getDoc(doc(db, 'etablissements', userId));
      if (etablissementDoc.exists()) {
        const data = etablissementDoc.data();
        setStats({
          eleves: data.stats?.eleves || 0,
          professeurs: data.stats?.professeurs || 0,
          cours: data.stats?.cours || 0,
          revenus: data.stats?.revenus || 0,
        });
      }

      // Charger les contributions récentes
      const contributionsQuery = query(
        collection(db, 'contributions'),
        where('auteur.role', '==', 'repetiteur'),
        where('statut', '==', 'validé')
      );
      const contributionsSnapshot = await getDocs(contributionsQuery);
      const contributions = contributionsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => b.date_soumission - a.date_soumission)
        .slice(0, 5);
      setRecentContributions(contributions);

      // Charger les meilleurs répétiteurs
      const repetiteursQuery = query(collection(db, 'users'), where('role', '==', 'repetiteur'));
      const repetiteursSnapshot = await getDocs(repetiteursQuery);
      const repetiteurs = repetiteursSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const sortedRepetiteurs = repetiteurs
        .sort((a, b) => (b.stats?.cours || 0) - (a.stats?.cours || 0))
        .slice(0, 3);
      setTopRepetiteurs(sortedRepetiteurs);

    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNiveauBadge = (niveau: string) => {
    const badges: Record<string, { emoji: string; color: string }> = {
      bronze: { emoji: '🥉', color: '#CD7F32' },
      argent: { emoji: '🥈', color: '#C0C0C0' },
      or: { emoji: '🥇', color: '#FFD700' },
      diamant: { emoji: '💎', color: '#1E90FF' },
      maitre: { emoji: '👑', color: '#9400D3' },
    };
    return badges[niveau.toLowerCase()] || badges.bronze;
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textMuted, marginTop: 8 }}>Chargement...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Tableau de bord</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
          <MaterialCommunityIcons name="cog" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={[styles.etablissementInfo, { backgroundColor: colors.surface }]}>
        <View style={styles.etablissementHeader}>
          <MaterialCommunityIcons name="office-building" size={40} color={colors.primary} />
          <View style={styles.etablissementDetails}>
            <Text style={[styles.etablissementName, { color: colors.text }]}>
              {userData?.nom || 'Mon Établissement'}
            </Text>
            <Text style={[styles.etablissementType, { color: colors.textMuted }]}>
              {userData?.type || 'Lycée'} - {userData?.ville || 'Libreville'}
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.statsContainer, { backgroundColor: colors.surface }]}>
        <Text style={[styles.statsTitle, { color: colors.text }]}>Statistiques</Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.primary + '10' }]}>
            <MaterialCommunityIcons name="account-group" size={24} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.text }]}>{stats.eleves}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Élèves</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.success + '10' }]}>
            <MaterialCommunityIcons name="account-tie" size={24} color={colors.success} />
            <Text style={[styles.statValue, { color: colors.text }]}>{stats.professeurs}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Professeurs</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.info + '10' }]}>
            <MaterialCommunityIcons name="file-document-multiple" size={24} color={colors.info} />
            <Text style={[styles.statValue, { color: colors.text }]}>{stats.cours}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Cours</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.warning + '10' }]}>
            <MaterialCommunityIcons name="currency-usd" size={24} color={colors.warning} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {stats.revenus.toLocaleString()} FCFA
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Revenus</Text>
          </View>
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Cours récents</Text>
          <TouchableOpacity onPress={() => navigation.navigate('GestionCours')}>
            <Text style={[styles.seeAllText, { color: colors.primary }]}>Voir tout</Text>
          </TouchableOpacity>
        </View>
        {recentContributions.length > 0 ? (
          recentContributions.map((contrib) => (
            <TouchableOpacity
              key={contrib.id}
              style={[styles.contribCard, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => navigation.navigate('ContributionDetails', { contributionId: contrib.id })}
            >
              <View style={styles.contribInfo}>
                <Text style={[styles.contribTitle, { color: colors.text }]} numberOfLines={1}>
                  {contrib.titre}
                </Text>
                <Text style={[styles.contribMeta, { color: colors.textMuted }]}>
                  {contrib.matiere} - {contrib.niveau}
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          ))
        ) : (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            Aucun cours récent
          </Text>
        )}
      </View>

      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Meilleurs Répétiteurs</Text>
          <TouchableOpacity onPress={() => navigation.navigate('GestionProfesseurs')}>
            <Text style={[styles.seeAllText, { color: colors.primary }]}>Voir tout</Text>
          </TouchableOpacity>
        </View>
        {topRepetiteurs.length > 0 ? (
          topRepetiteurs.map((rep) => {
            const badge = getNiveauBadge(rep.niveau);
            return (
              <View key={rep.id} style={[styles.repetiteurCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <View style={styles.repetiteurInfo}>
                  <Text style={[styles.repetiteurName, { color: colors.text }]}>{rep.nom} {rep.prenom}</Text>
                  <View style={styles.repetiteurDetails}>
                    <View style={[styles.badge, { backgroundColor: badge.color + '20' }]}>
                      <Text style={{ fontSize: 16 }}>{badge.emoji}</Text>
                      <Text style={[styles.badgeText, { color: badge.color }]}>{rep.niveau}</Text>
                    </View>
                    <Text style={[styles.repetiteurStat, { color: colors.textMuted }]}>
                      {rep.stats?.cours || 0} cours - {rep.stats?.notes || 0}/5
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.repetiteurAction, { backgroundColor: colors.primary + '20' }]}
                  onPress={() => navigation.navigate('ProfesseurDetails', { repetiteurId: rep.id })}
                >
                  <Text style={[styles.repetiteurActionText, { color: colors.primary }]}>Voir</Text>
                </TouchableOpacity>
              </View>
            );
          })
        ) : (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            Aucun répétiteur
          </Text>
        )}
      </View>

      <View style={[styles.quickActions, { backgroundColor: colors.surface }]}>
        <Text style={[styles.quickActionsTitle, { color: colors.text }]}>Actions rapides</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: colors.primary + '10' }]}
            onPress={() => navigation.navigate('GestionEleves')}
          >
            <MaterialCommunityIcons name="account-group" size={24} color={colors.primary} />
            <Text style={[styles.quickActionText, { color: colors.text }]}>Gérer les élèves</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: colors.success + '10' }]}
            onPress={() => navigation.navigate('GestionProfesseurs')}
          >
            <MaterialCommunityIcons name="account-tie" size={24} color={colors.success} />
            <Text style={[styles.quickActionText, { color: colors.text }]}>Gérer les profs</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: colors.info + '10' }]}
            onPress={() => navigation.navigate('GestionCours')}
          >
            <MaterialCommunityIcons name="file-document-multiple" size={24} color={colors.info} />
            <Text style={[styles.quickActionText, { color: colors.text }]}>Gérer les cours</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: colors.warning + '10' }]}
            onPress={() => navigation.navigate('Finance')}
          >
            <MaterialCommunityIcons name="currency-usd" size={24} color={colors.warning} />
            <Text style={[styles.quickActionText, { color: colors.text }]}>Finances</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
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
  etablissementInfo: {
    padding: 20,
    borderBottomWidth: 1,
  },
  etablissementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  etablissementDetails: {
    marginLeft: 16,
  },
  etablissementName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  etablissementType: {
    fontSize: 14,
  },
  statsContainer: {
    padding: 16,
    borderBottomWidth: 1,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  seeAllText: {
    fontSize: 14,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    padding: 16,
  },
  contribCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  contribInfo: {
    flex: 1,
  },
  contribTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  contribMeta: {
    fontSize: 12,
    marginTop: 4,
  },
  repetiteurCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  repetiteurInfo: {
    flex: 1,
  },
  repetiteurName: {
    fontSize: 14,
    fontWeight: '500',
  },
  repetiteurDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 8,
  },
  badgeText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: 'bold',
  },
  repetiteurStat: {
    fontSize: 12,
  },
  repetiteurAction: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  repetiteurActionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  quickActions: {
    padding: 16,
  },
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAction: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  quickActionText: {
    marginTop: 8,
    fontSize: 12,
    textAlign: 'center',
  },
});

export default DashboardEtablissementScreen;
