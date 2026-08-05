import * as ImagePicker from 'expo-image-picker';
import { db, storage } from './firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';

export const uploadProfileImage = async (userId: string, imageUri: string) => {
  try {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    const storageRef = ref(storage, `profileImages/${userId}`);
    await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(storageRef);

    // Mettre à jour l'URL dans Firestore
    await updateDoc(doc(db, 'users', userId), {
      profileImage: downloadURL,
      profileImageUpdatedAt: new Date()
    });

    return downloadURL;
  } catch (error) {
    console.error('Error uploading profile image:', error);
    throw error;
  }
};

export const pickImage = async () => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    alert('Désolé, nous avons besoin des permissions pour accéder à vos images!');
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.5,
  });

  if (!result.canceled) {
    return result.assets[0].uri;
  }
  return null;
};