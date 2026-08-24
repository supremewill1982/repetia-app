import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/firebaseConfig';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const METHODES = [
  { value: 'moov_money', label: 'Moov Money', icon: 'cellphone' as const },
  { value: 'airtel_money', label: 'Airtel Money', icon: 'cellphone-wireless' as const },
];

export default function DemanderPaiementScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { userId, userData } = useAuth();
  const [solde, setSolde] = useState(0);
  const [historique, setHistorique] = useState<any[]>([]);
  const [montant, setMontant] = useState('');
  const [methode, setMethode] = useState('moov_money');
  const [numero, setNumero] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { charger(); }, [userId]);

  const charger = async () => {
    if (!userId) { setLoading(false); return; }
    try {
      setLoading(true);
      const userSnap = await getDoc(doc(db, 'users', userId));
      setSolde(Number(userSnap.data()?.solde || 0));

      const snap = await getDocs(query(
        collection(db, 'demandes_paiement'),
        where('repetiteur_id', '==', userId),
      ));
      setHistorique(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error('Erreur chargement données paiement:', error);
      Alert.alert('Paiement', 'Impossible de charger vos données de paiement. Vérifiez votre connexion puis réessayez.');
    } finally {
      setLoading(false);
    }
  };

  const demander = async () => {
    const montantNum = Number.parseInt(montant.replace(/\D/g, ''), 10);
    if (!Number.isFinite(montantNum) || montantNum <= 0) {
      Alert.alert('Erreur', 'Entrez un montant valide.');
      return;
    }
    if (montantNum < 5000) {
      Alert.alert('Erreur', 'Le retrait minimum est de 5 000 FCFA.');
      return;
    }
    if (montantNum > solde) {
      Alert.alert('Erreur', `Votre solde disponible est de ${solde.toLocaleString('fr-FR')} FCFA.`);
      return;
    }
    if (!/^\+?\d{8,15}$/.test(numero.replace(/[\s-]/g, ''))) {
      Alert.alert('Erreur', 'Entrez un numéro de téléphone valide.');
      return;
    }
    if (historique.some(x => x.statut === 'en_attente')) {
      Alert.alert('Demande en cours', 'Vous avez déjà une demande de paiement en attente.');
      return;
    }

    try {
      setSubmitting(true);
      await addDoc(collection(db, 'demandes_paiement'), {
        repetiteur_id: userId,
        repetiteur_nom: `${userData?.prenom || ''} ${userData?.nom || ''}`.trim(),
        montant: montantNum,
        methode,
        numero: numero.trim(),
        statut: 'en_attente',
        date: serverTimestamp(),
      });
      setMontant('');
      setNumero('');
      await charger();
      Alert.alert('Demande envoyée', 'Votre demande sera traitée manuellement.');
    } catch (error) {
      console.error('Erreur demande paiement:', error);
      Alert.alert('Erreur', 'Impossible de soumettre votre demande de paiement.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <View style={[styles.center, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
            <MaterialCommunityIcons name="arrow-left" size={23} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[styles.title, { color: colors.text }]}>Paiement</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>Retirez vos revenus simplement</Text>
          </View>
        </View>

        <View style={[styles.balanceCard, { backgroundColor: colors.primary }]}>
          <Text style={styles.balanceLabel}>Solde disponible</Text>
          <Text style={styles.balance}>{solde.toLocaleString('fr-FR')} FCFA</Text>
          <Text style={styles.balanceHint}>Retrait minimum : 5 000 FCFA</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Demander un retrait</Text>

          <Text style={[styles.label, { color: colors.text }]}>Montant</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
            value={montant}
            onChangeText={setMontant}
            placeholder="Ex. 25 000"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            returnKeyType="next"
          />

          <Text style={[styles.label, { color: colors.text }]}>Méthode</Text>
          <View style={styles.methods}>
            {METHODES.map(item => {
              const active = methode === item.value;
              return (
                <TouchableOpacity
                  key={item.value}
                  onPress={() => setMethode(item.value)}
                  style={[styles.method, { backgroundColor: active ? colors.primary + '16' : colors.background, borderColor: active ? colors.primary : colors.border }]}
                >
                  <MaterialCommunityIcons name={item.icon} size={22} color={active ? colors.primary : colors.textMuted} />
                  <Text style={[styles.methodText, { color: active ? colors.primary : colors.text }]}>{item.label}</Text>
                  {active && <MaterialCommunityIcons name="check-circle" size={18} color={colors.primary} />}
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.label, { color: colors.text }]}>Numéro de téléphone</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
            value={numero}
            onChangeText={setNumero}
            placeholder="Ex. 07 00 00 00 00"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
            returnKeyType="done"
          />

          <TouchableOpacity
            onPress={demander}
            disabled={submitting}
            style={[styles.submit, { backgroundColor: colors.primary, opacity: submitting ? 0.55 : 1 }]}
          >
            {submitting ? <ActivityIndicator color="white" /> : <>
              <MaterialCommunityIcons name="cash-fast" size={20} color="white" />
              <Text style={styles.submitText}>Demander le paiement</Text>
            </>}
          </TouchableOpacity>
        </View>

        {historique.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Historique</Text>
            {historique.map(item => (
              <View key={item.id} style={[styles.historyRow, { borderBottomColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.historyAmount, { color: colors.text }]}>{Number(item.montant || 0).toLocaleString('fr-FR')} FCFA</Text>
                  <Text style={[styles.historyMeta, { color: colors.textMuted }]}>{item.methode === 'moov_money' ? 'Moov Money' : 'Airtel Money'} • {item.numero || ''}</Text>
                </View>
                <Text style={[styles.historyStatus, { color: item.statut === 'payé' ? colors.success : colors.warning }]}>{String(item.statut || '').replace('_', ' ')}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  iconButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: 2 },
  balanceCard: { borderRadius: 20, padding: 22, marginBottom: 14 },
  balanceLabel: { color: 'rgba(255,255,255,0.82)', fontSize: 13 },
  balance: { color: 'white', fontSize: 30, fontWeight: '900', marginTop: 6 },
  balanceHint: { color: 'rgba(255,255,255,0.82)', fontSize: 12, marginTop: 8 },
  card: { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 14 },
  cardTitle: { fontSize: 17, fontWeight: '800', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 7, marginTop: 8 },
  input: { minHeight: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, fontSize: 16, marginBottom: 8 },
  methods: { gap: 8, marginBottom: 8 },
  method: { minHeight: 52, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  methodText: { flex: 1, fontSize: 14, fontWeight: '700' },
  submit: { minHeight: 50, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14 },
  submitText: { color: 'white', fontWeight: '800', fontSize: 15 },
  historyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  historyAmount: { fontSize: 15, fontWeight: '800' },
  historyMeta: { fontSize: 12, marginTop: 3 },
  historyStatus: { fontSize: 12, fontWeight: '800' },
});
