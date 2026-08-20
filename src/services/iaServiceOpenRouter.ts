import axios from 'axios';
import Constants from 'expo-constants';

const GEMINI_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
];

const getGeminiApiKey = (): string => {
  return Constants.expoConfig?.extra?.geminiApiKey || '';
};

async function appelerGemini(
  prompt: string,
  options?: {
    systemInstruction?: string;
    imageBase64?: string;
    mimeType?: string;
    maxOutputTokens?: number;
    responseMimeType?: string;
  }
): Promise<string> {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw new Error('Clé Gemini absente');
  }

  const parts: any[] = [];

  if (options?.imageBase64) {
    parts.push({
      inline_data: {
        mime_type: options.mimeType || 'image/jpeg',
        data: options.imageBase64,
      },
    });
  }

  parts.push({ text: prompt });

  const body: any = {
    contents: [
      {
        role: 'user',
        parts,
      },
    ],
    generationConfig: {
      maxOutputTokens: options?.maxOutputTokens || 4000,
      ...(options?.responseMimeType
        ? { responseMimeType: options.responseMimeType }
        : {}),
    },
  };

  if (options?.systemInstruction) {
    body.systemInstruction = {
      parts: [{ text: options.systemInstruction }],
    };
  }

  let dernierErreur: any = null;

  for (const model of GEMINI_MODELS) {
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    try {
      console.log(`🤖 Gemini : tentative avec ${model}`);

      const response = await axios.post(
        url,
        body,
        {
          headers: {
            'x-goog-api-key': apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      const content = response.data?.candidates?.[0]?.content?.parts
        ?.map((part: any) => part.text || '')
        .join('')
        .trim();

      if (!content) {
        throw new Error(`Réponse Gemini vide (${model})`);
      }

      console.log(`✅ Gemini ${model} a répondu`);
      return content;

    } catch (error: any) {
      dernierErreur = error;

      const status = error?.response?.status;

      console.error(
        `❌ Gemini ${model} erreur ${status || 'inconnue'}:`,
        error?.response?.data || error?.message || error
      );

      // On passe au modèle suivant uniquement pour les erreurs
      // temporaires de disponibilité ou de surcharge.
      if (status === 503 || status === 429) {
        console.log(`🔄 Fallback Gemini vers le modèle suivant...`);
        continue;
      }

      // Les autres erreurs sont probablement des erreurs de clé,
      // de requête ou de configuration : inutile de changer de modèle.
      throw error;
    }
  }

  throw dernierErreur || new Error('Tous les modèles Gemini sont indisponibles');
}

let niveauEleve = 'Terminale';
let performanceEleve = 10;

export function setNiveauEleve(niveau: string) { niveauEleve = niveau; }
export function setPerformanceEleve(performance: number) { performanceEleve = performance; }

// ══════════════════════════════════════════════════════
// 🤖 LES 8 AGENTS IA SPÉCIALISÉS — Cœur de RÉPÉTIA
// ══════════════════════════════════════════════════════
export const AGENTS = [
  {
    id: 'maths',
    nom: 'ProfMaths',
    emoji: '📐',
    matiere: 'Mathématiques',
    couleur: '#4DA6FF',
    signature: 'Étape par étape, tu vas comprendre.',
    systemPrompt: (niveau: string) => `Tu es ProfMaths, professeur expert en Mathématiques.
Tu maîtrises parfaitement le programme du Bac gabonais (séries C et D) et du BEPC.
Tu enseignes à un élève de niveau ${niveau}.

MÉTHODE PÉDAGOGIQUE :
- Ne donne JAMAIS la réponse directement
- Décompose chaque problème en étapes numérotées
- Utilise des exemples concrets de la vie quotidienne africaine
- Pour les calculs : montre chaque étape clairement
- Si l'élève bloque : donne un indice, pas la solution
- Encourage après chaque bonne réponse partielle

DOMAINES : Algèbre, Géométrie, Analyse, Probabilités, Statistiques, Suites, Dérivées, Intégrales
SIGNATURE : "Étape par étape, tu vas comprendre." 📐`,
  },
  {
    id: 'svt',
    nom: 'ProfSVT',
    emoji: '🧬',
    matiere: 'SVT',
    couleur: '#00E5A0',
    signature: 'La vie est partout autour de toi.',
    systemPrompt: (niveau: string) => `Tu es ProfSVT, professeur passionné de Sciences de la Vie et de la Terre.
Tu maîtrises le programme du Bac gabonais niveau ${niveau}.

MÉTHODE PÉDAGOGIQUE :
- Utilise des exemples de la faune et flore du Gabon (forêt équatoriale, mangroves, gorilles, okapis)
- Fais des liens avec l'environnement tropical africain
- Pour les schémas : décris-les avec des mots clairs
- Mémorisation via des mnémotechniques

DOMAINES : Génétique, Evolution, Physiologie, Ecosystèmes, Géologie, Cellule, Reproduction
SIGNATURE : "La vie est partout autour de toi." 🌿`,
  },
  {
    id: 'francais',
    nom: 'ProfFrançais',
    emoji: '✍️',
    matiere: 'Français',
    couleur: '#FF6B9D',
    signature: 'Les mots sont tes armes.',
    systemPrompt: (niveau: string) => `Tu es ProfFrançais, professeur élégant et exigeant en Langue et Littérature française.
Tu prépares les élèves au Bac gabonais niveau ${niveau}.

MÉTHODE PÉDAGOGIQUE :
- Corrige les fautes et explique POURQUOI c'est une faute
- Pour la dissertation : méthode thèse/antithèse/synthèse
- Pour le commentaire composé : structure en axes thématiques
- Cite des auteurs africains francophones (Mongo Beti, Ferdinand Oyono, etc.)
- Enrichis le vocabulaire à chaque échange

DOMAINES : Dissertation, Commentaire composé, Résumé, Expression écrite, Littérature, Grammaire
SIGNATURE : "Les mots sont tes armes." ✍️`,
  },
  {
    id: 'physique',
    nom: 'ProfPhysique',
    emoji: '⚡',
    matiere: 'Physique-Chimie',
    couleur: '#FFD700',
    signature: 'La physique explique tout.',
    systemPrompt: (niveau: string) => `Tu es ProfPhysique, professeur enthousiaste en Physique-Chimie.
Tu maîtrises le programme du Bac gabonais séries C et D, niveau ${niveau}.

MÉTHODE PÉDAGOGIQUE :
- Commence toujours par les formules fondamentales
- Montre les unités à chaque calcul (SI)
- Donne des exemples pratiques concrets (électricité au Gabon, eau, chaleur tropicale)
- Applications numériques étape par étape
- Schémas décrits clairement (circuits, forces, etc.)

DOMAINES : Mécanique, Electricité, Optique, Thermodynamique, Chimie organique, Solutions
SIGNATURE : "La physique explique tout." ⚡`,
  },
  {
    id: 'histgeo',
    nom: 'ProfHistGéo',
    emoji: '🌍',
    matiere: 'Histoire-Géographie',
    couleur: '#FF8C42',
    signature: 'Connais ton histoire, bâtis ton futur.',
    systemPrompt: (niveau: string) => `Tu es ProfHistGéo, professeur passionné par l'Histoire de l'Afrique et la Géographie mondiale.
Tu enseignes au niveau ${niveau} selon le programme gabonais.

MÉTHODE PÉDAGOGIQUE :
- Mets toujours l'Afrique et le Gabon au centre de l'analyse
- Dates clés : aide à mémoriser avec des liens logiques
- Géographie : pars du local (Gabon, CEMAC) vers le mondial
- Donne le contexte politique et social africain
- Méthode dissertation historique : situation, faits, conséquences

DOMAINES : Histoire Afrique/Monde, Géopolitique, Géographie humaine/économique, Colonisation, Décolonisation
SIGNATURE : "Connais ton histoire, bâtis ton futur." 🌍`,
  },
  {
    id: 'philo',
    nom: 'ProfPhilo',
    emoji: '🧠',
    matiere: 'Philosophie',
    couleur: '#8B5CF6',
    signature: "Qu'en penses-tu, toi ?",
    systemPrompt: (niveau: string) => `Tu es ProfPhilo, maître de la pensée critique et de la philosophie.
Tu prépares les élèves au Bac gabonais niveau ${niveau}.

MÉTHODE PÉDAGOGIQUE SOCRATIQUE :
- Ne donne JAMAIS la réponse directement
- Réponds à chaque affirmation par une question plus profonde
- Méthode dissertation : problématisation → développement → conclusion
- Cite les philosophes au programme (Platon, Descartes, Kant, Hegel, Sartre, etc.)
- Fais des liens avec la philosophie africaine (Ubuntu, Senghor, etc.)
- Pousse l'élève à définir ses propres concepts

DOMAINES : Liberté, Vérité, Justice, Langage, Conscience, Art, Politique, Religion, Science
SIGNATURE : "Qu'en penses-tu, toi ?" 🧠`,
  },
  {
    id: 'anglais',
    nom: 'ProfAnglais',
    emoji: '🇬🇧',
    matiere: 'Anglais',
    couleur: '#4ECDC4',
    signature: 'English opens all doors.',
    systemPrompt: (niveau: string) => `Tu es ProfAnglais, professeur bilingue français-anglais.
Tu prépares les élèves au Bac gabonais niveau ${niveau}.

MÉTHODE PÉDAGOGIQUE :
- Réponds en FRANÇAIS mais insère de l'anglais progressivement
- Corrige la grammaire avec des explications en français
- Expression écrite : structure paragraphes topic sentence/développement/conclusion
- Oral : prononciation, fluidité, vocabulaire courant
- Vocabulaire : donne toujours le contexte d'utilisation

DOMAINES : Grammaire, Expression écrite, Compréhension, Vocabulaire, Civilisation anglophone, Oral
SIGNATURE : "English opens all doors." 🇬🇧`,
  },
  {
    id: 'info',
    nom: 'ProfInfo',
    emoji: '💻',
    matiere: 'Informatique',
    couleur: '#45B7D1',
    signature: 'Le code, c\'est le futur.',
    systemPrompt: (niveau: string) => `Tu es ProfInfo, professeur expert en Informatique et Technologies.
Tu enseignes au niveau ${niveau} selon le programme gabonais.

MÉTHODE PÉDAGOGIQUE :
- Explique les algorithmes étape par étape (pseudo-code d'abord)
- Bureautique : Word, Excel, PowerPoint niveau Bac
- Réseaux : explications simples avec des analogies
- Donne des exemples pratiques adaptés au contexte africain
- Pour la programmation : commence par l'algorithmique avant le code

DOMAINES : Algorithmique, Bureautique, Réseaux, Bases de données, Internet, Sécurité
SIGNATURE : "Le code, c'est le futur." 💻`,
  },
];

export function getAgent(agentId: string) {
  return AGENTS.find(a => a.id === agentId) || AGENTS[0];
}

// ══════════════════════════════════════════════════════
// 💬 CHAT AVEC UN AGENT SPÉCIALISÉ (nouvelle fonction principale)
// ══════════════════════════════════════════════════════
export async function chatAvecAgent(
  agentId: string,
  message: string,
  historique: { role: 'user' | 'assistant'; content: string }[],
  niveauClasse?: string,
  imageBase64?: string
): Promise<{ message: string }> {
  try {
    const agent = getAgent(agentId);
    const niveau = niveauClasse || niveauEleve;

    const historiqueTexte = historique
      .slice(-10)
      .map(m => `${m.role === 'user' ? 'ÉLÈVE' : 'PROFESSEUR'}: ${m.content}`)
      .join('\n');

    const prompt = `${historiqueTexte ? historiqueTexte + '\n\n' : ''}ÉLÈVE : ${message}`;

    const content = await appelerGemini(prompt, {
      systemInstruction: agent.systemPrompt(niveau),
      imageBase64,
      mimeType: 'image/jpeg',
      maxOutputTokens: 1000,
    });

    return {
      message:
        content ||
        "Je n'ai pas bien compris. Peux-tu reformuler ?",
    };
  } catch (error) {
    console.error('❌ Erreur chatAvecAgent:', error);

    return {
      message:
        "Désolé, je rencontre une difficulté technique. Réessaie dans un instant.",
    };
  }
}

// ══════════════════════════════════════════════════════
// 📸 FONCTIONS EXISTANTES (inchangées, clé sécurisée)
// ══════════════════════════════════════════════════════
export async function extraireTexteCours(
  fichierBase64: string,
  matiere: string,
  mimeType: string = 'application/pdf'
): Promise<string> {
  try {
    const typeFichier =
      mimeType === 'application/pdf'
        ? 'document PDF'
        : 'photo du cours';

    const prompt = `Tu es un professeur expert en ${matiere || 'pédagogie'}.

Analyse attentivement le ${typeFichier} fourni.

OBJECTIF :
Extraire fidèlement le contenu pédagogique réellement présent dans le document afin qu'il puisse ensuite servir à générer des questions de révision et à corriger les réponses d'un élève.

RÈGLES ABSOLUES :
- Utilise uniquement les informations réellement présentes dans le document.
- N'invente aucune notion, définition, formule, date, exemple ou information.
- Conserve les informations importantes et précises.
- Si une partie est illisible ou incertaine, indique-le au lieu de l'inventer.
- Pour les mathématiques et sciences, conserve les formules, unités et relations importantes.
- Pour l'histoire, la géographie et les matières littéraires, conserve les dates, noms, concepts et faits importants.
- Le contenu doit être suffisamment détaillé pour permettre une correction précise des réponses.

STRUCTURE :
1. Titre ou thème du cours
2. Notions principales
3. Définitions importantes
4. Formules, règles ou méthodes
5. Dates, noms, faits ou données importantes
6. Exemples et exercices présents
7. Points essentiels à retenir

Réponds en français et reste strictement fidèle au document.`;

    const contenu = await appelerGemini(prompt, {
      imageBase64: fichierBase64,
      mimeType,
      maxOutputTokens: 5000,
    });

    console.log('✅ Extraction du cours réussie');
    return contenu;
  } catch (error: any) {
    console.error(
      '❌ Erreur extraction cours Gemini:',
      error?.response?.data || error?.message || error
    );
    return '';
  }
}

export async function genererQuestionsCours(
  contenuCours: string,
  matiere: string
): Promise<any[]> {
  try {
    const safeContenu = contenuCours?.trim();

    if (!safeContenu || safeContenu.length < 50) {
      throw new Error('Contenu du cours insuffisant');
    }

    const prompt = `Tu es un professeur expert en ${matiere || 'pédagogie'}.

Tu dois créer une évaluation de révision UNIQUEMENT à partir du cours fourni.

NIVEAU DE L'ÉLÈVE : ${niveauEleve}

COURS :
${safeContenu}

CONSIGNES STRICTES :
1. Génère exactement 8 questions si le contenu le permet.
2. Chaque question doit être directement vérifiable à partir du cours.
3. Ne pose aucune question dont la réponse ne se trouve pas dans le cours.
4. Ne crée aucune information absente du cours.
5. Varie les questions : compréhension, mémorisation et application.
6. Évite les questions vagues.
7. Pour chaque question, fournis une réponse attendue précise.
8. Fournis les éléments indispensables permettant de distinguer une réponse correcte d'une réponse fausse.
9. Pour une question d'application, indique clairement la méthode ou le résultat attendu.
10. Chaque question vaut exactement 2 points.

Réponds UNIQUEMENT avec un JSON valide sous cette forme :

{
  "questions": [
    {
      "texte": "Question précise",
      "reponseAttendue": "Réponse correcte basée uniquement sur le cours",
      "criteresCorrection": "Éléments indispensables à retrouver dans la réponse de l'élève",
      "difficulte": "facile|moyen|difficile",
      "type": "comprehension|application|memorisation",
      "points": 2,
      "issueDuCours": true
    }
  ]
}

IMPORTANT :
- "reponseAttendue" doit être factuelle.
- "criteresCorrection" doit contenir les éléments nécessaires pour obtenir 2/2.
- Une réponse hors sujet doit obtenir 0/2.
- Une réponse partiellement correcte doit obtenir 1/2.
- Une réponse qui contredit le cours doit obtenir 0/2.`;

    const contenu = await appelerGemini(prompt, {
      maxOutputTokens: 4000,
      responseMimeType: 'application/json',
    });

    console.log('🤖 RÉPONSE GEMINI QUESTIONS:', contenu);

    const cleaned = contenu
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    let parsed: any = null;

    // 1. Réponse JSON directe
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // 2. Recherche d'un objet JSON dans la réponse
      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');

      if (start !== -1 && end > start) {
        try {
          parsed = JSON.parse(cleaned.slice(start, end + 1));
        } catch {
          parsed = null;
        }
      }
    }

    if (!parsed || !Array.isArray(parsed.questions)) {
      console.error('❌ JSON QUESTIONS INVALIDE:', contenu);
      throw new Error('JSON questions introuvable ou incomplet');
    }

    return parsed.questions;
  } catch (error) {
    console.error('❌ Erreur génération questions:', error);
    throw error;
  }
}

export async function evaluerReponseRevision(
  question: string,
  reponseEleve: string,
  essai: number = 1,
  matiere?: string,
  contenuCours: string = '',
  reponseAttendue: string = '',
  criteresCorrection: string = ''
): Promise<{ note: number; feedback: string }> {
  try {
    const safeQuestion = question?.trim() || 'Question non spécifiée';
    const safeReponse = reponseEleve?.trim() || '';
    const safeCours = contenuCours?.trim() || '';
    const safeAttendue = reponseAttendue?.trim() || '';
    const safeCriteres = criteresCorrection?.trim() || '';

    if (!safeReponse) {
      return {
        note: 0,
        feedback: 'Aucune réponse fournie.',
      };
    }

    const prompt = `Tu es un professeur strict mais pédagogique.

MATIÈRE : ${matiere || 'Révision'}
NIVEAU : ${niveauEleve}

QUESTION :
${safeQuestion}

RÉPONSE ATTENDUE :
${safeAttendue}

CRITÈRES DE CORRECTION :
${safeCriteres}

CONTENU DU COURS :
${safeCours}

RÉPONSE DE L'ÉLÈVE (essai n°${essai}) :
${safeReponse}

ÉVALUE UNIQUEMENT LA JUSTESSE DE LA RÉPONSE.

RÈGLES ABSOLUES :
- Compare la réponse de l'élève avec le cours ET la réponse attendue.
- La longueur de la réponse ne donne AUCUN point.
- Une réponse longue mais fausse = 0.
- Une réponse hors sujet = 0.
- Une réponse qui contredit le cours = 0.
- 2 points = réponse correcte et suffisamment complète.
- 1 point = réponse partiellement correcte.
- 0 point = réponse incorrecte, hors sujet, contradictoire ou trop vague.
- N'invente aucun élément.
- NE RÉVÈLE JAMAIS la réponse attendue à l'élève.
- NE DONNE JAMAIS la solution complète dans le feedback.
- Si la réponse est incorrecte, explique brièvement l'erreur ou donne un indice pédagogique, sans fournir directement la bonne réponse.
- Le feedback doit être très court : maximum 15 mots.
- Le feedback doit aider l'élève à réfléchir et progresser sans lui donner la solution.

Retourne UNIQUEMENT un JSON valide :
{
  "note": 0,
  "feedback": "Explication courte ou indice pédagogique sans révéler la réponse"
}`;

    const contenu = await appelerGemini(prompt, {
      maxOutputTokens: 1000,
      responseMimeType: 'application/json',
    });

    // Gemini peut parfois entourer le JSON de texte ou de balises Markdown.
    // On extrait le premier objet JSON valide au lieu de dépendre
    // d'un format de réponse strict.
    console.log('🤖 RÉPONSE GEMINI CORRECTION:', contenu);

    const cleaned = contenu
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    let parsed: any = null;

    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');

      if (start !== -1 && end > start) {
        try {
          parsed = JSON.parse(cleaned.slice(start, end + 1));
        } catch {
          parsed = null;
        }
      }
    }

    if (!parsed || typeof parsed !== 'object') {
      console.error('❌ Réponse Gemini non JSON:', contenu);
      throw new Error('JSON correction introuvable');
    }

    const note =
      parsed.note === 2 || parsed.note === 1 || parsed.note === 0
        ? parsed.note
        : 0;

    return {
      note,
      feedback:
        typeof parsed.feedback === 'string' &&
        parsed.feedback.trim()
          ? parsed.feedback.trim()
          : 'Réponse évaluée selon le contenu du cours.',
    };
  } catch (error) {
    console.error('❌ Erreur évaluation:', error);

    return {
      note: 0,
      feedback:
        'La correction automatique n’a pas pu être effectuée. Réessaie.',
    };
  }
}

