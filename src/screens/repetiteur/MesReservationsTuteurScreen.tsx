import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ActivityIndicator, Alert, Linking,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import {
  getMesReservationsTuteur, confirmerReservation, terminerReservation,
  Reservation,
} from '../../services/tuteurService';

export default function MesReservationsTuteurScreen() {
  const { colors } = useTheme();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    charger();
  }, []);

  const charger = async () => {
    setLoading(true);
    const list = await getMesReservationsTuteur();
    setReservations(list);
    setLoading(false);
  };

  const handleConfirmer = async (id: string, item: Reservation) => {
    try {
      await confirmerReservation(id);
      Alert.alert('✅ Demande confirmée', 'La réservation a été acceptée. Vous pouvez maintenant contacter l\'élève.');
      
      // Ouvrir WhatsApp pour confirmer la mise en relation
      const msg = `Bonjour ${item.elevePrénom} ! 👋\n\nJ'ai bien reçu ta demande de réservation RÉPÉTIA pour notre cours de ${item.matiere}.\nC'est validé de mon côté !`;
      const url = `https://wa.me/?text=${encodeURIComponent(msg)}`; // L'élève sera contacté par le tuteur
      Linking.openURL(url);
      
      charger();
    } catch {
      Alert.alert('Erreur', 'Impossible de confirmer la réservation.');
    }
  };

  const handleTerminer = async (id: string, item: Reservation) => {
    Alert.prompt(
      'Session terminée',
      'Confirmer le montant final convenu (en CFA) :',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Valider',
          onPress: async (text) => {
            const montant = parseInt(text || '', 10);
            if (isNaN(montant) || montant <= 0) {
              Alert.alert('Erreur', 'Montant invalide.');
              return;
            }
            try {
              await terminerReservation(id, montant);
              Alert.alert('Félicitations 🌟', 'La session est marquée comme terminée. Vos gains ont été mis à jour.');
              charger();
            } catch {
              Alert.alert('Erreur', 'Impossible de clore la réservation.');
            }
          }
        }
      ],
      'plain-text',
      String(item.prix)
    );
  };

  const renderItem = ({ item }: { item: Reservation }) => {
    const statutCouleur = 
      item.statut === 'confirmee' ? '#4CAF50' :
      item.statut === 'terminee' ? colors.primary :
      item.statut === 'annulee' ? colors.error : '#FF9800';

    const statutLabel = 
      item.statut === 'confirmee' ? 'Confirmée' :
      item.statut === 'terminee' ? 'Terminée' :
      item.statut === 'annulee' ? 'Annulée' : 'En attente';

    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.eleveNom, { color: colors.text }]}>{item.elevePrénom}</Text>
          <View style={[styles.statutBadge, { backgroundColor: statutCouleur + '20' }]}>
            <Text style={[styles.statutTxt, { color: statutCouleur }]}>{statutLabel}</Text>
          </View>
        </View>

        <Text style={[styles.details, { color: colors.textSecondary }]}>
          📚 {item.matiere} · ⏱️ {item.dureeMin} minutes
        </Text>
        <Text style={[styles.details, { color: colors.textSecondary }]}>
          📅 Le {item.date} à {item.heure}
        </Text>
        <Text style={[styles.prix, { color: colors.primary }]}>
          💰 {item.prix.toLocaleString()} CFA
        </Text>

        {item.message && (
          <View style={[styles.messageBox, { backgroundColor: colors.background }]}>
            <Text style={[styles.messageTxt, { color: colors.textMuted }]}>
              💬 "{item.message}"
            </Text>
          </View>
        )}

        {item.statut === 'en_attente' && (
          <TouchableOpacity
            style={[styles.btnAction, { backgroundColor: '#4CAF50' }]}
            onPress={() => handleConfirmer(item.id!, item)}
          >
            <MaterialCommunityIcons name="check" size={18} color="white" />
            <Text style={styles.btnText}>Confirmer la demande</Text>
          </TouchableOpacity>
        )}

        {item.statut === 'confirmee' && (
          <TouchableOpacity
            style={[styles.btnAction, { backgroundColor: colors.primary }]}
            onPress={() => handleTerminer(item.id!, item)}
          >
            <MaterialCommunityIcons name="check-all" size={18} color="white" />
            <Text style={styles.btnText}>Marquer comme terminée</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>📅 Mes Réservations</Text>
      </View>

      <FlatList
        data={reservations}
        keyExtractor={(item) => item.id!}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="calendar-blank" size={64} color={colors.textMuted} />
            <Text style={[styles.emptyTxt, { color: colors.textSecondary }]}>
              Aucune demande de réservation pour le moment.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingTop: 50, borderBottomWidth: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, gap: 14 },
  card: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eleveNom: { fontSize: 16, fontWeight: 'bold' },
  statutBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statutTxt: { fontSize: 11, fontWeight: '700' },
  details: { fontSize: 13 },
  prix: { fontSize: 15, fontWeight: 'bold', marginTop: 4 },
  messageBox: { padding: 10, borderRadius: 8, marginTop: 4 },
  messageTxt: { fontSize: 12, fontStyle: 'italic' },
  btnAction: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: 12, marginTop: 8 },
  btnText: { color: 'white', fontSize: 13, fontWeight: '700' },
  empty: { alignItems: 'center', justifyContent: 'center', marginTop: 100, gap: 16, paddingHorizontal: 32 },
  emptyTxt: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
