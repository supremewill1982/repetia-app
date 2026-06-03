import matieresData from '../data/matieres.json';

export interface Matiere {
  nom: string;
  icone: string;
  couleur: string;
  ordre: number;
}

export function getAllMatieres(): Matiere[] {
  return matieresData.matieres.sort((a, b) => a.ordre - b.ordre);
}

export function getMatiereInfo(nomMatiere: string): Matiere | undefined {
  return matieresData.matieres.find(m => m.nom === nomMatiere);
}

export function getMatiereInfoWithFallback(nomMatiere: string): Matiere {
  const matiere = matieresData.matieres.find(m => m.nom === nomMatiere);
  if (matiere) return matiere;
  
  return {
    nom: nomMatiere,
    icone: 'help-circle',
    couleur: '#95A5A6',
    ordre: 999
  };
}
