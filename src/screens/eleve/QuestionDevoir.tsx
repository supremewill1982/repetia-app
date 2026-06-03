import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { startTimeTracking, stopTimeTracking } from '../../services/timeTrackingService';
import { feedback } from '../../services/feedbackService';

export default function QuestionDevoir({ route, navigation }) {
  const { colors } = useTheme();
  const { imageUri, matiere } = route.params || {};

  const [question, setQuestion] = useState('');
  const [reponse, setReponse] = useState('');
  const [essais, setEssais] = useState(0);
  const [message, setMessage] = useState('');
  const [termine, setTermine] = useState(false);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [noteFinale, setNoteFinale] = useState(0);
  const [reponseFinale, setReponseFinale] = useState('');
  const [timeStarted, setTimeStarted] = useState(false);

  useEffect(() => {
    if (imageUri) {
      analyserImage();
    } else {
      setErreur("Aucune image reçue");
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    if (!timeStarted && matiere && !chargement && question) {
      startTimeTracking('devoir', matiere);
      setTimeStarted(true);
    }
  }, [chargement, matiere, question]);

  useEffect(() => {
    if (termine) {
      stopTimeTracking();
      navigation.replace('ResultatRevision', {
        score: noteFinale,
        scoreMax: 2,
        reponses: [{ question, reponse: reponseFinale, note: noteFinale, feedback: message || 'Devoir terminé' }],
        matiere: matiere,
        type: 'devoir'
      });
    }
  }, [termine]);

  const analyserImage = async () => {
    setChargement(true);
    setErreur('');
    
    try {
      console.log('📤 Lecture de l\'image:', imageUri);
      
      // Convertir l'image en base64 manuellement
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result;
          if (typeof result === 'string') {
            resolve(result.split(',')[1]);
          } else {
            reject(new Error('Conversion échouée'));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      
      console.log('📤 Image convertie, taille:', (base64 as string).length);
      
      if (!base64 || (base64 as string).length < 100) {
        throw new Error('Image invalide');
      }
      
      // Appeler l'API OpenRouter
      const apiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer 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',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.0-flash-001',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: `Tu es un professeur. Voici l'image d'un devoir de ${matiere || 'général'}. Extrais UNIQUEMENT la question principale. Réponds par une seule phrase courte.` },
                { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } }
              ]
            }
          ],
          max_tokens: 200,
          temperature: 0.3
        })
      });
      
      const data = await apiResponse.json();
      
      if (data.error) {
        throw new Error(data.error.message || 'Erreur API');
      }
      
      const questionGeneree = data.choices?.[0]?.message?.content;
      
      if (questionGeneree && questionGeneree.length > 10) {
        setQuestion(questionGeneree);
        console.log('✅ Question extraite:', questionGeneree);
      } else {
        throw new Error('Question non détectée');
      }
      
    } catch (error) {
      console.error('❌ Erreur:', error);
      setErreur(error.message || "Impossible de lire le devoir. Vérifie ta connexion.");
      // Question par défaut en mode dégradé
      setQuestion(`Peux-tu expliquer ce que tu as compris de cet exercice de ${matiere || 'mathématiques'} ?`);
    } finally {
      setChargement(false);
    }
  };

  const verifierReponseUtilisateur = async () => {
    if (!reponse.trim()) {
      feedback('error');
      Alert.alert('Info', 'Écris une réponse');
      return;
    }
    setChargement(true);
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer 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',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.0-flash-001',
          messages: [
            {
              role: 'user',
              content: `Note cette réponse sur 2 points (2=parfait, 1=partiel, 0=incorrect). Réponds UNIQUEMENT en JSON: {"note": 0, "feedback": "message"}.
              
Question: ${question}
Réponse: ${reponse}`
            }
          ],
          max_tokens: 150,
          temperature: 0.3
        })
      });
      
      const data = await response.json();
      let resultat;
      try {
        const content = data.choices?.[0]?.message?.content || '{"note": 0, "feedback": "Non évalué"}';
        resultat = JSON.parse(content);
      } catch {
        resultat = { note: 0, feedback: "Réponse enregistrée." };
      }
      
      if (resultat.note >= 1.5) {
        feedback('success');
        setNoteFinale(2);
        setReponseFinale(reponse);
        setMessage(resultat.feedback);
        setTermine(true);
      } else {
        const nouvelEssai = essais + 1;
        if (nouvelEssai >= 3) {
          feedback('info');
          setNoteFinale(0);
          setReponseFinale(reponse);
          setMessage(resultat.feedback);
          setTermine(true);
        } else {
          setEssais(nouvelEssai);
          setMessage(resultat.feedback);
          feedback('error');
        }
      }
    } catch (error) {
      // Mode dégradé : validation simple
      if (reponse.trim().length > 10) {
        feedback('success');
        setNoteFinale(2);
        setReponseFinale(reponse);
        setMessage("Bonne réponse ! (Évaluation simplifiée)");
        setTermine(true);
      } else {
        setMessage("Réponse trop courte. Développe ta réponse.");
        feedback('error');
      }
    } finally {
      setChargement(false);
      setReponse('');
    }
  };

  const handleIgnorer = () => {
    feedback('tap');
    Alert.alert('🚫 Ignorer la question', 'Tu n\'auras pas de point. Veux-tu vraiment ignorer ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Ignorer', style: 'destructive', onPress: () => {
        setNoteFinale(0);
        setReponseFinale('(ignoré)');
        setMessage('Question ignorée');
        setTermine(true);
      }}
    ]);
  };

  const handleRetour = () => {
    stopTimeTracking();
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleRetour}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Question du devoir</Text>
            {matiere && <View style={styles.matiereBadge}><Text style={styles.matiereBadgeText}>{matiere}</Text></View>}
          </LinearGradient>

          {chargement ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.text }]}>Analyse de l'image...</Text>
              <Text style={[styles.loadingSubtext, { color: colors.textSecondary }]}>L'IA lit ton devoir</Text>
            </View>
          ) : (
            <>
              <View style={[styles.questionCard, { backgroundColor: colors.surface }]}>
                <Text style={[styles.questionLabel, { color: colors.primary }]}>Question :</Text>
                <Text style={[styles.questionTexte, { color: colors.text }]}>{question}</Text>
              </View>

              <View style={[styles.reponseCard, { backgroundColor: colors.surface }]}>
                <Text style={[styles.reponseLabel, { color: colors.textSecondary }]}>Ta réponse :</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  placeholder="Écris ta réponse..."
                  placeholderTextColor={colors.textMuted}
                  value={reponse}
                  onChangeText={setReponse}
                  multiline
                  numberOfLines={4}
                />
              </View>

              {message ? (
                <View style={[styles.feedbackCard, { backgroundColor: colors.info + '20' }]}>
                  <MaterialCommunityIcons name="lightbulb" size={20} color={colors.info} />
                  <Text style={[styles.feedbackText, { color: colors.textSecondary }]}>{message}</Text>
                </View>
              ) : null}

              <View style={styles.infoContainer}>
                <Text style={[styles.essaisInfo, { color: colors.primary }]}>Essais : {essais}/3</Text>
              </View>

              <View style={styles.buttonsContainer}>
                <TouchableOpacity style={[styles.validateButton, { backgroundColor: colors.primary }]} onPress={verifierReponseUtilisateur} disabled={chargement || !reponse.trim()}>
                  <Text style={styles.validateButtonText}>Valider</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.ignoreButton, { backgroundColor: colors.error + '20' }]} onPress={handleIgnorer}>
                  <Text style={[styles.ignoreButtonText, { color: colors.error }]}>Ignorer</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 50, paddingBottom: 25, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: 'white' },
  matiereBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start', marginTop: 8 },
  matiereBadgeText: { color: 'white', fontSize: 12 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  loadingText: { marginTop: 20, fontSize: 16, fontWeight: '500' },
  loadingSubtext: { marginTop: 8, fontSize: 14 },
  questionCard: { margin: 20, padding: 20, borderRadius: 20 },
  questionLabel: { fontSize: 14, fontWeight: '600', marginBottom: 10 },
  questionTexte: { fontSize: 18, lineHeight: 26 },
  reponseCard: { marginHorizontal: 20, marginBottom: 16, padding: 20, borderRadius: 20 },
  reponseLabel: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
  textInput: { borderRadius: 12, borderWidth: 1, padding: 14, fontSize: 16, minHeight: 100, textAlignVertical: 'top' },
  feedbackCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 16, padding: 14, borderRadius: 12, gap: 10 },
  feedbackText: { flex: 1, fontSize: 14 },
  infoContainer: { marginHorizontal: 20, marginBottom: 20 },
  essaisInfo: { fontSize: 16, fontWeight: '600' },
  buttonsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 20, marginBottom: 30, gap: 12 },
  validateButton: { flex: 1, padding: 16, borderRadius: 16, alignItems: 'center' },
  validateButtonText: { color: 'white', fontSize: 18, fontWeight: '600' },
  ignoreButton: { flex: 1, padding: 16, borderRadius: 16, alignItems: 'center' },
  ignoreButtonText: { fontSize: 16, fontWeight: '600' },
});
