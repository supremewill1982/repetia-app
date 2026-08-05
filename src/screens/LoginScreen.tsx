import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const LoginScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Identifiants incorrects');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={[styles.innerContainer, { backgroundColor: colors.surface }]}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <MaterialCommunityIcons name="school" size={60} color={colors.primary} />
          <Text style={[styles.logoText, { color: colors.text }]}>RÉPÉTIA</Text>
          <Text style={[styles.logoSubtitle, { color: colors.textMuted }]}>
            Plateforme d'apprentissage
          </Text>
        </View>

        {/* Formulaire */}
        <View style={styles.formContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Email</Text>
          <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="email" size={20} color={colors.textMuted} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="votre@email.com"
              placeholderTextColor={colors.textMuted}
              selectedValue={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>Mot de passe</Text>
          <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="lock" size={20} color={colors.textMuted} />
            <TextInput
              style={[styles.input, { color: colors.text, flex: 1 }]}
              placeholder="Votre mot de passe"
              placeholderTextColor={colors.textMuted}
              selectedValue={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
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
            style={[styles.forgotButton, { backgroundColor: colors.surface }]}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={[styles.forgotText, { color: colors.primary }]}>Mot de passe oublié ?</Text>
          </TouchableOpacity>

          {/* Bouton de connexion */}
          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: colors.primary, opacity: loading ? 0.5 : 1 }]}
            onPress={handleLogin}
            disabled={loading || !email.trim() || !password.trim()}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.loginButtonText}>Se connecter</Text>
            )}
          </TouchableOpacity>

          {/* Lien vers l'inscription */}
          <View style={styles.signupContainer}>
            <Text style={[styles.signupText, { color: colors.textMuted }]}>
              Vous n'avez pas de compte ?
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={[styles.signupLink, { color: colors.primary }]}> S'inscrire</Text>
            </TouchableOpacity>
          </View>

          {/* Bouton de sélection de rôle */}
          <TouchableOpacity
            style={[styles.roleButton, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={() => navigation.navigate('RoleSelection')}
          >
            <MaterialCommunityIcons name="account-switch" size={20} color={colors.primary} />
            <Text style={[styles.roleButtonText, { color: colors.primary }]}>
              Choisir un autre rôle
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 8,
  },
  logoSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  formContainer: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  forgotText: {
    fontSize: 12,
    fontWeight: '500',
  },
  loginButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  signupText: {
    fontSize: 14,
  },
  signupLink: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  roleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 24,
  },
  roleButtonText: {
    marginLeft: 8,
    fontWeight: '500',
  },
});

export default LoginScreen;
