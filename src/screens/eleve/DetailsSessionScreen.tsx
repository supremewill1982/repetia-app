import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

export default function DetailsSessionScreen({ route, navigation }: any) {
  const { colors } = useTheme();
  const { matiere, date, questions, note } = route.params;
  
  const getNoteColor = (noteValue: number) => {
    if (noteValue < 10) return '#f44336';
    if (noteValue < 15) return '#FF9800';
    return '#4CAF50';
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{matiere}</Text>
        <Text style={styles.headerSubtitle}>{date}</Text>
        <View style={[styles.noteBadge, { backgroundColor: getNoteColor(note) + '40' }]}>
          <Text style={[styles.noteText, { color: getNoteColor(note) }]}>{note}/20</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>📋 Détail des questions</Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>2/2 = juste • 1/2 = partiel • 0/2 = incorrect</Text>
        
        {questions.map((q: any, idx: number) => {
          const noteQ = (q.note * 10) || 0;
          const noteColor = getNoteColor(noteQ);
          const iconName = q.note === 2 ? 'check-circle' : q.note === 1 ? 'progress-check' : 'close-circle';
          
          return (
            <View key={idx} style={[styles.questionCard, { backgroundColor: colors.surface }]}>
              <View style={styles.questionHeader}>
                <View style={styles.questionNumber}>
                  <Text style={[styles.questionNumberText, { color: colors.primary }]}>Q{idx + 1}</Text>
                  <MaterialCommunityIcons name={iconName} size={16} color={noteColor} />
                </View>
                <Text style={[styles.questionNote, { color: noteColor }]}>{q.note}/2 → {noteQ}/20</Text>
              </View>
              <Text style={[styles.questionText, { color: colors.text }]}>{q.question}</Text>
              <View style={[styles.reponseBox, { backgroundColor: colors.background }]}>
                <Text style={[styles.reponseLabel, { color: colors.textSecondary }]}>Ta réponse :</Text>
                <Text style={[styles.reponseText, { color: colors.text }]}>{q.reponse || '(non répondue)'}</Text>
              </View>
              {q.feedback && (
                <View style={styles.feedbackBox}>
                  <MaterialCommunityIcons name="lightbulb" size={14} color={colors.info} />
                  <Text style={[styles.feedbackText, { color: colors.info }]}>{q.feedback}</Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 50, paddingBottom: 25, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, alignItems: 'center' },
  backButton: { position: 'absolute', top: 50, left: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: 'white', marginBottom: 5 },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 10 },
  noteBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  noteText: { fontSize: 18, fontWeight: 'bold' },
  content: { padding: 16, paddingBottom: 30 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 5 },
  sectionSubtitle: { fontSize: 12, marginBottom: 20, fontStyle: 'italic' },
  questionCard: { borderRadius: 16, padding: 16, marginBottom: 16 },
  questionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  questionNumber: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  questionNumberText: { fontSize: 14, fontWeight: '600' },
  questionNote: { fontSize: 14, fontWeight: 'bold' },
  questionText: { fontSize: 15, lineHeight: 22, marginBottom: 12 },
  reponseBox: { padding: 12, borderRadius: 10, marginTop: 4 },
  reponseLabel: { fontSize: 12, fontWeight: '500', marginBottom: 4 },
  reponseText: { fontSize: 14 },
  feedbackBox: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  feedbackText: { fontSize: 12, fontStyle: 'italic', flex: 1 },
});
