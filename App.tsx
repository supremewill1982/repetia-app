import { useAppTimeTracking } from './src/hooks/useAppTimeTracking';
import { useEffect, useRef } from 'react';
import { startPeriodicSync, stopPeriodicSync } from './src/services/periodicSyncService';
import React from 'react';
import { Linking } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { mettreAJourActiviteLive } from './src/services/parentService';
import { auth } from './src/services/firebaseConfig';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AuthNavigator from './src/navigation/AuthNavigator';
import RepetiteurNavigator from './src/navigation/RepetiteurNavigator';
import EtablissementNavigator from './src/navigation/EtablissementNavigator';
import AdminNavigator from './src/navigation/AdminNavigator';
import ParentNavigator from './src/navigation/ParentNavigator';
import EleveNavigator from './src/navigation/EleveNavigator';

import { View, ActivityIndicator } from 'react-native';

const navigationRef = createNavigationContainerRef<any>();

function AppContent() {
  const pendingParentCode = useRef<string | null>(null);

  const { user, userRole, loading } = useAuth();
  const { colors } = useTheme();

  useAppTimeTracking();

  useEffect(() => {
    const traiterLien = (url: string) => {
      try {
        if (!url.startsWith('repetia://')) return;
        const parsed = new URL(url);
        if (parsed.hostname !== 'lier-parent') return;
        const code = parsed.searchParams.get('code');
        if (code && /^\d{6}$/.test(code)) {
          console.log('🔗 Lien parent reçu, code:', code);
          pendingParentCode.current = code;
          if (auth.currentUser) {
            setTimeout(() => {
              if (navigationRef.isReady()) {
                navigationRef.navigate('ParentLier', { code });
                pendingParentCode.current = null;
              }
            }, 500);
          }
        }
      } catch (e) {
        console.error('❌ Erreur traitement lien:', e);
      }
    };
    Linking.getInitialURL().then(url => { if (url) traiterLien(url); });
    const subscription = Linking.addEventListener('url', event => traiterLien(event.url));
    return () => subscription.remove();
  }, [user]);

  useEffect(() => {
    if (!user || userRole !== 'parent') return;
    const code = pendingParentCode.current;
    if (!code || !navigationRef.isReady()) return;
    setTimeout(() => {
      if (navigationRef.isReady()) {
        navigationRef.navigate('ParentLier', { code });
        pendingParentCode.current = null;
      }
    }, 500);
  }, [user, userRole]);

  useEffect(() => {
    if (user) startPeriodicSync(5); else stopPeriodicSync();
    return () => { stopPeriodicSync(); };
  }, [user]);

  if (loading) {
    return <View style={{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:colors.background}}><ActivityIndicator size="large" color={colors.primary}/></View>;
  }

  return <><StatusBar style="auto" /><NavigationContainer ref={navigationRef}>
    {user ? (
      userRole === 'admin' ? <AdminNavigator /> :
      userRole === 'parent' ? <ParentNavigator /> :
      userRole === 'eleve' ? <EleveNavigator /> :
      userRole === 'repetiteur' ? <RepetiteurNavigator /> :
      userRole === 'etablissement' ? <EtablissementNavigator /> : <AuthNavigator />
    ) : <AuthNavigator />}
  </NavigationContainer></>;
}

export default function App() {
  return <SafeAreaProvider><ThemeProvider><AuthProvider><AppContent /></AuthProvider></ThemeProvider></SafeAreaProvider>;
}
