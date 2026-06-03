import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform, Alert } from 'react-native';
import { auth } from './firebaseConfig';

const isExpoGo = Constants.appOwnership === 'expo';

if (!isExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

let expoPushToken: string | null = null;

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (isExpoGo) {
    console.log('⚠️ Notifications push désactivées dans Expo Go');
    return null;
  }

  if (!Device.isDevice) {
    console.log('⚠️ Les notifications push ne sont pas disponibles sur l\'émulateur');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('❌ Permission de notification non accordée');
    return null;
  }

  try {
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    });
    expoPushToken = token.data;
    console.log('✅ Expo Push Token:', token.data.substring(0, 20) + '...');
    return token.data;
  } catch (error) {
    console.error('❌ Erreur récupération token:', error);
    return null;
  }
}

export async function sendLocalNotification(title: string, body: string, data?: any): Promise<void> {
  if (isExpoGo) {
    console.log('🔔 Notification locale (simulée):', title);
    return;
  }
  
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data, sound: true },
    trigger: null,
  });
}

export async function scheduleNotification(title: string, body: string, seconds: number, data?: any): Promise<string> {
  if (isExpoGo) {
    console.log(`📅 Notification programmée (simulée) dans ${seconds}s: ${title}`);
    return `simulated-${Date.now()}`;
  }
  
  const id = await Notifications.scheduleNotificationAsync({
    content: { title, body, data, sound: true },
    trigger: { seconds },
  });
  return id;
}

export async function scheduleDailyReminder(hour: number = 18, minute: number = 0): Promise<string> {
  if (isExpoGo) {
    console.log(`⏰ Rappel quotidien simulé à ${hour}:${minute}`);
    return 'simulated';
  }
  
  await Notifications.cancelScheduledNotificationAsync('daily_reminder');
  
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '📚 Prêt à réviser ?',
      body: 'Une petite révision aujourd\'hui pour progresser !',
      sound: true,
      data: { type: 'daily_reminder' },
    },
    trigger: { hour, minute, repeats: true },
    identifier: 'daily_reminder',
  });
  
  console.log(`⏰ Rappel quotidien programmé à ${hour}:${minute}`);
  return id;
}

export async function cancelAllScheduledNotifications(): Promise<void> {
  if (isExpoGo) {
    console.log('🗑️ Annulation des notifications (simulée)');
    return;
  }
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function notifyNewBadge(badgeName: string): Promise<void> {
  await sendLocalNotification(
    `🎖️ Nouveau badge débloqué !`,
    `Bravo ! Tu as obtenu le badge "${badgeName}" !`,
    { type: 'new_badge', badge: badgeName }
  );
}

export async function notifySerieAchieved(serie: number): Promise<void> {
  const message = serie === 3 ? '🔥 3 jours consécutifs ! Continue comme ça !' :
                   serie === 7 ? '🌟 7 jours de révision ! Tu es sur une bonne lancée !' :
                   `${serie} jours de révision consécutifs ! Félicitations !`;
  
  await sendLocalNotification('🎯 Série de révision !', message, { type: 'serie_achieved', serie });
}

export async function scheduleRevisionReminder(): Promise<void> {
  await scheduleDailyReminder(18, 0);
}

export function addNotificationListener(callback: (notification: any) => void): () => void {
  if (isExpoGo) {
    console.log('📱 Listener de notification (simulé)');
    return () => {};
  }
  const subscription = Notifications.addNotificationReceivedListener(callback);
  return () => subscription.remove();
}

export function addNotificationResponseListener(callback: (response: any) => void): () => void {
  if (isExpoGo) {
    console.log('👆 Listener de réponse (simulé)');
    return () => {};
  }
  const subscription = Notifications.addNotificationResponseReceivedListener(callback);
  return () => subscription.remove();
}
