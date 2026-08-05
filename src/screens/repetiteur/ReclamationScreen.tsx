import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/firebaseConfig';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const ReclamationScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const { userId, userData } = useAuth();
  const [testId, setTestId] = useState('');
  const [matiere, setMatiere] = useState('');
  const [commentaire, setCommentaire] = useState('');
  const [reclamations, setReclamations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReclamations();
  }, [userId]);

  const fetchReclamations = async () => {
    try {
      setLoading(true);
      if (!userId) return;

      const q = query(collection(db, 'reclamations'), where('repetiteur_id', '==', userId));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReclamations(data);
    } catch (error) {
      console.error('Erreur chargement réclamations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!testId.trim() || !matiere.trim() || !commentaire.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'reclamations'), {
        repetiteur_id: userId,
        repetiteur_nom: `${userData?.prenom || ''} ${userData?.nom || ''}`,
        test_id: testId.trim(),
        matiere: matiere.trim(),
        commentaire: commentaire.trim(),
        statut: 'en_attente',
        date: serverTimestamp(),
      });

      Alert.alert('Succès', 'Votre réclamation a été soumise avec succès');
      setTestId('');
      setMatiere('');
      setCommentaire('');
      fetchReclamations();
    } catch (error) {
      console.error('Erreur soumission:', error);
      Alert.alert('Erreur', 'Impossible de soumettre votre réclamation');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Réclamation de certification</Text>
        <View />
      </View>

      <View style={[styles.formContainer, { backgroundColor: colors.surface }]}>
        <Text style={[styles.title, { color: colors.text }]}>Soumettre une réclamation</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Si vous pensez qu'il y a une erreur dans l'évaluation de votre test de certification
        </Text>

        <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>ID du test *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
          placeholder="Ex: test_abc123"
          placeholderTextColor={colors.textMuted}
          selectedValue={testId}
          onChangeText={setTestId}
        />

        <Text style={[styles.label, { color: colors.text }]}>Matière *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
          placeholder="Ex: Mathématiques"
          placeholderTextColor={colors.textMuted}
          selectedValue={matiere}
          onChangeText={setMatiere}
        />

        <Text style={[styles.label, { color: colors.text }]}>Commentaire *</Text>
        <TextInput
          style={[styles.textArea, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
          placeholder="Expliquez pourquoi vous contestez ce résultat..."
          placeholderTextColor={colors.textMuted}
          selectedValue={commentaire}
          onChangeText={setCommentaire}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[styles.submitButton, {
            backgroundColor: colors.primary,
            opacity: submitting ? 0.5 : 1
          }]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>Soumettre la réclamation</Text>
          )}
        </TouchableOpacity>
      </View>

      {reclamations.length > 0 && (
        <View style={[styles.listContainer, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Vos réclamations</Text>
          {reclamations.map((reclamation) => (
            <View key={reclamation.id} style={[styles.reclamationCard, {
              backgroundColor: colors.background,
              borderColor: colors.border
            }]}>
              <View style={styles.reclamationHeader}>
                <Text style={[styles.reclamationTitle, { color: colors.text }]}>
                  Réclamation #{reclamation.id.substring(0, 8)}
                </Text>
                <View style={[styles.statutBadge, {
                  backgroundColor: reclamation.statut === 'en_attente' ? colors.warning + '20' : colors.success + '20'
                }]}>
                  <Text style={[styles.statutText, {
                    color: reclamation.statut === 'en_attente' ? colors.warning : colors.success
                  }]}>
                    {reclamation.statut.replace('_', ' ')}
                  </Text>
                </View>
              </View>
              <Text style={[styles.reclamationMatiere, { color: colors.textMuted }]}>
                {reclamation.matiere} - Test: {reclamation.test_id}
              </Text>
              <Text style={[styles.reclamationComment, { color: colors.textMuted }]}>
                {reclamation.commentaire}
              </Text>
              <Text style={[styles.reclamationDate, { color: colors.textMuted }]}>
                Soumis le: {reclamation.date?.toDate().toLocaleDateString('fr-FR')}
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
  formContainer: {
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
    marginBottom: 12,
  },
  textArea: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
    marginBottom: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  reclamationCard: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  reclamationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reclamationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statutBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statutText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  reclamationMatiere: {
    fontSize: 14,
    marginTop: 8,
  },
  reclamationComment: {
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20,
  },
  reclamationDate: {
    fontSize: 12,
    marginTop: 8,
    color: '#888',
  },
});

export default ReclamationScreen;
