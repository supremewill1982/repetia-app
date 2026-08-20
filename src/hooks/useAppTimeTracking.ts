import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { AppState, AppStateStatus } from 'react-native';
import {
  startTimeTracking,
  stopTimeTracking,
  getTimeStats,
} from '../services/timeTrackingService';

export function useAppTimeTracking() {
  const { user } = useAuth();
  const appState   = useRef<AppStateStatus>(AppState.currentState);
  const mounted    = useRef(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    mounted.current = true;

    // ── Démarrage initial
    const init = async () => {
      if (!user) return;
      if (AppState.currentState === 'active') {
        await _demarrerNavigation();
      }
    };
    init();

    // ── Listener AppState
    // Couvre : mise en veille, verrou écran, passage à une autre app
    const sub = AppState.addEventListener('change', async (nextState) => {
      if (!mounted.current) return;

      const prevState = appState.current;
      appState.current = nextState;

      if (!user) return;

      if (prevState !== 'active' && nextState === 'active') {
        // ✅ Retour sur l'app (depuis verrou, autre app, background)
        await _demarrerNavigation();
      } else if (prevState === 'active' && nextState !== 'active') {
        // ✅ Quitte l'app (verrou, autre app, background)
        await _stopperTracking();
      }
    });

    // ── Polling léger (5s) : assure cohérence si session externe terminée
    intervalRef.current = setInterval(async () => {
      if (!mounted.current || !user || AppState.currentState !== 'active') return;
      const stats = await getTimeStats();
      // Si aucune session active et app au premier plan → démarrer navigation
      if (!stats.currentSession?.type) {
        await startTimeTracking('navigation', 'Général');
      }
    }, 5000);

    return () => {
      mounted.current = false;
      sub.remove();
      if (intervalRef.current) clearInterval(intervalRef.current);
      // Le cleanup React ne peut pas être await.
      // On lance explicitement le flush sans laisser de session active.
      void _stopperTracking();
    };
  }, [user]);
}

async function _demarrerNavigation() {
  try {
    const stats = await getTimeStats();
    // Ne démarrer navigation que si pas de session active (révision/devoir en cours)
    if (!stats.currentSession?.type) {
      await startTimeTracking('navigation', 'Général');
    }
  } catch (e) {
    console.error('Erreur démarrage navigation:', e);
  }
}

async function _stopperTracking() {
  try {
    const stats = await getTimeStats();
    if (stats.currentSession?.type) {
      await stopTimeTracking();
    }
  } catch (e) {
    console.error('Erreur arrêt tracking:', e);
  }
}
