import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

const ROLES = [
  { label: 'Élève', value: 'eleve' },
  { label: 'Parent', value: 'parent' },
  { label: 'Répétiteur', value: 'repetiteur' },
  { label: 'Établissement', value: 'etablissement' },
];

const RegisterScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const { register } = useAuth();
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('eleve');
  const [telephone, setTelephone] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async () => {
    if (!nom.trim() || !prenom.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);
    try {
      await register({
        nom: nom.trim(),
        prenom: prenom.trim(),
        email: email.trim(),
        password,
        role,
        telephone: telephone.trim() || undefined,
      });
      Alert.alert('Succès', 'Votre compte a été créé avec succès !');
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de créer votre compte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={[styles.innerContainer, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Créer un compte</Text>
            <View />
          </View>

          {/* Formulaire */}
          <View style={styles.formContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Nom *</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="account" size={20} color={colors.textMuted} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Votre nom de famille"
                placeholderTextColor={colors.textMuted}
                selectedValue={nom}
                onChangeText={setNom}
              />
            </View>

            <Text style={[styles.label, { color: colors.text, marginTop: 12 }]}>Prénom *</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="account" size={20} color={colors.textMuted} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Votre prénom"
                placeholderTextColor={colors.textMuted}
                selectedValue={prenom}
                onChangeText={setPrenom}
              />
            </View>

            <Text style={[styles.label, { color: colors.text, marginTop: 12 }]}>Email *</Text>
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

            <Text style={[styles.label, { color: colors.text, marginTop: 12 }]}>Mot de passe *</Text>
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

            <Text style={[styles.label, { color: colors.text, marginTop: 12 }]}>Confirmer le mot de passe *</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="lock-check" size={20} color={colors.textMuted} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Confirmez votre mot de passe"
                placeholderTextColor={colors.textMuted}
                selectedValue={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={true}
                autoCapitalize="none"
              />
            </View>

            <Text style={[styles.label, { color: colors.text, marginTop: 12 }]}>Téléphone</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="phone" size={20} color={colors.textMuted} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="+241 012345678"
                placeholderTextColor={colors.textMuted}
                selectedValue={telephone}
                onChangeText={setTelephone}
                keyboardType="phone-pad"
              />
            </View>

            <Text style={[styles.label, { color: colors.text, marginTop: 12 }]}>Rôle *</Text>
            <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Picker
                selectedValue={role}
                onValueChange={(itemValue) => setRole(itemValue)}
                style={{ color: colors.text }}
              >
                {ROLES.map((r) => (
                  <Picker.Item key={r.value} label={r.label} selectedValue={r.value} />
                ))}
              </Picker>
            </View>

            {/* Bouton d'inscription */}
            <TouchableOpacity
              style={[styles.registerButton, { backgroundColor: colors.primary, opacity: loading ? 0.5 : 1 }]}
              onPress={handleRegister}
              disabled={loading || !nom.trim() || !prenom.trim() || !email.trim() || !password.trim()}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.registerButtonText}>Créer mon compte</Text>
              )}
            </TouchableOpacity>

            {/* Lien vers la connexion */}
            <View style={styles.loginContainer}>
              <Text style={[styles.loginText, { color: colors.textMuted }]}>
                Vous avez déjà un compte ?
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={[styles.loginLink, { color: colors.primary }]}> Se connecter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  innerContainer: {
    flex: 1,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
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
  pickerContainer: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  registerButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  registerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    fontSize: 14,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default RegisterScreen;
