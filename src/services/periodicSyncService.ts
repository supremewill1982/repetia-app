import { networkService } from './networkService';
import { getSessionsSecure, saveSessionSecure } from './secureStorageService';
import { getSessionsEnfantFirebase, sauvegarderSessionFirebase } from './firebaseEnfantService';
import { synchroniserBadgesUtilisateur } from './badgesService';

  let syncInterval: ReturnType<typeof setInterval> | null = null;

export function startPeriodicSync(intervalMinutes = 5) {
  if (syncInterval) clearInterval(syncInterval);
  
  syncInterval = setInterval(async () => {
    if (!networkService.isConnected()) return;
    
    console.log('🔄 Synchronisation périodique...');
    
    // Synchroniser les sessions locales vers Firebase
    const sessionsLocales: any[] = await getSessionsSecure();
    for (const session of sessionsLocales) {
      if (!session.syncedToFirebase) {
        await sauvegarderSessionFirebase(session);
        session.syncedToFirebase = true;
        await saveSessionSecure(session);
      }
    }
    
    // Synchroniser les badges
    await synchroniserBadgesUtilisateur();
    
    console.log('✅ Synchronisation périodique terminée');
  }, intervalMinutes * 60 * 1000);
}

export function stopPeriodicSync() {
  if (syncInterval) clearInterval(syncInterval);
}
