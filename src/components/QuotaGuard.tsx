import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { verifierQuota, consommerQuota, StatutPremium } from '../services/premiumService';

interface QuotaGuardProps {
  type: 'question' | 'photo';
  onAccess: () => void;
  navigation: any;
  children?: React.ReactNode;
}

export default function QuotaGuard({ type, onAccess, navigation }: QuotaGuardProps) {
  const { colors } = useTheme();
  const [showModal, setShowModal] = useState(false);
  const [restant, setRestant] = useState(0);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    const result = await verifierQuota(type);
    if (result.autorise) {
      await consommerQuota(type);
      onAccess();
    } else {
      setRestant(result.restant);
      setShowModal(true);
    }
    setChecked(true);
  };

  return (
    <Modal visible={showModal} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.card }]}>
          <LinearGradient colors={['#7BA89A', '#5A8A7A']} style={styles.iconBg}>
            <MaterialCommunityIcons name="crown" size={40} color="#ECEEF3" />
          </LinearGradient>

          <Text style={[styles.titre, { color: colors.text }]}>
            Quota journalier atteint !
          </Text>
          <Text style={[styles.sous, { color: colors.textSecondary }]}>
            Tu as utilisé tes {type === 'question' ? '5 questions' : '2 photos'} gratuites aujourd'hui.
            Reviens demain ou passe en Premium pour un accès illimité ! 🚀
          </Text>

          <View style={styles.btnGroup}>
            <TouchableOpacity
              style={[styles.btnPremium, { backgroundColor: '#7BA89A' }]}
              onPress={() => {
                setShowModal(false);
                navigation.navigate('Abonnement');
              }}
            >
              <Text style={styles.btnPremiumText}>💎 Voir les plans Premium</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btnRetour, { borderColor: colors.border }]}
              onPress={() => {
                setShowModal(false);
                navigation.goBack();
              }}
            >
              <Text style={[styles.btnRetourText, { color: colors.textSecondary }]}>
                Retour
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  modal: {
    width: '100%', borderRadius: 24,
    padding: 28, alignItems: 'center', gap: 16,
  },
  iconBg: {
    width: 80, height: 80, borderRadius: 40,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 8,
  },
  titre: { fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
  sous: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  btnGroup: { width: '100%', gap: 12, marginTop: 8 },
  btnPremium: {
    padding: 16, borderRadius: 14, alignItems: 'center',
  },
  btnPremiumText: { color: '#ECEEF3', fontWeight: 'bold', fontSize: 16 },
  btnRetour: {
    padding: 14, borderRadius: 14, alignItems: 'center', borderWidth: 1,
  },
  btnRetourText: { fontSize: 15 },
});
