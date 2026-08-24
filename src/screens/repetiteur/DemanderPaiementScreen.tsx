import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, TextInput, KeyboardAvoidingView, Platform
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/firebaseConfig';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const METHODES = [
  { label: 'Moov Money', value: 'moov_money', icon: 'cellphone' },
  { label: 'Airtel Money', value: 'airtel_money', icon: 'cellphone' },
];

export default function DemanderPaiementScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { userId, userData } = useAuth();
  const [solde, setSolde] = useState(0);
  const [historique, setHistorique] = useState<any[]>([]);
  const [montant, setMontant] = useState('');
  const [methode, setMethode] = useState('airtel_money');
  const [numero, setNumero] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchData(); }, [userId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (!userId) return;
      const tuteurSnap = await getDoc(doc(db, 'tuteurs', userId));
      const userSnap = await getDoc(doc(db, 'users', userId));
      const tuteurData = tuteurSnap.exists() ? tuteurSnap.data() : {};
      const user = userSnap.exists() ? userSnap.data() : {};
      setSolde(Number(tuteurData.solde ?? user.solde ?? 0));
      const q = query(collection(db, 'demandes_paiement'), where('repetiteur_id', '==', userId));
      const snap = await getDocs(q);
      setHistorique(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error('Erreur chargement données paiement:', error);
      setHistorique([]);
      Alert.alert('Paiement', 'Impossible de charger vos données de paiement pour le moment.');
    } finally { setLoading(false); }
  };

  const handleDemanderPaiement = async () => {
    const montantNum = Number.parseInt(montant, 10);
    if (!Number.isFinite(montantNum) || montantNum <= 0) return Alert.alert('Erreur', 'Entrez un montant valide.');
    if (montantNum > solde) return Alert.alert('Erreur', `Le montant dépasse votre solde (${solde.toLocaleString()} FCFA).`);
    if (!numero.trim()) return Alert.alert('Erreur', 'Entrez le numéro Mobile Money.');
    if (historique.some(item => item.statut === 'en_attente')) return Alert.alert('Demande en cours', 'Vous avez déjà une demande de paiement en attente.');

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'demandes_paiement'), {
        repetiteur_id: userId,
        repetiteur_nom: `${userData?.prenom || ''} ${userData?.nom || ''}`.trim(),
        montant: montantNum,
        methode,
        numero: numero.trim(),
        statut: 'en_attente',
        date: serverTimestamp(),
      });
      setMontant(''); setNumero('');
      Alert.alert('Demande envoyée', `Votre demande de ${montantNum.toLocaleString()} FCFA a été enregistrée.`);
      fetchData();
    } catch (error) {
      console.error('Erreur demande paiement:', error);
      Alert.alert('Erreur', 'Impossible de soumettre votre demande de paiement.');
    } finally { setSubmitting(false); }
  };

  if (loading) return <View style={[styles.center, { backgroundColor: colors.background }]}><ActivityIndicator size="large" color={colors.primary} /></View>;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 24}>
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}><MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} /></TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Paiement</Text><View style={{ width: 40 }} />
        </View>

        <View style={[styles.balance, { backgroundColor: colors.surface }]}>
          <Text style={[styles.balanceLabel, { color: colors.textMuted }]}>Solde disponible</Text>
          <Text style={[styles.balanceValue, { color: colors.text }]}>{solde.toLocaleString()} FCFA</Text>
          <Text style={[styles.hint, { color: colors.textMuted }]}>Minimum de retrait : 5 000 FCFA</Text>
        </View>

        <View style={[styles.form, { backgroundColor: colors.surface }]}>
          <Text style={[styles.title, { color: colors.text }]}>Retirer mes revenus</Text>
          <Text style={[styles.label, { color: colors.text }]}>Montant</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]} value={montant} onChangeText={setMontant} placeholder="Ex. 50 000" placeholderTextColor={colors.textMuted} keyboardType="number-pad" returnKeyType="next" />

          <Text style={[styles.label, { color: colors.text }]}>Méthode</Text>
          <View style={styles.methods}>
            {METHODES.map(item => {
              const active = methode === item.value;
              return <TouchableOpacity key={item.value} onPress={() => setMethode(item.value)} style={[styles.method, { backgroundColor: active ? colors.primary + '12' : colors.background, borderColor: active ? colors.primary : colors.border }]}>
                <MaterialCommunityIcons name={item.icon as any} size={22} color={active ? colors.primary : colors.textMuted} />
                <Text style={[styles.methodText, { color: active ? colors.primary : colors.text }]}>{item.label}</Text>
                {active && <MaterialCommunityIcons name="check-circle" size={18} color={colors.primary} />}
              </TouchableOpacity>;
            })}
          </View>

          <Text style={[styles.label, { color: colors.text }]}>Numéro de téléphone</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]} value={numero} onChangeText={setNumero} placeholder="Ex. 07 XX XX XX XX" placeholderTextColor={colors.textMuted} keyboardType="phone-pad" returnKeyType="done" />

          <TouchableOpacity style={[styles.submit, { backgroundColor: colors.primary, opacity: submitting || !montant || !numero ? 0.55 : 1 }]} onPress={handleDemanderPaiement} disabled={submitting || !montant || !numero}>
            {submitting ? <ActivityIndicator color="white" /> : <Text style={styles.submitText}>Demander le paiement</Text>}
          </TouchableOpacity>
        </View>

        {historique.length > 0 && <View style={[styles.history, { backgroundColor: colors.surface }]}>
          <Text style={[styles.title, { color: colors.text }]}>Historique</Text>
          {historique.map(item => <View key={item.id} style={[styles.historyCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.historyRow}><Text style={[styles.amount, { color: colors.text }]}>{Number(item.montant || 0).toLocaleString()} FCFA</Text><Text style={[styles.status, { color: item.statut === 'en_attente' ? colors.warning : colors.success }]}>{String(item.statut || '').replace('_', ' ')}</Text></View>
            <Text style={[styles.detail, { color: colors.textMuted }]}>{item.methode === 'moov_money' ? 'Moov Money' : 'Airtel Money'} · {item.numero || ''}</Text>
          </View>)}
        </View>}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' }, headerTitle: { fontSize: 18, fontWeight: '700' },
  balance: { margin: 16, padding: 20, borderRadius: 18, alignItems: 'center' }, balanceLabel: { fontSize: 13 }, balanceValue: { fontSize: 30, fontWeight: '800', marginTop: 4 }, hint: { fontSize: 12, marginTop: 6 },
  form: { marginHorizontal: 16, padding: 18, borderRadius: 18 }, title: { fontSize: 18, fontWeight: '800', marginBottom: 14 }, label: { fontSize: 13, fontWeight: '600', marginBottom: 7, marginTop: 12 },
  input: { minHeight: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, fontSize: 15 }, methods: { gap: 8 }, method: { minHeight: 52, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }, methodText: { flex: 1, fontSize: 14, fontWeight: '600' },
  submit: { minHeight: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 20 }, submitText: { color: 'white', fontSize: 15, fontWeight: '800' },
  history: { margin: 16, padding: 18, borderRadius: 18 }, historyCard: { padding: 14, borderWidth: 1, borderRadius: 12, marginBottom: 8 }, historyRow: { flexDirection: 'row', justifyContent: 'space-between' }, amount: { fontWeight: '800' }, status: { fontWeight: '700' }, detail: { fontSize: 12, marginTop: 6 },
});
