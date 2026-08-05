import { db } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { utiliserOpenRouter } from './agentTypes';

// Configuration des agents
const AGENTS_CONFIG = {
  coach: {
    name: 'Coach IA',
    description: 'Aide les élèves avec des conseils personnalisés',
    model: 'openai/gpt-4o-mini',
    temperature: 0.7,
    max_tokens: 2000,
    system_prompt: `Tu es un coach pédagogique expert pour les élèves du secondaire et du supérieur.
    Ton rôle est d'aider les élèves à comprendre leurs cours, résoudre des exercices et progresser.
    Sois patient, encourageant et pédagogique.
    Explique les concepts de manière simple et donne des exemples concrets.
    Si tu ne connais pas la réponse, dis-le honnêtement et propose de chercher.
    Réponds toujours en français.`
  },
  professeur: {
    name: 'Professeur IA',
    description: 'Crée des exercices et explique les concepts',
    model: 'openai/gpt-4o-mini',
    temperature: 0.5,
    max_tokens: 3000,
    system_prompt: `Tu es un professeur expérimenté en mathématiques, physique, chimie, français et anglais.
    Ton rôle est de créer des exercices adaptés, expliquer les concepts difficiles et corriger les devoirs.
    Sois précis, méthodique et utilise un langage clair.
    Propose des exercices progressifs et donne des feedbacks constructifs.
    Réponds toujours en français.`
  },
  correcteur: {
    name: 'Correcteur IA',
    description: 'Corrige les devoirs et compositions',
    model: 'openai/gpt-4o-mini',
    temperature: 0.3,
    max_tokens: 4000,
    system_prompt: `Tu es un correcteur rigoureux et bienveillant.
    Ton rôle est de corriger les devoirs, compositions et exercices des élèves.
    Pour chaque erreur, explique pourquoi c'est faux et donne la bonne réponse.
    Note les travaux de manière équitable et propose des conseils pour progresser.
    Sois précis dans tes corrections et encourageant dans tes commentaires.
    Réponds toujours en français.`
  },
  evaluateur: {
    name: 'Évaluateur IA',
    description: 'Évalue les connaissances et compétences',
    model: 'openai/gpt-4o-mini',
    temperature: 0.2,
    max_tokens: 2500,
    system_prompt: `Tu es un évaluateur objectif et précis.
    Ton rôle est d'évaluer les connaissances et compétences des élèves à travers des tests et quiz.
    Pose des questions adaptées au niveau et au programme scolaire.
    Fournis des explications détaillées pour chaque réponse.
    Sois juste dans ton évaluation et transparent dans tes critères.
    Réponds toujours en français.`
  }
};

// Base de connaissances par matière
export const BASE_CONNAISSANCES: Record<string, any[]> = {
  'Mathématiques': [
    { texte: 'Quelle est la formule de l aire d un cercle ?', type: 'ouvert', reponse_correcte: 'A = πr²', points: 2, theme: 'géométrie' },
    { texte: 'Résoudre: 2x + 3 = 7', type: 'ouvert', reponse_correcte: 'x = 2', points: 1, theme: 'algèbre' },
    { texte: 'Quelle est la dérivée de x² ?', type: 'ouvert', reponse_correcte: '2x', points: 2, theme: 'analyse' },
    { texte: 'Calculer: ∫x dx', type: 'ouvert', reponse_correcte: 'x²/2 + C', points: 2, theme: 'analyse' },
    { texte: 'Quelle est la formule de la force gravitationnelle ?', type: 'ouvert', reponse_correcte: 'F = G*(m1*m2)/r²', points: 2, theme: 'mécanique' },
    { texte: 'Vitesse de la lumière dans le vide ?', type: 'ouvert', reponse_correcte: '300000 km/s', points: 1, theme: 'physique' },
    { texte: "Quelle est la formule de l'énergie cinétique ?", type: 'ouvert', reponse_correcte: 'Ec = 1/2*m*v²', points: 2, theme: 'énergie' },
    { texte: 'Théorème de Pythagore ?', type: 'ouvert', reponse_correcte: 'a² + b² = c²', points: 1, theme: 'géométrie' }
  ],
  'Français': [
    { texte: 'Fonction de "qui" dans "L homme qui parle" ?', type: 'qcm', reponse_correcte: 'pronom relatif', options: ['conjonction', 'pronom relatif', 'adverbe', 'article'], points: 1, theme: 'grammaire' },
    { texte: 'Quelle est la nature de "rapidement" ?', type: 'qcm', reponse_correcte: 'adverbe', options: ['adjectif', 'adverbe', 'nom', 'verbe'], points: 1, theme: 'grammaire' },
    { texte: 'Conjuguer "être" au présent de l indicatif, 1ère personne du singulier', type: 'ouvert', reponse_correcte: 'je suis', points: 1, theme: 'conjugaison' },
    { texte: 'Synonyme de "content" ?', type: 'ouvert', reponse_correcte: 'heureux', points: 1, theme: 'vocabulaire' },
    { texte: 'Antonyme de "jour" ?', type: 'ouvert', reponse_correcte: 'nuit', points: 1, theme: 'vocabulaire' }
  ],
  'Physique-Chimie': [
    { texte: 'Formule de la vitesse ?', type: 'ouvert', reponse_correcte: 'v = d/t', points: 1, theme: 'cinématique' },
    { texte: 'Unité de la force en SI ?', type: 'ouvert', reponse_correcte: 'newton (N)', points: 1, theme: 'mécanique' },
    { texte: 'Formule de la pression ?', type: 'ouvert', reponse_correcte: 'P = F/S', points: 1, theme: 'mécanique' },
    { texte: 'Quelle est la formule de la puissance électrique ?', type: 'ouvert', reponse_correcte: 'P = U*I', points: 2, theme: 'électricité' }
  ],
  'Anglais': [
    { texte: 'Traduire "bonjour" en anglais', type: 'ouvert', reponse_correcte: 'hello', points: 1, theme: 'vocabulaire' },
    { texte: 'Conjuguer "to be" au présent simple, 3ème personne du singulier', type: 'ouvert', reponse_correcte: 'is', points: 1, theme: 'conjugaison' },
    { texte: 'Traduire "je m appelle" en anglais', type: 'ouvert', reponse_correcte: 'my name is', points: 1, theme: 'vocabulaire' }
  ]
};

