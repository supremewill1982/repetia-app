// Taux de commission pour les différentes opérations
export const COMMISSION_CONTRIBUTION = 0.20; // 20% de commission sur les contributions payantes
export const COMMISSION_CERTIFICATION = 0.30; // 30% de commission sur les tests de certification
export const COMMISSION_ABONNEMENT = 0.15; // 15% de commission sur les abonnements

// Seuil minimum pour les retraits
export const SEUIL_RETRAIT_REPETITEUR = 10000; // 10 000 FCFA
export const SEUIL_RETRAIT_ETABLISSEMENT = 50000; // 50 000 FCFA

// Répartition des revenus pour les contributions
export const REPARTITION_CONTRIBUTION = {
  repetiteur: 0.70, // 70% pour le répétiteur
  plateforme: 0.20, // 20% pour la plateforme
  etablissement: 0.10, // 10% pour l'établissement (si applicable)
};

// Répartition des revenus pour les certifications
export const REPARTITION_CERTIFICATION = {
  plateforme: 0.70, // 70% pour la plateforme
  evaluateurs: 0.30, // 30% pour les évaluateurs
};

// Niveaux de certification
export const NIVEAUX_CERTIFICATION = {
  bronze: { score_min: 50, score_max: 69 },
  argent: { score_min: 70, score_max: 84 },
  or: { score_min: 85, score_max: 94 },
  diamant: { score_min: 95, score_max: 100 },
};

// Prix des tests de certification par niveau
export const PRIX_TEST_PAR_NIVEAU = {
  '6ème': 3000,
  '5ème': 3000,
  '4ème': 3500,
  '3ème': 3500,
  'Seconde': 4000,
  '1ère': 4500,
  'Terminale': 5000,
};
