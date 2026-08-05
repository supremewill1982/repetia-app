import { db, storage } from './firebaseConfig';
import {
  collection, addDoc, serverTimestamp, query, where, getDocs,
  doc, getDoc, updateDoc, deleteDoc, onSnapshot
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as FileSystem from 'expo-file-system';
import { Contribution, ContributionStatut, NouvelleContribution } from '../types/contributionTypes';
import { utiliserAgent } from './agents/agentManager';
import { COMMISSION_CONTRIBUTION } from '../config/commissionRates';

// 📤 Soumettre une nouvelle contribution
export async function soumettreContribution(
  nouvelleContribution: NouvelleContribution
): Promise<{ contributionId: string; statut: ContributionStatut }> {
  try {
    // 1. Télécharger le fichier vers Firebase Storage
    const fileRef = ref(
      storage,
      `contributions/${nouvelleContribution.userId}/${Date.now()}_${nouvelleContribution.titre.replace(/\s+/g, '_')}`
    );

    const fileContent = await FileSystem.readAsStringAsync(nouvelleContribution.fichierUri);
    const fileBlob = new Blob([fileContent], { type: 'application/pdf' });
    await uploadBytes(fileRef, await fileBlob.arrayBuffer());

    const fileUrl = await getDownloadURL(fileRef);
    const fileInfo = await FileSystem.getInfoAsync(nouvelleContribution.fichierUri);

    // 2. Créer la contribution dans Firestore
    const contributionData = {
      type: nouvelleContribution.type,
      titre: nouvelleContribution.titre,
      matiere: nouvelleContribution.matiere,
      niveau: nouvelleContribution.niveau,
      serie: nouvelleContribution.serie || null,
      description: nouvelleContribution.description || null,
      tags: nouvelleContribution.tags || [],
      prix: nouvelleContribution.prix || 0,
      statut: 'en_modération' as ContributionStatut,
      auteur: {
        userId: nouvelleContribution.userId,
        nom: 'À compléter', // Sera mis à jour avec les données utilisateur
        role: 'repetiteur',
      },
      fichier: {
        url: fileUrl,
        nom: nouvelleContribution.fichierUri.split('/').pop() || 'fichier',
        taille: Math.round(fileInfo.size / 1024), // en Ko
        type: nouvelleContribution.fichierUri.split('.').pop()?.toLowerCase() || 'pdf',
      },
      date_soumission: serverTimestamp(),
      telechargements: 0,
      revenus_generes: 0,
      score_ia: 0,
    };

    const docRef = await addDoc(collection(db, 'contributions'), contributionData);

    // 3. Évaluer avec l'agent modérateur
    const evaluation = await utiliserAgent(
      'moderateur',
      `Évalue cette contribution: ${nouvelleContribution.titre}\nMatière: ${nouvelleContribution.matiere}\nNiveau: ${nouvelleContribution.niveau}`,
      { userId: nouvelleContribution.userId, userRole: 'repetiteur', matiere: nouvelleContribution.matiere, niveau: nouvelleContribution.niveau }
    );

    try {
      const evalData = JSON.parse(evaluation);
      await updateDoc(docRef, {
        score_ia: evalData.score || 0,
        commentaire_modération: evalData.commentaire || '',
      });
    } catch (e) {
      // Si ce n'est pas du JSON, utiliser un score par défaut
      await updateDoc(docRef, { score_ia: 60 });
    }

    return { contributionId: docRef.id, statut: 'en_modération' };
  } catch (error) {
    console.error('❌ Erreur soumission contribution:', error);
    throw new Error('Impossible de soumettre votre contribution');
  }
}

// 📥 Obtenir les contributions d'un utilisateur
export async function getContributionsByUser(
  userId: string,
  statut?: ContributionStatut
): Promise<Contribution[]> {
  try {
    let q = query(
      collection(db, 'contributions'),
      where('auteur.userId', '==', userId)
    );

    if (statut) {
      q = query(q, where('statut', '==', statut));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    })) as Contribution[];
  } catch (error) {
    console.error('❌ Erreur chargement contributions utilisateur:', error);
    return [];
  }
}

// 📥 Obtenir toutes les contributions en modération
export async function getContributionsEnModeration(): Promise<Contribution[]> {
  try {
    const q = query(
      collection(db, 'contributions'),
      where('statut', 'in', ['en_modération', 'en_attente', 'modification_demandée'])
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    })) as Contribution[];
  } catch (error) {
    console.error('❌ Erreur chargement contributions en modération:', error);
    return [];
  }
}

