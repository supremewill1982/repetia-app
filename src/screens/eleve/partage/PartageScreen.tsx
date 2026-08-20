import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Share,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import { getCodeLiaison, genererCodeLiaison, getSessionsEnfantFirebase, getInfosEnfant } from '../../../services/firebaseEnfantService';
import { useFocusEffect } from '@react-navigation/native';

export default function PartageScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { userId } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      chargerDonnees();
    }, [])
  );

  const chargerDonnees = async () => {
    try {
      setLoading(true);
      setError('');
      
      const codeExistant = await getCodeLiaison();
      if (codeExistant) {
        setCode(codeExistant);
      } else {
        const nouveauCode = await genererCodeLiaison();
        if (nouveauCode) setCode(nouveauCode);
      }
      
      // Récupérer les vraies sessions depuis Firebase
      const sessions = await getSessionsEnfantFirebase(true);
      const infos = await getInfosEnfant();
      
      const totalSessions = sessions.length;
      let totalPoints = 0;
      let totalQuestions = 0;
      
      sessions.forEach(s => {
        if (s.questions) {
          totalQuestions += s.questions.length;
          s.questions.forEach(q => {
            totalPoints += (q.note || 0);
          });
        }
      });
      
      const moyenne = totalQuestions > 0 
        ? Math.round((totalPoints / (totalQuestions * 2)) * 100) 
        : 0;
      
      const dernieresSessions = sessions.slice(0, 3).map(s => ({
        date: new Date(s.date).toLocaleDateString('fr-FR'),
        matiere: s.matiere || 'Général',
        score: s.scoreTotal ? Math.round((s.scoreTotal / (s.scoreMax || 1)) * 100) : 0
      }));
      
      setStats({ 
        totalSessions, 
        totalQuestions, 
        moyenne,
        dernieresSessions,
        prenom: infos?.prenom || 'Élève'
      });
    } catch (error) {
      console.error('Erreur chargement:', error);
      setError('Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  const genererNouveauCode = async () => {
    Alert.alert(
      '🔄 Générer un nouveau code',
      'Cela invalidera l\'ancien code. Les parents devront utiliser le nouveau.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Générer',
          onPress: async () => {
            try {
              setLoading(true);
              const nouveauCode = await genererCodeLiaison();
              if (nouveauCode) {
                setCode(nouveauCode);
                Alert.alert('✅ Succès', `Nouveau code : ${nouveauCode}`);
              }
            } catch (error) {
              Alert.alert('❌ Erreur', 'Impossible de générer le code');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const partagerCode = async () => {
    try {
      await Share.share({
        message: `📚 Rejoins ${stats?.prenom || 'mon enfant'} sur Mon Répétiteur pour suivre ses progrès !\n\n📊 Ses statistiques : ${stats?.totalSessions || 0} travaux • ${stats?.moyenne || 0}% de moyenne\n\n🔑 Code de liaison : ${code}`,
        title: 'Invitation à suivre mes révisions'
      });
    } catch (error) {
      console.error('Erreur partage:', error);
    }
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.texteChargement, { color: colors.text }]}>Chargement...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitre, { color: colors.text }]}>👨‍👩‍👧 Partage parents</Text>
        <TouchableOpacity onPress={chargerDonnees}>
          <MaterialCommunityIcons name="refresh" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.codeCard}
      >
        <Text style={styles.codeTitre}>🔗 Ton code unique</Text>
        <View style={styles.codeContainer}>
          <Text style={styles.codeTexte}>{code || 'Génération...'}</Text>
        </View>
        <Text style={styles.codeDescription}>
          Donne ce code à tes parents pour qu'ils puissent suivre ta progression
        </Text>
        
        <View style={styles.codeActions}>
          <TouchableOpacity style={styles.codeButton} onPress={partagerCode}>
            <MaterialCommunityIcons name="share" size={20} color="white" />
            <Text style={styles.codeButtonTexte}>Partager</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.codeButton, styles.codeButtonOutline]} 
            onPress={genererNouveauCode}
          >
            <MaterialCommunityIcons name="refresh" size={20} color={colors.primary} />
            <Text style={styles.codeButtonTexte}>Nouveau</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {stats && (
        <View style={[styles.statsCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.statsTitre, { color: colors.text }]}>📊 Statistiques</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statValeur, { color: colors.primary }]}>{stats.totalSessions}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>travaux</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValeur, { color: colors.accent }]}>{stats.totalQuestions}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>questions</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValeur, { color: colors.success }]}>{stats.moyenne}%</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>moyenne</Text>
            </View>
          </View>
          
          {stats.dernieresSessions.length > 0 && (
            <View style={styles.lastSessions}>
              <Text style={[styles.lastSessionsTitle, { color: colors.textSecondary }]}>Derniers travaux :</Text>
              {stats.dernieresSessions.map((s: any, i: number) => (
                <Text key={i} style={[styles.lastSessionItem, { color: colors.textMuted }]}>
                  • {s.date} - {s.matiere} : {s.score}%
                </Text>
              ))}
            </View>
          )}
        </View>
      )}

      <View style={[styles.confidentialiteCard, { backgroundColor: colors.surface }]}>
        <MaterialCommunityIcons name="shield-lock" size={24} color={colors.primary} />
        <View style={styles.confidentialiteTexte}>
          <Text style={[styles.confidentialiteTitre, { color: colors.text }]}>🔒 Confidentialité</Text>
          <Text style={[styles.confidentialiteDescription, { color: colors.textSecondary }]}>
            Tes parents verront tes statistiques globales pour mieux t'aider.
          </Text>
        </View>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  texteChargement: { marginTop: 20, fontSize: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20 },
  headerTitre: { fontSize: 18, fontWeight: 'bold' },
  codeCard: { marginHorizontal: 20, marginBottom: 20, padding: 20, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  codeTitre: { color: 'white', fontSize: 16, fontWeight: '600', marginBottom: 15, opacity: 0.9 },
  codeContainer: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 15, borderRadius: 10, marginBottom: 15, alignItems: 'center' },
  codeTexte: { color: 'white', fontSize: 28, fontWeight: 'bold', letterSpacing: 2 },
  codeDescription: { color: 'white', fontSize: 14, marginBottom: 20, textAlign: 'center', opacity: 0.9 },
  codeActions: { flexDirection: 'row', justifyContent: 'space-around' },
  codeButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10, gap: 8 },
  codeButtonOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'white' },
  codeButtonTexte: { color: 'white', fontSize: 14, fontWeight: '600' },
  statsCard: { marginHorizontal: 20, marginBottom: 20, padding: 20, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  statsTitre: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statValeur: { fontSize: 28, fontWeight: 'bold' },
  statLabel: { fontSize: 12, marginTop: 4 },
  lastSessions: { marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#eee' },
  lastSessionsTitle: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
  lastSessionItem: { fontSize: 11, marginBottom: 4 },
  confidentialiteCard: { marginHorizontal: 20, marginBottom: 30, padding: 20, borderRadius: 20, flexDirection: 'row', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  confidentialiteTexte: { flex: 1, marginLeft: 12 },
  confidentialiteTitre: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  confidentialiteDescription: { fontSize: 13, lineHeight: 18 },
});
