import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

export default function PlanningBacScreen({ navigation }: any) {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={['#ECEEF3','#ECEEF3']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.titre}>📅 PlanningBac</Text>
      </LinearGradient>
      <View style={styles.center}>
        <Text style={{ fontSize: 48 }}>📅</Text>
        <Text style={[styles.txt, { color: colors.text }]}>PlanningBac</Text>
        <Text style={[styles.sub, { color: colors.textSecondary }]}>
          Génère ton planning de révision personnalisé avec l'IA
        </Text>
        <Text style={[styles.wip, { color: colors.textMuted }]}>
          Module en cours d'installation...{'\n'}
          Lance : npx expo start --clear
        </Text>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  titre: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 16 },
  txt: { fontSize: 24, fontWeight: 'bold' },
  sub: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  wip: { fontSize: 13, textAlign: 'center', marginTop: 16 },
});
