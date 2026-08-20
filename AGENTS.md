# RÉPÉTIA — instructions Codex

## Priorités
1. Préserver le fonctionnement existant.
2. Faire le minimum de changements nécessaires.
3. Tester chaque modification.
4. Ne jamais exposer de secrets.
5. Économiser le contexte et les tokens.

## Skills
- `project-memory` : mémoire persistante du projet.
- `project-setup` : compréhension de la stack et de la configuration.
- `task-observer` : adaptation au workflow de l'utilisateur.
- `token-optimizer` : réponses et contexte compacts.

Utiliser ces skills lorsqu'ils correspondent à la tâche.

## Validation
Pour les modifications TypeScript/React Native :
- utiliser le type-check TypeScript ;
- utiliser les tests existants ;
- utiliser les vérifications Expo disponibles ;
- après correction, relancer les vérifications concernées.

Ne jamais considérer une modification comme terminée uniquement parce que le code compile.

## Communication
Être bref.
Ne pas répéter les informations déjà connues.
Afficher uniquement les erreurs, résultats et décisions utiles.
