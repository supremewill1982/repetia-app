import { db } from './firebaseConfig';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
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
    // 1. Rechercher dans les contributions validées
    const contributionsQuery = query(
      collection(db, 'contributions'),
      where('statut', '==', 'validé'),
      where('matiere', '==', matiere)
    );

    if (niveau) {
      // Filtrer par niveau si spécifié
      const allContributions = await getDocs(contributionsQuery);
      const filteredByNiveau = allContributions.docs.filter(
        d => d.data().niveau === niveau
      );
      if (filteredByNiveau.length > 0) {
        // Trouver la contribution la plus pertinente
        const bestMatch = filteredByNiveau[0].data();
        return {
          reponse: `J'ai trouvé un cours pertinent dans notre base de connaissances:\n\n📚 **${bestMatch.titre}**\nMatière: ${bestMatch.matiere} - Niveau: ${bestMatch.niveau}\n\n${bestMatch.description || 'Pas de description disponible'}\n\nVous pouvez télécharger ce cours pour obtenir plus de détails.`,
          coursManquant: false,
          coursExiste: true,
        };
      }
    }

    // 2. Si rien trouvé, utiliser l'agent tuteur
    const agentResponse = await utiliserAgent(
      'tuteur',
      query,
      { userId, userRole, matiere, niveau, historique: [] }
    );

    // 3. Vérifier si la question suggère un cours manquant
    const coursManquant = !agentResponse.includes('J\'ai trouvé') &&
                          !agentResponse.includes('Voici') &&
                          (query.includes('cours sur') ||
                           query.includes('expliquer') ||
                           query.includes('apprendre'));

    return {
      reponse: agentResponse,
      coursManquant,
      coursExiste: false,
      propositionAjout: coursManquant ?
        `Créer un cours sur: ${query.substring(0, 100)}...` :
        undefined
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
    let q = query(collection(db, 'contributions'), where('statut', '==', 'validé'));

    if (matiere) {
      q = query(q, where('matiere', '==', matiere));
    }
    if (niveau) {
      q = query(q, where('niveau', '==', niveau));
    }

    const querySnapshot = await getDocs(q);
    let contributions = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    // Filtrer par tags si spécifiés
    if (tags && tags.length > 0) {
      contributions = contributions.filter(c =>
        tags.some(tag => c.tags.includes(tag))
      );
    }

    // Filtrer par type si spécifié
    if (type) {
      contributions = contributions.filter(c => c.type === type);
    }

    // Trier par téléchargements (popularité)
    contributions.sort((a, b) => (b.telechargements || 0) - (a.telechargements || 0));

    return contributions.slice(0, limit);
  } catch (error) {
    console.error('❌ Erreur recherche contributions:', error);
    return [];
  }
}
