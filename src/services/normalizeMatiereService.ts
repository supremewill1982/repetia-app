const MOTS_INTERDITS = ['cours', 'inconnue', 'undefined', 'null', ''];

export function normalizeMatiere(
  matiere: string | undefined | null,
  type?: string
): string {
  const valeurParDefaut = type === 'devoir' ? 'Devoir' : 'Révision';

  if (!matiere) {
    return valeurParDefaut;
  }

  const matiereNettoyee = matiere.toLowerCase().trim();

  if (MOTS_INTERDITS.includes(matiereNettoyee)) {
    return valeurParDefaut;
  }

  return matiere;
}

export function normalizeSessionMatiere(session: any): any {
  if (!session) return session;

  const sessionClone = { ...session };
  sessionClone.matiere = normalizeMatiere(
    session.matiere,
    session.type
  );

  return sessionClone;
}

export function normalizeSessions(sessions: any[]): any[] {
  return sessions.map(session => normalizeSessionMatiere(session));
}
