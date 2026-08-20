import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { getTimeStats, getTimeSummary, getTimePerSubject, syncTimeWithFirebase, formatTime } from '../services/timeTrackingService';

interface TimeStats {
  navigation: number;
  devoirs: number;
  revisions: number;
  global: number;
}

interface TimePerSubject {
  matiere: string;
  revision: number;
  devoir: number;
  navigation: number;
  total: number;
}

interface TimeSummary {
  global: string;
  revisions: string;
  devoirs: string;
  navigation: string;
  globalMinutes: number;
  revisionsMinutes: number;
  devoirsMinutes: number;
  navigationMinutes: number;
}

export function useRealtimeTimeStats(intervalSeconds: number = 30) {
  const [timeStats, setTimeStats] = useState<TimeStats>({
    navigation: 0,
    devoirs: 0,
    revisions: 0,
    global: 0
  });
  const [timeSummary, setTimeSummary] = useState<TimeSummary>({
    global: '0min',
    revisions: '0min',
    devoirs: '0min',
    navigation: '0min',
    globalMinutes: 0,
    revisionsMinutes: 0,
    devoirsMinutes: 0,
    navigationMinutes: 0
  });
  const [timePerSubject, setTimePerSubject] = useState<TimePerSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  const fetchStats = useCallback(async () => {
    try {
      await syncTimeWithFirebase();
      const stats = await getTimeStats();
      const summary = await getTimeSummary();
      const perSubject = await getTimePerSubject();
      
      setTimeStats(stats);
      setTimeSummary(summary);
      setTimePerSubject(perSubject);
      setLastUpdate(Date.now());
      setLoading(false);
      
      console.log('📊 Stats temps mises à jour:', { 
        global: summary.global, 
        revisions: summary.revisions,
        devoirs: summary.devoirs,
        navigation: summary.navigation
      });
    } catch (error) {
      console.error('Erreur récupération stats temps:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchStats();
      
      const interval = setInterval(() => {
        fetchStats();
      }, intervalSeconds * 1000);
      
      return () => {
        clearInterval(interval);
      };
    }, [fetchStats, intervalSeconds])
  );

  return { timeStats, timeSummary, timePerSubject, loading, lastUpdate, refresh: fetchStats };
}
