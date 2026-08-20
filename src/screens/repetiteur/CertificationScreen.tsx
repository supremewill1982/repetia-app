import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/firebaseConfig';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { payerTestCertification } from '../../services/certificationService';

const MATIERES = ['Mathématiques', 'Physique-Chimie', 'Français', 'Anglais', 'Histoire-Géographie', 'SVT', 'Philosophie', 'Informatique'];
const NIVEAUX = ['6ème', '5ème', '4ème', '3ème', 'Seconde', '1ère', 'Terminale'];

const CertificationScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const { userId, userData } = useAuth();
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [certification, setCertification] = useState<any>(null);
  const [startingTest, setStartingTest] = useState(false);

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (!userId) return;

      // Charger les tests disponibles
      const testsQuery = query(collection(db, 'tests_certification'));
      const testsSnapshot = await getDocs(testsQuery);
      const testsData = testsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTests(testsData);

      // Charger la certification actuelle
      const certQuery = query(collection(db, 'certifications'), where('repetiteur_id', '==', userId));
      const certSnapshot = await getDocs(certQuery);
      if (!certSnapshot.empty) {
        setCertification(certSnapshot.docs[0].data());
      }
    } catch (error) {
      console.error('Erreur chargement données:', error);
      Alert.alert('Erreur', 'Impossible de charger les données de certification');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = async (testId: string) => {
    setStartingTest(true);

    try {
      if (!userId) {
        Alert.alert('Erreur', 'Utilisateur non connecté.');
        return;
      }

      // Vérifier si un test est déjà en cours
      const enCoursQuery = query(
        collection(db, 'tests_certification_en_cours'),
        where('repetiteur_id', '==', userId),
        where('statut', 'in', ['en_cours', 'non_termine'])
      );

      const enCoursSnapshot = await getDocs(enCoursQuery);

      if (!enCoursSnapshot.empty) {
        Alert.alert(
          'Test en cours',
          'Vous avez déjà un test de certification en cours. Terminez-le avant d’en commencer un nouveau.'
        );
        return;
      }

      const test = tests.find(t => t.id === testId);

      if (!test) {
        Alert.alert('Erreur', 'Test de certification introuvable.');
        return;
      }

      const matiere = test.matiere || '';
      const niveau = test.niveau || '';

      // 💰 Paiement + génération du test
      const { testId: nouveauTestId } = await payerTestCertification(
        userId,
        matiere,
        niveau
      );

      // Enregistrer le test comme étant en cours
      await addDoc(collection(db, 'tests_certification_en_cours'), {
        test_id: nouveauTestId,
        repetiteur_id: userId,
        repetiteur_nom: `${userData?.prenom || ''} ${userData?.nom || ''}`,
        matiere,
        niveau,
        statut: 'en_cours',
        date_debut: serverTimestamp(),
        reponses: [],
        score: null,
      });

      navigation.navigate('TestCertification', {
        testId: nouveauTestId,
      });

    } catch (error: any) {
      console.error('Erreur démarrage test:', error);

      Alert.alert(
        'Impossible de commencer le test',
        error?.message || 'Une erreur est survenue.'
      );
    } finally {
      setStartingTest(false);
    }
  };

  const getNiveauBadge = (niveau: string) => {
    const badges: Record<string, { emoji: string; color: string; label: string }> = {
      bronze: { emoji: '🥉', color: '#CD7F32', label: 'Bronze' },
      argent: { emoji: '🥈', color: '#C0C0C0', label: 'Argent' },
      or: { emoji: '🥇', color: '#FFD700', label: 'Or' },
      diamant: { emoji: '💎', color: '#1E90FF', label: 'Diamant' },
      maitre: { emoji: '👑', color: '#9400D3', label: 'Maître' },
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
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Certification</Text>
        <View />
      </View>

      {/* Statut de certification */}
      {certification && (
        <View style={[styles.certificationCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.certificationTitle, { color: colors.text }]}>Votre certification</Text>
          <View style={styles.certificationContent}>
            <View style={[styles.badge, { backgroundColor: getNiveauBadge(certification.niveau).color + '20' }]}>
              <Text style={{ fontSize: 24 }}>{getNiveauBadge(certification.niveau).emoji}</Text>
              <Text style={[styles.badgeText, { color: getNiveauBadge(certification.niveau).color }]}>
                {getNiveauBadge(certification.niveau).label}
              </Text>
            </View>
            <View style={styles.certificationDetails}>
              <Text style={[styles.detailText, { color: colors.text }]}>
                Score: {certification.score}%
              </Text>
              <Text style={[styles.detailText, { color: colors.textMuted }]}>
                Valide jusqu'au: {certification.date_expiration?.toDate().toLocaleDateString('fr-FR')}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Tests disponibles */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Tests de certification disponibles</Text>
        {tests.length === 0 ? (
          <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
            <MaterialCommunityIcons name="file-document-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Aucun test disponible
            </Text>
          </View>
        ) : (
          tests.map((test) => {
            const canTakeTest = !certification ||
              (certification.niveau !== 'maitre' && test.niveau === certification.niveau);

            return (
              <View key={test.id} style={[styles.testCard, {
                backgroundColor: colors.background,
                borderColor: colors.border,
                opacity: canTakeTest ? 1 : 0.6
              }]}>
                <View style={styles.testInfo}>
                  <Text style={[styles.testTitle, { color: colors.text }]}>
                    {test.matiere} - {test.niveau}
                  </Text>
                  <Text style={[styles.testDescription, { color: colors.textMuted }]}>
                    {test.description || 'Test de certification pour valider vos compétences'}
                  </Text>
                  <Text style={[styles.testDetails, { color: colors.textMuted }]}>
                    {test.nombre_questions} questions - {test.duree} minutes
                  </Text>
                </View>
                {canTakeTest ? (
                  <TouchableOpacity
                    style={[styles.testButton, { backgroundColor: colors.primary }]}
                    onPress={() => handleStartTest(test.id)}
                    disabled={startingTest}
                  >
                    {startingTest ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text style={styles.testButtonText}>Commencer le test</Text>
                    )}
                  </TouchableOpacity>
                ) : (
                  <View style={[styles.testButtonDisabled, { backgroundColor: colors.textMuted + '20' }]}>
                    <Text style={[styles.testButtonTextDisabled, { color: colors.textMuted }]}>
                      Niveau déjà validé
                    </Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </View>

      {/* Historique des tests */}
      {certification?.historique && certification.historique.length > 0 && (
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Historique des tests</Text>
          {certification.historique.map((h: any, index: number) => (
            <View key={index} style={[styles.historyCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.historyTitle, { color: colors.text }]}>
                {h.matiere} - {h.niveau}
              </Text>
              <Text style={[styles.historyScore, { color: h.score >= 70 ? colors.success : colors.error }]}>
                Score: {h.score}%
              </Text>
              <Text style={[styles.historyDate, { color: colors.textMuted }]}>
                {h.date?.toDate().toLocaleDateString('fr-FR')}
              </Text>
            </View>
          ))}
        </View>
      )}
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
  certificationCard: {
    padding: 16,
    borderBottomWidth: 1,
  },
  certificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  certificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginRight: 16,
  },
  badgeText: {
    marginLeft: 8,
    fontWeight: 'bold',
  },
  certificationDetails: {
    flex: 1,
  },
  detailText: {
    marginBottom: 4,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 8,
    marginVertical: 16,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 16,
    textAlign: 'center',
  },
  testCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  testInfo: {
    flex: 1,
  },
  testTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  testDescription: {
    fontSize: 14,
    marginTop: 4,
    color: '#666',
  },
  testDetails: {
    fontSize: 12,
    marginTop: 4,
    color: '#888',
  },
  testButton: {
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  testButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  testButtonDisabled: {
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  testButtonTextDisabled: {
    fontWeight: 'bold',
  },
  historyCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  historyScore: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: 'bold',
  },
  historyDate: {
    fontSize: 12,
    marginTop: 4,
    color: '#888',
  },
});

export default CertificationScreen;
