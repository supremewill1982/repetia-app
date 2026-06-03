import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth }  from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../../services/firebaseConfig';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const db = getFirestore();

export default function ConnexionEnfantScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { setUserRole } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Champs requis', 'Email et mot de passe obligatoires.');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const userId = userCredential.user.uid;

      // Vérifier que c'est bien un compte élève
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.data();

      if (userData?.role !== 'eleve') {
        await auth.signOut();
        Alert.alert('Accès refusé', 'Cet espace est réservé aux élèves. Utilise l\'application parent si besoin.');
        return;
      }

      // Connexion réussie
      navigation.replace('EleveNavigator');
    } catch (error: any) {
      let message = 'Erreur de connexion. Vérifie vos identifiants.';
      if (error.code === 'auth/user-not-found') message = 'Aucun compte trouvé avec cet email.';
      else if (error.code === 'auth/wrong-password') message = 'Mot de passe incorrect.';
      else if (error.code === 'auth/invalid-email') message = 'Email invalide.';
      Alert.alert('Erreur', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient colors={['#7BA89A', '#5A8A7A']} style={styles.header}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>📚</Text>
          </View>
          <Text style={styles.title}>RÉPÉTIA Élève</Text>
          <Text style={styles.subtitle}>Connecte-toi pour réviser</Text>
        </LinearGradient>

        {/* Formulaire */}
        <View style={[styles.form, { backgroundColor: colors.surface }]}>
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
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <MaterialCommunityIcons
                name={showPassword ? 'eye-off' : 'eye'}
                size={20}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.loginBtn, { backgroundColor: colors.primary }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.loginBtnTxt}>Se connecter</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('InscriptionEnfant')}>
            <Text style={[styles.registerLink, { color: colors.primary }]}>
              Pas encore de compte ? Crée ton espace élève
            </Text>
          </TouchableOpacity>
        </View>

        {/* Section parent */}
        <View style={[styles.parentCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.parentTitle, { color: colors.text }]}>👨‍👩‍👧 Tu es un parent ?</Text>
          <Text style={[styles.parentSub, { color: colors.textMuted }]}>
            Suis la progression de ton enfant, reçois des alertes et génère des rapports IA.
          </Text>
          <TouchableOpacity
            style={[styles.parentBtn, { backgroundColor: colors.primary }]}
            onPress={() => setUserRole('parent')}
          >
            <MaterialCommunityIcons name="account-heart" size={22} color="white" />
            <Text style={styles.parentBtnTxt}>Accéder à l'espace parent</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
    gap: 12,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoEmoji: { fontSize: 40 },
  title: { fontSize: 28, fontWeight: '800', color: 'white' },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  form: {
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 24,
    padding: 20,
    gap: 16,
    elevation: 2,
    shadowColor: '#2B3A4A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#DDE1E8',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  input: { flex: 1, fontSize: 15 },
  loginBtn: {
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  loginBtnTxt: { color: 'white', fontSize: 16, fontWeight: '700' },
  registerLink: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
  },
  parentCard: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 24,
    gap: 12,
    elevation: 2,
    shadowColor: '#2B3A4A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  parentTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  parentSub: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  parentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 16,
    marginTop: 8,
  },
  parentBtnTxt: { color: 'white', fontSize: 15, fontWeight: '700' },
});
