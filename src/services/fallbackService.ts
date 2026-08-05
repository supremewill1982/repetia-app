import { db } from './firebaseConfig';
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { searchRAG } from './ragService';
import { utiliserAgent } from './agents/agentManager';
import { ContributionStatut } from '../types/contributionTypes';
import { AgentType } from './agents/agentTypes';

// 🔄 Gérer une question avec fallback (RAG → Web → Proposition)
export async function gererQuestionAvecFallback(
  question: string,
  userId: string,
  userRole: string,
  matiere: string,
  niveau: string,
  historique: Array<{ role: string; content: string }>
): Promise<{
  reponse: string;
  coursManquant: boolean;
  coursExiste: boolean;
  propositionAjout?: string;
}> {
  try {
    console.log(`[FALLBACK] Question: ${question.substring(0, 50)}...`);

    // 📌 ÉTAPE 1: Rechercher dans la base de connaissances (RAG)
    const ragResult = await searchRAG(question, matiere, niveau, userId, userRole);

    if (ragResult.coursExiste) {
      console.log('[FALLBACK] ✅ Trouvé dans RAG');
      return {
        ...ragResult,
        coursManquant: false,
      };
    }

    // 📌 ÉTAPE 2: Utiliser l'agent tuteur pour générer une réponse
    console.log('[FALLBACK] 🤖 Utilisation de l\'agent tuteur');
    const agentResponse = await utiliserAgent(
      'tuteur',
      question,
      { userId, userRole, matiere, niveau, historique }
    );

    // 📌 ÉTAPE 3: Vérifier si la question suggère un cours manquant
    const coursManquant = isCoursManquant(question, agentResponse);

    return {
      reponse: agentResponse,
      coursManquant,
      coursExiste: false,
      propositionAjout: coursManquant ?
        `Créer un cours sur: ${question.substring(0, 100)}...` :
        undefined,
    };

  } catch (error) {
    console.error('❌ Erreur fallback:', error);
    return {
      reponse: 'Désolé, je n\'ai pas pu traiter votre question. Veuillez réessayer ou contacter le support.',
      coursManquant: false,
      coursExiste: false,
    };
  }
}

// 🔍 Vérifier si une question suggère un cours manquant
function isCoursManquant(question: string, response: string): boolean {
  const lowerQuestion = question.toLowerCase();
  const lowerResponse = response.toLowerCase();

  // Mots-clés indiquant un besoin de cours
  const coursKeywords = [
    'cours sur', 'expliquer', 'apprendre', 'comprendre',
    'comment faire', 'méthode pour', 'leçon sur',
    'je ne comprends pas', 'aide moi avec', 'besoin d\'aide pour'
  ];

  // Si la question contient des mots-clés de cours ET que la réponse ne mentionne pas de ressource existante
  const aBesoinDeCours = coursKeywords.some(kw => lowerQuestion.includes(kw));
  const aTrouveRessource = lowerResponse.includes('trouvé') ||
                          lowerResponse.includes('voici') ||
                          lowerResponse.includes('cours') ||
                          lowerResponse.includes('explication');

  return aBesoinDeCours && !aTrouveRessource;
}

// 📝 Proposer d'ajouter un cours
export async function proposerAjoutCours(
  titre: string,
  matiere: string,
  niveau: string,
  userId: string,
  userRole: string
): Promise<{ proposition: string; titreSuggere: string }> {
  try {
    // Vérifier si un cours similaire existe déjà
    const existingQuery = query(
      collection(db, 'contributions'),
      where('matiere', '==', matiere),
      where('niveau', '==', niveau),
      where('statut', '==', 'validé')
    );

    const existingDocs = await getDocs(existingQuery);
    const existing = existingDocs.docs.find(d =>
      d.data().titre.toLowerCase().includes(titre.toLowerCase())
    );

    if (existing) {
      return {
        proposition: `Un cours similaire existe déjà: "${existing.data().titre}". Souhaitez-vous y contribuer ou créer un nouveau cours ?`,
        titreSuggere: existing.data().titre,
      };
    }

    return {
      proposition: `Aucun cours ne couvre exactement ce sujet. Souhaitez-vous créer: "${titre}" ?`,
      titreSuggere: titre,
    };

  } catch (error) {
    console.error('❌ Erreur proposition cours:', error);
    return {
      proposition: 'Souhaitez-vous créer un nouveau cours sur ce sujet ?',
      titreSuggere: titre,
    };
  }
}
