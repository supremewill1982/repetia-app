import { db } from './firebaseConfig';
import {
  collection, addDoc, serverTimestamp, query, where, getDocs,
  doc, getDoc, updateDoc, deleteDoc
} from 'firebase/firestore';
import { utiliserAgent, genererTestCertification } from './agents/agentManager';
import { COUT_TEST_CERTIFICATION, DELAI_RECLAMATION, NIVEAUX_CERTIFICATION, PRIX_TEST_PAR_NIVEAU } from '../config/commissionRates';
import { CertificationNiveau, Reclamation, TestCertification } from '../types/certificationTypes';

// 🎯 Générer gratuitement un nouveau test de certification
export async function payerTestCertification(
  userId: string,
  matiere: string,
  niveau: string
): Promise<{ testId: string }> {
  try {
    // La certification est gratuite.
    // Le solde du répétiteur représente uniquement ses gains.
    const { testId, questions } = await genererTestCertification(
      matiere,
      niveau,
      `${matiere} - ${niveau}`
    );

    await addDoc(collection(db, 'tests_certification'), {
      id: testId,
      matiere,
      niveau,
      questions,
      repetiteur_id: userId,
      statut: 'en_cours',
      date_passage: null,
      date_expiration_reclamation: null,
      score: 0,
      feedback: '',
      duree: 60,
      note_passage: 70,
    });

    return { testId };
  } catch (error) {
    console.error('❌ Erreur génération test certification:', error);
    throw error;
  }
}

// 📝 Soumettre un test terminé
export async function soumettreTest(
  testId: string,
  reponses: Record<string, string>
): Promise<{ score: number; niveau: CertificationNiveau; feedback: string; testReussi: boolean }> {
  try {
    const testRef = doc(db, 'tests_certification', testId);
    const testDoc = await getDoc(testRef);

    if (!testDoc.exists()) {
      throw new Error('Test non trouvé');
    }

    const testData = testDoc.data();
    const questions = testData.questions || [];

    // 📌 Calculer le score (en production: utiliser l'agent évaluateur)
    let score = 0;
    let totalPoints = 0;

    const normaliserReponse = (value: string) =>
      String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\\u0300-\\u036f]/g, '')
        .replace(/[.,!?;:]/g, '')
        .replace(/\\s+/g, ' ')
        .trim();

    questions.forEach((q: any) => {
      totalPoints += q.points || 0;

      const reponseUtilisateur = normaliserReponse(reponses[q.id]);
      const reponseCorrecte = normaliserReponse(q.reponse_correcte);

      if (reponseUtilisateur === reponseCorrecte) {
        score += q.points || 0;
      }
    });

    const pourcentage = totalPoints > 0
      ? Math.round((score / totalPoints) * 100)
      : 0;

    // 📌 Déterminer le niveau de certification
    let niveauCertif: CertificationNiveau = 'bronze';
    if (pourcentage >= NIVEAUX_CERTIFICATION.diamant.score_min) {
      niveauCertif = 'diamant';
    } else if (pourcentage >= NIVEAUX_CERTIFICATION.or.score_min) {
      niveauCertif = 'or';
    } else if (pourcentage >= NIVEAUX_CERTIFICATION.argent.score_min) {
      niveauCertif = 'argent';
    } else if (pourcentage >= NIVEAUX_CERTIFICATION.bronze.score_min) {
      niveauCertif = 'bronze';
    }

    // 📌 Générer un feedback avec l'agent coach
    const feedback = await utiliserAgent(
      'coach',
      `Génère un feedback pour un test de certification en ${testData.matiere} (niveau ${testData.niveau}) avec un score de ${pourcentage}%.
      Le test contenait ${questions.length} questions.`,
      { userId: testData.repetiteur_id, userRole: 'repetiteur', matiere: testData.matiere, niveau: testData.niveau }
    );

    // 📌 Mettre à jour le test
    const dateExpiration = new Date();
    dateExpiration.setDate(dateExpiration.getDate() + DELAI_RECLAMATION);

    await updateDoc(testRef, {
      statut: 'terminé',
      score: pourcentage,
      feedback,
      date_passage: serverTimestamp(),
      date_expiration_reclamation: dateExpiration,
    });

    // Fermer le suivi du test en cours
    const enCoursQuery = query(
      collection(db, 'tests_certification_en_cours'),
      where('test_id', '==', testId),
      where('repetiteur_id', '==', testData.repetiteur_id)
    );

    const enCoursSnapshot = await getDocs(enCoursQuery);

    for (const docSnap of enCoursSnapshot.docs) {
      await updateDoc(doc(db, 'tests_certification_en_cours', docSnap.id), {
        statut: 'terminé',
        date_fin: serverTimestamp(),
        score: pourcentage,
      });
    }

    // 📌 Mettre à jour la certification de l'utilisateur
    const userRef = doc(db, 'users', testData.repetiteur_id);
    await updateDoc(userRef, {
      [`certifications.${testData.matiere}.${testData.niveau}`]: {
        niveau: niveauCertif,
        score: pourcentage,
        date: serverTimestamp(),
        valide: pourcentage >= testData.note_passage,
      },
    });

    return {
      score: pourcentage,
      niveau: niveauCertif,
      feedback,
      testReussi: pourcentage >= testData.note_passage,
    };

  } catch (error) {
    console.error('❌ Erreur soumission test:', error);
    throw new Error('Impossible de soumettre le test');
  }
}

