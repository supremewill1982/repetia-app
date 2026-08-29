import { getFunctions, httpsCallable } from 'firebase/functions';
import { setDoc, serverTimestamp } from 'firebase/firestore';
import { app, auth, db, doc, getDoc } from './firebaseConfig';

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

function randomCode(): string {
  return String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0');
}

export async function genererCodeLiaisonSecure(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('Non connecté');
  const infos = await getDoc(doc(db, 'users', user.uid));
  const data = infos.data() || {};

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = randomCode();
    const existing = await getDoc(doc(db, 'codesLiaison', code));
    if (existing.exists()) continue;
    await setDoc(doc(db, 'codesLiaison', code), {
      code,
      enfantId: user.uid,
      enfantPrenom: data.prenom || 'Élève',
      prenom: data.prenom || 'Élève',
      classe: data.classe || 'Terminale',
      serie: data.serie || 'C',
      email: user.email || '',
      actif: true,
      expires: Date.now() + 48 * 60 * 60 * 1000,
      dateCreation: new Date().toISOString(),
      createdAt: serverTimestamp(),
    });
    return code;
  }
  throw new Error('Impossible de générer un code unique. Réessaie.');
}

export async function lierCompteEnfantSecure(code: string): Promise<EnfantLie> {
  const normalized = code.trim();
  if (!/^\d{6}$/.test(normalized)) throw new Error('Le code doit contenir exactement 6 chiffres.');
  const result = await linkChild({ code: normalized });
  if (!result.data?.enfant?.uid) throw new Error('Réponse de liaison invalide.');
  return result.data.enfant;
}
