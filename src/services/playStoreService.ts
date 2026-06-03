import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';

export async function genererApkInfo() {
  const info = {
    version: "1.0.0",
    buildNumber: 1,
    instructions: "Utilise la commande : eas build -p android --profile preview",
    liens: {
      eas: "https://expo.dev/eas",
      playConsole: "https://play.google.com/console"
    }
  };
  return info;
}

export async function exporterMetadonnees(): Promise<void> {
  const metadata = `# RépétiA - Fiche de présentation Play Store

Nom de l'application : RépétiA
Slogan : Réussis ton bac avec l'IA

Description courte :
RépétiA est ton coach personnel gratuit pour réussir le bac. Cours par IA, exercices interactifs, podcasts audio, planning intelligent et oracle de prédiction.

Description longue :
RépétiA révolutionne les révisions avec des technologies d'intelligence artificielle adaptées aux élèves africains.
- 📚 Cours personnalisés : scanne tes leçons, l'IA génère des questions et évalue tes réponses.
- 🎧 AudioRévision : transforme tes cours en podcasts à écouter partout.
- 📅 PlanningBac : un planning de révision intelligent basé sur tes lacunes.
- 🔮 Oracle du Bac : prédiction de ta note et conseils sur-mesure.
- 👨‍🏫 Répétiteurs : mise en relation avec des professeurs particuliers.

Catégories : Éducation, Révisions, Baccalauréat
Public cible : Lycéens (15-20 ans)

Mots-clés : bac, révision, cours, ia, gabon, examens, planning, podcast

Icône et captures : voir dossier assets/

Lien de téléchargement : [à générer via EAS]`;

  const path = FileSystem.documentDirectory + 'repetia_playstore_metadata.txt';
  await FileSystem.writeAsStringAsync(path, metadata);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(path);
  } else {
    Alert.alert('Métadonnées générées', metadata);
  }
}
