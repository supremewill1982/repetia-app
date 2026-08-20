import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { getSessionsEnfantFirebase } from '../../services/firebaseEnfantService';
import { getMatiereInfoWithFallback } from '../../services/matieresService';
import { feedback } from '../../services/feedbackService';
import { getNombreQuestionsEnAttente } from '../../services/pendingQuestionsService';
import { getBadgesDeBloques } from '../../services/badgesService';
import AnimatedWrapper from '../../components/AnimatedWrapper';
import AnimatedCard from '../../components/AnimatedCard';
import ModernLoader from '../../components/ModernLoader';
import NetworkStatus from '../../components/NetworkStatus';
import RecommendationsIA from '../../components/RecommendationsIA';
import QuotaBanner from '../../components/QuotaBanner';

const { width } = Dimensions.get('window');

interface Score {
  matiere: string;
  score: number;
  date: string;
  icone: string;
  couleur: string;
  sessionId: string;
}

interface MatierePrioritaire {
  nom: string;
  note: number;
  progression: number;
  icone: string;
  couleur: string;
}

interface StatsReelles {
  totalSessions: number;
  totalQuestions: number;
  scoreMoyen: number;
}


const DONNEES_DEFAUT = {
  prenom: 'Élève',
  serie: 0,
  revisionJour: { objectif: 3, fait: 0, matieres: [] as string[] },
  statsGlobales: { totalTravaux: 0, points: 0, badgesCount: 0 }
};

