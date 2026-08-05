import { submitRating, getRatingsForRepetiteur, getAverageRatingForRepetiteur } from '../src/services/ratingService';
import { db } from '../src/services/firebaseConfig';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';

// Mock data for testing
const testRepetiteurId = 'test-repetiteur-123';
const testStudentId = 'test-student-456';

describe('Rating Service', () => {
  // Clean up test data after tests
  afterAll(async () => {
    try {
      const q = query(collection(db, 'ratings'), where('repetiteurId', '==', testRepetiteurId));
      const querySnapshot = await getDocs(q);
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      console.log('✅ Test data cleaned up');
    } catch (error) {
      console.error('❌ Error cleaning up test data:', error);
    }
  });

  test('submitRating should create a new rating and update average', async () => {
    const ratingData = {
      repetiteurId: testRepetiteurId,
      studentId: testStudentId,
      rating: 4.5,
      comment: 'Excellent teacher!',
    };

    try {
      const ratingId = await submitRating(ratingData);
      expect(ratingId).toBeTruthy();
      expect(typeof ratingId).toBe('string');

      // Verify rating was created
      const ratings = await getRatingsForRepetiteur(testRepetiteurId);
      expect(ratings.length).toBe(1);
      expect(ratings[0].rating).toBe(4.5);
      expect(ratings[0].comment).toBe('Excellent teacher!');

      // Verify average rating
      const average = await getAverageRatingForRepetiteur(testRepetiteurId);
      expect(average).toBe(4.5);

      console.log('✅ submitRating test passed');
    } catch (error) {
      console.error('❌ submitRating test failed:', error);
      fail(error);
    }
  });

  test('getRatingsForRepetiteur should return empty array for non-existent repetiteur', async () => {
    try {
      const ratings = await getRatingsForRepetiteur('non-existent-id');
      expect(ratings).toBeInstanceOf(Array);
      expect(ratings.length).toBe(0);
      console.log('✅ getRatingsForRepetiteur test passed');
    } catch (error) {
      console.error('❌ getRatingsForRepetiteur test failed:', error);
      fail(error);
    }
  });

  test('getAverageRatingForRepetiteur should return 0 for no ratings', async () => {
    try {
      const average = await getAverageRatingForRepetiteur('non-existent-id');
      expect(average).toBe(0);
      console.log('✅ getAverageRatingForRepetiteur test passed');
    } catch (error) {
      console.error('❌ getAverageRatingForRepetiteur test failed:', error);
      fail(error);
    }
  });

  test('average rating calculation should be correct with multiple ratings', async () => {
    // Add more ratings
    const ratingsData = [
      { repetiteurId: testRepetiteurId, studentId: testStudentId, rating: 3.0, comment: 'Good' },
      { repetiteurId: testRepetiteurId, studentId: testStudentId, rating: 5.0, comment: 'Excellent' },
    ];

    try {
      // Submit additional ratings
      await Promise.all(ratingsData.map(rating => submitRating(rating)));

      // Verify average calculation: (4.5 + 3.0 + 5.0) / 3 = 4.166...
      const average = await getAverageRatingForRepetiteur(testRepetiteurId);
      expect(average).toBeCloseTo(4.1667, 2);

      // Verify total count
      const ratings = await getRatingsForRepetiteur(testRepetiteurId);
      expect(ratings.length).toBe(3);

      console.log('✅ Average rating calculation test passed');
    } catch (error) {
      console.error('❌ Average rating calculation test failed:', error);
      fail(error);
    }
  });
});