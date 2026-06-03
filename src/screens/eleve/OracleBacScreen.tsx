import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { predireNoteBac, Prediction } from '../../services/oracleBacService';

export default function OracleBacScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<Prediction | null>(null);

  const handlePredire = async () => {
    setLoading(true);
    try {
      const p = await predireNoteBac();
      setPrediction(p);
    } catch (e: any) {
      Alert.alert('Erreur', e.message || 'Impossible de faire la prédiction.');
    } finally {
      setLoading(false);
    }
  };

  const mentionColor = (mention: string) => {
    switch (mention) {
      case 'Excellent': return '#7BA89A';
      case 'Très bien': return '#4CAF50';
      case 'Bien': return '#2196F3';
      case 'Assez bien': return '#FF9800';
      default: return '#9E9E9E';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={['#E8F2EE', '#ECEEF3']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🔮 Oracle du Bac</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        {!prediction && !loading && (
          <TouchableOpacity style={[styles.predireBtn, { backgroundColor: colors.primary }]} onPress={handlePredire}>
            <MaterialCommunityIcons name="crystal-ball" size={28} color="#ECEEF3" />
            <Text style={styles.predireTxt}>Prédire ma note au bac</Text>
          </TouchableOpacity>
        )}

        {loading && <ActivityIndicator size="large" color={colors.primary} />}

        {prediction && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <LinearGradient colors={['#7BA89A', '#5A8A7A']} style={styles.noteCircle}>
              <Text style={styles.noteValue}>{prediction.noteEstimee}</Text>
              <Text style={styles.noteSur}>/20</Text>
            </LinearGradient>
            <Text style={[styles.mention, { color: mentionColor(prediction.mention) }]}>Mention {prediction.mention}</Text>
            <Text style={[styles.confiance, { color: colors.textSecondary }]}>Confiance : {prediction.confiance}%</Text>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>💪 Points forts</Text>
              {prediction.matieresForce.map((m, i) => (
                <Text key={i} style={[styles.badge, { backgroundColor: '#4CAF5020', color: '#4CAF50' }]}>{m}</Text>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>⚠️ Matières à risque</Text>
              {prediction.matieresRisque.map((m, i) => (
                <Text key={i} style={[styles.badge, { backgroundColor: '#f4433620', color: '#f44336' }]}>{m}</Text>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>🎯 Conseils personnalisés</Text>
              {prediction.conseils.map((c, i) => (
                <View key={i} style={styles.conseilItem}>
                  <MaterialCommunityIcons name="lightbulb" size={16} color={colors.primary} />
                  <Text style={[styles.conseilText, { color: colors.textSecondary }]}>{c}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={[styles.refreshBtn, { borderColor: colors.border }]} onPress={handlePredire}>
              <MaterialCommunityIcons name="refresh" size={20} color={colors.primary} />
              <Text style={[styles.refreshTxt, { color: colors.primary }]}>Actualiser</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,215,0,0.1)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: 'white' },
  content: { padding: 20, alignItems: 'center', gap: 20 },
  predireBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 16, paddingHorizontal: 24, borderRadius: 40, elevation: 4 },
  predireTxt: { fontSize: 18, fontWeight: 'bold', color: '#ECEEF3' },
  card: { width: '100%', borderRadius: 28, padding: 20, alignItems: 'center', gap: 16 },
  noteCircle: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center' },
  noteValue: { fontSize: 48, fontWeight: 'bold', color: '#ECEEF3' },
  noteSur: { fontSize: 18, color: '#ECEEF3' },
  mention: { fontSize: 22, fontWeight: 'bold' },
  confiance: { fontSize: 14 },
  section: { width: '100%', gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, fontSize: 13, fontWeight: '600', alignSelf: 'flex-start', marginRight: 8, marginBottom: 6 },
  conseilItem: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: 8 },
  conseilText: { flex: 1, fontSize: 14, lineHeight: 20 },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 30, borderWidth: 1, marginTop: 8 },
  refreshTxt: { fontSize: 14, fontWeight: '600' },
});
