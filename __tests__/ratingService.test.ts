const ratings: Array<{ id: string; data: Record<string, unknown> }> = [];
let nextId = 1;

jest.mock('../src/services/firebaseConfig', () => ({ db: {} }));
jest.mock('../src/services/notificationService', () => ({
  scheduleRatingNotification: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('firebase/firestore', () => ({
  collection: (_db: unknown, name: string) => ({ type: 'collection', name }),
  addDoc: jest.fn(async (_collection: { name: string }, data: Record<string, unknown>) => {
    const id = `rating-${nextId++}`;
    ratings.push({ id, data });
    return { id };
  }),
  query: jest.fn((_collection: { name: string }, filter: { field: string; value: unknown }) => ({ filter })),
  where: jest.fn((field: string, _operator: string, value: unknown) => ({ field, value })),
  getDocs: jest.fn(async (q: { filter?: { field: string; value: unknown } }) => {
    const matching = q.filter
      ? ratings.filter(r => r.data[q.filter!.field] === q.filter!.value)
      : ratings;
    return {
      docs: matching.map(r => ({ id: r.id, ref: { id: r.id }, data: () => r.data })),
    };
  }),
  doc: jest.fn((_db: unknown, collectionName: string, id: string) => ({ collectionName, id })),
  updateDoc: jest.fn(async () => undefined),
  getDoc: jest.fn(async () => ({ exists: () => false })),
}));

import { submitRating, getRatingsForRepetiteur, getAverageRatingForRepetiteur } from '../src/services/ratingService';

const testRepetiteurId = 'test-repetiteur-123';
const testStudentId = 'test-student-456';

describe('Rating Service (isolated)', () => {
  beforeEach(() => {
    ratings.length = 0;
    nextId = 1;
  });

  test('submitRating creates a rating without touching real Firebase', async () => {
    const ratingId = await submitRating({
      repetiteurId: testRepetiteurId,
      studentId: testStudentId,
      rating: 4.5,
      comment: 'Excellent teacher!',
    });

    expect(ratingId).toBe('rating-1');
    const result = await getRatingsForRepetiteur(testRepetiteurId);
    expect(result).toHaveLength(1);
    expect(result[0].rating).toBe(4.5);
    expect(result[0].comment).toBe('Excellent teacher!');
  });

  test('getRatingsForRepetiteur returns empty for another repetiteur', async () => {
    await submitRating({
      repetiteurId: testRepetiteurId,
      studentId: testStudentId,
      rating: 4,
      comment: 'Good',
    });

    await expect(getRatingsForRepetiteur('non-existent-id')).resolves.toEqual([]);
  });

  test('getAverageRatingForRepetiteur returns 0 with no ratings', async () => {
    await expect(getAverageRatingForRepetiteur('non-existent-id')).resolves.toBe(0);
  });

  test('average rating calculation is correct', async () => {
    await Promise.all([
      submitRating({ repetiteurId: testRepetiteurId, studentId: testStudentId, rating: 3, comment: 'Good' }),
      submitRating({ repetiteurId: testRepetiteurId, studentId: testStudentId, rating: 5, comment: 'Excellent' }),
      submitRating({ repetiteurId: testRepetiteurId, studentId: testStudentId, rating: 4.5, comment: 'Très bien' }),
    ]);

    await expect(getAverageRatingForRepetiteur(testRepetiteurId)).resolves.toBeCloseTo(4.1667, 2);
    await expect(getRatingsForRepetiteur(testRepetiteurId)).resolves.toHaveLength(3);
  });
});
