export type CertificationNiveau = 'bronze' | 'argent' | 'or' | 'diamant' | 'maitre';

export interface TestCertification {
  id: string;
  matiere: string;
  niveau: string;
  questions: Array<{
    id: string;
    texte: string;
    type: 'qcm' | 'ouvert';
    options?: string[];
    reponse_correcte?: string;
    points: number;
    difficulte: 'facile' | 'moyen' | 'difficile';
  }>;
  score: number;
  feedback?: string;
  statut: 'en_cours' | 'terminé' | 'validé' | 'rejeté';
  repetiteur_id: string;
  date_passage: any; // Firestore Timestamp
  date_expiration_reclamation?: any;
  duree: number; // en minutes
  note_passage: number;
}

export interface Reclamation {
  id: string;
  test_id: string;
  repetiteur_id: string;
  matiere: string;
  niveau: string;
  commentaire: string;
  statut: 'en_attente' | 'acceptée' | 'rejetée';
  date: any; // Firestore Timestamp
  traite_par?: string;
  date_traitement?: any;
  decision?: string;
  commentaire_admin?: string;
}

export const COUT_TEST_CERTIFICATION = 5000; // 5000 FCFA
export const SEUIL_PAIEMENT = 10000; // 10000 FCFA minimum pour demander un paiement
export const DEL AI_RECLAMATION = 7; // 7 jours pour faire une réclamation
