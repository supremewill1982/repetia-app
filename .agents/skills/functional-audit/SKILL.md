---
name: functional-audit
description: Audite fonctionnellement RÉPÉTIA par rôle et par écran pour détecter les boutons non fonctionnels, navigations cassées, écrans manquants, chargements infinis, erreurs et fonctionnalités incomplètes.
---

# Functional Audit

Objectif :
Vérifier que les fonctionnalités existantes de RÉPÉTIA sont réellement utilisables.

## Périmètre

Auditer méthodiquement :

- Parent
- Élève
- Répétiteur
- Tuteur
- Établissement
- Admin

## Pour chaque rôle

1. Identifier toutes les routes et tous les écrans.
2. Identifier les écrans accessibles depuis chaque écran.
3. Vérifier les boutons et actions :
   - onPress/onClick ;
   - navigation ;
   - appels de services ;
   - sauvegarde/lecture des données ;
   - retour utilisateur.
4. Rechercher :
   - boutons sans action ;
   - navigation vers une route inexistante ;
   - écran inaccessible ;
   - écran manquant ;
   - écran bloqué en chargement ;
   - état vide absent ;
   - état erreur absent ;
   - TODO/FIXME/placeholder ;
   - données jamais affichées ;
   - appels Firebase/API incomplets.
5. Vérifier les états :
   - loading ;
   - success ;
   - error ;
   - empty.
6. Vérifier les permissions et rôles lorsque nécessaire.

## Écran manquant

Si une fonctionnalité clairement prévue possède une route ou une action mais que l'écran nécessaire n'existe pas :

- confirmer l'intention depuis le code existant ;
- créer l'écran manquant ;
- connecter la navigation ;
- implémenter les états loading/error/empty ;
- réutiliser les composants et services existants ;
- ne pas inventer une nouvelle architecture inutile.

## Registre

Créer ou mettre à jour :

`PROJECT_AUDIT.md`

Format :

ID | Rôle | Écran | Problème | Action | Statut | Validation

Exemple :

P-001 | Parent | Dashboard | Bouton inactif | Corriger | TODO | —
P-002 | Parent | Réservations | Loading infini | Corriger | TODO | —
R-001 | Répétiteur | Profil | Écran manquant | Créer | TODO | —

## Priorités

P0 = fonctionnalité complètement bloquée
P1 = fonctionnalité principale cassée
P2 = fonctionnalité partiellement fonctionnelle
P3 = amélioration ou problème mineur

Traiter P0 puis P1 puis P2 puis P3.

## Règles

- Audit d'abord, modification ensuite.
- Ne pas supprimer une fonctionnalité pour faire disparaître un problème.
- Ne pas contourner une erreur.
- Réutiliser les services existants avant d'en créer de nouveaux.
- Ne pas modifier une fonctionnalité sans rapport.
- Ne jamais exposer de secrets.
- Ne pas considérer un écran fonctionnel uniquement parce qu'il compile.
- Une fonctionnalité est validée seulement après une vérification adaptée.

## Validation

Après chaque correction :

1. TypeScript.
2. Tests disponibles.
3. Vérification Expo pertinente.
4. Test fonctionnel disponible.
5. Mettre à jour `PROJECT_AUDIT.md`.

Si un outil de test n'est pas disponible :
le signaler et utiliser la meilleure validation disponible.

## Communication

Rester bref.

Pendant l'audit :
- donner uniquement les problèmes importants ;
- éviter les longs logs ;
- mettre les détails dans `PROJECT_AUDIT.md`.

Ne pas modifier le code pendant la phase d'inventaire, sauf nécessité absolue pour établir un diagnostic.
