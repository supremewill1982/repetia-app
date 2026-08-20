import { View, Text } from "react-native";
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

// Écrans Établissement
import DashboardEtablissementScreen from '../screens/etablissement/DashboardEtablissementScreen';
import GestionElevesScreen from '../screens/etablissement/GestionElevesScreen';
import GestionProfesseursScreen from '../screens/etablissement/GestionProfesseursScreen';
import GestionCoursScreen from '../screens/etablissement/GestionCoursScreen';
import FinanceScreen from '../screens/etablissement/FinanceScreen';
import RapportsIAScreen from '../screens/etablissement/RapportsIAScreen';
import ContributionDetailsScreen from '../screens/repetiteur/ContributionDetailsScreen';

// Écrans de détails
const EleveDetailsScreen = ({ navigation, route }: any) => {
  const { colors } = useTheme();
  const { eleve } = route.params;
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: 20 }}>
      <Text style={{ color: colors.text, fontSize: 24, fontWeight: 'bold' }}>
        {eleve.nom} {eleve.prenom}
      </Text>
      <Text style={{ color: colors.textMuted, marginTop: 8 }}>
        Classe: {eleve.classe}
      </Text>
      <Text style={{ color: colors.textMuted, marginTop: 4 }}>
        Email: {eleve.email}
      </Text>
      <Text style={{ color: colors.textMuted, marginTop: 4 }}>
        Téléphone: {eleve.telephone}
      </Text>
      <Text style={{ color: colors.textMuted, marginTop: 4 }}>
        Inscrit le: {eleve.date_inscription}
      </Text>
    </View>
  );
};

const ProfesseurDetailsScreen = ({ navigation, route }: any) => {
  const { colors } = useTheme();
  const { professeur } = route.params;
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: 20 }}>
      <Text style={{ color: colors.text, fontSize: 24, fontWeight: 'bold' }}>
        {professeur.nom} {professeur.prenom}
      </Text>
      <Text style={{ color: colors.textMuted, marginTop: 8 }}>
        Matières: {professeur.matieres.join(', ')}
      </Text>
      <Text style={{ color: colors.textMuted, marginTop: 4 }}>
        Niveau: {professeur.niveau}
      </Text>
      <Text style={{ color: colors.textMuted, marginTop: 4 }}>
        Email: {professeur.email}
      </Text>
      <Text style={{ color: colors.textMuted, marginTop: 4 }}>
        Téléphone: {professeur.telephone}
      </Text>
    </View>
  );
};

const EditEleveScreen = ({ navigation, route }: any) => {
  const { colors } = useTheme();
  const { eleve } = route.params;
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: 20 }}>
      <Text style={{ color: colors.text, fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>
        Modifier l'élève
      </Text>
    </View>
  );
};

const EditProfesseurScreen = ({ navigation, route }: any) => {
  const { colors } = useTheme();
  const { professeur } = route.params;
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: 20 }}>
      <Text style={{ color: colors.text, fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>
        Modifier le professeur
      </Text>
    </View>
  );
};

const RapportDetailsScreen = ({ navigation, route }: any) => {
  const { colors } = useTheme();
  const { rapport } = route.params;
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: 20 }}>
      <Text style={{ color: colors.text, fontSize: 20, fontWeight: 'bold' }}>
        {rapport.titre}
      </Text>
      <Text style={{ color: colors.textMuted, marginTop: 8 }}>
        {rapport.description}
      </Text>
      <Text style={{ color: colors.textMuted, marginTop: 4 }}>
        Date: {rapport.date.toLocaleDateString('fr-FR')}
      </Text>
    </View>
  );
};

// Stack Navigator pour les détails
const Stack = createStackNavigator();

function EtablissementStackNavigator() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="DashboardEtablissement"
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
        name="DashboardEtablissement"
        component={DashboardEtablissementScreen}
        options={{ title: 'Tableau de bord' }}
      />
      <Stack.Screen
        name="GestionEleves"
        component={GestionElevesScreen}
        options={{ title: 'Gestion des Élèves' }}
      />
      <Stack.Screen
        name="GestionProfesseurs"
        component={GestionProfesseursScreen}
        options={{ title: 'Gestion des Professeurs' }}
      />
      <Stack.Screen
        name="GestionCours"
        component={GestionCoursScreen}
        options={{ title: 'Gestion des Cours' }}
      />
      <Stack.Screen
        name="Finance"
        component={FinanceScreen}
        options={{ title: 'Finances' }}
      />
      <Stack.Screen
        name="RapportsIA"
        component={RapportsIAScreen}
        options={{ title: 'Rapports IA' }}
      />
      <Stack.Screen
        name="EleveDetails"
        component={EleveDetailsScreen}
        options={{ title: 'Détails de l\'Élève' }}
      />
      <Stack.Screen
        name="ProfesseurDetails"
        component={ProfesseurDetailsScreen}
        options={{ title: 'Détails du Professeur' }}
      />
      <Stack.Screen
        name="EditEleve"
        component={EditEleveScreen}
        options={{ title: 'Modifier l\'Élève' }}
      />
      <Stack.Screen
        name="EditProfesseur"
        component={EditProfesseurScreen}
        options={{ title: 'Modifier le Professeur' }}
      />
      <Stack.Screen
        name="RapportDetails"
        component={RapportDetailsScreen}
        options={{ title: 'Détails du Rapport' }}
      />
      <Stack.Screen
        name="ContributionDetails"
        component={ContributionDetailsScreen}
        options={{ title: 'Détails du Cours' }}
      />
    </Stack.Navigator>
  );
}

// Bottom Tab Navigator principal
const Tab = createBottomTabNavigator();

function EtablissementNavigator() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
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
        name="Dashboard"
        component={EtablissementStackNavigator}
        options={{
          tabBarLabel: 'Accueil',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Eleves"
        component={GestionElevesScreen}
        options={{
          tabBarLabel: 'Élèves',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-group" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Professeurs"
        component={GestionProfesseursScreen}
        options={{
          tabBarLabel: 'Professeurs',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-tie" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Cours"
        component={GestionCoursScreen}
        options={{
          tabBarLabel: 'Cours',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="file-document-multiple" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Finances"
        component={FinanceScreen}
        options={{
          tabBarLabel: 'Finances',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="currency-usd" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default EtablissementNavigator;
