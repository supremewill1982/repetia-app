import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator }     from '@react-navigation/stack';
import { MaterialCommunityIcons }   from '@expo/vector-icons';
import { useSafeAreaInsets }        from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useAuth }   from '../context/AuthContext';

import ParentAuthScreen       from '../screens/parent/ParentAuthScreen';
import ParentDashboard        from '../screens/parent/ParentDashboard';
import ParentTimeline         from '../screens/parent/ParentTimeline';
import ParentIACoach          from '../screens/parent/ParentIACoach';
import ParentCoupDePouce      from '../screens/parent/ParentCoupDePouce';
import ParentRapport          from '../screens/parent/ParentRapport';
import ParentLier             from '../screens/parent/ParentLier';
import ParentParametres       from '../screens/parent/ParentParametres';
import ParentSessionDetail    from '../screens/parent/ParentSessionDetail';

const Tab   = createBottomTabNavigator();
const Stack = createStackNavigator();

function ParentTabs() {
  const { colors } = useTheme();
  const insets     = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor:   colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor:  colors.border,
          borderTopWidth:  1,
          paddingBottom:   Math.max(insets.bottom, 8),
          paddingTop:      6,
          height:          58 + Math.max(insets.bottom, 8),
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        headerShown: false,
      }}
    >
      <Tab.Screen name="Dashboard" component={ParentDashboard}
        options={{ tabBarLabel: 'Accueil',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="home-heart" size={size} color={color} /> }} />
      <Tab.Screen name="Timeline" component={ParentTimeline}
        options={{ tabBarLabel: 'Activité',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="timeline-clock" size={size} color={color} /> }} />
      <Tab.Screen name="IACoach" component={ParentIACoach}
        options={{ tabBarLabel: 'IA Coach',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="brain" size={size} color={color} /> }} />
      <Tab.Screen name="CoupDePouce" component={ParentCoupDePouce}
        options={{ tabBarLabel: 'Message',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="hand-heart" size={size} color={color} /> }} />
      <Tab.Screen name="Parametres" component={ParentParametres}
        options={{ tabBarLabel: 'Réglages',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="cog" size={size} color={color} /> }} />
    </Tab.Navigator>
  );
}

export default function ParentNavigator() {
  const { colors }                    = useTheme();
  const { userId, userRole, loading } = useAuth();
  const [loggedIn, setLoggedIn]       = useState(false);

  useEffect(() => {
    setLoggedIn(userRole === 'parent' && !!userId);
  }, [userRole, userId]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!loggedIn ? (
        <Stack.Screen name="ParentAuth" component={ParentAuthScreen} />
      ) : (
        <>
          <Stack.Screen name="ParentMain"    component={ParentTabs} />
          <Stack.Screen name="ParentLier"    component={ParentLier} />
          <Stack.Screen name="ParentRapport" component={ParentRapport} />
          <Stack.Screen name="ParentDetail"  component={ParentSessionDetail} />
        </>
      )}
    </Stack.Navigator>
  );
}
