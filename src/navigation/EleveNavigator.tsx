import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator }     from '@react-navigation/stack';
import { MaterialCommunityIcons }   from '@expo/vector-icons';
import { useSafeAreaInsets }        from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useAuth }   from '../context/AuthContext';

// Auth
import ConnexionEnfantScreen   from '../screens/eleve/Auth/ConnexionEnfantScreen';
import InscriptionEnfantScreen from '../screens/eleve/Auth/InscriptionEnfantScreen';

// Tabs
import AccueilEleve       from '../screens/eleve/AccueilEleve';
import DevoirsScreen      from '../screens/eleve/DevoirsScreen';
import RevisionsScreen    from '../screens/eleve/RevisionsScreen';
import ProgressionScreen  from '../screens/eleve/ProgressionScreen';
import ProfilEnfantScreen from '../screens/eleve/Profil/ProfilEnfantScreen';

// Révisions & Devoirs
import ChoixMatiere            from '../screens/eleve/ChoixMatiere';
import PrisePhotoDevoir        from '../screens/eleve/PrisePhotoDevoir';
import PrisePhotoCours         from '../screens/eleve/PrisePhotoCours';
import QuestionDevoirAmeliore  from '../screens/eleve/QuestionDevoirAmeliore';
import QuestionRevision        from '../screens/eleve/QuestionRevision';
import ResultatRevision        from '../screens/eleve/ResultatRevision';
import SaisieManuelleDevoir    from '../screens/eleve/SaisieManuelleDevoir';

// Stats & Historique
import StatistiquesAvancees      from '../screens/eleve/StatistiquesAvancees';
import ToutesMatieresScreen      from '../screens/eleve/ToutesMatieresScreen';
import ToutesQuestionsScreen     from '../screens/eleve/ToutesQuestionsScreen';
import QuestionsParMatiereScreen from '../screens/eleve/QuestionsParMatiereScreen';
import QuestionDetailScreen      from '../screens/eleve/QuestionDetailScreen';
import HistoriqueCompletScreen   from '../screens/eleve/HistoriqueCompletScreen';
import QuestionsEnAttenteScreen  from '../screens/eleve/QuestionsEnAttenteScreen';
import RepriseQuestionScreen     from '../screens/eleve/RepriseQuestionScreen';

// Profil & Partage
import BadgesScreen  from '../screens/eleve/BadgesScreen';
import PartageScreen from '../screens/eleve/partage/PartageScreen';

// IA & Coaching
import CoachIAScreen           from '../screens/eleve/CoachIAScreen';
import RecommandationsIAScreen from '../screens/eleve/RecommandationsIAScreen';

// Premium
import GenererCodeLiaisonScreen from '../screens/eleve/GenererCodeLiaisonScreen';
import AbonnementScreen from '../screens/eleve/AbonnementScreen';

// BacArena
import BacArenaScreen     from '../screens/eleve/BacArenaScreen';
import DuelIAScreen       from '../screens/eleve/DuelIAScreen';
import ResultatDuelScreen from '../screens/eleve/ResultatDuelScreen';

// AudioRévision simple
import AudioRevisionScreen from '../screens/eleve/AudioRevisionScreen';

// AudioRévision Photo (7 écrans)
import AudioPhotoAccueil      from '../screens/eleve/AudioPhoto/AudioPhotoAccueil';
import AudioPhotoFormulaire   from '../screens/eleve/AudioPhoto/AudioPhotoFormulaire';
import AudioPhotoGeneration   from '../screens/eleve/AudioPhoto/AudioPhotoGeneration';
import AudioPhotoResultat     from '../screens/eleve/AudioPhoto/AudioPhotoResultat';
import AudioPhotoBibliotheque from '../screens/eleve/AudioPhoto/AudioPhotoBibliotheque';
import AudioPhotoLecteur      from '../screens/eleve/AudioPhoto/AudioPhotoLecteur';
import AudioPhotoDecouverte   from '../screens/eleve/AudioPhoto/AudioPhotoDecouverte';

