import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { networkService } from '../services/networkService';
import { offlineQueueService } from '../services/offlineQueueService';

export default function NetworkStatus() {
  const { colors } = useTheme();
  const [isConnected, setIsConnected] = useState(networkService.isConnected());
  const [queueCount, setQueueCount] = useState(0);
  const [show, setShow] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    const unsubscribe = networkService.onStatusChange(async (status) => {
      setIsConnected(status === 'connected');
      const count = await offlineQueueService.getQueueCount();
      setQueueCount(count);
      
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      
      if (status === 'connected' && count === 0) {
        setTimeout(() => {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }).start(() => setShow(false));
        }, 5000);
      } else {
        setShow(true);
      }
    });
    
    const loadQueueCount = async () => {
      const count = await offlineQueueService.getQueueCount();
      setQueueCount(count);
      if (count > 0) setShow(true);
    };
    loadQueueCount();
    
    return unsubscribe;
  }, []);

  if (!show) return null;

  const getIcon = () => {
    if (!isConnected) return 'wifi-off';
    if (queueCount > 0) return 'cloud-sync';
    return 'wifi-check';
  };

  const getMessage = () => {
    if (!isConnected) return 'Mode hors ligne';
    if (queueCount > 0) return `${queueCount} révision${queueCount > 1 ? 's' : ''} en attente`;
    return 'Connecté';
  };

  const getBackgroundColor = () => {
    if (!isConnected) return '#f44336';
    if (queueCount > 0) return '#FF9800';
    return '#4CAF50';
  };

  const handlePress = async () => {
    if (queueCount > 0 && isConnected) {
      await offlineQueueService.processQueue();
      const newCount = await offlineQueueService.getQueueCount();
      setQueueCount(newCount);
    }
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, backgroundColor: getBackgroundColor() }]}>
      <TouchableOpacity onPress={handlePress} style={styles.content} activeOpacity={0.8}>
        <MaterialCommunityIcons name={getIcon()} size={16} color="white" />
        <Text style={styles.message}>{getMessage()}</Text>
        {queueCount > 0 && isConnected && (
          <MaterialCommunityIcons name="refresh" size={14} color="white" />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    right: 20,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  message: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
});
