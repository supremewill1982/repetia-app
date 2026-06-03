import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { getStatutPremium, PLANS_INFO, StatutPremium } from '../services/premiumService';

interface Props {
  onPremiumPress: () => void;
  refreshKey?: number; // Incrémenter pour forcer le refresh
}

export default function QuotaBanner({ onPremiumPress, refreshKey = 0 }: Props) {
  const { colors } = useTheme();
  const [statut, setStatut] = useState<StatutPremium | null>(null);

  useEffect(() => {
    getStatutPremium().then(setStatut);
  }, [refreshKey]);

  if (!statut) return null;

  const planInfo = PLANS_INFO[statut.plan];

  // Premium → affiche juste le badge plan (pas de quota)
  if (statut.isPremium) {
    return (
      <View style={[styles.premiumBadge, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}>
        <MaterialCommunityIcons name="crown" size={14} color={colors.primary} />
        <Text style={[styles.premiumText, { color: colors.primary }]}>
          {planInfo.emoji} {planInfo.nom}
        </Text>
        {statut.expiresAt && (
          <Text style={[styles.expireText, { color: colors.textMuted }]}>
            · expire le {new Date(statut.expiresAt).toLocaleDateString('fr-FR')}
          </Text>
        )}
      </View>
    );
  }

  // Gratuit → affiche le quota restant
  const questionsRestantes = Math.max(0, planInfo.questionsParJour - statut.questionsUtilisees);
  const photosRestantes    = Math.max(0, planInfo.photosParSemaine  - statut.photosUtilisees);
  const quotaFaible        = questionsRestantes <= 1;

  return (
    <TouchableOpacity
      style={[
        styles.quotaBanner,
        {
          backgroundColor: quotaFaible ? colors.error + '15' : colors.card,
          borderColor:     quotaFaible ? colors.error : colors.border,
        },
      ]}
      onPress={onPremiumPress}
      activeOpacity={0.8}
    >
      <View style={styles.quotaLeft}>
        <MaterialCommunityIcons
          name="lightning-bolt"
          size={18}
          color={quotaFaible ? colors.error : colors.warning}
        />
        <View>
          <Text style={[styles.quotaTitle, { color: quotaFaible ? colors.error : colors.text }]}>
            {questionsRestantes > 0
              ? `${questionsRestantes} question${questionsRestantes > 1 ? 's' : ''} restante${questionsRestantes > 1 ? 's' : ''} aujourd'hui`
              : '⛔ Quota journalier atteint'
            }
          </Text>
          <Text style={[styles.quotaSub, { color: colors.textMuted }]}>
            📸 {photosRestantes} photo{photosRestantes > 1 ? 's' : ''} · Renouvellement à minuit
          </Text>
        </View>
      </View>
      <View style={[styles.premiumBtn, { backgroundColor: colors.primary }]}>
        <Text style={styles.premiumBtnText}>💎 Premium</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  quotaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  quotaLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  quotaTitle: { fontSize: 13, fontWeight: '600' },
  quotaSub: { fontSize: 11, marginTop: 2 },
  premiumBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  premiumBtnText: { color: '#ECEEF3', fontSize: 12, fontWeight: 'bold' },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  premiumText: { fontSize: 13, fontWeight: '600' },
  expireText: { fontSize: 11 },
});
