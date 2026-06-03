// Fichier de compatibilité pour les stats de temps
export interface TimeStats {
  totalApp: number;
  totalRevisions: number;
  totalDevoirs: number;
  parMatiere: {
    [matiere: string]: {
      revision: number;
      devoir: number;
      total: number;
    };
  };
}

export async function getTimeStats(): Promise<TimeStats> {
  try {
    // Importer dynamiquement pour éviter les erreurs circulaires
    const { getTimeStats: getRealTimeStats } = await import('./timeTrackingService');
    return await getRealTimeStats();
  } catch (error) {
    console.log('⚠️ timeTrackingService non disponible, stats par défaut');
    return { totalApp: 0, totalRevisions: 0, totalDevoirs: 0, parMatiere: {} };
  }
}

export function formatTime(minutes: number): string {
  if (minutes < 1) return '0min';
  const hours = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);
  if (hours > 0) {
    return `${hours}h${mins > 0 ? mins : ''}`;
  }
  return `${mins}min`;
}
