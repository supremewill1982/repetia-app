import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import AuthNavigator from './src/navigation/AuthNavigator';
import RepetiteurNavigator from './src/navigation/RepetiteurNavigator';
import EtablissementNavigator from './src/navigation/EtablissementNavigator';
import AdminNavigator from './src/navigation/AdminNavigator';
import ParentNavigator from './src/navigation/ParentNavigator';
import EleveNavigator from './src/navigation/EleveNavigator';
import { View, ActivityIndicator } from 'react-native';

// Composant principal de l'application
function AppContent() {
  const { user, loading } = useAuth();
  const { colors } = useTheme();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={colors.mode === 'dark' ? 'light' : 'dark'} />
      <NavigationContainer>
        {user ? (
          user.role === 'admin' ? (
            <AdminNavigator />
          ) : user.role === 'etablissement' ? (
            <EtablissementNavigator />
          ) : user.role === 'repetiteur' ? (
            <RepetiteurNavigator />
          ) : user.role === 'parent' ? (
            <ParentNavigator />
          ) : (
            <EleveNavigator />  // ✅ Rôle par défaut : élève
          )
        ) : (
          <AuthNavigator />
        )}
      </NavigationContainer>
    </>
  );
}

// Composant racine avec les providers
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
