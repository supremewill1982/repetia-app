import * as SecureStore from 'expo-secure-store';
import { sauvegarderSessionFirebase } from './firebaseEnfantService';
import { networkService } from './networkService';
import { auth } from './firebaseConfig';

const QUEUE_KEY_PREFIX = 'offline_queue';

function getQueueKey(): string | null {
  const uid = auth.currentUser?.uid;

  return uid
    ? `${QUEUE_KEY_PREFIX}_${uid}`
    : null;
}

export interface QueuedSession {
  id: string;
  ownerUid: string;
  session: any;
  timestamp: number;
  retryCount: number;
}

class OfflineQueueService {
  private queue: QueuedSession[] = [];
  private isProcessing = false;
  private loadedUid: string | null = null;

  constructor() {
    this.setupNetworkListener();
    this.loadQueue();
  }

  private async loadQueue(): Promise<void> {
    try {
      const uid = auth.currentUser?.uid;
      const key = getQueueKey();

      if (!uid || !key) {
        this.queue = [];
        this.loadedUid = null;
        return;
      }

      if (this.loadedUid === uid) {
        return;
      }

      const data =
        await SecureStore.getItemAsync(key);

      if (!data) {
        this.queue = [];
      } else {
        const parsed = JSON.parse(data);

        this.queue = Array.isArray(parsed)
          ? parsed
          : [];
      }

      this.loadedUid = uid;

      console.log(
        `📦 ${this.queue.length} sessions en attente pour ${uid}`
      );
    } catch (error) {
      console.error(
        '❌ Erreur chargement file offline:',
        error
      );

      this.queue = [];
    }
  }

  private async saveQueue(): Promise<void> {
    try {
      const uid = auth.currentUser?.uid;
      const key = getQueueKey();

      if (!uid || !key) {
        console.warn(
          '⚠️ saveQueue: aucun utilisateur connecté — écriture annulée'
        );

        return;
      }

      // Protection supplémentaire :
      // aucune entrée appartenant à un autre utilisateur.
      this.queue = this.queue.filter(
        item => item.ownerUid === uid
      );

      await SecureStore.setItemAsync(
        key,
        JSON.stringify(this.queue)
      );

      this.loadedUid = uid;
    } catch (error) {
      console.error(
        '❌ Erreur sauvegarde file offline:',
        error
      );
    }
  }

  private setupNetworkListener(): void {
    networkService.onStatusChange(
      async status => {
        if (status !== 'connected') {
          return;
        }

        console.log(
          '🌐 Connexion rétablie, synchronisation...'
        );

        await this.processQueue();
      }
    );
  }

  async addToQueue(
    session: any
  ): Promise<string> {
    const uid = auth.currentUser?.uid;

    if (!uid) {
      throw new Error(
        'Utilisateur non connecté'
      );
    }

    await this.loadQueue();

    const id =
      `${Date.now()}-` +
      Math.random()
        .toString(36)
        .substring(2, 7);

    const queuedSession: QueuedSession = {
      id,
      ownerUid: uid,
      session,
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.queue.push(queuedSession);

    await this.saveQueue();

    console.log(
      `📥 Session ajoutée à la file (${id})`
    );

    if (networkService.isConnected()) {
      await this.processQueue();
    }

    return id;
  }

  async processQueue(): Promise<void> {
    const uid = auth.currentUser?.uid;

    if (!uid) {
      console.warn(
        '⚠️ processQueue: aucun utilisateur connecté'
      );

      return;
    }

    if (this.isProcessing) {
      return;
    }

    await this.loadQueue();

    if (this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    console.log(
      `🔄 Traitement de ${this.queue.length} sessions pour ${uid}...`
    );

    const failedSessions: QueuedSession[] = [];

    try {
      for (const item of this.queue) {
        // Ne jamais synchroniser une session
        // appartenant à un autre compte.
        if (item.ownerUid !== uid) {
          console.warn(
            `⚠️ Session ${item.id} ignorée : propriétaire différent`
          );

          continue;
        }

        try {
          const result =
            await sauvegarderSessionFirebase(
              item.session
            );

          if (result.success) {
            console.log(
              `✅ Session ${item.id} synchronisée`
            );
          } else {
            item.retryCount += 1;
            failedSessions.push(item);

            console.warn(
              `⚠️ Échec session ${item.id} — tentative ${item.retryCount}`
            );
          }
        } catch (error) {
          item.retryCount += 1;
          failedSessions.push(item);

          console.error(
            `❌ Erreur session ${item.id}:`,
            error
          );
        }
      }

      // Après 5 échecs, on abandonne l'entrée.
      this.queue =
        failedSessions.filter(
          item => item.retryCount < 5
        );

      await this.saveQueue();

      console.log(
        `📊 ${this.queue.length} sessions restent`
      );
    } finally {
      this.isProcessing = false;
    }
  }

  async getQueueCount(): Promise<number> {
    await this.loadQueue();

    return this.queue.length;
  }

  async clearQueue(): Promise<void> {
    await this.loadQueue();

    this.queue = [];

    await this.saveQueue();

    console.log(
      '🗑️ File offline vidée'
    );
  }
}

export const offlineQueueService =
  new OfflineQueueService();
