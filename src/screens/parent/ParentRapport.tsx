import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ParentRapport({ navigation, route }: any) {
  const { colors } = useTheme();
  return (
    <View style={[s.c, { backgroundColor: colors.background }]}>
      <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}>
        <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
      </TouchableOpacity>
      <Text style={[s.t, { color: colors.text }]}>ParentRapport</Text>
      <Text style={[s.s, { color: colors.textMuted }]}>Chargement en cours...</Text>
    </View>
  );
}
const s = StyleSheet.create({
  c: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  back: { position: 'absolute', top: 52, left: 16 },
  t: { fontSize: 22, fontWeight: '700' },
  s: { fontSize: 14, marginTop: 8 },
});