// PlanningBac
import PlanningBacScreen from '../screens/eleve/PlanningBacScreen';

// Oracle du Bac
import OracleBacScreen from '../screens/eleve/OracleBacScreen';

// Répétiteurs
import TuteursListeScreen     from '../screens/eleve/TuteursListeScreen';
import TuteurProfilScreen     from '../screens/eleve/TuteurProfilScreen';
import InscriptionTuteurScreen from '../screens/tuteur/InscriptionTuteurScreen';
import TestValidationScreen   from '../screens/tuteur/TestValidationScreen';
import TuteurDashboardScreen  from '../screens/tuteur/TuteurDashboardScreen';
import SubmitRatingScreen     from '../screens/eleve/SubmitRatingScreen';
import MesSessionsEleveScreen from '../screens/eleve/MesSessionsEleveScreen';

// Imports optionnels
let DetailsSessionScreen: any = null;
let QuestionDevoir: any       = null;
try { DetailsSessionScreen = require('../screens/eleve/DetailsSessionScreen').default; } catch {}
try { QuestionDevoir = require('../screens/eleve/QuestionDevoir').default; } catch {}

const Tab   = createBottomTabNavigator();
const Stack = createStackNavigator();

function MainTabs() {
  const { colors } = useTheme();
  const insets     = useSafeAreaInsets();
  const bottomPad  = Math.max(insets.bottom, 8);

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor:   colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor:  colors.border,
          borderTopWidth:  1,
          paddingBottom:   bottomPad,
          paddingTop:      6,
          height:          58 + bottomPad,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginBottom: 2 },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Accueil"
        component={AccueilEleve}
        options={{ tabBarIcon: ({ color, size }) =>
          <MaterialCommunityIcons name="home" size={size} color={color} /> }}
      />
      <Tab.Screen
        name="Devoirs"
        component={DevoirsScreen}
        options={{ tabBarIcon: ({ color, size }) =>
          <MaterialCommunityIcons name="book-open" size={size} color={color} /> }}
      />
      <Tab.Screen
        name="Révisions"
        component={RevisionsScreen}
        options={{ tabBarIcon: ({ color, size }) =>
          <MaterialCommunityIcons name="repeat" size={size} color={color} /> }}
      />
      <Tab.Screen
        name="Progression"
        component={ProgressionScreen}
        options={{ tabBarIcon: ({ color, size }) =>
          <MaterialCommunityIcons name="chart-line" size={size} color={color} /> }}
      />
      <Tab.Screen
        name="Profil"
        component={ProfilEnfantScreen}
        options={{ tabBarIcon: ({ color, size }) =>
          <MaterialCommunityIcons name="account" size={size} color={color} /> }}
      />
    </Tab.Navigator>
  );
}

