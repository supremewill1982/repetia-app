import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { getSessionsEnfantFirebase } from '../../services/firebaseEnfantService';

export default function RevisionsScreen({ navigation }: any) {
  const { colors } = useTheme();

  const [revisions, setRevisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const chargerRevisions = async () => {
    try {
      const sessions = await getSessionsEnfantFirebase(true);

      // On ne garde que les sessions de révision
      const data = (sessions || [])
        .filter((session: any) => session.type === 'revision')
        .sort((a: any, b: any) => {
          const dateA = a.createdAt?.toDate?.()
            ? a.createdAt.toDate().getTime()
            : new Date(a.date || a.createdAt || 0).getTime();

          const dateB = b.createdAt?.toDate?.()
            ? b.createdAt.toDate().getTime()
            : new Date(b.date || b.createdAt || 0).getTime();

          return dateB - dateA;
        });

      setRevisions(data);
    } catch (error) {
      console.error('Erreur chargement révisions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      chargerRevisions();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    chargerRevisions();
  };

  const stats = {
    total: revisions.length,

    moyenne:
      revisions.length > 0
        ? Math.round(
            (revisions.reduce(
              (acc: number, r: any) =>
                acc +
                (typeof r.noteSur20 === 'number'
                  ? r.noteSur20
                  : r.scoreTotal && r.scoreMax
                    ? (r.scoreTotal / r.scoreMax) * 20
                    : 0),
              0
            ) /
              revisions.length) *
              10
          ) / 10
        : 0,

    serie: 0,
  };

  const getNote = (revision: any) => {
    if (typeof revision.noteSur20 === 'number') {
      return revision.noteSur20;
    }

    if (
      typeof revision.scoreTotal === 'number' &&
      typeof revision.scoreMax === 'number' &&
      revision.scoreMax > 0
    ) {
      return Math.min(
        20,
        Math.round((revision.scoreTotal / revision.scoreMax) * 20)
      );
    }

    return 0;
  };

  const getDate = (revision: any) => {
    try {
      if (revision.createdAt?.toDate) {
        return revision.createdAt.toDate().toLocaleDateString('fr-FR');
      }

      if (revision.date) {
        return new Date(revision.date).toLocaleDateString('fr-FR');
      }

      return '';
    } catch {
      return '';
    }
  };

  const getNoteColor = (note: number) => {
    if (note >= 16) return colors.success || '#4CAF50';
    if (note >= 10) return colors.warning || '#FF9800';
    return '#f44336';
  };

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.primary]}
        />
      }
    >
      <LinearGradient
        colors={['#E8F2EE', '#ECEEF3']}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>

        <Text
          style={[
            styles.headerTitle,
            { color: colors.text },
          ]}
        >
          📚 Mes révisions
        </Text>
      </LinearGradient>

      <View style={styles.statsRow}>
        <View
          style={[
            styles.statCard,
            { backgroundColor: colors.card },
          ]}
        >
          <Text
            style={[
              styles.statNumber,
              { color: colors.primary },
            ]}
          >
            {stats.total}
          </Text>

          <Text
            style={[
              styles.statLabel,
              { color: colors.textMuted },
            ]}
          >
            Révisions
          </Text>
        </View>

        <View
          style={[
            styles.statCard,
            { backgroundColor: colors.card },
          ]}
        >
          <Text
            style={[
              styles.statNumber,
              { color: colors.primary },
            ]}
          >
            {stats.moyenne}
          </Text>

          <Text
            style={[
              styles.statLabel,
              { color: colors.textMuted },
            ]}
          >
            Moyenne
          </Text>
        </View>

        <View
          style={[
            styles.statCard,
            { backgroundColor: colors.card },
          ]}
        >
          <Text
            style={[
              styles.statNumber,
              { color: colors.warning },
            ]}
          >
            {stats.serie}
          </Text>

          <Text
            style={[
              styles.statLabel,
              { color: colors.textMuted },
            ]}
          >
            Série
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.newButton}
        onPress={() => navigation.navigate('ChoixMatiere', { type: 'revision' })}
      >
        <LinearGradient
          colors={['#7BA89A', '#5A8A7A']}
          style={styles.newGradient}
        >
          <MaterialCommunityIcons
            name="plus-circle"
            size={24}
            color="white"
          />

          <Text style={styles.newButtonText}>
            Nouvelle révision
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      {revisions.length > 0 && (
        <View
          style={[
            styles.section,
            { backgroundColor: colors.card },
          ]}
        >
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text },
            ]}
          >
            🕐 Dernières révisions
          </Text>

          {revisions.slice(0, 5).map((revision: any) => {
            const note = getNote(revision);

            return (
              <TouchableOpacity
                key={revision.id}
                style={[
                  styles.revisionCard,
                  { borderBottomColor: colors.border },
                ]}
                onPress={() =>
                  navigation.navigate('ResultatRevision', {
                    score: revision.scoreTotal || 0,
                    scoreMax:
                      revision.scoreMax ||
                      (revision.questions?.length || 0) * 2,
                    noteSur20: note,
                    reponses: revision.questions || [],
                    matiere: revision.matiere,
                    type: 'revision',
                  })
                }
              >
                <View style={styles.revisionInfo}>
                  <Text
                    style={[
                      styles.revisionMatiere,
                      { color: colors.primary },
                    ]}
                  >
                    {revision.matiere || 'Révision'}
                  </Text>

                  <Text
                    style={[
                      styles.revisionDate,
                      { color: colors.textMuted },
                    ]}
                  >
                    {getDate(revision)}
                  </Text>
                </View>

                <View style={styles.revisionStatus}>
                  <Text
                    style={[
                      styles.revisionNote,
                      { color: getNoteColor(note) },
                    ]}
                  >
                    {note}/20
                  </Text>

                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={20}
                    color={colors.textMuted}
                  />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {!loading && revisions.length === 0 && (
        <View
          style={[
            styles.emptyCard,
            { backgroundColor: colors.card },
          ]}
        >
          <MaterialCommunityIcons
            name="book-open-outline"
            size={48}
            color={colors.textMuted}
          />

          <Text
            style={[
              styles.emptyTitle,
              { color: colors.text },
            ]}
          >
            Aucune révision
          </Text>

          <Text
            style={[
              styles.emptyText,
              { color: colors.textMuted },
            ]}
          >
            Commence une nouvelle révision pour voir
            tes résultats ici.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(90,138,122,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },

  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#2B3A4A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },

  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },

  newButton: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },

  newGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 16,
  },

  newButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },

  section: {
    margin: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 20,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },

  revisionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },

  revisionInfo: {
    flex: 1,
  },

  revisionMatiere: {
    fontSize: 15,
    fontWeight: '600',
  },

  revisionDate: {
    fontSize: 12,
    marginTop: 2,
  },

  revisionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  revisionNote: {
    fontSize: 15,
    fontWeight: 'bold',
  },

  emptyCard: {
    margin: 20,
    marginTop: 30,
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
  },

  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});
