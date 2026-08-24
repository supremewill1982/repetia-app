import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import { db, storage } from './firebaseConfig';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export const uploadProfileImage = async (userId: string, imageUri: string) => {
  try {
    const response = await fetch(imageUri);
    if (!response.ok) throw new Error('Impossible de lire l’image sélectionnée');
    const blob = await response.blob();
    const storageRef = ref(storage, `profileImages/${userId}`);
    await uploadBytes(storageRef, blob, { contentType: blob.type || 'image/jpeg' });
    const downloadURL = await getDownloadURL(storageRef);

    // Les profils sont stockés dans users et, pour les répétiteurs, dans tuteurs.
    await setDoc(doc(db, 'users', userId), {
      profileImage: downloadURL,
      profileImageUpdatedAt: serverTimestamp(),
    }, { merge: true });
    await setDoc(doc(db, 'tuteurs', userId), {
      profileImage: downloadURL,
      avatar: downloadURL,
    }, { merge: true });

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
