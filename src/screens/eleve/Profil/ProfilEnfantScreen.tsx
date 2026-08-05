import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import { getSessionsEnfantFirebase } from '../../../services/firebaseEnfantService';
import { getBadgesDeBloques } from '../../../services/badgesService';
import { feedback } from '../../../services/feedbackService';
import { useTimeTracking } from '../../../hooks/useTimeTracking';
import { useFocusEffect } from '@react-navigation/native';
import AnimatedWrapper from '../../../components/AnimatedWrapper';

export default function ProfilEnfantScreen({ navigation }: any) {
  const { colors, theme, isDark, toggleTheme } = useTheme();
  const { userData, logout } = useAuth();
  const { timeSummary, refresh: refreshTime, loading: timeLoading } = useTimeTracking();
  const [stats, setStats] = useState({
    totalRevisions: 0,
    totalDevoirs: 0,
    serie: 0,
    points: 0,
    moyenne: 0
  });
  const [badgesCount, setBadgesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const loadAll = async () => {
        await refreshTime();
        await chargerDonnees();
      };
      loadAll();
      
      const interval = setInterval(() => {
        refreshTime();
      }, 10000);
      
      return () => clearInterval(interval);
    }, [])
  );

  const chargerDonnees = async () => {
    try {
      setLoading(true);
      
      const sessionsRaw = await getSessionsEnfantFirebase(true);
      const sessions = Array.isArray(sessionsRaw) ? sessionsRaw : [];
      
      // ✅ Moyenne correcte = (points gagnés / points max possibles) × 20
      // Exemple : 3 pts / 22 pts max = 2.7/20
      const _toutesQuestions = (sessions || []).flatMap(s => s.questions || []);
      const _pointsGagnes    = _toutesQuestions.reduce((a, q) => a + (q.note || 0), 0);
      const _pointsMax       = _toutesQuestions.length * 2; // 2 pts max par question
      const moyenneGenerale  = _pointsMax > 0
        ? Math.round((_pointsGagnes / _pointsMax) * 20 * 10) / 10
        : 0;
      
      const totalRevisions = (sessions || []).filter(s => s.type !== 'devoir').length;
      const totalDevoirs = (sessions || []).filter(s => s.type === 'devoir').length;
      const totalQuestions = (sessions || []).reduce((acc, s) => acc + (s.questions?.length || 0), 0);
      const totalPoints = (sessions || []).reduce((acc, s) => acc + (s.scoreTotal || 0), 0);
      const _ptsMax = totalQuestions * 2;
      const moyenne = _ptsMax > 0 ? Math.round((totalPoints / _ptsMax) * 20 * 10) / 10 : 0;

      const datesUniques = [...new Set((sessions || []).map(s => 
        new Date(s.date).toLocaleDateString('fr-FR')
      ))].sort();
      
      let serie = 0;
      if (datesUniques.length > 0) {
        serie = 1;
        for (let i = 1; i < datesUniques.length; i++) {
          // Parser les dates pour éviter l'erreur de soustraction d'objets Date
          const current = new Date(datesUniques[i]).getTime();
          const previous = new Date(datesUniques[i-1]).getTime();
          const diff = (current - previous) / (1000 * 60 * 60 * 24);
          if (diff <= 2) serie++;
          else serie = 1;
        }
      }

      setStats({
        totalRevisions,
        totalDevoirs,
        serie,
        points: totalPoints,
        moyenne
      });
      
      const badges = await getBadgesDeBloques();
      setBadgesCount(badges.length);
      
    } catch (error) {
      console.error('❌ Erreur chargement données profil:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeconnexion = () => {
    feedback('tap');
    Alert.alert(
      '🚪 Déconnexion',
      'Veux-tu vraiment te déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Se déconnecter',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de se déconnecter');
            }
          }
        }
      ]
    );
  };

  const handleVoirBadges = () => {
    feedback('tap');
    navigation.navigate('Badges');
  };

  const handleToggleTheme = () => {
    feedback('tap');
    toggleTheme();
  };

  if (loading || timeLoading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Chargement de ton profil...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <AnimatedWrapper type="slideUp" duration={400}>
        <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {userData?.prenom ? userData.prenom[0].toUpperCase() : '👤'}
              </Text>
            </View>
            <Text style={styles.userName}>{userData?.prenom || 'Élève'}</Text>
            <Text style={styles.userClass}>{userData?.classe || 'Classe non définie'}</Text>
            <Text style={styles.userEmail}>{userData?.email || ''}</Text>
          </View>
        </LinearGradient>
      </AnimatedWrapper>

      {/* SECTION STATISTIQUES DE TEMPS */}
      <AnimatedWrapper type="fade" delay={50}>
        <View style={[styles.timeSection, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>⏱️ TEMPS PASSÉ</Text>
          
          {/* Temps Total - Grand chiffre */}
          <View style={styles.totalTimeCard}>
            <Text style={[styles.totalTimeValue, { color: colors.primary }]}>{timeSummary.global || '0min'}</Text>
            <Text style={[styles.totalTimeLabel, { color: colors.textSecondary }]}>Temps total</Text>
          </View>
          
          {/* Détail des 3 temps */}
          <View style={styles.timeDetailsRow}>
            <View style={styles.timeDetailItem}>
              <View style={[styles.timeIconBg, { backgroundColor: colors.accent + '20' }]}>
                <MaterialCommunityIcons name="book-open" size={20} color={colors.accent} />
              </View>
              <Text style={[styles.timeDetailValue, { color: colors.accent }]}>{timeSummary.revisions || '0min'}</Text>
              <Text style={[styles.timeDetailLabel, { color: colors.textSecondary }]}>Révisions</Text>
            </View>
            
            <View style={styles.timeDetailItem}>
              <View style={[styles.timeIconBg, { backgroundColor: '#FF9800' + '20' }]}>
                <MaterialCommunityIcons name="file-document" size={20} color="#FF9800" />
              </View>
              <Text style={[styles.timeDetailValue, { color: '#FF9800' }]}>{timeSummary.devoirs || '0min'}</Text>
              <Text style={[styles.timeDetailLabel, { color: colors.textSecondary }]}>Devoirs</Text>
            </View>
            
            <View style={styles.timeDetailItem}>
              <View style={[styles.timeIconBg, { backgroundColor: '#2196F3' + '20' }]}>
                <MaterialCommunityIcons name="compass" size={20} color="#2196F3" />
              </View>
              <Text style={[styles.timeDetailValue, { color: '#2196F3' }]}>{timeSummary.navigation || '0min'}</Text>
              <Text style={[styles.timeDetailLabel, { color: colors.textSecondary }]}>Navigation</Text>
            </View>
          </View>
        </View>
      </AnimatedWrapper>

      {/* SECTION MES INFORMATIONS */}
      <AnimatedWrapper type="slide" delay={100}>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>MES INFORMATIONS</Text>
          
          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: colors.primary + '20' }]}>
                <MaterialCommunityIcons name="account" size={20} color={colors.primary} />
              </View>
              <Text style={[styles.menuLabel, { color: colors.text }]}>Mon prénom</Text>
            </View>
            <Text style={[styles.menuValue, { color: colors.textSecondary }]}>{userData?.prenom || 'Non défini'}</Text>
          </View>
          
          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: colors.primary + '20' }]}>
                <MaterialCommunityIcons name="school" size={20} color={colors.primary} />
              </View>
              <Text style={[styles.menuLabel, { color: colors.text }]}>Ma classe</Text>
            </View>
            <Text style={[styles.menuValue, { color: colors.textSecondary }]}>{userData?.classe || 'Non définie'}</Text>
          </View>
          
          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: colors.primary + '20' }]}>
                <MaterialCommunityIcons name="email" size={20} color={colors.primary} />
              </View>
              <Text style={[styles.menuLabel, { color: colors.text }]}>Mon email</Text>
            </View>
            <Text style={[styles.menuValue, { color: colors.textSecondary }]}>{userData?.email || 'Non défini'}</Text>
          </View>
        </View>
      </AnimatedWrapper>

      {/* SECTION MES STATISTIQUES */}
      <AnimatedWrapper type="slide" delay={200}>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>MES STATISTIQUES</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIconBg, { backgroundColor: colors.accent + '20' }]}>
                <MaterialCommunityIcons name="repeat" size={24} color={colors.accent} />
              </View>
              <Text style={[styles.statNumber, { color: colors.text }]}>{stats.totalRevisions}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Révisions</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={[styles.statIconBg, { backgroundColor: colors.primary + '20' }]}>
                <MaterialCommunityIcons name="file-document" size={24} color={colors.primary} />
              </View>
              <Text style={[styles.statNumber, { color: colors.text }]}>{stats.totalDevoirs}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Devoirs</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={[styles.statIconBg, { backgroundColor: colors.warning + '20' }]}>
                <MaterialCommunityIcons name="fire" size={24} color={colors.warning} />
              </View>
              <Text style={[styles.statNumber, { color: colors.text }]}>{stats.serie}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Série</Text>
            </View>
          </View>
          
          <View style={[styles.moyenneContainer, { backgroundColor: colors.primary + '10' }]}>
            <Text style={[styles.moyenneLabel, { color: colors.textSecondary }]}>Moyenne générale (/20)</Text>
            <Text style={[styles.moyenneValeur, { color: colors.primary }]}>{stats.moyenne.toFixed(1)}/20</Text>
          </View>
        </View>
      </AnimatedWrapper>

      {/* SECTION RÉCOMPENSES & COURS */}
      <AnimatedWrapper type="slide" delay={300}>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>RÉCOMPENSES & COURS</Text>
          
          <TouchableOpacity style={styles.menuItem} onPress={handleVoirBadges}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: colors.accent + '20' }]}>
                <MaterialCommunityIcons name="trophy" size={20} color={colors.accent} />
              </View>
              <Text style={[styles.menuLabel, { color: colors.text }]}>Mes badges</Text>
              {badgesCount > 0 && (
                <View style={[styles.badgeCount, { backgroundColor: colors.accent }]}>
                  <Text style={styles.badgeCountText}>{badgesCount}</Text>
                </View>
              )}
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('MesSessionsEleve')}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: colors.primary + '20' }]}>
                <MaterialCommunityIcons name="calendar-clock" size={20} color={colors.primary} />
              </View>
              <Text style={[styles.menuLabel, { color: colors.text }]}>Mes réservations de cours</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </AnimatedWrapper>

      {/* SECTION PARAMÈTRES */}
      <AnimatedWrapper type="slide" delay={400}>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>PARAMÈTRES</Text>
          
          <TouchableOpacity style={styles.menuItem} onPress={handleToggleTheme}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: colors.accent + '20' }]}>
                <MaterialCommunityIcons name={isDark ? 'weather-night' : 'weather-sunny'} size={20} color={colors.accent} />
              </View>
              <Text style={[styles.menuLabel, { color: colors.text }]}>Changer le thème</Text>
            </View>
            <Text style={[styles.menuValue, { color: colors.textSecondary }]}>
              {theme === ('auto' as any) ? 'Automatique' : (isDark ? 'Sombre' : 'Clair')}
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </AnimatedWrapper>

      {/* BOUTON DÉCONNEXION */}
      <AnimatedWrapper type="fade" delay={500}>
        <TouchableOpacity
          style={[styles.deconnexionButton, { backgroundColor: colors.surface }]}
          onPress={handleDeconnexion}
        >
          <MaterialCommunityIcons name="logout" size={20} color={colors.error} />
          <Text style={[styles.deconnexionText, { color: colors.error }]}>Me déconnecter</Text>
        </TouchableOpacity>
      </AnimatedWrapper>

      <Text style={[styles.version, { color: colors.textMuted }]}>Version 1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 20, fontSize: 16 },
  header: { paddingTop: 60, paddingBottom: 30, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  avatarContainer: { alignItems: 'center' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 3, borderColor: 'white' },
  avatarText: { color: 'white', fontSize: 36, fontWeight: 'bold' },
  userName: { color: 'white', fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  userClass: { color: 'white', fontSize: 16, opacity: 0.9 },
  userEmail: { color: 'white', fontSize: 14, opacity: 0.7, marginTop: 4 },
  timeSection: { marginHorizontal: 16, marginTop: 16, borderRadius: 20, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  sectionTitle: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: 12, marginLeft: 4 },
  totalTimeCard: { alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  totalTimeValue: { fontSize: 36, fontWeight: 'bold' },
  totalTimeLabel: { fontSize: 12, marginTop: 4 },
  timeDetailsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  timeDetailItem: { alignItems: 'center', width: '30%' },
  timeIconBg: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  timeDetailValue: { fontSize: 16, fontWeight: 'bold' },
  timeDetailLabel: { fontSize: 10, marginTop: 2, textAlign: 'center' },
  section: { marginHorizontal: 16, marginTop: 16, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  menuIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  menuLabel: { fontSize: 16, flex: 1 },
  menuValue: { fontSize: 14, marginRight: 8, color: '#666' },
  badgeCount: { backgroundColor: '#FF9800', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2, minWidth: 24, alignItems: 'center' },
  badgeCountText: { color: 'white', fontSize: 11, fontWeight: 'bold' },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16 },
  statCard: { alignItems: 'center', width: '30%' },
  statIconBg: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statNumber: { fontSize: 24, fontWeight: 'bold', marginTop: 4 },
  statLabel: { fontSize: 11, marginTop: 2, textAlign: 'center' },
  moyenneContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, marginTop: 8, marginBottom: 16 },
  moyenneLabel: { fontSize: 14 },
  moyenneValeur: { fontSize: 18, fontWeight: 'bold' },
  deconnexionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 16, marginTop: 16, marginBottom: 10, padding: 16, borderRadius: 16, gap: 8 },
  deconnexionText: { fontSize: 16, fontWeight: '600' },
  version: { textAlign: 'center', fontSize: 11, marginVertical: 16 },
});
