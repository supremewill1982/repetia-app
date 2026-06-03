import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, db } from '../services/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import * as SecureStore from 'expo-secure-store';
import { invalidateCache } from '../services/cacheService';

type UserRole = 'parent' | 'eleve' | null;

interface AuthContextType {
  userRole: UserRole;
  userId: string | null;
  userData: any;
  setUserRole: (role: UserRole) => void;
  setUserId: (id: string | null) => void;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const clearUserData = async () => {
  // Supprimer toutes les données locales
  const keys = await SecureStore.getItemAsync('monrepetiteur_sessions');
  await SecureStore.deleteItemAsync('monrepetiteur_sessions');
  await SecureStore.deleteItemAsync('monrepetiteur_badges');
  await SecureStore.deleteItemAsync('monrepetiteur_time_stats');
  await SecureStore.deleteItemAsync('offline_queue');
  invalidateCache();
  console.log('🗑️ Données locales nettoyées');
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        
        try {
          const enfantRef = doc(db, 'enfants', user.uid);
          const enfantSnap = await getDoc(enfantRef);
          
          if (enfantSnap.exists()) {
            setUserRole('eleve');
            setUserData(enfantSnap.data());
          } else {
            console.log('Utilisateur sans rôle défini');
            setUserRole(null);
          }
        } catch (error) {
          console.error('Erreur détermination rôle:', error);
        }
      } else {
        setUserId(null);
        setUserRole(null);
        setUserData(null);
        // Nettoyer les données locales à la déconnexion
        await clearUserData();
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const logout = async () => {
    try {
      await clearUserData();
      await auth.signOut();
      console.log('✅ Déconnexion réussie, données nettoyées');
    } catch (error) {
      console.error('Erreur déconnexion:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      userRole,
      userId,
      userData,
      setUserRole,
      setUserId,
      logout,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
