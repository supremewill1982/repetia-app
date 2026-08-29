import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './firebaseConfig';

export interface EnfantLie {
  uid: string;
  prenom: string;
  classe: string;
  serie: string;
  email: string;
  dateCreation: string;
}

const functions = getFunctions(app, 'us-central1');
const linkChild = httpsCallable<{ code: string }, { enfant: EnfantLie }>(functions, 'linkChildByCode');

export async function lierCompteEnfantSecure(code: string): Promise<EnfantLie> {
  const normalized = code.trim();
  if (!/^\d{6}$/.test(normalized)) {
    throw new Error('Le code doit contenir exactement 6 chiffres.');
  }

  const result = await linkChild({ code: normalized });
  if (!result.data?.enfant?.uid) {
    throw new Error('Réponse de liaison invalide.');
  }
  return result.data.enfant;
}
