import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, db } from '../services/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import * as SecureStore from 'expo-secure-store';
import { invalidateCache } from '../services/cacheService';
import { Alert } from 'react-native';

type UserRole = 'parent' | 'eleve' | null;

interface AuthContextType {
  userRole: UserRole;
  userId: string | null;
  userData: any;
  setUserRole: (role: UserRole) => void;
  setUserId: (id: string | null) => void;
  logout: () => Promise<void>;
  loading: boolean;
  selectRoleManually: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const clearUserData = async () => {
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

  // ✅ Nouvelle fonction pour sélectionner manuellement
  const selectRoleManually = (role: UserRole) => {
    if (!userId) {
      Alert.alert('Erreur', 'Vous devez être connecté pour sélectionner un rôle');
      return;
    }
    setUserRole(role);
    // Sauvegarder le rôle sélectionné localement
    SecureStore.setItemAsync('monrepetiteur_manual_role', role);
    console.log('✅ Rôle sélectionné manuellement:', role);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        setUserData(null);

        try {
          // 1. Vérifier si rôle manuel sauvegardé
          const manualRole = await SecureStore.getItemAsync('monrepetiteur_manual_role');
          if (manualRole === 'parent' || manualRole === 'eleve') {
            setUserRole(manualRole as UserRole);
            setLoading(false);
            return;
          }

          // 2. Vérifier collection enfants
          const enfantRef = doc(db, 'enfants', user.uid);
          const enfantSnap = await getDoc(enfantRef);
          if (enfantSnap.exists()) {
            setUserRole('eleve');
            setUserData(enfantSnap.data());
            setLoading(false);
            return;
          }

          // 3. Vérifier collection parents
          const parentRef = doc(db, 'parents', user.uid);
          const parentSnap = await getDoc(parentRef);
          if (parentSnap.exists()) {
            setUserRole('parent');
            setUserData(parentSnap.data());
            setLoading(false);
            return;
          }

          // 4. Vérifier collection users (au cas où)
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            // Si le document a un champ 'role'
            if (userData.role === 'parent' || userData.role === 'eleve') {
              setUserRole(userData.role);
              setUserData(userData);
              setLoading(false);
              return;
            }
          }

          console.log('⚠️ Utilisateur sans rôle défini');
          setUserRole(null);
          setUserData(null);

        } catch (error) {
          console.error('❌ Erreur détermination rôle:', error);
          setUserRole(null);
          setUserData(null);
        }
      } else {
        setUserId(null);
        setUserRole(null);
        setUserData(null);
        await clearUserData();
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const logout = async () => {
    try {
      await clearUserData();
      await SecureStore.deleteItemAsync('monrepetiteur_manual_role');
      await auth.signOut();
      console.log('✅ Déconnexion réussie, données nettoyées');
    } catch (error) {
      console.error('❌ Erreur déconnexion:', error);
    }
  };

  return (
    <AuthContext.Provider selectedValue={{
      userRole,
      userId,
      userData,
      setUserRole,
      setUserId,
      logout,
      loading,
      selectRoleManually, // ✅ Nouvelle fonction
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
