import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

// Écrans Répétiteur
import ProfilRepetiteurScreen from '../screens/repetiteur/ProfilRepetiteurScreen';
import ContribuerCoursScreen from '../screens/repetiteur/ContribuerCoursScreen';
import MesCoursScreen from '../screens/repetiteur/MesCoursScreen';
import CertificationScreen from '../screens/repetiteur/CertificationScreen';
import ReclamationScreen from '../screens/repetiteur/ReclamationScreen';
import EditContributionScreen from '../screens/repetiteur/EditContributionScreen';
import ContributionDetailsScreen from '../screens/repetiteur/ContributionDetailsScreen';
import DemanderPaiementScreen from '../screens/repetiteur/DemanderPaiementScreen';
import RatingsListScreen from '../screens/repetiteur/RatingsListScreen';
import MesReservationsTuteurScreen from '../screens/repetiteur/MesReservationsTuteurScreen';

// Stack Navigator pour les détails
const Stack = createStackNavigator();

function RepetiteurStackNavigator() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="ProfilRepetiteur"
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.surface,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
          color: colors.text,
        },
      }}
    >
      <Stack.Screen
        name="ProfilRepetiteur"
        component={ProfilRepetiteurScreen}
        options={{ title: 'Mon Profil' }}
      />
      <Stack.Screen
        name="RatingsList"
        component={RatingsListScreen}
        options={{ title: 'Mes Avis' }}
      />
      <Stack.Screen
        name="ContribuerCours"
        component={ContribuerCoursScreen}
        options={{ title: 'Contribuer un cours' }}
      />
      <Stack.Screen
        name="MesCours"
        component={MesCoursScreen}
        options={{ title: 'Mes Contributions' }}
      />
      <Stack.Screen
        name="Certification"
        component={CertificationScreen}
        options={{ title: 'Certification' }}
      />
      <Stack.Screen
        name="Reclamation"
        component={ReclamationScreen}
        options={{ title: 'Réclamation' }}
      />
      <Stack.Screen
        name="EditContribution"
        component={EditContributionScreen}
        options={{ title: 'Modifier la Contribution' }}
      />
      <Stack.Screen
        name="ContributionDetails"
        component={ContributionDetailsScreen}
        options={{ title: 'Détails du Cours' }}
      />
      <Stack.Screen
        name="DemanderPaiement"
        component={DemanderPaiementScreen}
        options={{ title: 'Demander un paiement' }}
      />
      <Stack.Screen
        name="MesReservationsTuteur"
        component={MesReservationsTuteurScreen}
        options={{ title: 'Mes Réservations' }}
      />
    </Stack.Navigator>
  );
}

// Bottom Tab Navigator principal
const Tab = createBottomTabNavigator();

function RepetiteurNavigator() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="Profil"
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 0,
          elevation: 10,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: 4,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Profil"
        component={RepetiteurStackNavigator}
        options={{
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Contribuer"
        component={ContribuerCoursScreen}
        options={{
          tabBarLabel: 'Contribuer',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="file-document-edit" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="MesCours"
        component={MesCoursScreen}
        options={{
          tabBarLabel: 'Mes Cours',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="file-document-multiple" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Certification"
        component={CertificationScreen}
        options={{
          tabBarLabel: 'Certification',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="certificate" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Paiement"
        component={DemanderPaiementScreen}
        options={{
          tabBarLabel: 'Paiement',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="bank-transfer" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Reservations"
        component={MesReservationsTuteurScreen}
        options={{
          tabBarLabel: 'Réservations',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar-clock" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default RepetiteurNavigator;
