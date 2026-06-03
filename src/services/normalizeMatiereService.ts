const MOTS_INTERDITS = ['cours', 'inconnue', 'undefined', 'null', ''];

export function normalizeMatiere(matiere: string | undefined | null, type?: string): string {
  if (!matiere) {
    return type === 'devoir' ? 'Devoir' : 'Révision';
  }
  
  if (matiere === '' || matiere === null) {
    return type === 'devoir' ? 'Devoir' : 'Révision';
  }
  
  if (MOTS_INTERDITS.includes(matiere.toLowerCase().trim())) {
    return type === 'devoir' ? 'Devoir' : 'Révision';
  }
  
  if (matiere.toLowerCase() === 'cours') {
    return type === 'devoir' ? 'Devoir' : 'Révision';
  }
  
  return matiere;
}

export function normalizeSessionMatiere(session: any): any {
  if (!session) return session;
  
  const sessionClone = { ...session };
  sessionClone.matiere = normalizeMatiere(session.matiere, session.type);
  
  return sessionClone;
}

export function normalizeSessions(sessions: any[]): any[] {
  return sessions.map(session => normalizeSessionMatiere(session));
}
