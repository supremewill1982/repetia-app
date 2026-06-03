import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { inscrireParent, connecterParent } from '../../services/parentService';

export default function ParentAuthScreen() {
  const { colors } = useTheme();
  const [mode, setMode]           = useState<'login'|'register'>('login');
  const [prenom, setPrenom]       = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [loading, setLoading]     = useState(false);
  const [showPass, setShowPass]   = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Champs manquants', 'Email et mot de passe requis.');
      return;
    }
    if (mode === 'register' && !prenom.trim()) {
      Alert.alert('Prénom requis', 'Entre ton prénom pour créer un compte.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'register') await inscrireParent(email.trim(), password, prenom.trim());
      else                     await connecterParent(email.trim(), password);
    } catch (e: any) {
      const msg = e.code === 'auth/wrong-password'       ? 'Mot de passe incorrect.'
        : e.code === 'auth/user-not-found'               ? 'Compte introuvable.'
        : e.code === 'auth/email-already-in-use'         ? 'Cet email est déjà utilisé.'
        : e.code === 'auth/weak-password'                ? 'Mot de passe trop court (6 caractères min).'
        : e.message || 'Erreur inconnue.';
      Alert.alert('Erreur', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <LinearGradient colors={['#7BA89A', '#5A8A7A']} style={styles.header}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>👨‍👩‍👧‍👦</Text>
          </View>
          <Text style={styles.title}>RÉPÉTIA Parents</Text>
          <Text style={styles.subtitle}>Suivez la progression de votre enfant</Text>
        </LinearGradient>

        {/* Toggle */}
        <View style={[styles.toggle, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {(['login','register'] as const).map(m => (
            <TouchableOpacity
              key={m}
              style={[styles.toggleBtn, mode === m && { backgroundColor: colors.primary }]}
              onPress={() => setMode(m)}
            >
              <Text style={[styles.toggleTxt, { color: mode === m ? 'white' : colors.textMuted }]}>
                {m === 'login' ? 'Se connecter' : 'Créer un compte'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Formulaire */}
        <View style={[styles.form, { backgroundColor: colors.surface }]}>
          {mode === 'register' && (
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="account" size={20} color={colors.textMuted} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Votre prénom"
                placeholderTextColor={colors.textMuted}
                value={prenom}
                onChangeText={setPrenom}
              />
            </View>
          )}

          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons name="email" size={20} color={colors.textMuted} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Email"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons name="lock" size={20} color={colors.textMuted} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Mot de passe"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)}>
              <MaterialCommunityIcons
                name={showPass ? 'eye-off' : 'eye'}
                size={20} color={colors.textMuted}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: colors.primary }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator size="small" color="white" />
              : <Text style={styles.submitTxt}>
                  {mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
                </Text>
            }
          </TouchableOpacity>
        </View>

        <Text style={[styles.note, { color: colors.textMuted }]}>
          💡 Après connexion, liez le compte de votre enfant via un code de 6 chiffres
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1 },
  header: { paddingTop: 60, paddingBottom: 40, alignItems: 'center', gap: 12 },
  logoCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center' },
  logoEmoji: { fontSize: 40 },
  title:    { fontSize: 26, fontWeight: '800', color: 'white' },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  toggle:   { flexDirection: 'row', margin: 20, borderRadius: 16, borderWidth: 1, overflow: 'hidden', padding: 4 },
  toggleBtn:  { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
  toggleTxt:  { fontSize: 14, fontWeight: '600' },
  form: { marginHorizontal: 20, borderRadius: 24, padding: 20, gap: 14, elevation: 2 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#DDE1E8', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  input:     { flex: 1, fontSize: 15 },
  submitBtn: { padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 8 },
  submitTxt: { color: 'white', fontSize: 16, fontWeight: '700' },
  note:      { fontSize: 12, textAlign: 'center', margin: 20, lineHeight: 18 },
});
