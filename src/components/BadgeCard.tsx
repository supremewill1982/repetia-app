import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface BadgeCardProps {
  badge: {
    id: string;
    nom: string;
    description: string;
    icone: string;
    couleur: string;
    dateObtention?: string;
  };
  onPress?: () => void;
}

export default function BadgeCard({ badge, onPress }: BadgeCardProps) {
  const { colors } = useTheme();
  
  const dateFormatee = badge.dateObtention 
    ? new Date(badge.dateObtention).toLocaleDateString('fr-FR')
    : null;

  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: colors.surface }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={[badge.couleur + '40', badge.couleur + '20']}
        style={styles.gradient}
      >
        <View style={[styles.iconContainer, { backgroundColor: badge.couleur + '30' }]}>
          <MaterialCommunityIcons name={badge.icone} size={40} color={badge.couleur} />
        </View>
        
        <View style={styles.infoContainer}>
          <Text style={[styles.nom, { color: colors.text }]}>{badge.nom}</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
            {badge.description}
          </Text>
          {dateFormatee && (
            <Text style={[styles.date, { color: colors.textMuted }]}>
              Obtenu le {dateFormatee}
            </Text>
          )}
        </View>
        
        <MaterialCommunityIcons 
          name="chevron-right" 
          size={20} 
          color={colors.textSecondary} 
          style={styles.arrow}
        />
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoContainer: {
    flex: 1,
  },
  nom: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    marginBottom: 4,
  },
  date: {
    fontSize: 10,
  },
  arrow: {
    marginLeft: 8,
  },
});
