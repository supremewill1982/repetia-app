import * as SecureStore from 'expo-secure-store';
import { sauvegarderSessionFirebase } from './firebaseEnfantService';
import { networkService } from './networkService';

const QUEUE_KEY = 'offline_queue';

export interface QueuedSession {
  id: string;
  session: any;
  timestamp: number;
  retryCount: number;
}

class OfflineQueueService {
  private queue: QueuedSession[] = [];
  private isProcessing = false;

  constructor() {
    this.loadQueue();
    this.setupNetworkListener();
  }

  private async loadQueue() {
    try {
      const data = await SecureStore.getItemAsync(QUEUE_KEY);
      if (data) this.queue = JSON.parse(data);
      console.log(`📦 ${this.queue.length} sessions en attente`);
    } catch (error) {
      console.error('Erreur chargement file:', error);
    }
  }

  private async saveQueue() {
    try {
      await SecureStore.setItemAsync(QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Erreur sauvegarde file:', error);
    }
  }

  private setupNetworkListener() {
    networkService.onStatusChange(async (status) => {
      if (status === 'connected') {
        console.log('🌐 Connexion rétablie, synchronisation...');
        await this.processQueue();
      }
    });
  }

  async addToQueue(session: any): Promise<string> {
    const id = Date.now().toString() + '-' + Math.random().toString(36).substring(2, 7);
    this.queue.push({ id, session, timestamp: Date.now(), retryCount: 0 });
    await this.saveQueue();
    console.log(`📥 Session ajoutée à la file (${id})`);
    if (networkService.isConnected()) await this.processQueue();
    return id;
  }

  async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;
    console.log(`🔄 Traitement de ${this.queue.length} sessions...`);
    
    const failedSessions: QueuedSession[] = [];
    for (const item of this.queue) {
      try {
        const result = await sauvegarderSessionFirebase(item.session);
        if (result.success) console.log(`✅ Session ${item.id} synchronisée`);
        else item.retryCount++, failedSessions.push(item);
      } catch (error) {
        item.retryCount++, failedSessions.push(item);
      }
    }
    this.queue = failedSessions.filter(s => s.retryCount < 5);
    await this.saveQueue();
    console.log(`📊 ${this.queue.length} sessions restent`);
    this.isProcessing = false;
  }

  async getQueueCount(): Promise<number> {
    await this.loadQueue();
    return this.queue.length;
  }

  async clearQueue(): Promise<void> {
    this.queue = [];
    await this.saveQueue();
    console.log('🗑️ File vidée');
  }
}

export const offlineQueueService = new OfflineQueueService();
