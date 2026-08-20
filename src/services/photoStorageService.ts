import {
  getStorage,
  ref,
  uploadString,
  getDownloadURL,
} from 'firebase/storage';
import { app } from './firebaseConfig';

const storage = getStorage(app);

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      const result = reader.result;

      if (typeof result !== 'string') {
        reject(new Error('Impossible de convertir la photo en base64'));
        return;
      }

      const commaIndex = result.indexOf(',');

      if (commaIndex === -1) {
        reject(new Error('Format base64 invalide'));
        return;
      }

      resolve(result.slice(commaIndex + 1));
    };

    reader.onerror = () => {
      reject(new Error('Erreur lors de la lecture de la photo'));
    };

    reader.readAsDataURL(blob);
  });
}

export async function uploadPhoto(
  uri: string,
  path: string,
): Promise<string | null> {
  try {
    const response = await fetch(uri);

    if (!response.ok) {
      throw new Error(
        `Impossible de récupérer la photo (${response.status})`,
      );
    }

    const blob = await response.blob();
    const base64 = await blobToBase64(blob);

    const storageRef = ref(storage, path);

    await uploadString(storageRef, base64, 'base64');

    return await getDownloadURL(storageRef);
  } catch (error: unknown) {
    console.error('Erreur upload photo:', error);
    return null;
  }
}