export default function EleveNavigator({ initialRoute }: { initialRoute: string }) {
  const { colors }                    = useTheme();
  const { userRole, userId, loading } = useAuth();
  const [isLoggedIn, setIsLoggedIn]   = useState(false);

  useEffect(() => {
    setIsLoggedIn(userRole === 'eleve' && !!userId);
  }, [userRole, userId]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, color: colors.textSecondary }}>Chargement...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isLoggedIn ? (
        <>
          <Stack.Screen name="ConnexionEnfant"   component={ConnexionEnfantScreen} />
          <Stack.Screen name="InscriptionEnfant" component={InscriptionEnfantScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabs} />

          {/* Révisions & Devoirs */}
          <Stack.Screen name="ChoixMatiere"           component={ChoixMatiere} />
          <Stack.Screen name="PrisePhotoDevoir"       component={PrisePhotoDevoir} />
          <Stack.Screen name="PrisePhotoCours"        component={PrisePhotoCours} />
          <Stack.Screen name="QuestionDevoirAmeliore" component={QuestionDevoirAmeliore} />
          <Stack.Screen name="QuestionRevision"       component={QuestionRevision} />
          <Stack.Screen name="ResultatRevision"       component={ResultatRevision} />
          <Stack.Screen name="SaisieManuelleDevoir"   component={SaisieManuelleDevoir} />

          {/* Stats & Historique */}
          <Stack.Screen name="StatistiquesAvancees"   component={StatistiquesAvancees} />
          <Stack.Screen name="ToutesMatieres"         component={ToutesMatieresScreen} />
          <Stack.Screen name="ToutesQuestions"        component={ToutesQuestionsScreen} />
          <Stack.Screen name="QuestionsParMatiere"    component={QuestionsParMatiereScreen} />
          <Stack.Screen name="QuestionDetail"         component={QuestionDetailScreen} />
          <Stack.Screen name="HistoriqueComplet"      component={HistoriqueCompletScreen} />
          <Stack.Screen name="QuestionsEnAttente"     component={QuestionsEnAttenteScreen} />
          <Stack.Screen name="RepriseQuestion"        component={RepriseQuestionScreen} />

          {/* Profil & Partage */}
          <Stack.Screen name="Badges"   component={BadgesScreen} />
          <Stack.Screen name="Partage"  component={PartageScreen} />

          {/* IA & Coaching */}
          <Stack.Screen name="CoachIA"           component={CoachIAScreen} />
          <Stack.Screen name="RecommandationsIA" component={RecommandationsIAScreen} />

          {/* Premium */}
          <Stack.Screen name="GenererCodeLiaison" component={GenererCodeLiaisonScreen} />
          <Stack.Screen name="Abonnement" component={AbonnementScreen} />

          {/* BacArena */}
          <Stack.Screen name="BacArena"     component={BacArenaScreen} />
          <Stack.Screen name="DuelIA"       component={DuelIAScreen} />
          <Stack.Screen name="ResultatDuel" component={ResultatDuelScreen} />

          {/* AudioRévision simple */}
          <Stack.Screen name="AudioRevision" component={AudioRevisionScreen} />

          {/* AudioRévision Photo */}
          <Stack.Screen name="AudioPhotoAccueil"      component={AudioPhotoAccueil} />
          <Stack.Screen name="AudioPhotoFormulaire"   component={AudioPhotoFormulaire} />
          <Stack.Screen name="AudioPhotoGeneration"   component={AudioPhotoGeneration}
            options={{ gestureEnabled: false }} />
          <Stack.Screen name="AudioPhotoResultat"     component={AudioPhotoResultat} />
          <Stack.Screen name="AudioPhotoBibliotheque" component={AudioPhotoBibliotheque} />
          <Stack.Screen name="AudioPhotoLecteur"      component={AudioPhotoLecteur} />
          <Stack.Screen name="AudioPhotoDecouverte"   component={AudioPhotoDecouverte} />

          {/* PlanningBac */}
          <Stack.Screen name="PlanningBac" component={PlanningBacScreen} />

          {/* Oracle du Bac */}
          <Stack.Screen name="OracleBac" component={OracleBacScreen} />

           {/* Répétiteurs */}
           <Stack.Screen name="TuteursList"       component={TuteursListeScreen} />
           <Stack.Screen name="TuteurProfil"      component={TuteurProfilScreen} />
           <Stack.Screen name="InscriptionTuteur" component={InscriptionTuteurScreen} />
           <Stack.Screen name="TestValidation"    component={TestValidationScreen} />
           <Stack.Screen name="TuteurDashboard"   component={TuteurDashboardScreen} />
           <Stack.Screen name="SubmitRating"     component={SubmitRatingScreen} />
           <Stack.Screen name="MesSessionsEleve"  component={MesSessionsEleveScreen} />

          {/* Optionnels */}
          {DetailsSessionScreen && (
            <Stack.Screen name="DetailsSessionScreen" component={DetailsSessionScreen} />
          )}
          {QuestionDevoir && (
            <Stack.Screen name="QuestionDevoir" component={QuestionDevoir} />
          )}
        </>
      )}
    </Stack.Navigator>
  );
}