// Base de connaissances pour le coach IA
export const COACH_KNOWLEDGE = {
  conseils: {
    revision: [
      "Fais des fiches de révision pour chaque chapitre",
      "Relis tes cours le soir même après les avoir appris",
      "Utilise des schémas et des mind maps pour visualiser les concepts",
      "Fais des exercices régulièrement pour t'entraîner",
      "Explique le cours à voix haute comme si tu l'enseignais à quelqu'un d'autre"
    ],
    organisation: [
      "Crée un planning de révision réaliste",
      "Priorise les matières où tu as le plus de difficultés",
      "Fais des pauses de 5 minutes toutes les 25-30 minutes de travail",
      "Trouve un endroit calme et sans distraction pour travailler",
      "Utilise des applications de gestion du temps comme la technique Pomodoro"
    ],
    motivation: [
      "Fixe-toi des objectifs réalisables à court terme",
      "Récompense-toi après avoir atteint un objectif",
      "Visualise ta réussite et les bénéfices de tes efforts",
      "Trouve un partenaire d'étude pour te motiver mutuellement",
      "Rappelle-toi pourquoi tu travailles dur (ton avenir, tes rêves)"
    ]
  },
  methodes: {
    mathematiques: [
      "Comprends d'abord la théorie avant de faire des exercices",
      "Fais au moins 3 exercices types pour chaque notion",
      "Vérifie toujours tes calculs étape par étape",
      "Utilise des couleurs différentes pour chaque type d'information",
      "Apprends par cœur les formules de base"
    ],
    francais: [
      "Lis régulièrement pour enrichir ton vocabulaire",
      "Fais des fiches de grammaire et de conjugaison",
      "Écris des textes courts pour t'entraîner",
      "Relis-toi à voix haute pour repérer les erreurs",
      "Utilise un correcteur orthographique pour tes rédactions"
    ],
    sciences: [
      "Fais des schémas pour comprendre les phénomènes",
      "Apprends les définitions par cœur",
      "Fais des expériences pratiques quand c'est possible",
      "Relie les concepts entre eux pour mieux les comprendre",
      "Utilise des vidéos éducatives pour visualiser les concepts"
    ]
  }
};

// Utiliser un agent spécifique
export const utiliserAgent = async (
  typeAgent: string,
  prompt: string,
  context: {
    userId?: string;
    userRole?: string;
    matiere?: string;
    niveau?: string;
    historique?: any[];
  } = {}
): Promise<string> => {
  try {
    const config = AGENTS_CONFIG[typeAgent as keyof typeof AGENTS_CONFIG];

    if (!config) {
      throw new Error(`Agent ${typeAgent} non trouvé`);
    }

    // Ajouter le contexte utilisateur au prompt
    const systemPrompt = `${config.system_prompt}

Contexte utilisateur:
- Rôle: ${context.userRole || 'élève'}
- Matière: ${context.matiere || 'général'}
- Niveau: ${context.niveau || 'secondaire'}
- ID: ${context.userId || 'anonyme'}

Historique de la conversation:
${context.historique ? context.historique.map((msg: any) => `- ${msg.role}: ${msg.content}`).join('\n') : 'Aucun historique'}

Réponds de manière claire, structurée et adaptée au niveau de l'utilisateur.`;

    // Appel à OpenRouter
    const response = await utiliserOpenRouter({
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: config.temperature,
      max_tokens: config.max_tokens
    });

    return response.choices[0]?.message?.content || 'Désolé, je n ai pas pu générer de réponse.';
  } catch (error: any) {
    console.error('Erreur utilisation agent:', error);
    return `Désolé, une erreur est survenue: ${error.message}`;
  }
};

