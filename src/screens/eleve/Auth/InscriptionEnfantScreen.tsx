import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, Alert, ActivityIndicator, Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../../services/firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { styles } from './styles';

const CLASSES = [
  'CM1', 'CM2', '6ème', '5ème', '4ème', '3ème', 'Seconde', 'Première', 'Terminale'
];

export default function InscriptionEnfantScreen({ navigation, onLogin }) {
  const { colors } = useTheme();
  const [prenom, setPrenom] = useState('');
  const [classe, setClasse] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [errors, setErrors] = useState({ prenom: '', classe: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    let isValid = true;
    const newErrors = { prenom: '', classe: '', email: '', password: '', confirmPassword: '' };
    if (!prenom) { newErrors.prenom = 'Le prénom est requis'; isValid = false; }
    if (!classe) { newErrors.classe = 'La classe est requise'; isValid = false; }
    if (!email) { newErrors.email = "L'email est requis"; isValid = false; }
    else if (!/\S+@\S+\.\S+/.test(email)) { newErrors.email = 'Email invalide'; isValid = false; }
    if (!password) { newErrors.password = 'Le mot de passe est requis'; isValid = false; }
    else if (password.length < 6) { newErrors.password = '6 caractères minimum'; isValid = false; }
    if (password !== confirmPassword) { newErrors.confirmPassword = 'Les mots de passe ne correspondent pas'; isValid = false; }
    setErrors(newErrors);
    return isValid;
  };

  const handleInscription = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await setDoc(doc(db, 'enfants', user.uid), {
        prenom, classe, email, dateCreation: new Date().toISOString(),
        age: CLASSES.indexOf(classe) + 8, codeLiaison: null, parentsLies: []
      });
      if (onLogin) onLogin();
      else navigation.replace('Main');
    } catch (error: any) {
      let errorMessage = 'Erreur lors de l\'inscription';
      if (error.code === 'auth/email-already-in-use') errorMessage = 'Cet email est déjà utilisé';
      else if (error.code === 'auth/weak-password') errorMessage = 'Mot de passe trop faible (6 caractères minimum)';
      else if (error.code === 'auth/network-request-failed') errorMessage = 'Problème de connexion réseau';
      Alert.alert('Erreur', errorMessage);
    } finally { setLoading(false); }
  };

  const selectClass = (selectedClass) => {
    setClasse(selectedClass);
    setShowClassPicker(false);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text, marginTop: 20 }]}>✏️ Créer mon compte</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Rejoins l'aventure Mon Répétiteur</Text>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Prénom</Text>
            <TextInput style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: errors.prenom ? colors.error : colors.border }]} placeholder="Thomas" placeholderTextColor={colors.textMuted} value={prenom} onChangeText={setPrenom} />
            {errors.prenom && <Text style={[styles.errorText, { color: colors.error }]}>{errors.prenom}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Classe</Text>
            <TouchableOpacity style={[styles.input, { backgroundColor: colors.surface, borderColor: errors.classe ? colors.error : colors.border, justifyContent: 'center' }]} onPress={() => setShowClassPicker(true)}>
              <Text style={{ color: classe ? colors.text : colors.textMuted }}>{classe || 'Sélectionner votre classe'}</Text>
            </TouchableOpacity>
            {errors.classe && <Text style={[styles.errorText, { color: colors.error }]}>{errors.classe}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Email</Text>
            <TextInput style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: errors.email ? colors.error : colors.border }]} placeholder="thomas@email.com" placeholderTextColor={colors.textMuted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            {errors.email && <Text style={[styles.errorText, { color: colors.error }]}>{errors.email}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Mot de passe</Text>
            <View style={{ position: 'relative' }}>
              <TextInput style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: errors.password ? colors.error : colors.border }]} placeholder="••••••••" placeholderTextColor={colors.textMuted} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
              <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
                <MaterialCommunityIcons name={showPassword ? 'eye-off' : 'eye'} size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={[styles.errorText, { color: colors.error }]}>{errors.password}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Confirmer le mot de passe</Text>
            <TextInput style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: errors.confirmPassword ? colors.error : colors.border }]} placeholder="••••••••" placeholderTextColor={colors.textMuted} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showPassword} />
            {errors.confirmPassword && <Text style={[styles.errorText, { color: colors.error }]}>{errors.confirmPassword}</Text>}
          </View>

          <TouchableOpacity onPress={handleInscription} disabled={loading} style={{ width: '100%', marginTop: 20 }}>
            <LinearGradient colors={[colors.primary, colors.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.button}>
              {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>S'INSCRIRE</Text>}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>Déjà un compte ?</Text>
            <TouchableOpacity onPress={() => navigation.goBack()} disabled={loading}>
              <Text style={[styles.footerLink, { color: colors.primary }]}>Se connecter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Modal visible={showClassPicker} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 }}>
            <Text style={[styles.label, { color: colors.text, marginBottom: 15 }]}>Choisis ta classe</Text>
            {CLASSES.map((c, idx) => (
              <TouchableOpacity key={idx} onPress={() => selectClass(c)} style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <Text style={{ color: colors.text, fontSize: 16 }}>{c}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setShowClassPicker(false)} style={{ marginTop: 15, paddingVertical: 12, backgroundColor: colors.primary, borderRadius: 12, alignItems: 'center' }}>
              <Text style={{ color: 'white', fontWeight: '600' }}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
