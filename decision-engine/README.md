# Decision Engine — Prototype

Moteur adaptatif du système multi-agents.

Objectif :

1. Évaluer la difficulté d'une tâche.
2. Évaluer son niveau de risque.
3. Choisir automatiquement les agents nécessaires.
4. Éviter les débats inutiles.
5. Déclencher un débat uniquement lorsqu'il est justifié.
6. Faire intervenir un arbitre uniquement en cas de désaccord persistant.
7. Utiliser les tests comme validation finale.

Principe :

DIFFICULTÉ × RISQUE
        ↓
AGENTS NÉCESSAIRES
        ↓
ANALYSE
        ↓
DÉSACCORD ?
   ├── NON → VALIDATION
   └── OUI → DÉBAT
                 ↓
             RÉSOLUTION
                 ↓
             TESTS
                 ↓
          PASS / NOUVEAU CYCLE

Ce prototype ne modifie aucun fichier du projet principal.
