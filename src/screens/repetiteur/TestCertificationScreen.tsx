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
import { db } from '../../services/firebaseConfig';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
} from 'firebase/firestore';
import { soumettreTest } from '../../services/certificationService';

const TestCertificationScreen = ({ navigation, route }: any) => {
  const { colors } = useTheme();
  const { testId } = route.params || {};

  const [test, setTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [index, setIndex] = useState(0);
  const [reponses, setReponses] = useState<Record<string, string>>({});
  const [termine, setTermine] = useState(false);
  const [resultat, setResultat] = useState<any>(null);

  useEffect(() => {
    chargerTest();
  }, [testId]);

  const chargerTest = async () => {
    try {
      if (!testId) {
        throw new Error('Identifiant du test manquant.');
      }

      const testRef = doc(db, 'tests_certification', testId);
      const snapshot = await getDoc(testRef);

      if (!snapshot.exists()) {
        throw new Error('Test de certification introuvable.');
      }

      const data = snapshot.data();

      if (!Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error('Ce test ne contient aucune question.');
      }

      setTest({
        id: snapshot.id,
        ...data,
      });
    } catch (error: any) {
      console.error('Erreur chargement test:', error);
      Alert.alert(
        'Erreur',
        error?.message || 'Impossible de charger le test.',
        [{ text: 'Retour', onPress: () => navigation.goBack() }],
      );
    } finally {
      setLoading(false);
    }
  };

  const question = test?.questions?.[index];
  const total = test?.questions?.length || 0;

  const enregistrerReponse = (value: string) => {
    if (!question?.id) return;

    setReponses(prev => ({
      ...prev,
      [question.id]: value,
    }));
  };

  const suivant = () => {
    if (!question?.id) return;

    const reponse = reponses[question.id];

    if (!reponse || !reponse.trim()) {
      Alert.alert('Réponse manquante', 'Sélectionne ou saisis une réponse.');
      return;
    }

    if (index < total - 1) {
      setIndex(i => i + 1);
    } else {
      terminerTest();
    }
  };

  const terminerTest = async () => {
    if (submitting) return;

    const nonRepondu = test.questions.find(
      (q: any) => !reponses[q.id] || !String(reponses[q.id]).trim(),
    );

    if (nonRepondu) {
      Alert.alert(
        'Question non répondue',
        'Réponds à toutes les questions avant de terminer le test.',
      );
      return;
    }

    Alert.alert(
      'Terminer le test ?',
      'Es-tu sûr de vouloir soumettre définitivement tes réponses ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Soumettre',
          onPress: soumettre,
        },
      ],
    );
  };

  const soumettre = async () => {
    setSubmitting(true);

    try {
      const resultatTest = await soumettreTest(testId, reponses);

      // Marquer le test en cours comme terminé.
      try {
        const q = query(
          collection(db, 'tests_certification_en_cours'),
          where('test_id', '==', testId),
        );

        const snapshot = await getDocs(q);

        for (const item of snapshot.docs) {
          await updateDoc(item.ref, {
            statut: 'termine',
            reponses,
            score: resultatTest.score,
          });
        }
      } catch (e) {
        console.warn('Impossible de mettre à jour le test en cours:', e);
      }

      setResultat(resultatTest);
      setTermine(true);
    } catch (error: any) {
      console.error('Erreur soumission:', error);

      Alert.alert(
        'Erreur',
        error?.message || 'Impossible de soumettre le test.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View
        style={[
          styles.center,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Chargement du test...
        </Text>
      </View>
    );
  }

  if (termine && resultat) {
    const reussi = resultat.testReussi;

    return (
      <ScrollView
        contentContainerStyle={styles.resultContainer}
        style={{ backgroundColor: colors.background }}
      >
        <View
          style={[
            styles.resultIcon,
            {
              backgroundColor: reussi
                ? '#4CAF5020'
                : '#f4433620',
            },
          ]}
        >
          <MaterialCommunityIcons
            name={reussi ? 'check-circle' : 'close-circle'}
            size={80}
            color={reussi ? '#4CAF50' : '#f44336'}
          />
        </View>

        <Text style={[styles.resultTitle, { color: colors.text }]}>
          {reussi ? 'Certification réussie !' : 'Test non réussi'}
        </Text>

        <Text
          style={[
            styles.score,
            { color: reussi ? '#4CAF50' : '#f44336' },
          ]}
        >
          {resultat.score}%
        </Text>

        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Niveau obtenu
          </Text>

          <Text style={[styles.niveau, { color: colors.primary }]}>
            {String(resultat.niveau).toUpperCase()}
          </Text>

          <Text style={[styles.feedback, { color: colors.textSecondary }]}>
            {resultat.feedback}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.primary },
          ]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>
            Retour à la certification
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
    >
      <View style={styles.progressHeader}>
        <Text style={[styles.progressText, { color: colors.text }]}>
          Question {index + 1} / {total}
        </Text>

        <Text style={[styles.pointsText, { color: colors.textMuted }]}>
          {question?.points || 1} point
          {(question?.points || 1) > 1 ? 's' : ''}
        </Text>
      </View>

      <View
        style={[
          styles.progressBackground,
          { backgroundColor: colors.border },
        ]}
      >
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor: colors.primary,
              width: `${((index + 1) / total) * 100}%`,
            },
          ]}
        />
      </View>

      <View
        style={[
          styles.questionCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.matiere, { color: colors.primary }]}>
          {test?.matiere} · {test?.niveau}
        </Text>

        <Text style={[styles.question, { color: colors.text }]}>
          {question?.texte}
        </Text>

        {question?.type === 'qcm' &&
        Array.isArray(question?.options) ? (
          <View style={styles.options}>
            {question.options.map((option: string, i: number) => {
              const selected =
                reponses[question.id] === option;

              return (
                <TouchableOpacity
                  key={`${question.id}_${i}`}
                  style={[
                    styles.option,
                    {
                      backgroundColor: selected
                        ? colors.primary + '20'
                        : colors.background,
                      borderColor: selected
                        ? colors.primary
                        : colors.border,
                    },
                  ]}
                  onPress={() => enregistrerReponse(option)}
                >
                  <View
                    style={[
                      styles.radio,
                      {
                        borderColor: selected
                          ? colors.primary
                          : colors.textMuted,
                      },
                    ]}
                  >
                    {selected && (
                      <View
                        style={[
                          styles.radioInner,
                          { backgroundColor: colors.primary },
                        ]}
                      />
                    )}
                  </View>

                  <Text
                    style={[
                      styles.optionText,
                      { color: colors.text },
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <TextInput
            style={[
              styles.input,
              {
                color: colors.text,
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
            value={reponses[question?.id] || ''}
            onChangeText={enregistrerReponse}
            placeholder="Saisis ta réponse..."
            placeholderTextColor={colors.textMuted}
            multiline
          />
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: colors.primary },
          submitting && styles.disabled,
        ]}
        onPress={suivant}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>
            {index === total - 1
              ? 'Terminer le test'
              : 'Question suivante'}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '700',
  },
  pointsText: {
    fontSize: 14,
  },
  progressBackground: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  questionCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
  },
  matiere: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 14,
  },
  question: {
    fontSize: 20,
    lineHeight: 29,
    fontWeight: '600',
    marginBottom: 24,
  },
  options: {
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
  },
  input: {
    minHeight: 120,
    borderWidth: 1,
    borderRadius: 14,
    padding: 15,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  button: {
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.6,
  },
  resultContainer: {
    flexGrow: 1,
    alignItems: 'center',
    padding: 24,
    paddingBottom: 50,
  },
  resultIcon: {
    width: 130,
    height: 130,
    borderRadius: 65,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
  },
  resultTitle: {
    fontSize: 25,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 20,
  },
  score: {
    fontSize: 58,
    fontWeight: '900',
    marginVertical: 20,
  },
  card: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  niveau: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 16,
  },
  feedback: {
    fontSize: 15,
    lineHeight: 23,
  },
});

export default TestCertificationScreen;
