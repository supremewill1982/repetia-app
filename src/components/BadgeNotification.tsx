import React, { useEffect, useRef, useState } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity,
  Animated, Dimensions, Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface Badge {
  id:          string;
  nom:         string;
  description: string;
  icone:       string;
  couleur:     string;
}

interface Props {
  badge:    Badge | null;
  onHide:   () => void;
  duration?: number;
}

export default function BadgeNotification({ badge, onHide, duration = 5000 }: Props) {
  const [visible, setVisible] = useState(false);

  // Animations
  const scale      = useRef(new Animated.Value(0)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  const iconScale  = useRef(new Animated.Value(0)).current;
  const iconRotate = useRef(new Animated.Value(0)).current;
  const shimmer    = useRef(new Animated.Value(0)).current;
  const bounce     = useRef(new Animated.Value(0)).current;

  const shimmerLoop = useRef<Animated.CompositeAnimation | null>(null);
  const timer       = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!badge) return;

    // Reset
    scale.setValue(0);
    opacity.setValue(0);
    iconScale.setValue(0);
    iconRotate.setValue(0);
    shimmer.setValue(0);
    bounce.setValue(0);

    setVisible(true);

    // ── Séquence d'entrée
    Animated.sequence([
      // 1. Fond fade in
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();

    // 2. Card scale spring
    Animated.spring(scale, {
      toValue: 1,
      friction:  4,
      tension:   70,
      useNativeDriver: true,
    }).start();

    // 3. Icon avec délai
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(iconScale, {
          toValue: 1,
          friction: 3,
          tension: 90,
          useNativeDriver: true,
        }),
        Animated.timing(iconRotate, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();

      // 4. Shimmer continu
      shimmerLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(shimmer, { toValue: 1, duration: 1000, useNativeDriver: true }),
          Animated.timing(shimmer, { toValue: 0, duration: 1000, useNativeDriver: true }),
        ])
      );
      shimmerLoop.current.start();

      // 5. Micro-bounce
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounce, { toValue: 6, duration: 800, useNativeDriver: true }),
          Animated.timing(bounce, { toValue: 0, duration: 800, useNativeDriver: true }),
        ]),
        { iterations: 3 }
      ).start();
    }, 300);

    // Auto-fermeture
    timer.current = setTimeout(() => _hide(), duration);

    return () => {
      if (timer.current) clearTimeout(timer.current);
      shimmerLoop.current?.stop();
    };
  }, [badge?.id]);

  const _hide = () => {
    if (timer.current) clearTimeout(timer.current);
    shimmerLoop.current?.stop();

    Animated.parallel([
      Animated.timing(scale,   { toValue: 0.7, duration: 200, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0,   duration: 250, useNativeDriver: true }),
    ]).start(() => {
      setVisible(false);
      onHide?.();
    });
  };

  if (!badge) return null;

  const iconRotInterp = iconRotate.interpolate({
    inputRange:  [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const shimmerOpacity = shimmer.interpolate({
    inputRange: [0, 1], outputRange: [0.85, 1],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={_hide}
    >
      <Animated.View style={[styles.overlay, { opacity }]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={_hide}
        />

        <Animated.View style={[
          styles.card,
          { borderColor: badge.couleur + '60' },
          {
            transform: [
              { scale },
              { translateY: bounce },
            ],
          },
        ]}>
          {/* Fond coloré léger */}
          <View style={[styles.cardBg, { backgroundColor: badge.couleur + '15' }]} />

          {/* Fermer */}
          <TouchableOpacity style={styles.closeBtn} onPress={_hide}>
            <MaterialCommunityIcons name="close" size={18} color="#8A9AAA" />
          </TouchableOpacity>

          {/* Label */}
          <Text style={styles.labelTop}>🏅 BADGE DÉBLOQUÉ !</Text>

          {/* Icône animée */}
          <Animated.View style={[
            styles.iconWrapper,
            {
              opacity: shimmerOpacity,
              transform: [
                { scale: iconScale },
                { rotate: iconRotInterp },
              ],
            },
          ]}>
            <View style={[styles.iconCircle, {
              backgroundColor: badge.couleur + '25',
              borderColor:     badge.couleur,
            }]}>
              <MaterialCommunityIcons
                name={badge.icone as any}
                size={56}
                color={badge.couleur}
              />
            </View>
          </Animated.View>

          {/* Nom du badge */}
          <Text style={[styles.badgeNom, { color: '#2B3A4A' }]}>
            {badge.nom}
          </Text>

          {/* Description */}
          <Text style={styles.badgeDesc}>{badge.description}</Text>

          {/* Bouton continuer */}
          <TouchableOpacity
            style={[styles.continuerBtn, { backgroundColor: badge.couleur }]}
            onPress={_hide}
          >
            <Text style={styles.continuerTxt}>Continuer 🎉</Text>
          </TouchableOpacity>

          {/* Barre de timer */}
          <Animated.View style={[
            styles.timerBar,
            { backgroundColor: badge.couleur },
          ]} />
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 30, 40, 0.75)',
    justifyContent: 'center',
    alignItems:     'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    borderWidth:  1.5,
    padding:      28,
    alignItems:   'center',
    gap:          12,
    // Ombre prononcée
    shadowColor:   '#2B3A4A',
    shadowOffset:  { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius:  24,
    elevation:     20,
    overflow: 'hidden',
  },
  cardBg: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 28,
  },
  closeBtn: {
    position: 'absolute',
    top: 14, right: 14,
    width: 32, height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  labelTop: {
    fontSize:    11,
    fontWeight:  '800',
    letterSpacing: 2,
    color:       '#8A9AAA',
    marginTop:   8,
  },
  iconWrapper: { marginVertical: 8 },
  iconCircle: {
    width:  110,
    height: 110,
    borderRadius: 55,
    borderWidth:  2.5,
    justifyContent: 'center',
    alignItems:     'center',
  },
  badgeNom: {
    fontSize:   24,
    fontWeight: '800',
    textAlign:  'center',
    letterSpacing: 0.3,
  },
  badgeDesc: {
    fontSize:   14,
    color:      '#8A9AAA',
    textAlign:  'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  continuerBtn: {
    paddingHorizontal: 28,
    paddingVertical:   12,
    borderRadius:      30,
    marginTop:         8,
  },
  continuerTxt: {
    color:      'white',
    fontSize:   15,
    fontWeight: '700',
  },
  timerBar: {
    position: 'absolute',
    bottom: 0, left: 0,
    height: 4,
    width: '100%',
    borderBottomLeftRadius:  28,
    borderBottomRightRadius: 28,
    opacity: 0.4,
  },
});
