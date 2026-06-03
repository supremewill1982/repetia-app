export type Matiere =
  | 'Maths' | 'Physique' | 'SVT' | 'Anglais'
  | 'Histoire' | 'Français' | 'Philo' | 'ESP';

export const MATIERES: Matiere[] = [
  'Maths','Physique','SVT','Anglais',
  'Histoire','Français','Philo','ESP',
];

export const MATIERE_CONFIG: Record<Matiere, { emoji: string; couleur: string }> = {
  Maths:    { emoji: '📐', couleur: '#4DA6FF' },
  Physique: { emoji: '⚡', couleur: '#FFD700' },
  SVT:      { emoji: '🧬', couleur: '#00E5A0' },
  Anglais:  { emoji: '🇬🇧', couleur: '#4ECDC4' },
  Histoire: { emoji: '🌍', couleur: '#FF8C42' },
  Français: { emoji: '✍️', couleur: '#FF6B9D' },
  Philo:    { emoji: '🧠', couleur: '#8B5CF6' },
  ESP:      { emoji: '💪', couleur: '#F59E0B' },
};

export interface ScriptSection {
  type:     'intro' | 'explication' | 'exemple' | 'quiz' | 'conclusion';
  dureeSec: number;
  texte:    string;
}

export interface PodcastEnregistre {
  id:              string;
  userId:          string;
  userPrenom:      string;
  matiere:         Matiere;
  titreChapitre:   string;
  titreSection:    string | null;
  texteOCR:        string;
  scriptPodcast:   ScriptSection[];
  dureeSecondes:   number;
  dateCreation:    string;
  derniereEcoute:  string | null;
  nbEcoute:        number;
  estFavori:       boolean;
  estPublic:       boolean;
  likesCount:      number;
}
