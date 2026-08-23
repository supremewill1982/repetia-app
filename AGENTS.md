# RÉPÉTIA — Instructions pour les agents

## Objectif
Développer, corriger et stabiliser RÉPÉTIA sans introduire de régressions.

## Stack
- Expo SDK 54
- React Native 0.81.5
- React 19.1.0
- TypeScript 5.9
- Firebase 12
- React Navigation 7
- Jest + ts-jest

## Règles essentielles
1. Analyser d'abord le bug et identifier les fichiers réellement concernés.
2. Ne pas modifier des fichiers sans rapport avec le problème.
3. Préserver le comportement fonctionnel existant.
4. Faire la correction la plus simple et la plus sûre possible.
5. Après chaque correction, lancer les vérifications disponibles.
6. Ne jamais considérer un bug comme corrigé sans validation.
7. Vérifier les régressions avant de terminer.
8. Ne pas exposer de clés API ou secrets côté client.
9. Ne pas utiliser la vraie base Firebase pour les tests destructifs.
10. Documenter les décisions techniques importantes.

## Priorités actuelles

### 1. Nouvelle révision
Le flux attendu est :

Nouvelle révision
→ ChoixMatiere
→ PrisePhotoCours

Ne pas envoyer directement vers PrisePhotoCours.

### 2. Chaîne IA
Vérifier entièrement :

analyse du cours
→ génération des questions
→ réponse de l'élève
→ évaluation
→ correction/notation

Services importants :
- src/services/iaServiceOpenRouter.ts
- extraireTexteCours
- genererQuestionsCours
- evaluerReponseRevision
- pendingQuestionsService.ts

### 3. Tracking du temps
Effectuer un vrai test :
- navigation ~1 minute
- révision ~1 minute
- retour/fin de session
- Profil → Temps passé

Vérifier :
- temps navigation
- temps révision
- temps total
- absence de double comptage

## Problèmes techniques connus
- jest.setup.js manquant alors que jest.config.js le référence.
- Tests Firebase à isoler avec mocks ou émulateur.
- Clés EXPO_PUBLIC_* à ne pas utiliser pour des secrets IA.
- Vérifier/migrer l'API expo-file-system pour SDK 54.
- Vérifier la configuration native de expo-notifications.
- Vérifier expo-updates et la stratégie de build/versioning.

## Vérifications
Avant de terminer une tâche :
- TypeScript
- tests pertinents
- vérification du diff
- recherche de régression si nécessaire

## Méthode
ANALYSER → MODIFIER → TESTER → VÉRIFIER → CORRIGER SI NÉCESSAIRE → TERMINER

## Important
Ne jamais réécrire tout le projet pour corriger un problème local.
Privilégier les changements minimaux, ciblés et vérifiables.
