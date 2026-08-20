import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { StackNavigationProp } from '@react-navigation/stack';

type Props = {
  navigation: StackNavigationProp<any>;
};

export default function RecommendationsIA({ navigation }: Props) {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState("Analyse tes résultats avec l'IA");

  useEffect(() => {
    setTimeout(() => {
      setPreview("Découvre tes points forts et faibles");
      setLoading(false);
    }, 1000);
  }, []);

  const handlePress = () => {
    if (navigation) {
      navigation.navigate('RecommandationsIA');
    }
  };

  return (
    <TouchableOpacity style={[styles.container, { backgroundColor: colors.surface }]} onPress={handlePress} activeOpacity={0.8}>
      <LinearGradient colors={[colors.primary + '20', colors.secondary + '20']} style={styles.gradient}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="robot" size={24} color={colors.primary} />
          <Text style={[styles.titre, { color: colors.text }]}>💡 Recommandations IA</Text>
        </View>
        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <>
            <Text style={[styles.preview, { color: colors.textSecondary }]}>{preview}</Text>
            <Text style={[styles.conseil, { color: colors.textMuted }]}>Appuie pour des conseils personnalisés</Text>
          </>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: 20, marginHorizontal: 20, marginVertical: 10, overflow: 'hidden' },
  gradient: { padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  titre: { fontSize: 16, fontWeight: 'bold' },
  preview: { fontSize: 13, marginBottom: 8, fontStyle: 'italic' },
  conseil: { fontSize: 11, textAlign: 'center', marginTop: 4 },
});
