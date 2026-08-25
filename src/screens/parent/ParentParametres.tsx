import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export default function ParentParametres({ navigation }: any) {
  const { colors } = useTheme();
  const { userData } = useAuth();
  const parent = userData as any;
  const nom = [parent?.prenom, parent?.nom].filter(Boolean).join(' ') || 'Parent';

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={[styles.hero, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primary + '18' }]}>
          <MaterialCommunityIcons name="account-heart" size={42} color={colors.primary} />
        </View>
        <Text style={[styles.name, { color: colors.text }]}>{nom}</Text>
        <Text style={[styles.email, { color: colors.textMuted }]}>{parent?.email || 'Compte parent'}</Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.section, { color: colors.text }]}>Mon compte</Text>
        <Row icon="account-outline" label="Informations personnelles" value={nom} colors={colors} />
        <Row icon="shield-check-outline" label="Rôle" value="Parent" colors={colors} />
        <Row icon="email-outline" label="Email" value={parent?.email || '—'} colors={colors} />
      </View>

      <TouchableOpacity style={[styles.action, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate('ParentLier')}>
        <MaterialCommunityIcons name="account-plus-outline" size={22} color="white" />
        <Text style={styles.actionText}>Lier un enfant</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.secondary, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => navigation.navigate('ParentRapport')}>
        <MaterialCommunityIcons name="file-chart-outline" size={22} color={colors.primary} />
        <Text style={[styles.secondaryText, { color: colors.text }]}>Voir mes rapports</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Row({ icon, label, value, colors }: any) {
  return <View style={[styles.row, { borderBottomColor: colors.border }]}>
    <MaterialCommunityIcons name={icon} size={21} color={colors.primary} />
    <View style={{ flex: 1 }}><Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text><Text style={[styles.value, { color: colors.text }]} numberOfLines={1}>{value}</Text></View>
  </View>;
}

const styles = StyleSheet.create({
  container: { flex: 1 }, content: { padding: 16, paddingBottom: 32, gap: 12 },
  hero: { borderWidth: 1, borderRadius: 22, padding: 24, alignItems: 'center' },
  avatar: { width: 86, height: 86, borderRadius: 43, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 24, fontWeight: '900', marginTop: 12 }, email: { fontSize: 12, marginTop: 4 },
  card: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 15 }, section: { fontSize: 16, fontWeight: '900', paddingVertical: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, borderTopWidth: 1 }, label: { fontSize: 10 }, value: { fontSize: 13, fontWeight: '700', marginTop: 2 },
  action: { minHeight: 52, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, actionText: { color: 'white', fontWeight: '900', fontSize: 14 },
  secondary: { minHeight: 52, borderRadius: 15, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, secondaryText: { fontWeight: '800', fontSize: 14 },
});
