import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

// Écrans Admin
import ModerationScreen from '../screens/admin/ModerationScreen';
import ReclamationCertificationScreen from '../screens/admin/ReclamationCertificationScreen';

const Stack = createStackNavigator();

function AdminStackNavigator() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="Moderation"
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
        name="Moderation"
        component={ModerationScreen}
        options={{ title: 'Modération' }}
      />
      <Stack.Screen
        name="ReclamationCertification"
        component={ReclamationCertificationScreen}
        options={{ title: 'Réclamations de certification' }}
      />
    </Stack.Navigator>
  );
}

const Tab = createBottomTabNavigator();

function AdminNavigator() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="Moderation"
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
        name="Moderation"
        component={AdminStackNavigator}
        options={{
          tabBarLabel: 'Modération',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="shield-check" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Reclamations"
        component={ReclamationCertificationScreen}
        options={{
          tabBarLabel: 'Réclamations',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="alert-circle" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default AdminNavigator;
