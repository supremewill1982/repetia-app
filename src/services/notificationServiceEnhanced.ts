import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform, Alert } from 'react-native';
import { auth, db } from './firebaseConfig';
import { doc, setDoc, getDoc } from 'firebase/firestore';

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

// Sauvegarder le token push de l'élève dans Firestore
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (isExpoGo) {
    console.log('⚠️ Notifications push désactivées dans Expo Go');
    return null;
  }

  if (!Device.isDevice) {
    console.log('⚠️ Pas disponible sur émulateur');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    console.log('❌ Permission refusée');
    return null;
  }

  try {
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    });
    
    // Sauvegarder le token dans Firestore pour l'utilisateur
    const user = auth.currentUser;
    if (user) {
      const userRef = doc(db, 'enfants', user.uid);
      await setDoc(userRef, { pushToken: token.data }, { merge: true });
      console.log('✅ Token push enregistré pour', user.email);
    }
    return token.data;
  } catch (error) {
    console.error('❌ Erreur token:', error);
    return null;
  }
}

// Envoyer une notification locale à l'élève (fonctionne même en Expo Go en simulation)
export async function sendToStudent(title: string, body: string, data: any = {}) {
  if (isExpoGo) {
    // Simuler une alerte pour tester
    console.log(`🔔 [SIMULATION] ${title}: ${body}`);
    // Option: afficher une alerte pour tester (décommente si besoin)
    // Alert.alert(title, body);
    return;
  }
  
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data, sound: true },
    trigger: null,
  });
  console.log(`✅ Notification envoyée: ${title}`);
}

// Programme le rappel quotidien
export async function scheduleDailyReminder(hour: number = 18, minute: number = 0) {
  if (isExpoGo) {
    console.log(`⏰ Rappel quotidien simulé à ${hour}:${minute}`);
    return;
  }
  
  await Notifications.cancelScheduledNotificationAsync('daily_reminder');
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '📚 Prêt à réviser ?',
      body: 'Une petite révision aujourd\'hui pour progresser !',
      sound: true,
      data: { type: 'reminder' },
    },
    trigger: { hour, minute, repeats: true },
    identifier: 'daily_reminder',
  });
  console.log(`⏰ Rappel quotidien programmé à ${hour}:${minute}`);
}

// Programme toutes les notifications pour un élève
export async function setupStudentNotifications(enfantId: string, prenom: string) {
  console.log(`📱 Configuration notifications pour ${prenom}`);
  await scheduleDailyReminder(18, 0);
}

// Vérifier et notifier après une session
export async function checkAndNotifyAfterSession(session: any, score: number, scoreMax: number, reponses: any[]) {
  const pourcentage = (score / scoreMax) * 100;
  
  if (pourcentage < 50) {
    await sendToStudent(
      '💪 Continue comme ça !',
      `Cette révision était difficile, mais chaque erreur t'aide à progresser.`,
      { type: 'encouragement' }
    );
  }
  
  if (pourcentage >= 90) {
    await sendToStudent(
      '🎉 Excellent travail !',
      `Félicitations ! Tu as maîtrisé cette révision avec ${Math.round(pourcentage)}% !`,
      { type: 'success' }
    );
  }
}

// Vérifier et notifier les séries
export async function checkAndNotifySerie(serie: number, enfantId: string, prenom: string) {
  const series = { 3: '3 jours !', 7: '7 jours !', 14: '14 jours !', 30: '30 jours !' };
  if (series[serie]) {
    await sendToStudent(
      '🔥 Série de révisions !',
      `Félicitations ! Tu as révisé ${series[serie]} Ta motivation est impressionnante !`,
      { type: 'serie', serie }
    );
  }
}
