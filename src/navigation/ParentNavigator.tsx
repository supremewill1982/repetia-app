import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import ParentDashboard from '../screens/parent/ParentDashboard';
import ParentAuthScreen from '../screens/parent/ParentAuthScreen';
import ParentCoupDePouce from '../screens/parent/ParentCoupDePouce';
import ParentIACoach from '../screens/parent/ParentIACoach';
import ParentLier from '../screens/parent/ParentLier';
import ParentParametres from '../screens/parent/ParentParametres';
import ParentRapport from '../screens/parent/ParentRapport';
import ParentSessionDetail from '../screens/parent/ParentSessionDetail';
import ParentTimeline from '../screens/parent/ParentTimeline';

const Stack = createStackNavigator();

const ParentNavigator = () => {
  const { colors } = useTheme();

  // 🎨 Style commun pour le bouton retour
  const backButton = (navigation: any) => (
    <TouchableOpacity
      onPress={() => navigation.goBack()}
      style={{ marginLeft: 16 }}
    >
      <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
    </TouchableOpacity>
  );

  return (
    <Stack.Navigator
      initialRouteName="ParentDashboard"
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
      {/* Écran principal parent */}
      <Stack.Screen
        name="ParentDashboard"
        component={ParentDashboard}
        options={({ navigation }) => ({
          title: 'RÉPÉTIA Parent',
          headerLeft: () => backButton(navigation),
        })}
      />

      {/* Authentification parent */}
      <Stack.Screen
        name="ParentAuthScreen"
        component={ParentAuthScreen}
        options={({ navigation }) => ({
          title: 'Connexion Parent',
          headerLeft: () => backButton(navigation),
        })}
      />

      {/* Coup de pouce */}
      <Stack.Screen
        name="ParentCoupDePouce"
        component={ParentCoupDePouce}
        options={({ navigation }) => ({
          title: 'Coup de pouce',
          headerLeft: () => backButton(navigation),
        })}
      />

      {/* Coach IA */}
      <Stack.Screen
        name="ParentIACoach"
        component={ParentIACoach}
        options={({ navigation }) => ({
          title: 'Coach IA',
          headerLeft: () => backButton(navigation),
        })}
      />

      {/* Lier enfant */}
      <Stack.Screen
        name="ParentLier"
        component={ParentLier}
        options={({ navigation }) => ({
          title: 'Lier un enfant',
          headerLeft: () => backButton(navigation),
        })}
      />

      {/* Paramètres */}
      <Stack.Screen
        name="ParentParametres"
        component={ParentParametres}
        options={({ navigation }) => ({
          title: 'Paramètres',
          headerLeft: () => backButton(navigation),
        })}
      />

      {/* Rapports */}
      <Stack.Screen
        name="ParentRapport"
        component={ParentRapport}
        options={({ navigation }) => ({
          title: 'Rapports',
          headerLeft: () => backButton(navigation),
        })}
      />

      {/* Détails session */}
      <Stack.Screen
        name="ParentSessionDetail"
        component={ParentSessionDetail}
        options={({ navigation }) => ({
          title: 'Détails Session',
          headerLeft: () => backButton(navigation),
        })}
      />

      {/* Timeline */}
      <Stack.Screen
        name="ParentTimeline"
        component={ParentTimeline}
        options={({ navigation }) => ({
          title: 'Timeline',
          headerLeft: () => backButton(navigation),
        })}
      />
    </Stack.Navigator>
  );
};

export default ParentNavigator;
