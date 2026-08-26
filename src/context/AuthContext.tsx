import React, { createContext, useState, useContext, useEffect } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '../services/firebaseConfig';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import * as SecureStore from 'expo-secure-store';
import { invalidateCache } from '../services/cacheService';
import { stopTimeTracking } from '../services/timeTrackingService';

type UserRole = 'parent' | 'eleve' | 'repetiteur' | 'etablissement' | 'admin' | null;
interface AuthContextType {
  user: User | null; userRole: UserRole; userId: string | null; userData: Record<string, unknown> | null;
  setUserRole: (role: UserRole) => void; setUserId: (id: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role: Exclude<UserRole, null>, profile?: Record<string, unknown>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>; logout: () => Promise<void>; loading: boolean;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
const clearUserData = async (): Promise<void> => {
  await Promise.all([
    SecureStore.deleteItemAsync('monrepetiteur_sessions'), SecureStore.deleteItemAsync('monrepetiteur_badges'),
    SecureStore.deleteItemAsync('repetia_badges_v3'), SecureStore.deleteItemAsync('monrepetiteur_time_stats'),
    SecureStore.deleteItemAsync('offline_queue'),
  ]);
  invalidateCache();
};
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null); const [userRole, setUserRole] = useState<UserRole>(null);
  const [userId, setUserId] = useState<string | null>(null); const [userData, setUserData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const login = async (email: string, password: string) => { await signInWithEmailAndPassword(auth, email, password); };
  const register = async (email: string, password: string, role: Exclude<UserRole, null>, profile: Record<string, unknown> = {}) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password); const u = credential.user;
    await setDoc(doc(db, 'users', u.uid), { ...profile, uid: u.uid, email: u.email ?? email, role, createdAt: serverTimestamp() }, { merge: true });
  };
  const resetPassword = async (email: string) => { await sendPasswordResetEmail(auth, email); };
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async firebaseUser => {
      if (!firebaseUser) {
        setUser(null); setUserId(null); setUserRole(null); setUserData(null); await clearUserData(); setLoading(false); return;
      }
      setUser(firebaseUser); setUserId(firebaseUser.uid); setUserData(null); setLoading(true);
      try {
        const enfantSnap = await getDoc(doc(db, 'enfants', firebaseUser.uid));
        if (enfantSnap.exists()) { setUserRole('eleve'); setUserData(enfantSnap.data() as Record<string, unknown>); return; }
        const parentSnap = await getDoc(doc(db, 'parents', firebaseUser.uid));
        if (parentSnap.exists()) { setUserRole('parent'); setUserData(parentSnap.data() as Record<string, unknown>); return; }
        const userSnap = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userSnap.exists()) {
          const data = userSnap.data();
          if (['parent','eleve','repetiteur','etablissement','admin'].includes(String(data.role))) {
            setUserRole(data.role as UserRole); setUserData(data as Record<string, unknown>); return;
          }
        }
        // Compatibilité avec les comptes répétiteurs historiques : leur profil métier
        // peut exister dans /tuteurs même si /users/role n'a jamais été migré.
        const tuteurSnap = await getDoc(doc(db, 'tuteurs', firebaseUser.uid));
        if (tuteurSnap.exists()) { setUserRole('repetiteur'); setUserData(tuteurSnap.data() as Record<string, unknown>); return; }
        setUserRole(null); setUserData(null);
      } catch (error) {
        console.error('❌ Erreur détermination rôle:', error); setUserRole(null); setUserData(null);
      } finally { setLoading(false); }
    });
    return unsubscribe;
  }, []);
  const logout = async () => {
    try { try { await stopTimeTracking(); } catch {} await clearUserData(); await auth.signOut(); }
    catch (error) { console.error('❌ Erreur déconnexion:', error); }
  };
  return <AuthContext.Provider value={{ user, userRole, userId, userData, setUserRole, setUserId, login, register, resetPassword, logout, loading }}>{children}</AuthContext.Provider>;
};
export const useAuth = (): AuthContextType => { const context = useContext(AuthContext); if (!context) throw new Error('useAuth must be used within an AuthProvider'); return context; };
