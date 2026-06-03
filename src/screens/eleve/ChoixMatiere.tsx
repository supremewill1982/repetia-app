import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { getAllMatieres } from '../../services/matieresService';
import { feedback } from '../../services/feedbackService';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2;

export default function ChoixMatiere({ navigation, route }) {
  const { colors } = useTheme();
  const { type } = route.params;
  const matieres = getAllMatieres();

  const handleMatiereChoisie = (matiere) => {
    feedback('tap');
    if (type === 'revision') {
      navigation.navigate('PrisePhotoCours', { matiere: matiere.nom, type });
    } else {
      navigation.navigate('PrisePhotoDevoir', { matiere: matiere.nom, type });
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Choisis ta matière</Text>
        <Text style={styles.subtitle}>{type === 'revision' ? 'Sélectionne la matière à réviser' : 'Sélectionne la matière du devoir'}</Text>
      </LinearGradient>
      
      <View style={styles.grid}>
        {matieres.map((matiere) => (
          <TouchableOpacity
            key={matiere.nom}
            style={[styles.matiereCard, { backgroundColor: colors.surface }]}
            onPress={() => handleMatiereChoisie(matiere)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: matiere.couleur + '20' }]}>
              <MaterialCommunityIcons name={matiere.icone} size={36} color={matiere.couleur} />
            </View>
            <Text style={[styles.matiereNom, { color: colors.text }]} numberOfLines={2} adjustsFontSizeToFit>
              {matiere.nom}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 50, paddingBottom: 30, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  title: { fontSize: 26, fontWeight: 'bold', color: 'white', marginBottom: 8 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.9)' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', padding: 16 },
  matiereCard: { 
    width: CARD_WIDTH, 
    padding: 16, 
    borderRadius: 16, 
    alignItems: 'center', 
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  matiereNom: { fontSize: 14, fontWeight: '500', textAlign: 'center', lineHeight: 18, maxWidth: CARD_WIDTH - 20 }
});
