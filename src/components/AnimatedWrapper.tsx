import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View, ViewStyle } from 'react-native';

interface AnimatedWrapperProps {
  children: React.ReactNode;
  type?: 'fade' | 'slide' | 'scale' | 'slideUp';
  duration?: number;
  delay?: number;
  style?: ViewStyle;
}

export default function AnimatedWrapper({ 
  children, 
  type = 'fade', 
  duration = 400, 
  delay = 0,
  style 
}: AnimatedWrapperProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const translateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    const animations = {
      fade: Animated.timing(fadeAnim, {
        toValue: 1,
        duration,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      slide: Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration,
          delay,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      scale: Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration,
          delay,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      slideUp: Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration,
          delay,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    };

    animations[type].start();

    return () => {
      animations[type].stop();
    };
  }, []);

  const getAnimatedStyle = () => {
    switch (type) {
      case 'fade':
        return { opacity: fadeAnim };
      case 'slide':
        return { opacity: fadeAnim, transform: [{ translateX: slideAnim }] };
      case 'scale':
        return { opacity: fadeAnim, transform: [{ scale: scaleAnim }] };
      case 'slideUp':
        return { opacity: fadeAnim, transform: [{ translateY: translateY }] };
      default:
        return { opacity: fadeAnim };
    }
  };

  return (
    <Animated.View style={[getAnimatedStyle(), style]}>
      {children}
    </Animated.View>
  );
}
