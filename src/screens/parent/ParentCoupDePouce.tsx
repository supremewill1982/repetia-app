import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { getEnfantsLies, envoyerCoupDePouce, lancerDefi } from '../../services/parentService';

const MESSAGES_RAPIDES = [
  '💪 Bravo pour tes efforts, continue comme ça !',
  '🌟 Je suis fier(e) de toi, tu travailles bien !',
  '📚 N\'oublie pas de réviser ce soir, je compte sur toi !',
  '🎯 Tu peux y arriver, je crois en toi !',
  '❤️ Bon courage pour le Bac, on est avec toi !',
];

const DEFIS_RAPIDES = [
  { titre: 'Révision rapide', desc: 'Fais une révision dans la prochaine heure', heures: 1 },
  { titre: 'Session du soir',  desc: 'Travaille 30 minutes ce soir',              heures: 8 },
  { titre: 'Défi weekend',     desc: 'Complète 3 révisions ce weekend',            heures: 48 },
];

export default function ParentCoupDePouce({ navigation }: any) {
  const { colors }   = useTheme();
  const { userData } = useAuth();
  const [message, setMessage]     = useState('');
  const [loading, setLoading]     = useState(false);
  const [enfantId, setEnfantId]   = useState('');
  const [enfantNom, setNom]       = useState('');
  const [onglet, setOnglet]       = useState<'message'|'defi'>('message');

  useFocusEffect(useCallback(() => {
    getEnfantsLies().then(e => {
      if (e.length) { setEnfantId(e[0].uid); setNom(e[0].prenom); }
    });
  }, []));

  const envoyer = async (msg: string) => {
    if (!enfantId) { Alert.alert('Aucun enfant lié'); return; }
    setLoading(true);
    try {
      await envoyerCoupDePouce(enfantId, msg, (userData as any)?.prenom || 'Parent');
      Alert.alert('✅ Message envoyé !', `${enfantNom} recevra ton message à sa prochaine connexion.`);
      setMessage('');
    } catch {
      Alert.alert('Erreur', 'Impossible d\'envoyer le message.');
    } finally {
      setLoading(false);
    }
  };

  const lancerLeDefi = async (d: typeof DEFIS_RAPIDES[0]) => {
    if (!enfantId) return;
    setLoading(true);
    try {
      await lancerDefi(enfantId, d.titre, d.desc, d.heures, (userData as any)?.prenom || 'Parent');
      Alert.alert('⚔️ Défi lancé !', `${enfantNom} voit ton défi dans son application.`);
    } catch {
      Alert.alert('Erreur', 'Impossible de lancer le défi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={['#7BA89A', '#5A8A7A']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitre}>💌 Coup de pouce — {enfantNom}</Text>
      </LinearGradient>

      {/* Onglets */}
      <View style={[styles.tabs, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {(['message','defi'] as const).map(t => (
          <TouchableOpacity key={t} style={[styles.tab, onglet === t && { borderBottomColor: colors.primary, borderBottomWidth: 2.5 }]} onPress={() => setOnglet(t)}>
            <Text style={[styles.tabTxt, { color: onglet === t ? colors.primary : colors.textMuted }]}>
              {t === 'message' ? '💬 Message' : '⚔️ Défi'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {onglet === 'message' && (
          <>
            <Text style={[styles.sectionTitre, { color: colors.text }]}>Messages rapides</Text>
            {MESSAGES_RAPIDES.map((m, i) => (
              <TouchableOpacity key={i} style={[styles.msgRapide, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => envoyer(m)}>
                <Text style={[styles.msgRapideTxt, { color: colors.text }]}>{m}</Text>
                <MaterialCommunityIcons name="send" size={18} color={colors.primary} />
              </TouchableOpacity>
            ))}

            <Text style={[styles.sectionTitre, { color: colors.text, marginTop: 8 }]}>Message personnalisé</Text>
            <TextInput
              style={[styles.msgInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder={`Écris un message pour ${enfantNom}...`}
              placeholderTextColor={colors.textMuted}
              selectedValue={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={4}
            />
            <TouchableOpacity
              style={[styles.envoyerBtn, { backgroundColor: message.trim() ? colors.primary : colors.border }]}
              onPress={() => message.trim() && envoyer(message)}
              disabled={loading || !message.trim()}
            >
              {loading ? <ActivityIndicator size="small" color="white" />
                : <><MaterialCommunityIcons name="send" size={20} color="white" /><Text style={styles.envoyerBtnTxt}>Envoyer</Text></>
              }
            </TouchableOpacity>
          </>
        )}

        {onglet === 'defi' && (
          <>
            <Text style={[styles.sectionTitre, { color: colors.text }]}>Lancer un défi à {enfantNom}</Text>
            <Text style={[styles.defiDesc, { color: colors.textMuted }]}>
              Le défi apparaît dans l'app de votre enfant avec un timer. Il recevra une notification quand le temps est écoulé.
            </Text>
            {DEFIS_RAPIDES.map((d, i) => (
              <TouchableOpacity key={i} style={[styles.defiCard, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => lancerLeDefi(d)}>
                <View>
                  <Text style={[styles.defiTitre, { color: colors.text }]}>⚔️ {d.titre}</Text>
                  <Text style={[styles.defiSous, { color: colors.textSecondary }]}>{d.desc}</Text>
                  <Text style={[styles.defiTimer, { color: colors.primary }]}>⏱ {d.heures}h pour relever le défi</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 52, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 14 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerTitre: { fontSize: 16, fontWeight: '700', color: 'white', flex: 1 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1 },
  tab:  { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabTxt: { fontSize: 13, fontWeight: '600' },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  sectionTitre: { fontSize: 15, fontWeight: '700' },
  msgRapide: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, borderWidth: 1, gap: 10 },
  msgRapideTxt: { flex: 1, fontSize: 14, lineHeight: 20 },
  msgInput: { borderRadius: 16, borderWidth: 1, padding: 14, fontSize: 15, minHeight: 100, textAlignVertical: 'top' },
  envoyerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16, borderRadius: 16 },
  envoyerBtnTxt: { color: 'white', fontSize: 15, fontWeight: '700' },
  defiDesc: { fontSize: 13, lineHeight: 20 },
  defiCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 18, borderWidth: 1, gap: 10 },
  defiTitre: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  defiSous:  { fontSize: 12, lineHeight: 18 },
  defiTimer: { fontSize: 12, fontWeight: '600', marginTop: 4 },
});
