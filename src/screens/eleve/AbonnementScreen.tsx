import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { getStatutPremium, PLANS_INFO, Plan, StatutPremium } from '../../services/premiumService';
import { useAuth } from '../../context/AuthContext';

const WHATSAPP_NUMBER = '24160217098';

export default function AbonnementScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [statut, setStatut] = useState<StatutPremium | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStatutPremium().then((s) => { setStatut(s); setLoading(false); });
  }, []);

  const subscribe = (plan: Plan) => {
    const info = PLANS_INFO[plan];
    const message = `Bonjour ! Je veux m'abonner à RÉPÉTIA.\n\n📦 Plan : ${info.emoji} ${info.nom}\n💰 Prix : ${info.prix.toLocaleString()} CFA/mois\n\nMon email : ${user?.email || ''}`;
    Linking.openURL(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`).catch(() =>
      Alert.alert('WhatsApp non disponible', `Contacte-nous au ${WHATSAPP_NUMBER}`),
    );
  };

  if (loading) return <View style={[styles.center, { backgroundColor: colors.background }]}><ActivityIndicator size="large" color={colors.primary} /></View>;

  const current: Plan = statut?.plan ?? 'gratuit';
  const planIds = Object.keys(PLANS_INFO) as Plan[];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}><MaterialCommunityIcons name="arrow-left" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.title}>Abonnements RÉPETIA</Text>
        <Text style={styles.subtitle}>Choisis l'accompagnement adapté à tes besoins</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.current, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Plan actuel</Text>
          <Text style={[styles.currentPlan, { color: colors.primary }]}>{PLANS_INFO[current].emoji} {PLANS_INFO[current].nom}</Text>
        </View>
        {planIds.map((id) => {
          const info = PLANS_INFO[id];
          const isCurrent = id === current;
          const isPremium = id !== 'gratuit';
          return (
            <View key={id} style={[styles.card, { backgroundColor: colors.card, borderColor: isCurrent ? info.couleur : colors.border }]}>
              <View style={styles.cardTop}>
                <Text style={styles.emoji}>{info.emoji}</Text>
                <View style={{ flex: 1 }}><Text style={[styles.plan, { color: info.couleur }]}>{info.nom}</Text><Text style={[styles.desc, { color: colors.textSecondary }]}>{info.description}</Text></View>
                <View><Text style={[styles.price, { color: info.couleur }]}>{info.prix === 0 ? '0' : info.prix.toLocaleString()}</Text><Text style={[styles.cfa, { color: colors.textMuted }]}>CFA/mois</Text></View>
              </View>
              <View style={styles.features}>{info.avantages.map((feature) => <View key={feature} style={styles.feature}><MaterialCommunityIcons name="check-circle" size={17} color={info.couleur} /><Text style={[styles.featureText, { color: colors.textSecondary }]}>{feature}</Text></View>)}</View>
              {isCurrent ? <View style={[styles.currentButton, { borderColor: info.couleur }]}><Text style={[styles.currentButtonText, { color: info.couleur }]}>✓ Plan actuel</Text></View> : isPremium ? <TouchableOpacity style={[styles.subscribe, { backgroundColor: info.couleur }]} onPress={() => subscribe(id)}><MaterialCommunityIcons name="whatsapp" size={18} color="#fff" /><Text style={styles.subscribeText}>S'abonner</Text></TouchableOpacity> : null}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingTop: 52, paddingBottom: 22, paddingHorizontal: 20, alignItems: 'center' },
  back: { position: 'absolute', left: 16, top: 52, padding: 8 },
  title: { color: '#fff', fontSize: 22, fontWeight: '800' }, subtitle: { color: '#fff', opacity: 0.9, marginTop: 5, fontSize: 13 },
  content: { padding: 16, paddingBottom: 40 },
  current: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 16 }, label: { fontSize: 12 }, currentPlan: { fontSize: 20, fontWeight: '800', marginTop: 5 },
  card: { borderWidth: 1, borderRadius: 18, padding: 16, marginBottom: 16 }, cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 }, emoji: { fontSize: 34 }, plan: { fontSize: 19, fontWeight: '800' }, desc: { fontSize: 12, marginTop: 3 }, price: { fontSize: 20, fontWeight: '800', textAlign: 'right' }, cfa: { fontSize: 10, textAlign: 'right' },
  features: { marginTop: 14, gap: 8 }, feature: { flexDirection: 'row', alignItems: 'center', gap: 8 }, featureText: { flex: 1, fontSize: 13 },
  currentButton: { marginTop: 14, borderWidth: 1.5, borderRadius: 12, padding: 11, alignItems: 'center' }, currentButtonText: { fontWeight: '800' },
  subscribe: { marginTop: 14, borderRadius: 12, padding: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, subscribeText: { color: '#fff', fontWeight: '800' },
});
