import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const setupNotificationPermissions = async () => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error setting up notification permissions:', error);
    return false;
  }
};

export const scheduleRatingNotification = async (repetiteurName: string, rating: number) => {
  try {
    const permissionsGranted = await setupNotificationPermissions();
    if (!permissionsGranted) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎉 Nouveau commentaire reçu !',
        body: `${repetiteurName}, vous avez reçu une nouvelle note de ${rating} étoiles.`,
        sound: 'default',
        vibrate: [0, 250, 250, 250],
        priority: 'high',
      },
      trigger: null, // Send immediately
    });

    console.log('Rating notification scheduled successfully');
  } catch (error) {
    console.error('Error scheduling rating notification:', error);
  }
};

export const cancelAllNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('All notifications canceled');
  } catch (error) {
    console.error('Error canceling notifications:', error);
  }
};

// Configure notification handler
export const configureNotificationHandler = () => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  // Handle notification when app is foregrounded
  Notifications.addNotificationReceivedListener(notification => {
    console.log('Notification received:', notification);
  });

  // Handle notification response
  Notifications.addNotificationResponseReceivedListener(response => {
    console.log('Notification response received:', response);
  });
};
