import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore, doc, setDoc, deleteDoc, updateDoc, increment } from 'firebase/firestore';
import { auth } from './firebaseConfig';

const db             = getFirestore();
const LIKES_MAX_JOUR = 20;
const getQuotaKey    = () => `likes_quota_${new Date().toISOString().split('T')[0]}`;

interface LikeQuota { count: number; podcastIds: string[]; }

async function getQuotaJour(): Promise<LikeQuota> {
  try {
    const v = await AsyncStorage.getItem(getQuotaKey());
    return v ? JSON.parse(v) : { count: 0, podcastIds: [] };
  } catch { return { count: 0, podcastIds: [] }; }
}

async function saveQuota(q: LikeQuota) {
  await AsyncStorage.setItem(getQuotaKey(), JSON.stringify(q));
}

export async function getLikeInfo(podcastId: string): Promise<{ dejaLike: boolean; restants: number }> {
  const quota = await getQuotaJour();
  return {
    dejaLike: quota.podcastIds.includes(podcastId),
    restants: Math.max(0, LIKES_MAX_JOUR - quota.count),
  };
}

export async function toggleLike(podcastId: string): Promise<{ success: boolean; liked: boolean; message?: string }> {
  const user = auth.currentUser;
  if (!user) return { success: false, liked: false, message: 'Non connecté' };

  const quota = await getQuotaJour();
  const dejaLike = quota.podcastIds.includes(podcastId);

  if (dejaLike) {
    try {
      await deleteDoc(doc(db, 'likes', `${user.uid}_${podcastId}`));
      await updateDoc(doc(db, 'podcasts_public', podcastId), { likesCount: increment(-1) });
    } catch {}
    quota.count = Math.max(0, quota.count - 1);
    quota.podcastIds = quota.podcastIds.filter(id => id !== podcastId);
    await saveQuota(quota);
    return { success: true, liked: false };
  }

  if (quota.count >= LIKES_MAX_JOUR) {
    return { success: false, liked: false, message: `Limite atteinte ! Plus que 0 likes aujourd'hui.` };
  }

  try {
    await setDoc(doc(db, 'likes', `${user.uid}_${podcastId}`), {
      userId: user.uid, podcastId, date: new Date().toISOString(),
    });
    await updateDoc(doc(db, 'podcasts_public', podcastId), { likesCount: increment(1) });
  } catch {}

  quota.count++;
  quota.podcastIds.push(podcastId);
  await saveQuota(quota);
  return { success: true, liked: true };
}
