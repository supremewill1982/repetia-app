import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { db, storage } from './firebaseConfig';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export const uploadProfileImage = async (userId: string, imageUri: string) => {
  try {
    if (!userId || !imageUri) throw new Error('Image ou utilisateur invalide');

    // Évite le chemin Blob/fetch qui est fragile selon les versions React Native/Firebase.
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    if (!base64) throw new Error('Image vide');

    const storageRef = ref(storage, `profileImages/${userId}`);
    await uploadString(storageRef, base64, 'base64', {
      contentType: 'image/jpeg',
      cacheControl: 'public,max-age=3600',
    });
    const downloadURL = `${await getDownloadURL(storageRef)}&v=${Date.now()}`;

    await setDoc(doc(db, 'users', userId), {
      profileImage: downloadURL,
      profileImageUpdatedAt: serverTimestamp(),
    }, { merge: true });

    const tuteurRef = doc(db, 'tuteurs', userId);
    const tuteurSnap = await getDoc(tuteurRef);
    if (tuteurSnap.exists()) {
      await setDoc(tuteurRef, {
        profileImage: downloadURL,
        avatar: downloadURL,
      }, { merge: true });
    }

    return downloadURL;
  } catch (error) {
    console.error('Error uploading profile image:', error);
    throw error;
  }
};

export const pickImage = async () => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    alert('Autorisez l’accès à vos photos pour choisir une image de profil.');
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.5,
  });

  return result.canceled ? null : result.assets[0]?.uri || null;
};
