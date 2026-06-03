import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, StatusBar } from 'react-native';
import { NavigationContainer }   from '@react-navigation/native';
import { SafeAreaProvider }      from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider, useAuth }   from './src/context/AuthContext';
import EleveNavigator              from './src/navigation/EleveNavigator';
import ParentNavigator             from './src/navigation/ParentNavigator';
import { useAppTimeTracking }      from './src/hooks/useAppTimeTracking';

// ── Wrapper interne (accès aux contextes) ──
function AppInner() {
  const { colors }                    = useTheme();
  const { userRole, userId, loading } = useAuth();
  useAppTimeTracking();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, color: colors.textSecondary, fontSize: 14 }}>
          Chargement...
        </Text>
      </View>
    );
  }

  // ✅ Rendu conditionnel basé sur le rôle — PAS de navigation.navigate()
  if (userRole === 'parent') {
    return <ParentNavigator />;
  }

  // Élève (connecté ou non — EleveNavigator gère l'auth interne)
  return <EleveNavigator initialRoute="Main" />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <NavigationContainer>
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
            <AppInner />
          </NavigationContainer>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
