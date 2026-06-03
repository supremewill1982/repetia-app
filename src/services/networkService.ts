import NetInfo from '@react-native-community/netinfo';

type NetworkStatus = 'connected' | 'disconnected' | 'unknown';
type NetworkListener = (status: NetworkStatus) => void;

class NetworkService {
  private static instance: NetworkService;
  private status: NetworkStatus = 'unknown';
  private listeners: NetworkListener[] = [];

  private constructor() {
    this.init();
  }

  static getInstance(): NetworkService {
    if (!NetworkService.instance) {
      NetworkService.instance = new NetworkService();
    }
    return NetworkService.instance;
  }

  private init() {
    NetInfo.addEventListener(state => {
      const isConnected = state.isConnected && state.isInternetReachable !== false;
      const newStatus: NetworkStatus = isConnected ? 'connected' : 'disconnected';
      
      if (this.status !== newStatus) {
        console.log(`🌐 Statut réseau: ${newStatus}`);
        this.status = newStatus;
        this.listeners.forEach(listener => listener(newStatus));
      }
    });
  }

  getStatus(): NetworkStatus {
    return this.status;
  }

  isConnected(): boolean {
    return this.status === 'connected';
  }

  onStatusChange(callback: NetworkListener): () => void {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) this.listeners.splice(index, 1);
    };
  }

  async checkConnection(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return !!(state.isConnected && state.isInternetReachable !== false);
  }
}

export const networkService = NetworkService.getInstance();
