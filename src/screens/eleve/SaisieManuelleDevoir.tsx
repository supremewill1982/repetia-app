import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

export default function SaisieManuelleDevoir({ route, navigation }: any) {
  const { colors } = useTheme();
  const { matiere } = route.params || {};
  
  const [titre, setTitre] = useState('');
  const [consignes, setConsignes] = useState('');
  const [questions, setQuestions] = useState<{ texte: string; reponseAttendue: string; }[]>([{ texte: "", reponseAttendue: "" }]);

  const ajouterQuestion = () => setQuestions([...questions, { texte: '', reponseAttendue: '' }]);
  const supprimerQuestion = (index: number) => { if (questions.length > 1) { const newQuestions = [...questions]; newQuestions.splice(index, 1); setQuestions(newQuestions); } };
  const mettreAJourQuestion = (index: number, field: keyof { texte: string; reponseAttendue: string }, value: string) => { const newQuestions = [...questions]; newQuestions[index][field] = value; setQuestions(newQuestions); };

  const validerDevoir = () => {
    const questionsValides = questions.filter(q => q.texte.trim() !== '');
    if (questionsValides.length === 0) { Alert.alert('Info', 'Ajoute au moins une question'); return; }
    
    const analyse = {
      titre: titre.trim() || `Devoir de ${matiere}`,
      matiere: matiere,
      consignes: consignes,
      questions: questionsValides.map((q, idx) => ({ id: idx + 1, texte: q.texte, reponseAttendue: q.reponseAttendue || "À corriger", explication: "Compare avec la correction" }))
    };
    navigation.replace('QuestionDevoirAmeliore', { analyseManuelle: analyse, matiere });
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}><MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} /></TouchableOpacity>
        <Text style={styles.headerTitle}>📝 Saisie manuelle</Text>
        <Text style={styles.headerSubtitle}>Décris ton devoir</Text>
      </LinearGradient>

      <View style={styles.form}>
        <Text style={[styles.label, { color: colors.text }]}>Titre du devoir</Text>
        <TextInput style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]} placeholder="Ex: Devoir de maths" placeholderTextColor={colors.textMuted} onChangeText={setTitre} />

        <Text style={[styles.label, { color: colors.text }]}>Consignes (optionnel)</Text>
        <TextInput style={[styles.inputMultiline, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]} placeholder="Instructions générales..." placeholderTextColor={colors.textMuted} onChangeText={setConsignes} multiline numberOfLines={3} />

        <Text style={[styles.sectionTitle, { color: colors.text }]}>📖 Questions</Text>
        
        {questions.map((q, idx) => (
          <View key={idx} style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <Text style={[styles.questionNumber, { color: colors.primary }]}>Question {idx + 1}</Text>
              {questions.length > 1 && <TouchableOpacity onPress={() => supprimerQuestion(idx)}><MaterialCommunityIcons name="delete" size={20} color={colors.error} /></TouchableOpacity>}
            </View>
            <TextInput style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]} placeholder="Écris la question..." placeholderTextColor={colors.textMuted} onChangeText={(text) => mettreAJourQuestion(idx, 'texte', text)} multiline />
            <TextInput style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border, marginTop: 8 }]} placeholder="Correction attendue (optionnel)" placeholderTextColor={colors.textMuted} onChangeText={(text) => mettreAJourQuestion(idx, 'reponseAttendue', text)} multiline />
          </View>
        ))}

        <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.accent }]} onPress={ajouterQuestion}><MaterialCommunityIcons name="plus" size={20} color="white" /><Text style={styles.addButtonText}>Ajouter une question</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.validateButton, { backgroundColor: colors.primary }]} onPress={validerDevoir}><MaterialCommunityIcons name="check" size={20} color="white" /><Text style={styles.validateButtonText}>Commencer le devoir</Text></TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 50, paddingBottom: 25, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: 'white', marginBottom: 5 },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.9)' },
  form: { padding: 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 16 },
  inputMultiline: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 16, minHeight: 80, textAlignVertical: 'top' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 16 },
  questionCard: { marginBottom: 20, padding: 12, borderRadius: 12, backgroundColor: '#f8f9fa' },
  questionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  questionNumber: { fontSize: 16, fontWeight: '600' },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, gap: 8, marginTop: 10 },
  addButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  validateButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, gap: 8, marginTop: 30, marginBottom: 40 },
  validateButtonText: { color: 'white', fontSize: 18, fontWeight: '600' },
});