export async function analyserDevoir(
  imageBase64: string,
  matiere?: string
): Promise<string> {
  try {
    const prompt = `Tu es un professeur de ${matiere || 'mathématiques'}.

Extrais UNIQUEMENT la ou les questions du devoir de manière précise.

Ne résous pas le devoir.
Ne donne aucune réponse.
Ne complète pas les informations illisibles par des suppositions.`;

    return await appelerGemini(prompt, {
      imageBase64,
      mimeType: 'image/jpeg',
      maxOutputTokens: 500,
    });
  } catch (error) {
    console.error('❌ Erreur analyse devoir:', error);

    return "Décris-moi l'exercice avec tes mots, je t'aiderai à le résoudre.";
  }
}

export async function verifierReponse(question: string, reponseEleve: string, essai = 1): Promise<{ correct: boolean; feedback: string }> {
  const result = await evaluerReponseRevision(question, reponseEleve, essai);
  return { correct: result.note >= 1.5, feedback: result.feedback };
}

export async function chatCoaching(message: string, contexte: string, contenuCours: string, matiere: string): Promise<{ message: string }> {
  return chatAvecAgent('maths', message, [], niveauEleve);
}

export async function analyserDevoirAvecRetry(imageBase64: string, maxRetries = 3): Promise<string> {
  for (let i = 0; i < maxRetries; i++) {
    const result = await analyserDevoir(imageBase64);
    if (!result.includes("erreur") && result.length > 20) return result;
    if (i < maxRetries - 1) await new Promise(r => setTimeout(r, 2000));
  }
  return "Je n'arrive pas à lire clairement ton devoir. Peux-tu prendre une photo plus nette ?";
}
