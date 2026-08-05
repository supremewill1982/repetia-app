import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, TextInput } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { submitRating, Rating } from '../../services/ratingService';
import { useNavigation, useRoute } from '@react-navigation/native';

const SubmitRatingScreen = () => {
  const { colors } = useTheme();
  const { userId } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();
  const { repetiteurId, repetiteurName } = route.params as { repetiteurId: string; repetiteurName: string };

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!userId) {
      Alert.alert('Erreur', 'Vous devez être connecté pour soumettre un avis');
      return;
    }

    if (rating < 1 || rating > 5) {
      Alert.alert('Erreur', 'La note doit être entre 1 et 5');
      return;
    }

    setSubmitting(true);
    try {
      await submitRating({
        repetiteurId,
        studentId: userId,
        rating,
        comment,
      });

      setRatingSubmitted(true);
      Alert.alert('Succès', 'Votre avis a été soumis avec succès!');
    } catch (error) {
      console.error('Error submitting rating:', error);
      Alert.alert('Erreur', 'Impossible de soumettre votre avis. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = () => {
    return [1, 2, 3, 4, 5].map((star) => (
      <TouchableOpacity
        key={star}
        onPress={() => setRating(star)}
        style={styles.starContainer}
        disabled={ratingSubmitted}
      >
        <MaterialCommunityIcons
          name={star <= rating ? 'star' : 'star-outline'}
          size={36}
          color={star <= rating ? colors.warning : colors.textMuted}
        />
      </TouchableOpacity>
    ));
  };

  if (ratingSubmitted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.successContainer, { backgroundColor: colors.surface }]}>
          <MaterialCommunityIcons name="check-circle" size={64} color={colors.success} />
          <Text style={[styles.successTitle, { color: colors.text }]}>Merci pour votre avis!</Text>
          <Text style={[styles.successMessage, { color: colors.textMuted }]}>
            Votre note aidera {repetiteurName} à améliorer ses services.
          </Text>
          <TouchableOpacity
            style={[styles.successBackButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.successBackButtonText}>Retour au profil</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Noter {repetiteurName}</Text>
        <View style={styles.headerSpace} />
      </View>

      <View style={[styles.content, { backgroundColor: colors.surface }]}>
        <Text style={[styles.title, { color: colors.text }]}>Comment évaluez-vous ce répétiteur?</Text>

        <View style={styles.starsContainer}>
          {renderStars()}
        </View>

        <Text style={[styles.label, { color: colors.text, marginTop: 24 }]}>Commentaire (optionnel)</Text>
        <TextInput
          style={[styles.commentInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
          value={comment}
          onChangeText={setComment}
          placeholder="Partagez votre expérience..."
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: colors.primary, opacity: submitting ? 0.7 : 1 }]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>Soumettre l'avis</Text>
          )}
        </TouchableOpacity>
      </View>
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
  content: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  starContainer: {
    padding: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  commentInput: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 24,
  },
  submitButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  successContainer: {
    flex: 1,
    padding: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 16,
  },
  successMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  backButton: {
    padding: 12,
    borderRadius: 8,
    width: '60%',
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default SubmitRatingScreen;