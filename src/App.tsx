import React, { useState, useEffect, useRef } from 'react';
import 'react-native-gesture-handler';
import { NavigationContainer, useNavigationContainerRef, useNavigationState } from '@react-navigation/native';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import EleveNavigator from './navigation/EleveNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, ActivityIndicator } from 'react-native';
import { auth } from './services/firebaseConfig';
import { networkService } from './services/networkService';
import { offlineQueueService } from './services/offlineQueueService';
import { synchroniserBadgesUtilisateur } from './services/badgesService';
import { startRealtimeSync } from './services/realtimeSyncService';
import { setupStudentNotifications, scheduleDailyReminder } from './services/notificationServiceEnhanced';
import { getInfosEnfant } from './services/firebaseEnfantService';
import { saveProgressionToFirebase } from './services/progressionService';
import { useAppTimeTracking } from './hooks/useAppTimeTracking';
import { startTimeTracking, stopTimeTracking } from './services/timeTrackingService';
import { 
  registerForPushNotificationsAsync, 
  addNotificationListener,
  addNotificationResponseListener
} from './services/notificationService';

function TimeTracker() {
  useAppTimeTracking();
  return null;
}

// Composant pour suivre la navigation
function NavigationTracker({ children }: { children: React.ReactNode }) {
  const navigationRef = useNavigationContainerRef();
  const routeNameRef = useRef<string>();
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    if (!navigationRef.isReady()) return;
    
    const state = navigationRef.getRootState();
    const currentRoute = state.routes[state.index]?.name;
    
    if (currentRoute && !isTracking) {
      routeNameRef.current = currentRoute;
      startTimeTracking('navigation', 'Général');
      setIsTracking(true);
    }
    
    const unsubscribe = navigationRef.addListener('state', (event) => {
      const previousRoute = routeNameRef.current;
      const currentRoute = event.data.state.routes[event.data.state.index]?.name;
      
      if (previousRoute !== currentRoute && currentRoute) {
        console.log(`🔄 Navigation: ${previousRoute} -> ${currentRoute}`);
        // Le temps de navigation est automatiquement géré par le hook useAppTimeTracking
        routeNameRef.current = currentRoute;
      }
    });
    
    return unsubscribe;
  }, [navigationRef.isReady()]);

  return <>{children}</>;
}

export default function App() {
  const [initialRoute, setInitialRoute] = useState('ConnexionEnfant');
  const [loading, setLoading] = useState(true);
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();
  const realtimeSyncRef = useRef<(() => void) | null>(null);
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    const initialize = async () => {
      try {
        const connected = await networkService.checkConnection();
        if (!connected) {
          console.log('📴 Démarrage en mode hors ligne');
        }

        const unsubscribeNetwork = networkService.onStatusChange((status) => {
          console.log(`🌐 Statut réseau: ${status}`);
        });

        const token = await registerForPushNotificationsAsync();
        if (token) {
          console.log('📱 Token push enregistré');
          await scheduleDailyReminder(18, 0);
        } else {
          console.log('ℹ️ Notifications push non disponibles (Expo Go)');
        }

        notificationListener.current = addNotificationListener((notification) => {
          console.log('🔔 Notification reçue:', notification);
        });

        responseListener.current = addNotificationResponseListener((response) => {
          console.log('👆 Notification tapée:', response);
        });

        const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
          if (user) {
            console.log('👤 Utilisateur détecté au démarrage:', user.email);
            setInitialRoute('Main');
            
            await synchroniserBadgesUtilisateur();
            await saveProgressionToFirebase();
            
            const infos = await getInfosEnfant();
            await setupStudentNotifications(user.uid, infos?.prenom || 'Élève');
            
            if (realtimeSyncRef.current) {
              realtimeSyncRef.current();
              realtimeSyncRef.current = null;
            }
            realtimeSyncRef.current = startRealtimeSync((type, data) => {
              console.log(`📡 Mise à jour temps réel - ${type}:`, 
                type === 'sessions' ? `${data.length} nouvelles sessions` : `${data.length} badges`);
              if (type === 'sessions' && data.length > 0) {
                saveProgressionToFirebase();
              }
            });
            
            // Démarrer le suivi de navigation
            startTimeTracking('navigation', 'Général');
          } else {
            console.log('👤 Aucun utilisateur connecté au démarrage');
            setInitialRoute('ConnexionEnfant');
            
            if (realtimeSyncRef.current) {
              realtimeSyncRef.current();
              realtimeSyncRef.current = null;
            }
          }
          setLoading(false);
        });

        const syncQueue = async () => {
          if (await networkService.checkConnection()) {
            console.log('🔄 Synchronisation de la file d\'attente au démarrage...');
            await offlineQueueService.processQueue();
          }
        };
        syncQueue();

        return () => {
          unsubscribeNetwork();
          unsubscribeAuth();
          if (realtimeSyncRef.current) {
            realtimeSyncRef.current();
            realtimeSyncRef.current = null();
          }
        };
      } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
        setLoading(false);
      }
    };

    initialize();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={{ marginTop: 20, fontSize: 16, color: '#666' }}>Chargement de l'application...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <NavigationContainer ref={navigationRef}>
            <NavigationTracker>
              <TimeTracker />
              <EleveNavigator initialRoute={initialRoute} />
            </NavigationTracker>
          </NavigationContainer>
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
