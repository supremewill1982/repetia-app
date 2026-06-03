import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { app } from './firebaseConfig';

const storage = getStorage(app);

export async function uploadPhoto(uri, path) {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const base64 = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(blob);
    });
    
    const storageRef = ref(storage, path);
    await uploadString(storageRef, base64, 'base64');
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error('Erreur upload photo:', error);
    return null;
  }
}
