# RÉPÉTIA — Contexte Projet

## App existante
- Nom actuel : Mon Répétiteur
- Stack : React Native + Expo SDK 54 + TypeScript
- Backend : Firebase (Auth + Firestore)
- IA : OpenRouter (Gemini 2.0 Flash)
- Dev : Termux + Expo Go sur Android, Gabon

## Objectif
Transformer "Mon Répétiteur" en "RÉPÉTIA"
App éducative IA premium pour élèves gabonais/africains

## Ce qui est fait
- 25 écrans fonctionnels
- 40 badges
- Photo → questions IA
- Coach IA socratique
- Suivi du temps
- Mode hors ligne

## Bugs identifiés
- Clé API en clair dans iaServiceOpenRouter.ts
- contexteEleve non importé dans CoachIAScreen
- null() bug dans App.tsx

## Prochaines étapes
1. Corriger bugs
2. Sécuriser .env
3. Thème dark gold RÉPÉTIA
4. 8 agents IA spécialisés
5. Système premium/quota
