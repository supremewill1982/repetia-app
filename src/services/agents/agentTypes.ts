export type AgentType = 'tuteur' | 'evaluateur' | 'moderateur' | 'coach';

export interface AgentContext {
  userId: string;
  userRole: 'eleve' | 'parent' | 'repetiteur' | 'etablissement' | 'admin';
  matiere?: string;
  niveau?: string;
  historique?: Array<{ role: string; content: string }>;
}

export interface AgentResponse {
  reponse: string;
  coursManquant?: boolean;
  coursExiste?: boolean;
  propositionAjout?: string;
  score?: number;
}
