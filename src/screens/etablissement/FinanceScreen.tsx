import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, TextInput
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { ActivityIndicator as AI } from 'react-native';

const TYPES = [
  { value: 'tous', label: 'Tous' },
  { value: 'abonnements', label: 'Abonnements' },
  { value: 'contributions', label: 'Contributions' },
  { value: 'paiements', label: 'Paiements' },
  { value: 'retraits', label: 'Retraits' },
];

const MOIS = [
  { value: 'ce_mois', label: 'Ce mois' },
  { value: 'mois_dernier', label: 'Mois dernier' },
  { value: '3_mois', label: '3 derniers mois' },
  { value: '6_mois', label: '6 derniers mois' },
  { value: 'annee', label: 'Cette année' },
  { value: 'tous', label: 'Tous' },
];

const FinanceScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const { userId } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    solde: 0,
    revenus: 0,
    depenses: 0,
    paiementsEnAttente: 0,
  });
  const [filterType, setFilterType] = useState<string>('tous');
  const [filterMois, setFilterMois] = useState<string>('ce_mois');
  const [showRetraitModal, setShowRetraitModal] = useState(false);
  const [montantRetrait, setMontantRetrait] = useState('');
  const [userSolde, setUserSolde] = useState(0);

  useEffect(() => {
    fetchData();
  }, [filterType, filterMois, userId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      if (userId) {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          setUserSolde(userDoc.data()?.solde || 0);
        }
      }

      const mockTransactions = [
        { id: '1', type: 'abonnements', montant: 50000, date: new Date(), statut: 'complet', description: 'Abonnement mensuel - Établissement' },
        { id: '2', type: 'contributions', montant: 15000, date: new Date(Date.now() - 86400000), statut: 'complet', description: 'Revenus des contributions' },
        { id: '3', type: 'paiements', montant: -25000, date: new Date(Date.now() - 172800000), statut: 'complet', description: 'Paiement à un répétiteur' },
        { id: '4', type: 'abonnements', montant: 50000, date: new Date(Date.now() - 2592000000), statut: 'complet', description: 'Abonnement mensuel' },
        { id: '5', type: 'retraits', montant: -100000, date: new Date(Date.now() - 5184000000), statut: 'en_attente', description: 'Retrait vers compte bancaire' },
      ];

      let filtered = mockTransactions;
      if (filterType !== 'tous') {
        filtered = filtered.filter(t => t.type === filterType);
      }

      const maintenant = new Date();
      if (filterMois === 'ce_mois') {
        filtered = filtered.filter(t => t.date.getMonth() === maintenant.getMonth() && t.date.getFullYear() === maintenant.getFullYear());
      } else if (filterMois === 'mois_dernier') {
        const moisDernier = new Date(maintenant.getFullYear(), maintenant.getMonth() - 1, 1);
        filtered = filtered.filter(t =>
          t.date.getMonth() === moisDernier.getMonth() &&
          t.date.getFullYear() === moisDernier.getFullYear()
        );
      } else if (filterMois === '3_mois') {
        filtered = filtered.filter(t => {
          const dateT = new Date(t.date);
          return dateT >= new Date(maintenant.getFullYear(), maintenant.getMonth() - 2, 1);
        });
      } else if (filterMois === '6_mois') {
        filtered = filtered.filter(t => {
          const dateT = new Date(t.date);
          return dateT >= new Date(maintenant.getFullYear(), maintenant.getMonth() - 5, 1);
        });
      } else if (filterMois === 'annee') {
        filtered = filtered.filter(t => {
          const dateT = new Date(t.date);
          return dateT.getFullYear() === maintenant.getFullYear();
        });
      }

        setTransactions(filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

      const totalRevenus = filtered
        .filter(t => t.montant > 0)
        .reduce((sum, t) => sum + t.montant, 0);
      const totalDepenses = filtered
        .filter(t => t.montant < 0)
        .reduce((sum, t) => sum + Math.abs(t.montant), 0);
      const solde = userSolde;
      const paiementsEnAttente = filtered
        .filter(t => t.statut === 'en_attente' && t.montant < 0)
        .reduce((sum, t) => sum + Math.abs(t.montant), 0);

      setStats({
        solde,
        revenus: totalRevenus,
        depenses: totalDepenses,
        paiementsEnAttente,
      });

    } catch (error) {
      console.error('Erreur chargement finances:', error);
      Alert.alert('Erreur', 'Impossible de charger les données financières');
    } finally {
      setLoading(false);
    }
  };

  const handleRetrait = async () => {
    if (!montantRetrait.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un montant');
      return;
    }

    const montant = parseInt(montantRetrait);
    if (isNaN(montant) || montant <= 0) {
      Alert.alert('Erreur', 'Le montant doit être un nombre positif');
      return;
    }

    if (montant > userSolde) {
      Alert.alert('Erreur', `Le montant ne peut pas dépasser votre solde (${userSolde.toLocaleString()} FCFA)`);
      return;
    }

    try {
      Alert.alert(
        'Succès',
        `Votre demande de retrait de ${montant.toLocaleString()} FCFA a été soumise avec succès.`,
        [{ text: 'OK', onPress: () => setShowRetraitModal(false) }]
      );
      setMontantRetrait('');
    } catch (error) {
      console.error('Erreur retrait:', error);
      Alert.alert('Erreur', 'Impossible de soumettre votre demande de retrait');
    }
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, { name: string; color: string }> = {
      abonnements: { name: 'credit-card', color: '#4CAF50' },
      contributions: { name: 'file-document', color: '#2196F3' },
      paiements: { name: 'account-cash', color: '#FF9800' },
      retraits: { name: 'bank-transfer', color: '#F44336' },
    };
    return icons[type] || { name: 'currency-usd', color: '#9E9E9E' };
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textMuted, marginTop: 8 }}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Finances</Text>
        <TouchableOpacity onPress={() => setShowRetraitModal(true)}>
          <MaterialCommunityIcons name="bank-transfer" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.statsContainer, { backgroundColor: colors.surface }]}>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.primary + '10' }]}>
            <MaterialCommunityIcons name="currency-usd" size={24} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {userSolde.toLocaleString()} FCFA
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Solde actuel</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.success + '10' }]}>
            <MaterialCommunityIcons name="trending-up" size={24} color={colors.success} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {stats.revenus.toLocaleString()} FCFA
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Revenus</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.error + '10' }]}>
            <MaterialCommunityIcons name="trending-down" size={24} color={colors.error} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {stats.depenses.toLocaleString()} FCFA
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Dépenses</Text>
          </View>
        </View>

        {stats.paiementsEnAttente > 0 && (
          <View style={[styles.pendingCard, { backgroundColor: colors.warning + '10', borderColor: colors.warning }]}>
            <MaterialCommunityIcons name="clock" size={20} color={colors.warning} />
            <Text style={[styles.pendingText, { color: colors.warning }]}>
              Paiements en attente: {stats.paiementsEnAttente.toLocaleString()} FCFA
            </Text>
          </View>
        )}
      </View>

      <View style={[styles.filters, { backgroundColor: colors.surface }]}>
        <View style={styles.filterGroup}>
          <Text style={[styles.filterLabel, { color: colors.text }]}>Type:</Text>
          <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Picker
              selectedValue={filterType}
              onValueChange={(itemValue) => setFilterType(itemValue)}
              style={{ color: colors.text, width: 150 }}
            >
              {TYPES.map((t) => (
                <Picker.Item key={t.value} label={t.label} value={t.value} />
              ))}
            </Picker>
          </View>
        </View>
        <View style={styles.filterGroup}>
          <Text style={[styles.filterLabel, { color: colors.text }]}>Période:</Text>
          <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Picker
              selectedValue={filterMois}
              onValueChange={(itemValue) => setFilterMois(itemValue)}
              style={{ color: colors.text, width: 150 }}
            >
              {MOIS.map((m) => (
                <Picker.Item key={m.value} label={m.label} value={m.value} />
              ))}
            </Picker>
          </View>
        </View>
      </View>

      <ScrollView style={styles.listContainer}>
        {transactions.length === 0 ? (
          <View style={[styles.emptyContainer, { backgroundColor: colors.surface }]}>
            <MaterialCommunityIcons name="file-document-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Aucune transaction trouvée
            </Text>
          </View>
        ) : (
          transactions.map((transaction) => {
            const icon = getTypeIcon(transaction.type);
            const estCredit = transaction.montant > 0;
            return (
              <View key={transaction.id} style={[styles.transactionCard, {
                backgroundColor: colors.surface,
                borderColor: colors.border
              }]}>
                <View style={styles.transactionIcon}>
                  <MaterialCommunityIcons
                    name={icon.name as any}
                    size={24}
                    color={icon.color}
                  />
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={[styles.transactionDescription, { color: colors.text }]}>
                    {transaction.description}
                  </Text>
                  <Text style={[styles.transactionDate, { color: colors.textMuted }]}>
                    {transaction.date.toLocaleDateString('fr-FR')} - {transaction.date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <View style={styles.transactionAmount}>
                  <Text style={[styles.amountValue, {
                    color: estCredit ? colors.success : colors.error
                  }]}>
                    {estCredit ? '+' : '-'} {Math.abs(transaction.montant).toLocaleString()} FCFA
                  </Text>
                  <View style={[styles.statusBadge, {
                    backgroundColor: transaction.statut === 'complet' ? colors.success + '20' : colors.warning + '20'
                  }]}>
                    <Text style={[styles.statusText, {
                      color: transaction.statut === 'complet' ? colors.success : colors.warning
                    }]}>
                      {transaction.statut.replace('_', ' ')}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {showRetraitModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Demander un retrait</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
              Solde disponible: {userSolde.toLocaleString()} FCFA
            </Text>

            <Text style={[styles.modalLabel, { color: colors.text, marginTop: 16 }]}>Montant à retirer *</Text>
            <TextInput
              style={[styles.modalInput, {
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.text
              }]}
              placeholder="Ex: 100000"
              placeholderTextColor={colors.textMuted}
              value={montantRetrait}
              onChangeText={setMontantRetrait}
              keyboardType="numeric"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.textMuted + '20' }]}
                onPress={() => setShowRetraitModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleRetrait}
              >
                <Text style={styles.modalButtonText}>Demander le retrait</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
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
  statsContainer: {
    padding: 16,
    borderBottomWidth: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '30%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  pendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
  },
  pendingText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    borderBottomWidth: 1,
  },
  filterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  filterLabel: {
    marginRight: 8,
    fontSize: 14,
  },
  pickerContainer: {
    borderRadius: 8,
    borderWidth: 1,
  },
  listContainer: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    borderRadius: 12,
    margin: 16,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 1,
    borderBottomWidth: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '500',
  },
  transactionDate: {
    fontSize: 12,
    marginTop: 2,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    borderRadius: 12,
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  modalInput: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default FinanceScreen;
