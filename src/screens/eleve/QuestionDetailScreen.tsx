import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { getMatiereInfoWithFallback } from '../../services/matieresService';
import { feedback } from '../../services/feedbackService';
import { ajouterQuestionEnAttente, supprimerQuestionEnAttente } from '../../services/pendingQuestionsService';

export default function QuestionDetailScreen({ route, navigation }) {
  const { colors } = useTheme();
  const { question, reponse, correction, matiere, date, questionId, sessionId } = route.params || {};
  
  const [showCorrection, setShowCorrection] = useState(false);
  const matiereInfo = getMatiereInfoWithFallback(matiere || 'Révision');
  const dateObj = new Date(date);
  const dateFormatee = !isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString('fr-FR') : 'Date inconnue';

  const handleNouvelleTentative = () => {
    feedback('tap');
    Alert.alert(
      '🔄 Nouvelle tentative',
      'Veux-tu réessayer de répondre à cette question spécifiquement ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Oui',
          onPress: async () => {
            // Naviguer vers RepriseQuestion pour cette question spécifique
            navigation.navigate('RepriseQuestion', {
              questionId: questionId || Date.now().toString(),
              question: question,
              matiere: matiere,
              type: 'revision',
              tentativeActuelle: 1,
              tentativesRestantes: 2,
              reponsesPrecedentes: [reponse]
            });
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <View style={[styles.matiereBadge, { backgroundColor: matiereInfo.couleur + '20' }]}>
            <MaterialCommunityIcons name={matiereInfo.icone} size={14} color={matiereInfo.couleur} />
            <Text style={[styles.matiereBadgeText, { color: matiereInfo.couleur }]}>{matiere || 'Révision'}</Text>
          </View>
          <Text style={styles.dateText}>{dateFormatee}</Text>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="help-circle" size={24} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Question</Text>
          </View>
          <Text style={[styles.questionTexte, { color: colors.text }]}>
            {question || 'Question non disponible'}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="account" size={24} color={colors.warning} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Ta réponse</Text>
          </View>
          <View style={[styles.reponseContainer, { backgroundColor: colors.warning + '10' }]}>
            <Text style={[styles.reponseTexte, { color: colors.text }]}>
              {reponse || 'Pas de réponse enregistrée'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.correctionButton, { backgroundColor: colors.surface }]}
          onPress={() => setShowCorrection(!showCorrection)}
        >
          <View style={styles.correctionButtonContent}>
            <Text style={[styles.correctionButtonText, { color: colors.primary }]}>
              {showCorrection ? 'Masquer la correction' : 'Voir la correction'}
            </Text>
            <MaterialCommunityIcons name={showCorrection ? 'chevron-up' : 'chevron-down'} size={20} color={colors.primary} />
          </View>
        </TouchableOpacity>

        {showCorrection && (
          <View style={[styles.card, { backgroundColor: colors.success + '10' }]}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="check-circle" size={24} color={colors.success} />
              <Text style={[styles.cardTitle, { color: colors.success }]}>Correction</Text>
            </View>
            <Text style={[styles.correctionTexte, { color: colors.text }]}>
              {correction || 'Correction non disponible'}
            </Text>
          </View>
        )}

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={handleNouvelleTentative}
          >
            <MaterialCommunityIcons name="repeat" size={20} color="white" />
            <Text style={styles.actionButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.conseilContainer, { backgroundColor: colors.info + '10' }]}>
          <MaterialCommunityIcons name="lightbulb" size={20} color={colors.info} />
          <Text style={[styles.conseilTexte, { color: colors.textSecondary }]}>
            Relis bien la correction et essaie de comprendre où tu as fait une erreur.
          </Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  matiereBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  matiereBadgeText: { fontSize: 14, fontWeight: '600' },
  dateText: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 30 },
  card: { borderRadius: 20, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  questionTexte: { fontSize: 16, lineHeight: 24 },
  reponseContainer: { padding: 12, borderRadius: 12 },
  reponseTexte: { fontSize: 15, lineHeight: 22 },
  correctionButton: { borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  correctionButtonContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  correctionButtonText: { fontSize: 16, fontWeight: '600' },
  correctionTexte: { fontSize: 15, lineHeight: 22 },
  actionsContainer: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, gap: 8 },
  actionButtonText: { color: 'white', fontSize: 14, fontWeight: '600' },
  conseilContainer: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, gap: 10 },
  conseilTexte: { flex: 1, fontSize: 13, lineHeight: 18 },
});
