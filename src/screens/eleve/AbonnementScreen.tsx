import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Linking, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { getStatutPremium, PLANS_INFO, Plan, StatutPremium } from '../../services/premiumService';
import { useAuth } from '../../context/AuthContext';

// ⚠️ Remplace par ton vrai numéro WhatsApp
const WHATSAPP_NUMBER = '24160217098';

export default function AbonnementScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [statut, setStatut] = useState<StatutPremium | null>(null);
  const [loading, setLoading] = useState(true);
  const [planChoisi, setPlanChoisi] = useState<Plan | null>(null);

  useEffect(() => {
    getStatutPremium().then(s => {
      setStatut(s);
      setLoading(false);
    });
  }, []);

  const abonnerViaWhatsApp = (plan: Plan) => {
    const info = PLANS_INFO[plan];
    const message = `Bonjour ! Je veux m'abonner à RÉPÉTIA.\n\n` +
      `📦 Plan : ${info.emoji} ${info.nom}\n` +
      `💰 Prix : ${info.prix.toLocaleString()} CFA/mois\n\n` +
      `Mon email de compte : ${user?.email || ''}\n\n` +
      `Comment procéder au paiement Mobile Money ?`;

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('WhatsApp non disponible', `Contacte-nous au ${WHATSAPP_NUMBER}`);
    });
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const planActuel = statut?.plan || 'gratuit';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient colors={['#7BA89A', '#6A8A9A']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#ECEEF3" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Abonnements RÉPÉTIA</Text>
        <Text style={styles.headerSub}>Ton répétiteur IA premium</Text>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Statut actuel */}
        <View style={[styles.statutBanner, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statutLabel, { color: colors.textSecondary }]}>Ton plan actuel</Text>
          <View style={styles.statutRow}>
            <Text style={styles.statutEmoji}>{PLANS_INFO[planActuel].emoji}</Text>
            <Text style={[styles.statutPlan, { color: colors.primary }]}>
              {PLANS_INFO[planActuel].nom}
            </Text>
            {statut?.expiresAt && (
              <Text style={[styles.statutExpire, { color: colors.textMuted }]}>
                Expire le {new Date(statut.expiresAt).toLocaleDateString('fr-FR')}
              </Text>
            )}
          </View>
          {planActuel === 'gratuit' && (
            <Text style={[styles.quotaInfo, { color: colors.warning }]}>
              ⚡ {Math.max(0, 5 - (statut?.questionsUtilisees || 0))} questions restantes aujourd'hui
            </Text>
          )}
        </View>

        {/* Titre section */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Choisis ton plan 👇
        </Text>

        {/* Cartes de plans */}
        {(Object.entries(PLANS_INFO) as [Plan, typeof PLANS_INFO.gratuit][]).map(([planId, info]) => {
          const isActuel = planId === planActuel;
          const isPopulaire = planId === 'etudiant';
          const isPremium = planId !== 'gratuit';

          return (
            <View key={planId} style={styles.cardWrapper}>
              {isPopulaire && (
                <View style={[styles.badgePopulaire, { backgroundColor: colors.primary }]}>
                  <Text style={styles.badgePopulaireText}>⭐ POPULAIRE</Text>
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.card,
                    borderColor: isActuel ? info.couleur : colors.border,
                    borderWidth: isActuel ? 2 : 1,
                  },
                ]}
                onPress={() => isPremium && setPlanChoisi(planId)}
                activeOpacity={isPremium ? 0.8 : 1}
              >
                {/* En-tête de la carte */}
                <LinearGradient
                  colors={[info.couleur + '30', info.couleur + '10']}
                  style={styles.cardHeader}
                >
                  <Text style={styles.cardEmoji}>{info.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardNom, { color: info.couleur }]}>{info.nom}</Text>
                    <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>{info.description}</Text>
                  </View>
                  <View style={styles.prixWrapper}>
                    {info.prix > 0 ? (
                      <>
                        <Text style={[styles.prixMontant, { color: info.couleur }]}>
                          {info.prix.toLocaleString()}
                        </Text>
                        <Text style={[styles.prixDevise, { color: colors.textMuted }]}>CFA/mois</Text>
                      </>
                    ) : (
                      <Text style={[styles.prixGratuit, { color: info.couleur }]}>GRATUIT</Text>
                    )}
                  </View>
                </LinearGradient>

                {/* Avantages */}
                <View style={styles.avantages}>
                  {info.avantages.map((av, i) => (
                    <View key={i} style={styles.avantageRow}>
                      <MaterialCommunityIcons name="check-circle" size={16} color={info.couleur} />
                      <Text style={[styles.avantageText, { color: colors.textSecondary }]}>{av}</Text>
                    </View>
                  ))}
                </View>

                {/* Bouton */}
                {isActuel ? (
                  <View style={[styles.btnActuel, { borderColor: info.couleur }]}>
                    <Text style={[styles.btnActuelText, { color: info.couleur }]}>✓ Plan actuel</Text>
                  </View>
                ) : isPremium ? (
                  <TouchableOpacity
                    style={[styles.btnSouscrire, { backgroundColor: info.couleur }]}
                    onPress={() => abonnerViaWhatsApp(planId)}
                  >
                    <MaterialCommunityIcons name="whatsapp" size={18} color="#ECEEF3" />
                    <Text style={styles.btnSouscrireText}>S'abonner via WhatsApp</Text>
                  </TouchableOpacity>
                ) : null}
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Section paiement */}
        <View style={[styles.paiementSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.paiementTitre, { color: colors.text }]}>
            💳 Comment payer ?
          </Text>
          <Text style={[styles.paiementStep, { color: colors.textSecondary }]}>
            1️⃣ Clique sur "S'abonner via WhatsApp"
          </Text>
          <Text style={[styles.paiementStep, { color: colors.textSecondary }]}>
            2️⃣ Envoie le paiement Mobile Money (Airtel Money ou Moov)
          </Text>
          <Text style={[styles.paiementStep, { color: colors.textSecondary }]}>
            3️⃣ Envoie la capture de confirmation
          </Text>
          <Text style={[styles.paiementStep, { color: colors.textSecondary }]}>
            4️⃣ Ton compte est activé en moins de 30 minutes ✅
          </Text>

          <TouchableOpacity
            style={[styles.btnContact, { backgroundColor: '#25D366' }]}
            onPress={() => Linking.openURL(`https://wa.me/${WHATSAPP_NUMBER}`)}
          >
            <MaterialCommunityIcons name="whatsapp" size={20} color="white" />
            <Text style={styles.btnContactText}>Contacter le support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  backBtn: {
    position: 'absolute', top: 50, left: 16,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#ECEEF3', marginBottom: 4 },
  headerSub: { fontSize: 13, color: '#3A3A1A' },

  statutBanner: {
    margin: 16, padding: 16, borderRadius: 16, borderWidth: 1,
  },
  statutLabel: { fontSize: 12, marginBottom: 8 },
  statutRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statutEmoji: { fontSize: 24 },
  statutPlan: { fontSize: 20, fontWeight: 'bold', flex: 1 },
  statutExpire: { fontSize: 12 },
  quotaInfo: { marginTop: 8, fontSize: 13, fontWeight: '500' },

  sectionTitle: {
    fontSize: 18, fontWeight: 'bold',
    marginHorizontal: 16, marginBottom: 8,
  },

  cardWrapper: { marginHorizontal: 16, marginBottom: 16 },
  badgePopulaire: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 12, marginBottom: -12, marginLeft: 12,
    zIndex: 1,
  },
  badgePopulaireText: { color: '#ECEEF3', fontSize: 11, fontWeight: 'bold' },

  card: { borderRadius: 20, overflow: 'hidden' },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, gap: 12,
  },
  cardEmoji: { fontSize: 36 },
  cardNom: { fontSize: 18, fontWeight: 'bold' },
  cardDesc: { fontSize: 12, marginTop: 2 },
  prixWrapper: { alignItems: 'flex-end' },
  prixMontant: { fontSize: 22, fontWeight: 'bold' },
  prixDevise: { fontSize: 11 },
  prixGratuit: { fontSize: 18, fontWeight: 'bold' },

  avantages: { padding: 16, gap: 8 },
  avantageRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avantageText: { fontSize: 14, flex: 1 },

  btnActuel: {
    margin: 16, marginTop: 0,
    padding: 12, borderRadius: 12, borderWidth: 1.5,
    alignItems: 'center',
  },
  btnActuelText: { fontWeight: 'bold', fontSize: 14 },

  btnSouscrire: {
    margin: 16, marginTop: 0,
    padding: 14, borderRadius: 14,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
  },
  btnSouscrireText: { color: '#ECEEF3', fontWeight: 'bold', fontSize: 15 },

  paiementSection: {
    margin: 16, padding: 20, borderRadius: 20, borderWidth: 1, gap: 8,
  },
  paiementTitre: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  paiementStep: { fontSize: 14, lineHeight: 22 },
  btnContact: {
    marginTop: 12, padding: 14, borderRadius: 14,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
  },
  btnContactText: { color: 'white', fontWeight: 'bold', fontSize: 15 },
});
