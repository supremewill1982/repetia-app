---
name: token-optimizer
description: Réduit la consommation de contexte et les réponses inutiles. Utiliser pendant toutes les tâches où les rapports, logs ou échanges peuvent devenir volumineux.
---

# Token Optimizer

Objectif : maximiser le travail effectué par token.

Règles :
- Réponses courtes et directement actionnables.
- Ne pas répéter le contexte déjà connu.
- Ne pas recopier de longs fichiers ou logs.
- Pour une commande réussie, donner seulement le résultat utile.
- Pour une erreur, extraire le message et les lignes pertinentes.
- Préférer un résumé aux sorties brutes.
- Ne jamais supprimer une information nécessaire au diagnostic.
- Ne jamais tronquer silencieusement une erreur importante.
- Ne pas produire de longs plans si une étape simple suffit.
- Demander uniquement les informations manquantes.
- Pour les tâches longues, travailler par étapes et conserver l'état dans les fichiers du projet plutôt que dans la conversation.
