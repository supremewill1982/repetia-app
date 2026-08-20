import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { saveSessionSecure }        from '../../services/secureStorageService';
import { sauvegarderSessionFirebase } from '../../services/firebaseEnfantService';
import { getMatiereInfoWithFallback } from '../../services/matieresService';
import { offlineQueueService }       from '../../services/offlineQueueService';
import { networkService }            from '../../services/networkService';
import { feedback }                  from '../../services/feedbackService';
import { verifierEtDebloquerBadges } from '../../services/badgesService';
import { checkAndNotifyAfterSession, checkAndNotifySerie } from '../../services/notificationServiceEnhanced';
import Toast            from '../../components/Toast';
import BadgeNotification from '../../components/BadgeNotification';

export default function ResultatRevision({ route, navigation }: any) {
  const { colors }  = useTheme();
  const { userId }  = useAuth();
  const { score, scoreMax, noteSur20: noteSur20Prop, reponses, matiere, type = 'revision' } = route.params || {};

  const [saving, setSaving]             = useState(true);
  const sauvegardeEffectuee = useRef(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType]       = useState<'success'|'error'|'info'>('success');

  // ✅ Gestion badges — file d'attente pour les afficher un par un
  const [badgesQueue, setBadgesQueue]   = useState<any[]>([]);
  const [badgeActuel, setBadgeActuel]   = useState<any>(null);

  // Animations entrée
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  const noteSur20   = noteSur20Prop ?? (scoreMax ? Math.min(20, Math.round((score / scoreMax) * 20)) : 0);
  const matiereInfo = getMatiereInfoWithFallback(matiere || 'Révision');
  const noteColor   = noteSur20 >= 16 ? '#4CAF50' : noteSur20 >= 12 ? '#FF9800' : '#f44336';
  const mention     = noteSur20 >= 18 ? 'Excellent ! 🏆'
    : noteSur20 >= 16 ? 'Très bien ! 🌟'
    : noteSur20 >= 14 ? 'Bien ! 👍'
    : noteSur20 >= 12 ? 'Assez bien'
    : noteSur20 >= 10 ? 'Passable'
    : 'À améliorer 💪';

  useEffect(() => {
    // Animation d'entrée
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }),
    ]).start();

    sauvegarderResultats();
  }, []);

  // ✅ Afficher les badges un par un dès qu'ils arrivent dans la queue
  useEffect(() => {
    if (badgesQueue.length > 0 && !badgeActuel) {
      setBadgeActuel(badgesQueue[0]);
    }
  }, [badgesQueue, badgeActuel]);

  const handleBadgeHide = () => {
    setBadgeActuel(null);
    setBadgesQueue(prev => {
      const reste = prev.slice(1);
      if (reste.length > 0) {
        // Petit délai avant le suivant
        setTimeout(() => setBadgeActuel(reste[0]), 500);
      }
      return reste;
    });
  };

  const sauvegarderResultats = async () => {
    if (sauvegardeEffectuee.current) {
      console.log('⚠️ Sauvegarde déjà effectuée, appel ignoré');
      return;
    }

    sauvegardeEffectuee.current = true;

    try {
      setSaving(true);
      const sessionComplete = {
        enfantId:   userId || 'enfant-test',
        date:       new Date().toISOString(),
        heureDebut: new Date().toISOString(),
        matiere:    matiere || (type === 'devoir' ? 'Devoir' : 'Révision'),
        cours:      type === 'devoir'
          ? 'Devoir du ' + new Date().toLocaleDateString('fr-FR')
          : 'Révision du ' + new Date().toLocaleDateString('fr-FR'),
        type,
        questions: (reponses || []).map((r: any) => ({
          question: r.question || '',
          reponse:  r.reponse  || '',
          note:     typeof r.note === 'number' ? r.note : 0,
          feedback: r.feedback  || '',
          essais:   r.essais    || 1,
        })),
        scoreTotal: score    || 0,
        scoreMax:   scoreMax || (reponses?.length || 0) * 2,
        noteSur20:  noteSur20,
      };

      await saveSessionSecure(sessionComplete);

      const isOnline = await networkService.checkConnection();
      if (isOnline) {
        await sauvegarderSessionFirebase(sessionComplete);
      } else {
        await offlineQueueService.addToQueue(sessionComplete);
      }

        await checkAndNotifyAfterSession(sessionComplete, score, scoreMax, reponses || []);
        await checkAndNotifySerie(0, userId || "", "");

      // ✅ Vérifier badges ICI (dans ResultatRevision, pas dans QuestionRevision)
      const nouveaux = await verifierEtDebloquerBadges();
      if (nouveaux.length > 0) {
        console.log(`🏅 ${nouveaux.length} badge(s) débloqué(s) !`);
        // ✅ Délai pour laisser l'animation d'entrée se terminer avant les badges
        setTimeout(() => {
          setBadgesQueue(nouveaux);
        }, 800);
      }

      setSaving(false);
    } catch (e: any) {
      console.error('Erreur sauvegarde résultats:', e);
      setSaving(false);
      setToastMessage('Erreur de sauvegarde');
      setToastType('error');
      setToastVisible(true);
    }
  };

  const bonnesReponses    = (reponses || []).filter((r: any) => r.note === 2).length;
  const reponsesPartielles = (reponses || []).filter((r: any) => r.note === 1).length;
  const mauvaiseReponses  = (reponses || []).filter((r: any) => r.note === 0).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ✅ Badge animation affichée dans cet écran */}
      <BadgeNotification badge={badgeActuel} onHide={handleBadgeHide} duration={4500} />

      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHide={() => setToastVisible(false)}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Note principale */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }], alignItems: 'center' }}>
          <LinearGradient
            colors={[noteColor, noteColor + 'AA']}
            style={styles.noteCercle}
          >
            <Text style={styles.noteValeur}>{noteSur20}</Text>
            <Text style={styles.noteSur}>/20</Text>
          </LinearGradient>
          <Text style={[styles.mention, { color: noteColor }]}>{mention}</Text>
          <Text style={[styles.matiereTxt, { color: colors.textSecondary }]}>
            {matiereInfo.icone} {matiere || 'Révision'} · {type === 'devoir' ? 'Devoir' : 'Révision'}
          </Text>
        </Animated.View>

        {/* Stats */}
        <Animated.View style={[styles.statsRow, { opacity: fadeAnim }]}>
          <View style={[styles.statBox, { backgroundColor: '#4CAF5020' }]}>
            <Text style={[styles.statVal, { color: '#4CAF50' }]}>{bonnesReponses}</Text>
            <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Bonnes</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: '#FF980020' }]}>
            <Text style={[styles.statVal, { color: '#FF9800' }]}>{reponsesPartielles}</Text>
            <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Partielles</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: '#f4433620' }]}>
            <Text style={[styles.statVal, { color: '#f44336' }]}>{mauvaiseReponses}</Text>
            <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Mauvaises</Text>
          </View>
        </Animated.View>

        {/* Score détaillé */}
        <Animated.View style={[styles.scoreCard, { backgroundColor: colors.surface, opacity: fadeAnim }]}>
          <Text style={[styles.scoreCardTitre, { color: colors.text }]}>Détail du score</Text>
          <View style={styles.scoreBarWrapper}>
            <View style={[styles.scoreBarBg, { backgroundColor: colors.border }]}>
              <View style={[styles.scoreBarFill, { width: `${(score / scoreMax) * 100}%`, backgroundColor: noteColor }]} />
            </View>
            <Text style={[styles.scoreBarLabel, { color: colors.textSecondary }]}>
              {score}/{scoreMax} points
            </Text>
          </View>

          {saving && (
            <View style={styles.savingRow}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.savingTxt, { color: colors.textMuted }]}>Sauvegarde...</Text>
            </View>
          )}
        </Animated.View>

        {/* Détail des réponses */}
        {reponses && reponses.length > 0 && (
          <Animated.View style={[styles.reponsesCard, { backgroundColor: colors.surface, opacity: fadeAnim }]}>
            <Text style={[styles.reponsesCardTitre, { color: colors.text }]}>Tes réponses</Text>
            {reponses.map((r: any, i: number) => (
              <View key={i} style={[styles.reponseRow, { borderBottomColor: colors.border }]}>
                <View style={[styles.reponseBadge, {
                  backgroundColor: r.note === 2 ? '#4CAF5025' : r.note === 1 ? '#FF980025' : '#f4433625',
                }]}>
                  <Text style={[styles.reponseNote, {
                    color: r.note === 2 ? '#4CAF50' : r.note === 1 ? '#FF9800' : '#f44336',
                  }]}>
                    {r.note === 2 ? '✓' : r.note === 1 ? '~' : '✗'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.reponseQuestion, { color: colors.textSecondary }]} numberOfLines={2}>
                    {r.question}
                  </Text>
                  {r.feedback && (
                    <Text style={[styles.reponseFeedback, { color: colors.textMuted }]} numberOfLines={1}>
                      {r.feedback}
                    </Text>
                  )}
                </View>
                <Text style={[styles.reponsePts, { color: colors.text }]}>{r.note}/2</Text>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Boutons */}
        <TouchableOpacity
          style={[styles.btnPrimary, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('ChoixMatiere', { type: 'revision' })}
        >
          <MaterialCommunityIcons name="repeat" size={20} color="#ECEEF3" />
          <Text style={styles.btnPrimaryTxt}>Nouvelle révision</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btnSecondary, { borderColor: colors.border }]}
          onPress={() => navigation.navigate('Main')}
        >
          <Text style={[styles.btnSecondaryTxt, { color: colors.textSecondary }]}>Retour à l'accueil</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40, alignItems: 'center' },
  noteCercle: { width: 140, height: 140, borderRadius: 70, justifyContent: 'center', alignItems: 'center', marginTop: 40, marginBottom: 16, elevation: 8 },
  noteValeur: { fontSize: 52, fontWeight: 'bold', color: 'white' },
  noteSur: { fontSize: 18, color: 'rgba(255,255,255,0.8)', marginTop: -8 },
  mention: { fontSize: 22, fontWeight: 'bold', marginBottom: 6 },
  matiereTxt: { fontSize: 14, marginBottom: 28 },
  statsRow: { flexDirection: 'row', gap: 12, width: '100%', marginBottom: 20 },
  statBox: { flex: 1, borderRadius: 16, padding: 16, alignItems: 'center' },
  statVal: { fontSize: 28, fontWeight: 'bold' },
  statLbl: { fontSize: 12, marginTop: 4 },
  scoreCard: { width: '100%', borderRadius: 20, padding: 20, marginBottom: 20 },
  scoreCardTitre: { fontSize: 16, fontWeight: '700', marginBottom: 16 },
  scoreBarWrapper: { gap: 8 },
  scoreBarBg: { height: 10, borderRadius: 5, overflow: 'hidden' },
  scoreBarFill: { height: '100%', borderRadius: 5 },
  scoreBarLabel: { fontSize: 13, textAlign: 'right' },
  savingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  savingTxt: { fontSize: 13 },
  reponsesCard: { width: '100%', borderRadius: 20, padding: 16, marginBottom: 20 },
  reponsesCardTitre: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
  reponseRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, gap: 10 },
  reponseBadge: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  reponseNote: { fontSize: 16, fontWeight: 'bold' },
  reponseQuestion: { fontSize: 13, lineHeight: 18 },
  reponseFeedback: { fontSize: 11, marginTop: 2, fontStyle: 'italic' },
  reponsePts: { fontSize: 13, fontWeight: '600', width: 28, textAlign: 'right' },
  btnPrimary: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16, borderRadius: 16, marginBottom: 12 },
  btnPrimaryTxt: { color: '#ECEEF3', fontSize: 16, fontWeight: 'bold' },
  btnSecondary: { width: '100%', padding: 14, borderRadius: 16, alignItems: 'center', borderWidth: 1 },
  btnSecondaryTxt: { fontSize: 15 },
});