// 📥 Obtenir les contributions validées
export async function getContributionsValidees(
  matiere?: string,
  niveau?: string,
  limit: number = 10
): Promise<Contribution[]> {
  try {
    let q = query(
      collection(db, 'contributions'),
      where('statut', '==', 'validé')
    );

    if (matiere) {
      q = query(q, where('matiere', '==', matiere));
    }
    if (niveau) {
      q = query(q, where('niveau', '==', niveau));
    }

    const querySnapshot = await getDocs(q);
    let contributions = querySnapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    })) as Contribution[];

    // Trier par date de validation (les plus récentes en premier)
    contributions.sort((a, b) => {
      const dateA = a.date_validation ? a.date_validation.toDate() : new Date(0);
      const dateB = b.date_validation ? b.date_validation.toDate() : new Date(0);
      return dateB.getTime() - dateA.getTime();
    });

    return contributions.slice(0, limit);
  } catch (error) {
    console.error('❌ Erreur chargement contributions validées:', error);
    return [];
  }
}

// ✅ Valider une contribution
export async function validerContribution(
  contributionId: string,
  modérateurId: string,
  statut: ContributionStatut,
  commentaire?: string
): Promise<void> {
  try {
    const contribRef = doc(db, 'contributions', contributionId);
    const contribDoc = await getDoc(contribRef);

    if (!contribDoc.exists()) {
      throw new Error('Contribution non trouvée');
    }

    const contribData = contribDoc.data();

    await updateDoc(contribRef, {
      statut,
      modérateur_id: modérateurId,
      commentaire_modération: commentaire || '',
      date_validation: statut === 'validé' ? serverTimestamp() : null,
    });

    // Si validé, mettre à jour le solde du répétiteur
    if (statut === 'validé' && contribData.prix > 0) {
      const userRef = doc(db, 'users', contribData.auteur.userId);
      await updateDoc(userRef, {
        solde: contribData.prix * (1 - COMMISSION_CONTRIBUTION),
      });
    }

  } catch (error) {
    console.error('❌ Erreur validation contribution:', error);
    throw new Error('Impossible de valider la contribution');
  }
}

// 🔄 Demander une modification
export async function demanderModification(
  contributionId: string,
  modérateurId: string,
  commentaire: string
): Promise<void> {
  try {
    const contribRef = doc(db, 'contributions', contributionId);
    await updateDoc(contribRef, {
      statut: 'modification_demandée' as ContributionStatut,
      modérateur_id: modérateurId,
      commentaire_modération: commentaire,
    });
  } catch (error) {
    console.error('❌ Erreur demande modification:', error);
    throw new Error('Impossible de demander une modification');
  }
}

// 🗑️ Supprimer une contribution
export async function supprimerContribution(
  contributionId: string,
  modérateurId: string
): Promise<void> {
  try {
    const contribRef = doc(db, 'contributions', contributionId);
    await updateDoc(contribRef, {
      statut: 'rejeté' as ContributionStatut,
      modérateur_id: modérateurId,
      commentaire_modération: 'Contribution supprimée par le modérateur',
    });
  } catch (error) {
    console.error('❌ Erreur suppression contribution:', error);
    throw new Error('Impossible de supprimer la contribution');
  }
}

// 💰 Demander un paiement
export async function demanderPaiement(
  userId: string,
  montant: number,
  infosBanquaires: { iban: string; nom_banque: string; numero_compte: string }
): Promise<{ paiementId: string }> {
  try {
    const paiementRef = await addDoc(collection(db, 'demandes_paiement'), {
      user_id: userId,
      montant,
      statut: 'en_attente',
      infos_banquaires: infosBanquaires,
      date: serverTimestamp(),
    });

    // Mettre à jour le solde de l'utilisateur
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      solde: 0, // Réinitialiser le solde après demande de paiement
    });

    return { paiementId: paiementRef.id };
  } catch (error) {
    console.error('❌ Erreur demande paiement:', error);
    throw new Error('Impossible de demander un paiement');
  }
}

// 📊 Incrémenter le nombre de téléchargements
export async function incrementerTelechargements(contributionId: string): Promise<void> {
  try {
    const contribRef = doc(db, 'contributions', contributionId);
    await updateDoc(contribRef, {
      telechargements: 1, // Firestore va incrémenter
    });
  } catch (error) {
    console.error('❌ Erreur incrémentation téléchargements:', error);
  }
}

// 📊 Mettre à jour les revenus générés
export async function mettreAJourRevenus(contributionId: string, montant: number): Promise<void> {
  try {
    const contribRef = doc(db, 'contributions', contributionId);
    await updateDoc(contribRef, {
      revenus_generes: montant, // Firestore va incrémenter
    });
  } catch (error) {
    console.error('❌ Erreur mise à jour revenus:', error);
  }
}
