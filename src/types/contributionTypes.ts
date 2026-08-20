export type ContributionType = 'cours' | 'devoir' | 'correction';
export type ContributionStatut = 'en_attente' | 'en_modération' | 'validé' | 'rejeté' | 'modification_demandée' | 'désactivé';

export interface ContributionAuteur {
  userId: string;
  nom: string;
  role: 'repetiteur' | 'etablissement' | 'admin';
  email?: string;
}

export interface ContributionFichier {
  url: string;
  nom: string;
  taille: number; // en Ko
  type: string; // pdf, docx, etc.
}

export interface Contribution {
  id: string;
  type: ContributionType;
  titre: string;
  matiere: string;
  niveau: string;
  serie?: string;
  description?: string;
  contenuTexte?: string;
  tags: string[];
  prix: number; // en FCFA
  statut: ContributionStatut;
  auteur: ContributionAuteur;
  fichier: ContributionFichier;
  date_soumission: any; // Firestore Timestamp
  date_validation?: any;
  telechargements?: number;
  revenus_generes?: number;
  score_ia?: number;
  notes_moyenne?: number;
  modérateur_id?: string;
  commentaire_modération?: string;
}

export interface NouvelleContribution {
  userId: string;
  fichierUri: string;
  type: ContributionType;
  titre: string;
  matiere: string;
  niveau: string;
  tags: string[];
  serie?: string;
  prix: number;
  description?: string;
  contenuTexte?: string;
}