// Générer un exercice adapté
export const genererExercice = async (
  matiere: string,
  niveau: string,
  type: string = 'qcm',
  theme?: string
): Promise<any> => {
  try {
    const base = BASE_CONNAISSANCES[matiere] || [];

    // Filtrer par thème si spécifié
    const questions = theme
      ? base.filter(q => q.theme === theme)
      : base;

    // Filtrer par type
    const questionsFiltrees = questions.filter(q => q.type === type);

    if (questionsFiltrees.length === 0) {
      // Générer avec IA si aucune question trouvée
      const prompt = `Génère un exercice de type ${type} en ${matiere} pour un élève de niveau ${niveau}${theme ? ` sur le thème ${theme}` : ''}.
      Format de réponse:
      {
        "texte": "texte de la question",
        "type": "${type}",
        "reponse_correcte": "réponse correcte",
        ${type === 'qcm' ? '"options": ["option1", "option2", "option3", "option4"],' : ''}
        "points": nombre de points,
        "theme": "${theme || matiere}",
        "explication": "explication détaillée de la réponse"
      }`;

      const response = await utiliserAgent('professeur', prompt, {
        matiere,
        niveau,
        userRole: 'professeur'
      });

      try {
        // Extraire le JSON de la réponse
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        return { texte: response, type, reponse_correcte: '', points: 1, theme: theme || matiere };
      } catch (e) {
        return { texte: response, type, reponse_correcte: '', points: 1, theme: theme || matiere };
      }
    }

    // Sélectionner une question aléatoire
    const randomIndex = Math.floor(Math.random() * questionsFiltrees.length);
    return questionsFiltrees[randomIndex];
  } catch (error: any) {
    console.error('Erreur génération exercice:', error);
    return {
      texte: 'Erreur lors de la génération de l exercice',
      type,
      reponse_correcte: '',
      points: 0,
      theme: theme || matiere
    };
  }
};

// Corriger une réponse
export const corrigerReponse = async (
  question: any,
  reponseUtilisateur: string,
  matiere: string,
  niveau: string
): Promise<any> => {
  try {
    const estCorrect = reponseUtilisateur.toLowerCase().trim() === question.reponse_correcte.toLowerCase().trim();

    if (estCorrect) {
      return {
        correct: true,
        score: question.points,
        feedback: 'Bravo ! Réponse correcte.',
        explication: question.explication || `La réponse "${question.reponse_correcte}" est bien correcte.`
      };
    } else {
      // Générer un feedback avec IA
      const prompt = `L'utilisateur a répondu "${reponseUtilisateur}" à la question "${question.texte}".
      La bonne réponse est "${question.reponse_correcte}".
      Donne un feedback constructif, explique pourquoi la réponse est fausse et donne la bonne réponse.
      Sois encourageant et pédagogique.
      Format: {
        "feedback": "ton feedback ici",
        "explication": "explication détaillée ici",
        "conseil": "conseil pour progresser"
      }`;

      const response = await utiliserAgent('correcteur', prompt, {
        matiere,
        niveau,
        userRole: 'correcteur'
      });

      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return {
            correct: false,
            score: 0,
            ...JSON.parse(jsonMatch[0])
          };
        }
      } catch (e) {
        // Retourner un feedback basique
      }

      return {
        correct: false,
        score: 0,
        feedback: `Désolé, la réponse correcte est: ${question.reponse_correcte}`,
        explication: question.explication || 'Essaie encore !',
        conseil: 'Relis attentivement ton cours et les exemples.'
      };
    }
  } catch (error: any) {
    console.error('Erreur correction:', error);
    return {
      correct: false,
      score: 0,
      feedback: 'Erreur lors de la correction',
      explication: question.explication || '',
      conseil: 'Essaie de reformuler ta réponse.'
    };
  }
};

// Générer un rapport de progression
export const genererRapportProgression = async (
  userId: string,
  matiere: string,
  niveau: string,
  statistiques: any
): Promise<string> => {
  try {
    const prompt = `Génère un rapport de progression détaillé pour un élève (ID: ${userId}) en ${matiere} (niveau: ${niveau}).

Statistiques:
${JSON.stringify(statistiques, null, 2)}

Structure du rapport:
1. Résumé des performances (note globale, progression)
2. Points forts
3. Points à améliorer
4. Recommandations personnalisées
5. Objectifs pour la prochaine période

Sois précis, encourageant et donne des conseils concrets.`;

    const rapport = await utiliserAgent('coach', prompt, {
      userId,
      matiere,
      niveau,
      userRole: 'coach'
    });

    return rapport;
  } catch (error: any) {
    console.error('Erreur génération rapport:', error);
    return 'Erreur lors de la génération du rapport de progression.';
  }
};

// Exporter tout
export {
  AGENTS_CONFIG,
  BASE_CONNAISSANCES,
  COACH_KNOWLEDGE,
  utiliserAgent,
  genererExercice,
  corrigerReponse,
  genererRapportProgression
};