// 📋 Obtenir les tests d'un répétiteur
export async function getTestsByRepetiteur(userId: string): Promise<TestCertification[]> {
  try {
    const q = query(
      collection(db, 'tests_certification'),
      where('repetiteur_id', '==', userId)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    })) as TestCertification[];
  } catch (error) {
    console.error('❌ Erreur chargement tests:', error);
    return [];
  }
}

// ⚖️ Faire une réclamation pour un test
export async function faireReclamation(
  testId: string,
  repetiteurId: string,
  commentaire: string
): Promise<{ reclamationId: string }> {
  try {
    // Vérifier que le délai n'est pas expiré
    const testRef = doc(db, 'tests_certification', testId);
    const testDoc = await getDoc(testRef);

    if (!testDoc.exists()) {
      throw new Error('Test non trouvé');
    }

    const testData = testDoc.data();
    const dateExpiration = testData.date_expiration_reclamation?.toDate();

    if (dateExpiration && new Date() > dateExpiration) {
      throw new Error(`Délai de réclamation expiré (${DELAI_RECLAMATION} jours après le test)`);
    }

    // Créer la réclamation
    const reclamationRef = await addDoc(collection(db, 'reclamations_certification'), {
      test_id: testId,
      repetiteur_id: repetiteurId,
      matiere: testData.matiere,
      niveau: testData.niveau,
      commentaire,
      statut: 'en_attente',
      date: serverTimestamp(),
    });

    return { reclamationId: reclamationRef.id };
  } catch (error) {
    console.error('❌ Erreur réclamation:', error);
    throw error;
  }
}

// ✅ Obtenir les réclamations en attente
export async function getReclamationsEnAttente(): Promise<Reclamation[]> {
  try {
    const q = query(
      collection(db, 'reclamations_certification'),
      where('statut', '==', 'en_attente')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    })) as Reclamation[];
  } catch (error) {
    console.error('❌ Erreur chargement réclamations:', error);
    return [];
  }
}

// ✅ Traiter une réclamation
export async function traiterReclamation(
  reclamationId: string,
  adminId: string,
  decision: 'acceptée' | 'rejetée',
  commentaire?: string
): Promise<void> {
  try {
    const reclamationRef = doc(db, 'reclamations_certification', reclamationId);
    const reclamationDoc = await getDoc(reclamationRef);

    if (!reclamationDoc.exists()) {
      throw new Error('Réclamation non trouvée');
    }

    const reclamationData = reclamationDoc.data();

    // Mettre à jour la réclamation
    await updateDoc(reclamationRef, {
      statut: decision,
      traite_par: adminId,
      date_traitement: serverTimestamp(),
      decision,
      commentaire_admin: commentaire || '',
    });

    // Si acceptée, recalculer le test
    if (decision === 'acceptée') {
      const testRef = doc(db, 'tests_certification', reclamationData.test_id);
      await updateDoc(testRef, {
        statut: 'à_reévaluer',
      });
    }

  } catch (error) {
    console.error('❌ Erreur traitement réclamation:', error);
    throw new Error('Impossible de traiter la réclamation');
  }
}
