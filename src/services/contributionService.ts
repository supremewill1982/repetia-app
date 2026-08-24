import { db, storage } from './firebaseConfig';
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as FileSystem from 'expo-file-system/legacy';
import { Contribution, ContributionStatut, NouvelleContribution } from '../types/contributionTypes';
import { utiliserAgent } from './agents/agentManager';
import { COMMISSION_CONTRIBUTION } from '../config/commissionRates';

export async function soumettreContribution(nouvelleContribution: NouvelleContribution): Promise<{ contributionId: string; statut: ContributionStatut }> {
  const safeName = nouvelleContribution.fichierUri.split('/').pop()?.replace(/[^a-zA-Z0-9._-]/g, '_') || 'fichier';
  const fileRef = ref(storage, `contributions/${nouvelleContribution.userId}/${Date.now()}_${safeName}`);
  try {
    const response = await fetch(nouvelleContribution.fichierUri);
    if (!response.ok) throw new Error('Lecture fichier impossible');
    const blob = await response.blob();
    const info = await FileSystem.getInfoAsync(nouvelleContribution.fichierUri);
    const size = info.exists && 'size' in info && typeof info.size === 'number' ? info.size : 0;
    if (size > 20 * 1024 * 1024) throw new Error('Fichier trop volumineux');
    await uploadBytes(fileRef, blob, { contentType: blob.type || 'application/octet-stream' });
    const fileUrl = await getDownloadURL(fileRef);
    const contributionData = { type: nouvelleContribution.type, titre: nouvelleContribution.titre, matiere: nouvelleContribution.matiere, niveau: nouvelleContribution.niveau, serie: nouvelleContribution.serie || null, description: nouvelleContribution.description || null, tags: nouvelleContribution.tags || [], prix: nouvelleContribution.prix || 0, statut: 'en_attente' as ContributionStatut, auteur: { userId: nouvelleContribution.userId, nom: '', role: 'repetiteur' as const }, fichier: { url: fileUrl, nom: safeName, taille: Math.round(size / 1024), type: blob.type || '' }, date_soumission: serverTimestamp(), telechargements: 0, revenus_generes: 0, score_ia: 0 };
    const docRef = await addDoc(collection(db, 'contributions'), contributionData);
    try {
      const evaluation = JSON.parse(await utiliserAgent('moderateur', `Évalue cette contribution: ${nouvelleContribution.titre}\nMatière: ${nouvelleContribution.matiere}\nNiveau: ${nouvelleContribution.niveau}`, { userId: nouvelleContribution.userId, userRole: 'repetiteur', matiere: nouvelleContribution.matiere, niveau: nouvelleContribution.niveau }));
      await updateDoc(docRef, { score_ia: evaluation.score || 0, commentaire_modération: evaluation.commentaire || '' });
    } catch { await updateDoc(docRef, { score_ia: 60 }); }
    return { contributionId: docRef.id, statut: 'en_attente' };
  } catch (error) { console.error('Erreur soumission contribution:', error); throw new Error('Impossible de soumettre votre contribution'); }
}

export async function getContributionsByUser(userId: string, statut?: ContributionStatut): Promise<Contribution[]> {
  try { let q: any = query(collection(db, 'contributions'), where('auteur.userId', '==', userId)); if (statut) q = query(q, where('statut', '==', statut)); const snap = await getDocs(q); return snap.docs.map(d => ({ id: d.id, ...(d.data() as Record<string, unknown>) })) as Contribution[]; } catch (e) { console.error(e); return []; }
}
export async function getContributionsEnModeration(): Promise<Contribution[]> {
  try { const q = query(collection(db, 'contributions'), where('statut', 'in', ['en_attente', 'en_modération', 'modification_demandée'])); const snap = await getDocs(q); return snap.docs.map(d => ({ id: d.id, ...(d.data() as Record<string, unknown>) })) as Contribution[]; } catch (e) { console.error(e); return []; }
}
export async function getContributionsValidees(matiere?: string, niveau?: string, limitCount = 10): Promise<Contribution[]> {
  try { let q: any = query(collection(db, 'contributions'), where('statut', '==', 'validé')); if (matiere) q = query(q, where('matiere', '==', matiere)); if (niveau) q = query(q, where('niveau', '==', niveau)); const snap = await getDocs(q); return snap.docs.map(d => ({ id: d.id, ...(d.data() as Record<string, unknown>) })).slice(0, limitCount) as Contribution[]; } catch (e) { console.error(e); return []; }
}
export async function validerContribution(contributionId: string, modérateurId: string, statut: ContributionStatut, commentaire?: string): Promise<void> { const refDoc = doc(db, 'contributions', contributionId); const snap = await getDoc(refDoc); if (!snap.exists()) throw new Error('Contribution non trouvée'); await updateDoc(refDoc, { statut, modérateur_id: modérateurId, commentaire_modération: commentaire || '', date_validation: statut === 'validé' ? serverTimestamp() : null }); const data = snap.data(); if (statut === 'validé' && data.prix > 0) await updateDoc(doc(db, 'users', data.auteur.userId), { solde: increment(data.prix * (1 - COMMISSION_CONTRIBUTION)) }); }
export async function demanderModification(contributionId: string, modérateurId: string, commentaire: string) { await updateDoc(doc(db, 'contributions', contributionId), { statut: 'modification_demandée', modérateur_id: modérateurId, commentaire_modération: commentaire }); }
export async function supprimerContribution(contributionId: string, modérateurId: string) { await updateDoc(doc(db, 'contributions', contributionId), { statut: 'rejeté', modérateur_id: modérateurId, commentaire_modération: 'Contribution supprimée par le modérateur' }); }
export async function demanderPaiement(userId: string, montant: number, infos: { methode: 'moov_money' | 'airtel_money'; numero: string }): Promise<{ paiementId: string }> { if (!['moov_money', 'airtel_money'].includes(infos.methode)) throw new Error('Méthode de paiement non supportée'); const refDoc = await addDoc(collection(db, 'demandes_paiement'), { repetiteur_id: userId, montant, methode: infos.methode, numero: infos.numero, statut: 'en_attente', date: serverTimestamp() }); return { paiementId: refDoc.id }; }
export async function incrementerTelechargements(contributionId: string) { try { await updateDoc(doc(db, 'contributions', contributionId), { telechargements: increment(1) }); } catch (e) { console.error(e); } }
export async function mettreAJourRevenus(contributionId: string, montant: number) { try { await updateDoc(doc(db, 'contributions', contributionId), { revenus_generes: increment(montant) }); } catch (e) { console.error(e); } }