export default function AccueilEleve({ navigation }: { navigation: any }) {
  const { colors } = useTheme();
  const { userData } = useAuth();
  const [donnees, setDonnees]                   = useState(DONNEES_DEFAUT);
  const [derniersScores, setDerniersScores]     = useState<Score[]>([]);
  const [matieresPrioritaires, setMatieresPrioritaires] = useState<MatierePrioritaire[]>([]);
  const [statsReelles, setStatsReelles]         = useState<StatsReelles | null>(null);
  const [loading, setLoading]                   = useState(true);
  const [pendingCount, setPendingCount]         = useState(0);
  const [badgesCount, setBadgesCount]           = useState(0);

  useFocusEffect(
    React.useCallback(() => {
      chargerDonnees();
      chargerPendingCount();
      chargerBadgesCount();
    }, [])
  );

  const chargerPendingCount = async () => {
    try { setPendingCount(await getNombreQuestionsEnAttente()); } catch {}
  };

  const chargerBadgesCount = async () => {
    try { setBadgesCount((await getBadgesDeBloques()).length); } catch {}
  };

  const chargerDonnees = async () => {
    try {
      setLoading(true);
      const sessions = await getSessionsEnfantFirebase();

      if (!sessions || sessions.length === 0) {
        setDonnees(prev => ({ ...prev, prenom: String(userData?.prenom) || 'Élève' }));
        setStatsReelles({ totalSessions: 0, totalQuestions: 0, scoreMoyen: 0 });
        setLoading(false);
        return;
      }

      let totalQuestions = 0, totalPoints = 0;
      sessions.forEach(s => {
        if (s.questions && Array.isArray(s.questions)) {
          totalQuestions += s.questions.length;
          s.questions.forEach(q => { if (q && typeof q.note === 'number') totalPoints += q.note; });
        }
      });
      const scoreMoyen = totalQuestions > 0 ? Math.round((totalPoints / (totalQuestions * 2)) * 100) : 0;

        const statsParMatiere: Record<string, { questions: number; points: number }> = {};
      sessions.forEach(session => {
        const matiere = session.matiere || (session.type === 'devoir' ? 'Devoir' : 'Révision');
        if (!statsParMatiere[matiere]) statsParMatiere[matiere] = { questions: 0, points: 0 };
        if (session.questions && Array.isArray(session.questions)) {
          session.questions.forEach(q => {
            if (q && typeof q.note === 'number') {
              statsParMatiere[matiere].questions++;
              statsParMatiere[matiere].points += q.note;
            }
          });
        }
      });

      const derniersScoresCalcules = sessions.slice(-5).reverse().map(session => {
        const scoreSession = session.scoreTotal && session.scoreMax
          ? Math.round((session.scoreTotal / session.scoreMax) * 100) : 0;
        const matiere = session.matiere || (session.type === 'devoir' ? 'Devoir' : 'Révision');
        const matiereInfo = getMatiereInfoWithFallback(matiere);
        return {
          matiere, score: scoreSession,
          date: new Date(session.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
          icone: matiereInfo.icone, couleur: matiereInfo.couleur, sessionId: session.id,
        };
      });
      setDerniersScores(derniersScoresCalcules);

      const matieresPrio = Object.entries(statsParMatiere)
        .map(([nom, data]) => {
          const moyenne    = data.questions > 0 ? data.points / data.questions : 0;
          const progression = data.questions > 0 ? Math.round((data.points / (data.questions * 2)) * 100) : 0;
          const matiereInfo = getMatiereInfoWithFallback(nom);
          return { nom, note: moyenne, progression, icone: matiereInfo.icone, couleur: matiereInfo.couleur };
        })
        .filter(m => m.note < 1.5).sort((a, b) => a.note - b.note).slice(0, 3);
      setMatieresPrioritaires(matieresPrio);

      const datesUniques = [...new Set(sessions.map(s =>
        new Date(s.date).toLocaleDateString('fr-FR')
      ))].sort();
      let serie = datesUniques.length > 0 ? 1 : 0;
      for (let i = 1; i < datesUniques.length; i++) {
        const diff = (new Date(datesUniques[i]).getTime() - new Date(datesUniques[i-1]).getTime()) / (1000*60*60*24);
        if (diff <= 2) serie++; else serie = 1;
      }

      const today = new Date().toLocaleDateString('fr-FR');
      const revisionsAujourdhui = sessions.filter(s =>
        new Date(s.date).toLocaleDateString('fr-FR') === today
      ).length;
      const matieresAujourdhui = [...new Set(
        sessions.filter(s => new Date(s.date).toLocaleDateString('fr-FR') === today)
          .map(s => s.matiere || 'Révision')
      )];

      setDonnees({
        prenom: String(userData?.prenom) || 'Élève',
        serie,
        revisionJour: { objectif: 3, fait: revisionsAujourdhui, matieres: matieresAujourdhui },
        statsGlobales: { totalTravaux: sessions.length, points: totalPoints, badgesCount },
      });
      setStatsReelles({ totalSessions: sessions.length, totalQuestions, scoreMoyen });
    } catch (e) {
      console.error('Erreur chargement:', e);
    } finally {
      setLoading(false);
    }
  };

  const CarteScore = ({ score }: { score: Score }) => (
    <TouchableOpacity
      style={[styles.scoreCard, { backgroundColor: colors.surface }]}
      onPress={() => { feedback('tap'); navigation.navigate('StatistiquesAvancees'); }}
      activeOpacity={0.7}
    >
      <View style={[styles.scoreIcone, { backgroundColor: score.couleur + '20' }]}>
        <MaterialCommunityIcons name={score.icone as any} size={24} color={score.couleur} />
      </View>
      <View style={styles.scoreInfo}>
        <Text style={[styles.scoreMatiere, { color: colors.text }]}>{score.matiere}</Text>
        <Text style={[styles.scoreDate, { color: colors.textSecondary }]}>{score.date}</Text>
      </View>
      <View style={[styles.scoreValeur, { backgroundColor: score.couleur + '20' }]}>
        <Text style={[styles.scoreNombre, { color: score.couleur }]}>{score.score}%</Text>
      </View>
    </TouchableOpacity>
  );

  const CarteMatierePrioritaire = ({ matiere }: { matiere: MatierePrioritaire }) => (
    <TouchableOpacity
      style={[styles.prioritaireCard, { backgroundColor: colors.surface }]}
      onPress={() => { feedback('tap'); navigation.navigate('PrisePhotoCours', { matiere: matiere.nom, type: 'revision' }); }}
      activeOpacity={0.7}
    >
      <View style={styles.prioritaireHeader}>
        <View style={[styles.prioritaireIcone, { backgroundColor: matiere.couleur + '20' }]}>
          <MaterialCommunityIcons name={matiere.icone as any} size={30} color={matiere.couleur} />
        </View>
        <View style={styles.prioritaireInfo}>
          <Text style={[styles.prioritaireNom, { color: colors.text }]}>{matiere.nom}</Text>
          <Text style={[styles.prioritaireNote, { color: colors.textSecondary }]}>
            Note moyenne: {matiere.note.toFixed(1)}/2
          </Text>
        </View>
      </View>
      <View style={styles.prioritaireProgress}>
        <View style={styles.prioritaireProgressBar}>
          <View style={[styles.prioritaireProgressFill,
            { width: `${matiere.progression}%`, backgroundColor: matiere.couleur }]} />
        </View>
        <Text style={[styles.prioritaireProgressionTexte, { color: matiere.couleur }]}>
          {matiere.progression}%
        </Text>
      </View>
      <View style={[styles.prioritaireBouton, { backgroundColor: matiere.couleur }]}>
        <Text style={styles.prioritaireBoutonTexte}>Réviser maintenant</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <>
        <ModernLoader visible type="book" message="Chargement..." subMessage="Préparation du tableau de bord" />
        <NetworkStatus />
      </>
    );
  }

  return (
    <>
      <NetworkStatus />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── En-tête ── */}
        <AnimatedWrapper type="slideUp" delay={100}>
          <View style={styles.header}>
            <View>
              <Text style={[styles.bienvenue, { color: colors.textSecondary }]}>Bonjour,</Text>
              <Text style={[styles.prenom, { color: colors.text }]}>{donnees.prenom} !</Text>
              {statsReelles && statsReelles.totalSessions > 0 && (
                <Text style={[styles.statsReelles, { color: colors.primary }]}>
                  {statsReelles.totalSessions} travaux • {statsReelles.scoreMoyen}% moyen
                </Text>
              )}
            </View>
            <TouchableOpacity style={styles.avatar} onPress={() => navigation.navigate('Profil')}>
              <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.avatarGradient}>
                <Text style={styles.avatarTexte}>{donnees.prenom[0]}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </AnimatedWrapper>

        {/* ── Questions en attente ── */}
        {pendingCount > 0 && (
          <AnimatedWrapper type="slide" delay={150}>
            <TouchableOpacity
              style={[styles.pendingButton, { backgroundColor: colors.warning + '15', borderColor: colors.warning }]}
              onPress={() => navigation.navigate('QuestionsEnAttente')}
            >
              <MaterialCommunityIcons name="clock-alert" size={20} color={colors.warning} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.pendingTitle, { color: colors.text }]}>Questions à reprendre</Text>
                <Text style={[styles.pendingSubtitle, { color: colors.textMuted }]}>
                  {pendingCount} question{pendingCount > 1 ? 's' : ''} en attente
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </AnimatedWrapper>
        )}

        {/* ── Travaux du jour + Série ── */}
        <AnimatedWrapper type="scale" delay={200}>
          <View style={styles.cartesLigne}>
            <LinearGradient colors={['#7BA89A', '#5A8A7A']} style={styles.revisionJourCard}>
              <View style={styles.revisionJourHeader}>
                <Text style={styles.revisionJourTitre}>Travaux du jour</Text>
                <Text style={styles.revisionJourCompteur}>
                  {donnees.revisionJour.fait}/{donnees.revisionJour.objectif}
                </Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBarFill, {
                  width: `${(donnees.revisionJour.fait / donnees.revisionJour.objectif) * 100}%`
                }]} />
              </View>
              {donnees.revisionJour.matieres.length > 0 && (
                <Text style={styles.revisionJourMatieres}>
                  {donnees.revisionJour.matieres.join(', ')}
                </Text>
              )}
            </LinearGradient>
            <LinearGradient colors={['#8A9AAA', '#6A7A8A']} style={styles.serieCard}>
              <View style={styles.serieContent}>
                <MaterialCommunityIcons name="fire" size={28} color="white" />
                <Text style={styles.serieNombre}>{donnees.serie}</Text>
                <Text style={styles.serieLabel}>jours</Text>
              </View>
            </LinearGradient>
          </View>
        </AnimatedWrapper>

        {/* ── Partage avec le parent ── */}
        <AnimatedWrapper type="slide" delay={300}>
          <TouchableOpacity
            onPress={() => {
              feedback('tap');
              navigation.navigate('GenererCodeLiaison');
            }}
            activeOpacity={0.85}
            style={{
              marginHorizontal: 16,
              marginTop: 16,
              marginBottom: 8,
              borderRadius: 18,
              overflow: 'hidden',
              elevation: 4,
              shadowOpacity: 0.15,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 3 },
            }}
          >
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              style={{
                paddingVertical: 17,
                paddingHorizontal: 18,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: 'rgba(255,255,255,0.20)',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 14,
                }}
              >
                <MaterialCommunityIcons
                  name="account-heart"
                  size={27}
                  color="white"
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: 'white',
                    fontSize: 17,
                    fontWeight: '800',
                    marginBottom: 3,
                  }}
                >
                  Partager avec mon parent
                </Text>
                <Text
                  style={{
                    color: 'rgba(255,255,255,0.90)',
                    fontSize: 13,
                    lineHeight: 18,
                  }}
                >
                  Génère ton code de liaison en quelques secondes
                </Text>
              </View>

              <MaterialCommunityIcons
                name="chevron-right"
                size={28}
                color="white"
              />
            </LinearGradient>
          </TouchableOpacity>
        </AnimatedWrapper>

        {/* ── Quota Premium ── */}
        <QuotaBanner onPremiumPress={() => navigation.navigate('Abonnement')} />

        {/* ── Derniers scores ── */}
        {derniersScores.length > 0 && (
          <AnimatedWrapper type="slide" delay={400}>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitre, { color: colors.text }]}>Derniers scores</Text>
                <TouchableOpacity onPress={() => navigation.navigate('HistoriqueComplet')}>
                  <Text style={[styles.sectionLien, { color: colors.primary }]}>Voir tout →</Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {derniersScores.map((score, i) => (
                  <AnimatedCard key={i} delay={i * 100}>
                    <CarteScore score={score} />
                  </AnimatedCard>
                ))}
              </ScrollView>
            </View>
          </AnimatedWrapper>
        )}

        {/* ── Matières prioritaires ── */}
        {matieresPrioritaires.length > 0 && (
          <AnimatedWrapper type="slide" delay={500}>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitre, { color: colors.text }]}>À réviser en priorité</Text>
                <TouchableOpacity onPress={() => navigation.navigate('ToutesMatieres')}>
                  <Text style={[styles.sectionLien, { color: colors.primary }]}>Tout voir →</Text>
                </TouchableOpacity>
              </View>
              {matieresPrioritaires.map((matiere, i) => (
                <CarteMatierePrioritaire key={i} matiere={matiere} />
              ))}
            </View>
          </AnimatedWrapper>
        )}

        {/* ── Recommandations IA ── */}
        <RecommendationsIA navigation={navigation} />

        {/* ── Statistiques globales ── */}
        <AnimatedWrapper type="fade" delay={700}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitre, { color: colors.text }]}>Tes statistiques</Text>
            <View style={styles.statsGrid}>
              {[
                { icon: 'book-open-variant', val: donnees.statsGlobales.totalTravaux, label: 'Travaux',  color: colors.primary },
                { icon: 'star',              val: `${statsReelles?.scoreMoyen || 0}%`, label: 'Moyenne', color: colors.primary },
                { icon: 'fire',              val: donnees.serie,                        label: 'Série',   color: colors.warning },
                { icon: 'trophy',            val: badgesCount,                          label: 'Badges',  color: colors.success },
              ].map(({ icon, val, label, color }) => (
                <View key={label} style={[styles.statBloc, { backgroundColor: colors.surface }]}>
                  <MaterialCommunityIcons name={icon as any} size={22} color={color} />
                  <Text style={[styles.statValeur, { color: colors.text }]}>{val}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
                </View>
              ))}
            </View>
          </View>
        </AnimatedWrapper>

        {/* ══════════════════════════════════════
            ── Grille 2×2 fonctionnalités ──
        ══════════════════════════════════════ */}
        <View style={styles.gridSection}>
          <Text style={[styles.sectionTitre, { color: colors.text, marginBottom: 14 }]}>
            Fonctionnalités
          </Text>
          <View style={styles.featuresGrid}>
            {[
              { icon:'🎧', label:'AudioRévision', sub:'Photo → Podcast',  route:'AudioPhotoAccueil', bg:'#EEF7F3', color:'#5A8A7A' },
              { icon:'🔮', label:'Oracle du Bac', sub:'Sujets probables', route:'OracleBac',          bg:'#EEEEF8', color:'#6A7A9A' },
              { icon:'⚔️', label:'BacArena',      sub:'Défie KEBA',       route:'BacArena',            bg:'#F3EEF7', color:'#7A6A9A' },
              { icon:'👩‍🏫', label:'Répétiteurs',  sub:'Sessions live',   route:'TuteursList',         bg:'#EEF3F7', color:'#5A7A9A' },
            ].map((item, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.featureCard, { backgroundColor: item.bg }]}
                onPress={() => navigation.navigate(item.route)}
                activeOpacity={0.8}
              >
                <Text style={styles.featureEmoji}>{item.icon}</Text>
                <Text style={[styles.featureLabel, { color: item.color }]}>{item.label}</Text>
                <Text style={styles.featureSub}>{item.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ══════════════════════════════════════
            ── Bouton Coach IA ──
        ══════════════════════════════════════ */}
        <View style={styles.coachWrapper}>
          <TouchableOpacity
            style={styles.coachButton}
            onPress={() => navigation.navigate('CoachIA')}
            activeOpacity={0.85}
          >
            <View style={[styles.coachIconCircle, { backgroundColor: colors.primary }]}>
              <MaterialCommunityIcons name="robot" size={26} color="white" />
            </View>
            <View style={styles.coachCenter}>
              <Text style={[styles.coachTitle, { color: colors.text }]}>Coach IA</Text>
              <Text style={[styles.coachSub, { color: colors.textMuted }]}>
                Pose ta question à ton prof IA
              </Text>
            </View>
            <View style={[styles.coachArrow, { backgroundColor: colors.primary + '20' }]}>
              <MaterialCommunityIcons name="arrow-right" size={18} color={colors.primary} />
            </View>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  /* Header */
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20,
  },
  bienvenue: { fontSize: 14 },
  prenom:    { fontSize: 26, fontWeight: '800' },
  statsReelles: { fontSize: 11, marginTop: 4 },
  avatar:    { width: 48, height: 48, borderRadius: 24, overflow: 'hidden' },
  avatarGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  avatarTexte:    { color: 'white', fontSize: 20, fontWeight: 'bold' },

  /* Pending */
  pendingButton: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 20, marginBottom: 16,
    padding: 14, borderRadius: 16, borderWidth: 1,
  },
  pendingTitle:    { fontSize: 14, fontWeight: '700' },
  pendingSubtitle: { fontSize: 11, marginTop: 2 },

  /* Cartes jour + série */
  cartesLigne: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 20 },
  revisionJourCard: { flex: 2, borderRadius: 20, padding: 16 },
  revisionJourHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  revisionJourTitre:    { fontSize: 13, fontWeight: '600', color: 'white', opacity: 0.9 },
  revisionJourCompteur: { fontSize: 18, fontWeight: 'bold', color: 'white' },
  revisionJourMatieres: { fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 8 },
  progressBarContainer: { height: 6, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 3 },
  progressBarFill: { height: '100%', backgroundColor: 'white', borderRadius: 3 },
  serieCard: { flex: 1, borderRadius: 20, padding: 14, justifyContent: 'center' },
  serieContent: { alignItems: 'center' },
  serieNombre: { fontSize: 26, fontWeight: 'bold', color: 'white' },
  serieLabel:  { fontSize: 11, color: 'rgba(255,255,255,0.8)' },

  /* Sections */
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
  },
  sectionTitre: { fontSize: 17, fontWeight: '700' },
  sectionLien:  { fontSize: 13, fontWeight: '500' },

  /* Score cards */
  scoreCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 16, padding: 12, marginRight: 10, width: 240,
    shadowColor: '#2B3A4A', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  scoreIcone: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  scoreInfo:  { flex: 1 },
  scoreMatiere: { fontSize: 14, fontWeight: '600' },
  scoreDate:    { fontSize: 11, marginTop: 2 },
  scoreValeur:  { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  scoreNombre:  { fontSize: 14, fontWeight: '700' },

  /* Matière prioritaire */
  prioritaireCard: {
    borderRadius: 16, padding: 14, marginBottom: 10,
    shadowColor: '#2B3A4A', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  prioritaireHeader:   { flexDirection: 'row', marginBottom: 10 },
  prioritaireIcone:    { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  prioritaireInfo:     { flex: 1 },
  prioritaireNom:      { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  prioritaireNote:     { fontSize: 12 },
  prioritaireProgress: { marginBottom: 10 },
  prioritaireProgressBar:     { height: 5, backgroundColor: '#E8ECF2', borderRadius: 3, marginBottom: 4 },
  prioritaireProgressFill:    { height: '100%', borderRadius: 3 },
  prioritaireProgressionTexte: { fontSize: 11, fontWeight: '600', textAlign: 'right' },
  prioritaireBouton:    { paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  prioritaireBoutonTexte: { color: 'white', fontSize: 13, fontWeight: '600' },

  /* Stats globales */
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  statBloc: {
    width: '47%', borderRadius: 16, padding: 14, alignItems: 'center',
    shadowColor: '#2B3A4A', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  statValeur: { fontSize: 22, fontWeight: '800', marginTop: 6 },
  statLabel:  { fontSize: 11, marginTop: 3 },

  /* ── Grille 2×2 ── */
  gridSection: { paddingHorizontal: 20, marginBottom: 20 },
  featuresGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
  },
  featureCard: {
    width: '47%', borderRadius: 20, padding: 18,
    alignItems: 'center', gap: 6,
    shadowColor: '#2B3A4A', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  featureEmoji: { fontSize: 32 },
  featureLabel: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  featureSub:   { fontSize: 10, color: '#8A9AAA', textAlign: 'center' },

  /* ── Coach IA ── */
  coachWrapper: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  coachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    gap: 14,
    shadowColor: '#2B3A4A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#DDE1E8',
  },
  coachIconCircle: {
    width: 52, height: 52, borderRadius: 26,
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },
  coachCenter: { flex: 1 },
  coachTitle: { fontSize: 17, fontWeight: '700' },
  coachSub:   { fontSize: 12, marginTop: 3 },
  coachArrow: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
  },
});
