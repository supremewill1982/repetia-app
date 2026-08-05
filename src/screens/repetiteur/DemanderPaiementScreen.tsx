import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, TextInput
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/firebaseConfig';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const DemanderPaiementScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const { userId, userData } = useAuth();
  const [solde, setSolde] = useState(0);
  const [historique, setHistorique] = useState<any[]>([]);
  const [montant, setMontant] = useState('');
  const [methode, setMethode] = useState('mobile_money');
  const [numero, setNumero] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const METHODES = [
    { label: 'Mobile Money', value: 'mobile_money' },
    { label: 'Orange Money', value: 'orange_money' },
    { label: 'MTN Mobile Money', value: 'mtn_money' },
    { label: 'Compte bancaire', value: 'compte_bancaire' },
  ];

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (!userId) return;

      // Charger le solde
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        setSolde(userDoc.data()?.solde || 0);
      }

      // Charger l'historique des paiements
      const q = query(
        collection(db, 'demandes_paiement'),
        where('repetiteur_id', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHistorique(data.sort((a, b) => b.date - a.date));
    } catch (error) {
      console.error('Erreur chargement données:', error);
      Alert.alert('Erreur', 'Impossible de charger vos données de paiement');
    } finally {
      setLoading(false);
    }
  };

  const handleDemanderPaiement = async () => {
    if (!montant.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un montant');
      return;
    }

    const montantNum = parseInt(montant);
    if (isNaN(montantNum) || montantNum <= 0) {
      Alert.alert('Erreur', 'Le montant doit être un nombre positif');
      return;
    }

    if (montantNum > solde) {
      Alert.alert('Erreur', `Le montant ne peut pas dépasser votre solde (${solde.toLocaleString()} FCFA)`);
      return;
    }

    if (!numero.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre numéro de téléphone ou compte');
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'demandes_paiement'), {
        repetiteur_id: userId,
        repetiteur_nom: `${userData?.prenom || ''} ${userData?.nom || ''}`,
        montant: montantNum,
        methode: methode,
        numero: numero.trim(),
        statut: 'en_attente',
        date: serverTimestamp(),
      });

      Alert.alert(
        'Succès',
        `Votre demande de paiement de ${montantNum.toLocaleString()} FCFA a été soumise avec succès.`,
        [{ text: 'OK', onPress: () => {
          setMontant('');
          setNumero('');
          fetchData();
        }}]
      );
    } catch (error) {
      console.error('Erreur demande paiement:', error);
      Alert.alert('Erreur', 'Impossible de soumettre votre demande de paiement');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Demander un paiement</Text>
        <View />
      </View>

      {/* Solde actuel */}
      <View style={[styles.soldeContainer, { backgroundColor: colors.surface }]}>
        <Text style={[styles.soldeTitle, { color: colors.text }]}>Votre solde disponible</Text>
        <View style={styles.soldeAmountContainer}>
          <MaterialCommunityIcons name="currency-usd" size={24} color={colors.success} />
          <Text style={[styles.soldeAmount, { color: colors.text }]}>
            {solde.toLocaleString()} FCFA
          </Text>
        </View>
        <Text style={[styles.soldeHint, { color: colors.textMuted }]}>
          Minimum de retrait: 5000 FCFA
        </Text>
      </View>

      {/* Formulaire de demande */}
      <View style={[styles.formContainer, { backgroundColor: colors.surface }]}>
        <Text style={[styles.formTitle, { color: colors.text }]}>Demander un retrait</Text>

        <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>Montant *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
          placeholder="Ex: 50000"
          placeholderTextColor={colors.textMuted}
          selectedValue={montant}
          onChangeText={setMontant}
          keyboardType="numeric"
        />

        <Text style={[styles.label, { color: colors.text }]}>Méthode de paiement *</Text>
        <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Picker
            selectedValue={methode}
            onValueChange={(itemValue) => setMethode(itemValue)}
            style={{ color: colors.text }}
          >
            {METHODES.map((m) => (
              <Picker.Item key={m.value} label={m.label} selectedValue={m.value} />
            ))}
          </Picker>
        </View>

        <Text style={[styles.label, { color: colors.text }]}>Numéro de téléphone / Compte *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
          placeholder={methode === 'compte_bancaire' ? 'Numéro de compte' : '+241 012345678'}
          placeholderTextColor={colors.textMuted}
          selectedValue={numero}
          onChangeText={setNumero}
          keyboardType={methode === 'compte_bancaire' ? 'default' : 'phone-pad'}
        />

        <TouchableOpacity
          style={[styles.submitButton, {
            backgroundColor: colors.primary,
            opacity: submitting || !montant.trim() || !numero.trim() ? 0.5 : 1
          }]}
          onPress={handleDemanderPaiement}
          disabled={submitting || !montant.trim() || !numero.trim()}
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>Demander le paiement</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Historique des demandes */}
      {historique.length > 0 && (
        <View style={[styles.historiqueContainer, { backgroundColor: colors.surface }]}>
          <Text style={[styles.historiqueTitle, { color: colors.text }]}>Historique des demandes</Text>
          {historique.map((demande) => (
            <View key={demande.id} style={[styles.demandeCard, {
              backgroundColor: colors.background,
              borderColor: colors.border
            }]}>
              <View style={styles.demandeHeader}>
                <Text style={[styles.demandeMontant, { color: colors.text }]}>
                  {demande.montant.toLocaleString()} FCFA
                </Text>
                <View style={[styles.statutBadge, {
                  backgroundColor: demande.statut === 'en_attente' ? colors.warning + '20' :
                                   demande.statut === 'payé' ? colors.success + '20' :
                                   colors.error + '20'
                }]}>
                  <Text style={[styles.statutText, {
                    color: demande.statut === 'en_attente' ? colors.warning :
                           demande.statut === 'payé' ? colors.success :
                           colors.error
                  }]}>
                    {demande.statut.replace('_', ' ')}
                  </Text>
                </View>
              </View>
              <Text style={[styles.demandeDetails, { color: colors.textMuted }]}>
                {demande.methode.replace('_', ' ')} - {demande.numero}
              </Text>
              <Text style={[styles.demandeDate, { color: colors.textMuted }]}>
                Demandé le: {demande.date?.toDate().toLocaleDateString('fr-FR')}
              </Text>
              {demande.date_traitement && (
                <Text style={[styles.demandeDate, { color: colors.textMuted }]}>
                  Traité le: {demande.date_traitement?.toDate().toLocaleDateString('fr-FR')}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  soldeContainer: {
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  soldeTitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  soldeAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  soldeAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  soldeHint: {
    fontSize: 12,
    marginTop: 8,
    color: '#888',
  },
  formContainer: {
    padding: 16,
    borderBottomWidth: 1,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
    marginBottom: 16,
  },
  pickerContainer: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  submitButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  historiqueContainer: {
    padding: 16,
  },
  historiqueTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  demandeCard: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  demandeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  demandeMontant: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statutBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statutText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  demandeDetails: {
    fontSize: 14,
    marginTop: 8,
  },
  demandeDate: {
    fontSize: 12,
    marginTop: 4,
    color: '#888',
  },
});

export default DemanderPaiementScreen;
