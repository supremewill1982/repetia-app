// Version ultra-optimisée pour rester sous 2048 bytes
export function optimizeSession(session: any): any {
  return {
    d: session.date.substring(0, 10), // Date courte
    m: (session.matiere || (session.type === 'devoir' ? 'D' : 'R')).substring(0, 20),
    t: session.type === 'devoir' ? 'D' : 'R',
    s: session.scoreTotal || 0,
    x: session.scoreMax || 10,
    q: (session.questions || []).slice(0, 5).map((q: any) => ({
      n: q.note || 0
    }))
  };
}

export function restoreSession(optimized: any): any {
  return {
    date: optimized.d,
    matiere: optimized.m === 'D' ? 'Devoir' : (optimized.m === 'R' ? 'Révision' : optimized.m),
    type: optimized.t === 'D' ? 'devoir' : 'revision',
    scoreTotal: optimized.s,
    scoreMax: optimized.x,
    questions: (optimized.q || []).map((q: any) => ({
      note: q.n,
      question: '',
      reponse: '',
      feedback: ''
    }))
  };
}
