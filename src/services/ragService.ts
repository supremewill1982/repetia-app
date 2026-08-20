import { db } from './firebaseConfig';
import { collection, query as firestoreQuery, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { utiliserAgent } from './agents/agentManager';
import { AgentType } from './agents/agentTypes';

// 🔍 Rechercher dans la base de connaissances (RAG)
export async function searchRAG(
  query: string,
  matiere: string,
  niveau: string,
  userId: string,
  userRole: string
): Promise<{ reponse: string; coursManquant: boolean; coursExiste: boolean; propositionAjout?: string }> {
  try {
    // 1. Rechercher les contributions validées de la matière
    const contributionsQuery = firestoreQuery(
      collection(db, 'contributions'),
      where('statut', '==', 'validé'),
      where('matiere', '==', matiere)
    );

    const snapshot = await getDocs(contributionsQuery);

    // 2. Filtrer par niveau
    const contributions: Array<Record<string, unknown> & { id: string }> = snapshot.docs
      .map((d): Record<string, unknown> & { id: string } => ({ id: d.id, ...(d.data() as Record<string, unknown>) }))
      .filter(c => !niveau || c.niveau === niveau);

    // 3. Chercher une contribution contenant du texte exploitable par le RAG
    const avecContenu = contributions.find(
      c => typeof c.contenuTexte === 'string' && c.contenuTexte.trim().length > 0
    );

    if (avecContenu) {
      const contenu = String(avecContenu.contenuTexte).substring(0, 12000);

      const prompt = `Tu es le Tuteur IA de Repetia.

Réponds à la question de l'élève en utilisant PRIORITAIREMENT le contenu pédagogique fourni ci-dessous.

QUESTION DE L'ÉLÈVE :
${query}

COURS DISPONIBLE :
Titre : ${avecContenu.titre || 'Cours'}
Matière : ${avecContenu.matiere || matiere}
Niveau : ${avecContenu.niveau || niveau}

CONTENU :
${contenu}

RÈGLES :
- Réponds en français.
- Explique progressivement et simplement.
- Ne fabrique pas d'informations absentes du cours si la question porte directement sur celui-ci.
- Si le cours ne contient pas suffisamment d'informations pour répondre, indique-le clairement puis complète avec tes connaissances générales.
- Aide l'élève à comprendre plutôt que de donner uniquement une réponse finale.`;

      const agentResponse = await utiliserAgent(
        'tuteur',
        prompt,
        { userId, userRole, matiere, niveau, historique: [] }
      );

      return {
        reponse: agentResponse,
        coursManquant: false,
        coursExiste: true,
      };
    }

    // 4. Aucun contenu texte exploitable : utiliser le tuteur en fallback
    const agentResponse = await utiliserAgent(
      'tuteur',
      query,
      { userId, userRole, matiere, niveau, historique: [] }
    );

    const coursManquant =
      !agentResponse.includes("J'ai trouvé") &&
      !agentResponse.includes('Voici') &&
      (query.toLowerCase().includes('cours sur') ||
       query.toLowerCase().includes('expliquer') ||
       query.toLowerCase().includes('apprendre'));

    return {
      reponse: agentResponse,
      coursManquant,
      coursExiste: contributions.length > 0,
      propositionAjout: coursManquant
        ? `Créer un cours sur: ${query.substring(0, 100)}...`
        : undefined,
    };

  } catch (error) {
    console.error('❌ Erreur recherche RAG:', error);

    return {
      reponse: 'Désolé, je n\'ai pas pu trouver de réponse dans notre base de connaissances. Essayez de reformuler votre question.',
      coursManquant: false,
      coursExiste: false,
    };
  }
}

// 🔍 Rechercher des contributions par critères
export async function rechercherContributions(
  matiere?: string,
  niveau?: string,
  tags?: string[],
  type?: string,
  limit: number = 10
): Promise<any[]> {
  try {
    let q = firestoreQuery(collection(db, 'contributions'), where('statut', '==', 'validé'));

    if (matiere) {
      q = firestoreQuery(q, where('matiere', '==', matiere));
    }
    if (niveau) {
      q = firestoreQuery(q, where('niveau', '==', niveau));
    }

    const querySnapshot = await getDocs(q);
    let contributions: Array<Record<string, unknown> & { id: string }> = querySnapshot.docs.map((d): Record<string, unknown> & { id: string } => ({ id: d.id, ...(d.data() as Record<string, unknown>) }));

    // Filtrer par tags si spécifiés
    if (tags && tags.length > 0) {
      contributions = contributions.filter(c =>
          tags.some(tag => Array.isArray(c.tags) && c.tags.includes(tag))
      );
    }

    // Filtrer par type si spécifié
    if (type) {
      contributions = contributions.filter(c => c.type === type);
    }

    // Trier par téléchargements (popularité)
      contributions.sort((a, b) => (Number(b.telechargements) || 0) - (Number(a.telechargements) || 0));

    return contributions.slice(0, limit);
  } catch (error) {
    console.error('❌ Erreur recherche contributions:', error);
    return [];
  }
}
