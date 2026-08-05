import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { lierCompteEnfant } from '../../services/parentService';

export default function ParentLier({ navigation }: any) {
  const { colors } = useTheme();
  const [code, setCode]       = useState('');
  const [loading, setLoading] = useState(false);

  const handleLier = async () => {
    if (code.length !== 6) {
      Alert.alert('Code invalide', 'Le code doit contenir exactement 6 chiffres.');
      return;
    }
    setLoading(true);
    try {
      const enfant = await lierCompteEnfant(code.trim());
      Alert.alert(
        '✅ Compte lié !',
        `${enfant.prenom} (${enfant.classe} Série ${enfant.serie}) est maintenant lié à votre compte.`,
        [{ text: 'Super !', onPress: () => navigation.goBack() }]
      );
    } catch (e: any) {
      Alert.alert('Erreur', e.message || 'Code invalide ou expiré.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={['#7BA89A', '#5A8A7A']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitre}>Lier un compte enfant</Text>
      </LinearGradient>

      <View style={styles.content}>
        <Text style={{ fontSize: 64, textAlign: 'center' }}>🔗</Text>
        <Text style={[styles.titre, { color: colors.text }]}>
          Code de liaison
        </Text>
        <Text style={[styles.desc, { color: colors.textSecondary }]}>
          Demandez à votre enfant d'ouvrir RÉPÉTIA et d'aller dans{'\n'}
          Profil → Générer un code parent{'\n\n'}
          Le code est valable 10 minutes.
        </Text>

        {/* Input code */}
        <TextInput
          style={[styles.codeInput, {
            backgroundColor: colors.surface,
            borderColor:     code.length === 6 ? colors.primary : colors.border,
            color:           colors.text,
          }]}
          placeholder="000000"
          placeholderTextColor={colors.textMuted}
          selectedValue={code}
          onChangeText={t => setCode(t.replace(/[^0-9]/g, '').slice(0, 6))}
          keyboardType="numeric"
          maxLength={6}
          textAlign="center"
        />

        <TouchableOpacity
          style={[styles.lierBtn, {
            backgroundColor: code.length === 6 ? colors.primary : colors.border,
          }]}
          onPress={handleLier}
          disabled={loading || code.length !== 6}
        >
          {loading
            ? <ActivityIndicator size="small" color="white" />
            : <>
                <MaterialCommunityIcons name="link-plus" size={22} color="white" />
                <Text style={styles.lierBtnTxt}>Lier ce compte</Text>
              </>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 52, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 14 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerTitre: { fontSize: 18, fontWeight: '700', color: 'white' },
  content: { flex: 1, padding: 32, alignItems: 'center', gap: 20 },
  titre: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
  desc:  { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  codeInput: { fontSize: 40, fontWeight: '800', letterSpacing: 16, borderWidth: 2, borderRadius: 20, paddingVertical: 20, paddingHorizontal: 32, width: '100%' },
  lierBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 16, width: '100%', justifyContent: 'center' },
  lierBtnTxt: { color: 'white', fontSize: 16, fontWeight: '700' },
});
