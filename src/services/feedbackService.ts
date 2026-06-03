import * as Haptics from 'expo-haptics';

export type FeedbackType = 'success' | 'error' | 'info' | 'warning' | 'badge' | 'tap';

export async function initSounds() {
  console.log('🔊 Système de feedback initialisé');
}

export async function playSuccessSound() {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (error) {}
}

export async function playErrorSound() {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch (error) {}
}

export async function playInfoSound() {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch (error) {}
}

export async function playBadgeSound() {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } catch (error) {}
}

export async function playTapFeedback() {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch (error) {}
}

export async function successFeedback() {
  await playSuccessSound();
}

export async function errorFeedback() {
  await playErrorSound();
}

export async function notificationFeedback() {
  await playInfoSound();
}

export async function badgeFeedback() {
  await playBadgeSound();
}

export async function tapFeedback() {
  await playTapFeedback();
}

export async function feedback(type: FeedbackType) {
  switch (type) {
    case 'success':
      await successFeedback();
      break;
    case 'error':
      await errorFeedback();
      break;
    case 'info':
      await notificationFeedback();
      break;
    case 'badge':
      await badgeFeedback();
      break;
    case 'tap':
      await tapFeedback();
      break;
    case 'warning':
      await playInfoSound();
      break;
  }
}
