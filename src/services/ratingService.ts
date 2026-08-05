import { db } from './firebaseConfig';
import { collection, addDoc, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { scheduleRatingNotification } from './notificationService';

export interface Rating {
  id: string;
  repetiteurId: string;
  studentId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export const submitRating = async (ratingData: Omit<Rating, 'id' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'ratings'), {
      ...ratingData,
      createdAt: new Date()
    });

    // Mettre à jour la note moyenne du répétiteur
    await updateRepetiteurAverageRating(ratingData.repetiteurId);

    // Envoyer une notification au répétiteur
    const repetiteurDoc = await getDoc(doc(db, 'users', ratingData.repetiteurId));
    if (repetiteurDoc.exists()) {
      const repetiteurData = repetiteurDoc.data();
      const repetiteurName = `${repetiteurData.prenom || ''} ${repetiteurData.nom || ''}`.trim();
      await scheduleRatingNotification(repetiteurName, ratingData.rating);
    }

    return docRef.id;
  } catch (error) {
    console.error('Error submitting rating:', error);
    throw error;
  }
};

export const getRatingsForRepetiteur = async (repetiteurId: string) => {
  try {
    const q = query(collection(db, 'ratings'), where('repetiteurId', '==', repetiteurId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Rating));
  } catch (error) {
    console.error('Error getting ratings:', error);
    throw error;
  }
};

export const getAverageRatingForRepetiteur = async (repetiteurId: string) => {
  try {
    const ratings = await getRatingsForRepetiteur(repetiteurId);
    if (ratings.length === 0) return 0;

    const sum = ratings.reduce((acc, rating) => acc + rating.rating, 0);
    return sum / ratings.length;
  } catch (error) {
    console.error('Error calculating average rating:', error);
    throw error;
  }
};

const updateRepetiteurAverageRating = async (repetiteurId: string) => {
  try {
    const averageRating = await getAverageRatingForRepetiteur(repetiteurId);
    await updateDoc(doc(db, 'users', repetiteurId), {
      averageRating,
      ratingsCount: (await getRatingsForRepetiteur(repetiteurId)).length
    });
  } catch (error) {
    console.error('Error updating average rating:', error);
    throw error;
  }
};