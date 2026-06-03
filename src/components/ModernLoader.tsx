import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

interface ModernLoaderProps {
  visible: boolean;
  message?: string;
  subMessage?: string;
  type?: 'brain' | 'book' | 'lightbulb' | 'magic';
}

const messages = {
  brain: [
    "L'IA réfléchit...",
    "Analyse en cours...",
    "Préparation des questions...",
    "Patiente, c'est presque prêt..."
  ],
  book: [
    "Lecture du cours...",
    "Extraction des notions importantes...",
    "Création des exercices...",
    "Bientôt prêt !"
  ],
  lightbulb: [
    "Génération des idées...",
    "Création des questions...",
    "Optimisation du contenu...",
    "Tu vas adorer ces questions !"
  ],
  magic: [
    "Un peu de magie...",
    "Transformation en questions...",
    "Préparation de la révision...",
    "C'est presque fini !"
  ]
};

const icons = {
  brain: 'brain',
  book: 'book-open-variant',
  lightbulb: 'lightbulb-on',
  magic: 'magic-staff'
};

export default function ModernLoader({ 
  visible, 
  message, 
  subMessage, 
  type = 'brain' 
}: ModernLoaderProps) {
  const { colors } = useTheme();
  
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [currentSubMessage, setCurrentSubMessage] = useState(subMessage || '');
  
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;
  const fadeValue = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const progressScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
      
      Animated.loop(
        Animated.sequence([
          Animated.timing(progressScale, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(progressScale, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      spinValue.setValue(0);
      progressScale.setValue(0);
    }
  }, [visible]);

  useEffect(() => {
    if (visible) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseValue, {
            toValue: 1.1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseValue, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseValue.setValue(1);
    }
  }, [visible]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeValue, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeValue.setValue(0);
      translateY.setValue(20);
    }
  }, [visible]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  useEffect(() => {
    if (!visible) return;
    
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => 
        prev + 1 >= (messages[type]?.length || 4) ? 0 : prev + 1
      );
    }, 2500);
    
    return () => clearInterval(interval);
  }, [visible, type]);

  const displayMessage = message || messages[type][currentMessageIndex];
  const displaySubMessage = currentSubMessage || 
    (type === 'brain' ? "L'intelligence artificielle travaille pour toi" :
     type === 'book' ? "Analyse du contenu pédagogique" :
     type === 'lightbulb' ? "Création de questions personnalisées" :
     "Préparation de ta révision");

  if (!visible) return null;

  return (
    <Animated.View 
      style={[
        styles.overlay,
        {
          backgroundColor: colors.background,
          opacity: fadeValue,
          transform: [{ translateY }]
        }
      ]}
    >
      <LinearGradient
        colors={[colors.primary + '10', colors.secondary + '10']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          
          <Animated.View 
            style={[
              styles.outerGlow,
              {
                transform: [{ scale: pulseValue }],
                borderColor: colors.primary + '40',
              }
            ]} 
          />
          
          <Animated.View 
            style={[
              styles.iconContainer,
              {
                backgroundColor: colors.surface,
                transform: [{ rotate: spin }],
                shadowColor: colors.primary,
              }
            ]}
          >
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              style={styles.iconGradient}
            >
              <MaterialCommunityIcons 
                name={icons[type]} 
                size={48} 
                color="white" 
              />
            </LinearGradient>
          </Animated.View>

          <View style={styles.particles}>
            {[...Array(6)].map((_, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.particle,
                  {
                    backgroundColor: colors.primary,
                    opacity: 0.6,
                    transform: [
                      {
                        translateX: Math.sin(Date.now() / 1000 + i) * 30
                      },
                      {
                        translateY: Math.cos(Date.now() / 1000 + i) * 20
                      }
                    ]
                  }
                ]}
              />
            ))}
          </View>

          <Animated.Text 
            style={[
              styles.mainMessage, 
              { 
                color: colors.text,
                transform: [{ translateY: pulseValue.interpolate({
                  inputRange: [1, 1.1],
                  outputRange: [0, -5]
                }) }]
              }
            ]}
          >
            {displayMessage}
          </Animated.Text>

          <Text style={[styles.subMessage, { color: colors.textSecondary }]}>
            {displaySubMessage}
          </Text>

          <View style={styles.progressContainer}>
            <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
              <Animated.View 
                style={[
                  styles.progressFill,
                  {
                    transform: [{ scaleX: progressScale }],
                    backgroundColor: colors.primary,
                  }
                ]} 
              />
            </View>
          </View>

          <View style={styles.waves}>
            {[...Array(3)].map((_, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.wave,
                  {
                    backgroundColor: colors.primary + '20',
                    width: width * (0.5 + i * 0.15),
                    height: 2 + i * 2,
                    opacity: 0.5 - i * 0.15,
                    transform: [{ scaleX: pulseValue }],
                  }
                ]}
              />
            ))}
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  gradient: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  outerGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 30,
  },
  iconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  particles: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  mainMessage: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  subMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 40,
  },
  progressContainer: {
    width: '80%',
    marginTop: 20,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    width: '100%',
    transform: [{ scaleX: 0 }],
    borderRadius: 2,
  },
  waves: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
  },
  wave: {
    position: 'absolute',
    bottom: 0,
    borderRadius: 10,
  },
});
