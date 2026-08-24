import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import { db, storage } from './firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';

export const uploadProfileImage = async (userId: string, imageUri: string) => {
  const response = await fetch(imageUri);
  const blob = await response.blob();
  const storageRef = ref(storage, `profileImages/${userId}`);
  await uploadBytes(storageRef, blob, { contentType: blob.type || 'image/jpeg' });
  const downloadURL = await getDownloadURL(storageRef);
  const patch = { profileImage: downloadURL, avatar: downloadURL, profileImageUpdatedAt: new Date() };
  await setDoc(doc(db, 'users', userId), patch, { merge: true });
  await setDoc(doc(db, 'tuteurs', userId), patch, { merge: true });
  return downloadURL;
};

export const pickImage = async () => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    alert('Autorisez l’accès aux photos pour choisir une image de profil.');
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });
  return !result.canceled && result.assets?.[0]?.uri ? result.assets[0].uri : null;
};
