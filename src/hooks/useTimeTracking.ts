import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { getTimeStats, getTimeSummary, getTimePerSubject, forceReloadStats, formatTime } from '../services/timeTrackingService';

interface TimePerSubject { matiere: string; revision: number; devoir: number; navigation: number; total: number; }
export function useTimeTracking() {
  const [timeStats, setTimeStats] = useState({ navigation: 0, devoirs: 0, revisions: 0, global: 0 });
  const [timeSummary, setTimeSummary] = useState({ global: '0min', revisions: '0min', devoirs: '0min', navigation: '0min', globalMinutes: 0, revisionsMinutes: 0, devoirsMinutes: 0, navigationMinutes: 0 });
  const [timePerSubject, setTimePerSubject] = useState<TimePerSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchStats = useCallback(async () => {
    try {
      const stats = await forceReloadStats();
      const summary = { global: formatTime(stats.global), revisions: formatTime(stats.revisions), devoirs: formatTime(stats.devoirs), navigation: formatTime(stats.navigation), globalMinutes: stats.global, revisionsMinutes: stats.revisions, devoirsMinutes: stats.devoirs, navigationMinutes: stats.navigation };
      setTimeStats(stats); setTimeSummary(summary); setTimePerSubject(await getTimePerSubject());
    } catch (error) { console.error('❌ Erreur récupération stats temps:', error); }
    finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { fetchStats(); const interval = setInterval(fetchStats, 10000); return () => clearInterval(interval); }, [fetchStats]));
  return { timeStats, timeSummary, timePerSubject, loading, refresh: fetchStats };
}
