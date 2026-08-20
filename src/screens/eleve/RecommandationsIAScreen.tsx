import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { getSessionsEnfantFirebase } from '../../services/firebaseEnfantService';
import { getMatiereInfoWithFallback } from '../../services/matieresService';
import { feedback } from '../../services/feedbackService';
import AnimatedWrapper from '../../components/AnimatedWrapper';
import ModernLoader from '../../components/ModernLoader';

const { width } = Dimensions.get('window');
const OPENROUTER_API_KEY = '';
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
interface RecommandationIA {
  analyse: string;
  recommandations: string[];
  encouragement: string;
  objectif: string;
}

interface StatsDetaillees {
  totalRevisions: number;
  totalQuestions: number;
  moyenneGenerale: string;
  serie: number;
  meilleureMatiere: string;
  pireMatiere: string;
  detailsParMatiere: Record<string, { questions: number; points: number; sessions: number }>;
  nbJoursConsecutifs: number;
}


async function genererRecommandationsIA(statsDetaillees: StatsDetaillees) {
  const prompt = `Tu es un professeur particulier bienveillant et expert en pédagogie. L'élève ci-dessous a besoin de conseils personnalisés pour progresser.

Voici ses statistiques détaillées (issues de ses révisions et devoirs) :

${JSON.stringify(statsDetaillees, null, 2)}

**Consignes :**
1. Analyse ses forces (matières où il réussit le mieux, progression récente, série en cours).
2. Identifie ses faiblesses principales (matières en difficulté, types d'erreurs récurrentes, notes faibles).
3. Propose **3 recommandations concrètes et réalisables** pour la semaine prochaine (ex: "Révise les fractions 10 min par jour", "Regarde une vidéo sur la conjugaison", "Fais 2 exercices de calcul mental").
4. Rédige un court message d'encouragement personnalisé (1 ou 2 phrases).
5. Termine par un objectif motivant (progresser de 5% en maths, atteindre 5 jours de série...).

**Format de réponse attendu (JSON uniquement) :**
{
  "analyse": "Texte synthétique (max 150 mots) résumant les points clés.",
  "recommandations": ["recommandation 1", "recommandation 2", "recommandation 3"],
  "encouragement": "message d'encouragement personnalisé",
  "objectif": "objectif concret pour la semaine"
}

Ne donne jamais la réponse en dehors du JSON.`;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',
        messages: [
          { role: 'system', content: 'Tu es un professeur bienveillant. Réponds UNIQUEMENT en JSON valide.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });
    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    const cleaned = content.replace(/```json\s*|\s*```/g, '').trim();
    const jsonMatch = cleaned.match(/\{.*\}/s);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (error) {
    console.error('Erreur génération recommandations IA:', error);
    return null;
  }
}

export default function RecommandationsIAScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
    const [recommandations, setRecommandations] = useState<RecommandationIA | null>(null);
    const [stats, setStats] = useState<StatsDetaillees | null>(null);

  useEffect(() => {
    chargerRecommandations();
  }, []);

  const chargerRecommandations = async () => {
    try {
      setLoading(true);
      const sessions = await getSessionsEnfantFirebase();
      if (sessions.length === 0) {
        setRecommandations({
          analyse: "Commence ta première révision pour obtenir des conseils personnalisés !",
          recommandations: ["Prends une photo de ton cours", "Réponds aux questions générées", "Reviens demain pour continuer"],
          encouragement: "Tu vas y arriver ! 🚀",
          objectif: "Faire 3 révisions cette semaine",
        });
        setLoading(false);
        return;
      }

      // Calculer des stats détaillées
      let totalQuestions = 0, totalPoints = 0;
        const matieresStats: Record<string, { questions: number; points: number; sessions: number }> = {};
      let meilleureMatiere = { nom: '', note: 0 };
      let pireMatiere = { nom: '', note: 2 };
      let progression = 0;
      let serie = 0;
        const datesUniques: string[] = [];

      sessions.forEach(s => {
          const m = s.matiere || 'Général';
        if (!matieresStats[m]) matieresStats[m] = { questions: 0, points: 0, sessions: 0 };
        if (s.questions) {
          s.questions.forEach(q => {
            const note = q.note || 0;
            totalQuestions++;
            totalPoints += note;
            matieresStats[m].questions++;
            matieresStats[m].points += note;
          });
        }
        matieresStats[m].sessions++;
        const d = new Date(s.date).toLocaleDateString();
        if (!datesUniques.includes(d)) datesUniques.push(d);
      });
      datesUniques.sort();
      serie = 1;
      for (let i = 1; i < datesUniques.length; i++) {
          const diff = (new Date(datesUniques[i]).getTime() - new Date(datesUniques[i-1]).getTime()) / (1000 * 3600 * 24);
        if (diff <= 2) serie++;
        else serie = 1;
      }

        for (const [nom, data] of Object.entries(matieresStats) as [string, { questions: number; points: number; sessions: number }][]) {
        const noteMoyenne = data.questions > 0 ? (data.points / data.questions) : 0;
        if (noteMoyenne > meilleureMatiere.note) meilleureMatiere = { nom, note: noteMoyenne };
        if (noteMoyenne < pireMatiere.note) pireMatiere = { nom, note: noteMoyenne };
      }

      const progressionGlobale = totalQuestions > 0 ? ((totalPoints / (totalQuestions * 2)) * 100).toFixed(0) : 0;

      const statsDetaillees = {
        totalRevisions: sessions.length,
        totalQuestions,
        moyenneGenerale: progressionGlobale + '%',
        serie,
        meilleureMatiere: meilleureMatiere.nom || 'Aucune',
        pireMatiere: pireMatiere.nom || 'Aucune',
        detailsParMatiere: matieresStats,
        nbJoursConsecutifs: serie,
      };

      setStats(statsDetaillees);
      const iaResult = await genererRecommandationsIA(statsDetaillees);
      if (iaResult && iaResult.recommandations) {
        setRecommandations(iaResult);
      } else {
        throw new Error('Réponse IA invalide');
      }
    } catch (error) {
      console.error('Erreur chargement recommandations:', error);
      setRecommandations({
        analyse: "L'IA n'a pas pu générer de recommandations pour le moment. Réessaie plus tard.",
        recommandations: ["Continue tes révisions régulièrement", "Concentre-toi sur tes matières les plus difficiles", "N'hésite pas à relire tes cours"],
        encouragement: "Tu progresses, chaque effort compte ! 💪",
        objectif: "Reviens demain pour une nouvelle analyse",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ModernLoader visible={true} type="brain" message="L'IA analyse tes données..." subMessage="Préparation de recommandations personnalisées" />;
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recommandations IA</Text>
        <Text style={styles.headerSubtitle}>Des conseils personnalisés pour progresser</Text>
      </LinearGradient>

      {stats && (
        <AnimatedWrapper type="fade" delay={100}>
          <View style={[styles.statsCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statsTitle, { color: colors.text }]}>📊 Synthèse de ta progression</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}><Text style={[styles.statValue, { color: colors.primary }]}>{stats.totalRevisions}</Text><Text style={styles.statLabel}>Révisions</Text></View>
              <View style={styles.statItem}><Text style={[styles.statValue, { color: colors.primary }]}>{stats.totalQuestions}</Text><Text style={styles.statLabel}>Questions</Text></View>
              <View style={styles.statItem}><Text style={[styles.statValue, { color: colors.primary }]}>{stats.moyenneGenerale}</Text><Text style={styles.statLabel}>Moyenne</Text></View>
              <View style={styles.statItem}><Text style={[styles.statValue, { color: colors.warning }]}>{stats.serie}</Text><Text style={styles.statLabel}>Jours consécutifs</Text></View>
            </View>
            <View style={styles.bestWorst}>
              <Text style={[styles.bestText, { color: colors.success }]}>🏆 Meilleure matière : {stats.meilleureMatiere}</Text>
              <Text style={[styles.worstText, { color: colors.error }]}>⚠️ À travailler : {stats.pireMatiere}</Text>
            </View>
          </View>
        </AnimatedWrapper>
      )}

      {recommandations && (
        <>
          <AnimatedWrapper type="slide" delay={200}>
            <View style={[styles.analyseCard, { backgroundColor: colors.surface }]}>
              <MaterialCommunityIcons name="robot" size={28} color={colors.accent} />
              <Text style={[styles.analyseTitle, { color: colors.text }]}>Analyse IA</Text>
              <Text style={[styles.analyseText, { color: colors.textSecondary }]}>{recommandations.analyse}</Text>
            </View>
          </AnimatedWrapper>

          <AnimatedWrapper type="slide" delay={300}>
            <View style={[styles.recoCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.recoTitle, { color: colors.primary }]}>🎯 Recommandations</Text>
              {recommandations.recommandations.map((rec, idx) => (
                <View key={idx} style={styles.recoItem}>
                  <MaterialCommunityIcons name="lightbulb-on" size={20} color={colors.accent} />
                  <Text style={[styles.recoText, { color: colors.text }]}>{rec}</Text>
                </View>
              ))}
            </View>
          </AnimatedWrapper>

          <AnimatedWrapper type="fade" delay={400}>
            <View style={[styles.encouragementCard, { backgroundColor: colors.primary + '10' }]}>
              <Text style={[styles.encouragementText, { color: colors.primary }]}>{recommandations.encouragement}</Text>
              <Text style={[styles.objectifText, { color: colors.secondary }]}>📅 Objectif : {recommandations.objectif}</Text>
            </View>
          </AnimatedWrapper>
        </>
      )}

      <TouchableOpacity style={[styles.refreshButton, { backgroundColor: colors.surface }]} onPress={chargerRecommandations}>
        <MaterialCommunityIcons name="refresh" size={20} color={colors.primary} />
        <Text style={[styles.refreshText, { color: colors.primary }]}>Actualiser les recommandations</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 50, paddingBottom: 25, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: 'white', marginBottom: 5 },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.9)' },
  statsCard: { margin: 16, padding: 20, borderRadius: 20, alignItems: 'center' },
  statsTitle: { fontSize: 16, fontWeight: '600', marginBottom: 15 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 15 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold' },
  statLabel: { fontSize: 12, marginTop: 4 },
  bestWorst: { width: '100%', marginTop: 8, alignItems: 'center' },
  bestText: { fontSize: 14, fontWeight: '500', marginBottom: 4 },
  worstText: { fontSize: 14, fontWeight: '500' },
  analyseCard: { marginHorizontal: 16, marginBottom: 16, padding: 20, borderRadius: 20, alignItems: 'center' },
  analyseTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 8, marginBottom: 12 },
  analyseText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  recoCard: { marginHorizontal: 16, marginBottom: 16, padding: 20, borderRadius: 20 },
  recoTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  recoItem: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  recoText: { flex: 1, fontSize: 14, lineHeight: 20 },
  encouragementCard: { marginHorizontal: 16, marginBottom: 20, padding: 20, borderRadius: 20, alignItems: 'center' },
  encouragementText: { fontSize: 16, fontWeight: '600', marginBottom: 8, textAlign: 'center' },
  objectifText: { fontSize: 14, fontStyle: 'italic' },
  refreshButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 16, marginBottom: 30, padding: 14, borderRadius: 16, gap: 8 },
  refreshText: { fontSize: 16, fontWeight: '600' },
});
