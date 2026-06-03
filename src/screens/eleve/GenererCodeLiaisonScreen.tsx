import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { genererCodeLiaison } from '../../services/parentService';

export default function GenererCodeLiaisonScreen({ navigation }: any) {
  const { colors }         = useTheme();
  const [code, setCode]    = useState('');
  const [loading, setLoading] = useState(false);
  const [secondes, setSec] = useState(0);

  useEffect(() => {
    if (!code || secondes <= 0) return;
    const t = setInterval(() => {
      setSec(s => {
        if (s <= 1) { clearInterval(t); setCode(''); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [code]);

  const generer = async () => {
    setLoading(true);
    try {
      const c = await genererCodeLiaison();
      setCode(c);
      setSec(600); // 10 minutes
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const formatTimer = (s: number) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={['#7BA89A', '#5A8A7A']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitre}>Code parent</Text>
      </LinearGradient>

      <View style={styles.content}>
        <Text style={{ fontSize: 64, textAlign: 'center' }}>👨‍👩‍👧</Text>
        <Text style={[styles.titre, { color: colors.text }]}>Lier votre parent</Text>
        <Text style={[styles.desc, { color: colors.textSecondary }]}>
          Génère un code de 6 chiffres à donner à ton parent. Il l'entrera dans l'application RÉPÉTIA Parents.
        </Text>

        {code ? (
          <View style={[styles.codeBox, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
            <Text style={[styles.code, { color: colors.primary }]}>{code}</Text>
            <Text style={[styles.timer, { color: colors.textMuted }]}>
              Expire dans {formatTimer(secondes)}
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.genBtn, { backgroundColor: colors.primary }]}
            onPress={generer}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator size="small" color="white" />
              : <><MaterialCommunityIcons name="key-plus" size={22} color="white" />
                  <Text style={styles.genBtnTxt}>Générer mon code</Text></>
            }
          </TouchableOpacity>
        )}

        {code && (
          <TouchableOpacity
            style={[styles.regenBtn, { borderColor: colors.border }]}
            onPress={generer}
          >
            <Text style={[styles.regenBtnTxt, { color: colors.textMuted }]}>Générer un nouveau code</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 52, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 14 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerTitre: { fontSize: 18, fontWeight: '700', color: 'white' },
  content: { flex: 1, padding: 32, alignItems: 'center', gap: 20 },
  titre: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
  desc:  { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  codeBox: { alignItems: 'center', padding: 32, borderRadius: 24, borderWidth: 2, width: '100%', gap: 12 },
  code:  { fontSize: 48, fontWeight: '900', letterSpacing: 12 },
  timer: { fontSize: 14 },
  genBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 16 },
  genBtnTxt: { color: 'white', fontSize: 16, fontWeight: '700' },
  regenBtn: { padding: 12, borderRadius: 12, borderWidth: 1 },
  regenBtnTxt: { fontSize: 13 },
});
