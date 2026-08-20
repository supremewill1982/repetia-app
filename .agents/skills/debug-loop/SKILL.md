---
name: debug-loop
description: Boucle autonome de diagnostic, correction et validation de RÉPÉTIA. Utiliser pour résoudre les bugs et terminer une tâche de développement.
---

# Debug Loop

Objectif :
Résoudre le problème avec le minimum de modifications nécessaires et valider le résultat.

Boucle :

1. Observer le problème.
2. Identifier la cause probable.
3. Inspecter le code concerné.
4. Corriger.
5. Exécuter le type-check TypeScript.
6. Exécuter les tests disponibles.
7. Exécuter les vérifications Expo pertinentes.
8. Si une vérification échoue :
   - analyser l'erreur ;
   - corriger ;
   - recommencer.
9. Arrêter lorsque les validations passent.
10. Résumer uniquement :
   - problème trouvé ;
   - fichiers modifiés ;
   - validations réussies ;
   - éventuels problèmes restants.

Règles :

- Maximum 8 cycles par tâche.
- Ne jamais masquer une erreur.
- Ne jamais supprimer un test pour faire passer la validation.
- Ne jamais désactiver TypeScript ou les contrôles Expo pour contourner un problème.
- Ne jamais modifier des fichiers sans rapport avec le problème.
- Ne jamais utiliser de secrets ou les afficher.
- Avant une modification importante, vérifier git status.
- Si une modification risque d'être destructive, créer une sauvegarde ou demander confirmation.
- Ne jamais considérer "ça devrait fonctionner" comme une validation.
- Une boucle réussie signifie que les vérifications réellement disponibles ont été exécutées et passent.

Tests prioritaires :

1. TypeScript :
   npx tsc --noEmit

2. Tests du projet :
   utiliser le script npm de test s'il existe.

3. Expo :
   utiliser expo-doctor ou les vérifications Expo réellement disponibles.

4. Tests E2E :
   utiliser les outils E2E disponibles dans le projet lorsqu'ils sont configurés.

Si un outil n'est pas installé :
ne pas installer automatiquement une nouvelle infrastructure lourde.
Signaler le manque et continuer avec les validations disponibles.

Communication :
rester bref pendant la boucle.
Ne pas afficher les longs logs.
Afficher seulement les erreurs pertinentes et le résultat de chaque cycle.
