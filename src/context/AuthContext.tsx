import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import type { UserProfile } from '../types/Expense';

interface AuthContextType {
      currentUserAuth: User | null;
      currentUserProfile: UserProfile | null;
      loading: boolean;
      login: (email: string, password: string) => Promise<void>;
      logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
      const context = useContext(AuthContext);
      if (!context) {
            throw new Error('useAuth must be used within an AuthProvider');
      }
      return context;
};

interface AuthProviderProps {
      children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
      const [currentUserAuth, setCurrentUserAuth] = useState<User | null>(null);
      const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
      const [loading, setLoading] = useState(true);

      useEffect(() => {
            const unsubscribe = onAuthStateChanged(auth, async (user) => {
                  setCurrentUserAuth(user);
                  if (user) {
                        // Fetch user profile from Firestore
                        try {
                              const userDocRef = doc(db, 'users', user.uid);
                              const userDoc = await getDoc(userDocRef);
                              if (userDoc.exists()) {
                                    setCurrentUserProfile(userDoc.data() as UserProfile);
                              } else {
                                    // Fallback if profile doesn't exist
                                    console.warn('User profile not found for uid:', user.uid);
                                    setCurrentUserProfile({
                                          id: user.uid,
                                          email: user.email || '',
                                          displayName: user.displayName || user.email?.split('@')[0] || 'Kullanıcı',
                                          role: 'ORTAK', // Default role
                                          createdAt: {} as any, // Placeholder
                                          updatedAt: {} as any // Placeholder
                                    });
                              }
                        } catch (error) {
                              console.error('Error fetching user profile:', error);
                              setCurrentUserProfile(null);
                        }
                  } else {
                        setCurrentUserProfile(null);
                  }
                  setLoading(false);
            });

            return unsubscribe;
      }, []);

      const login = async (email: string, password: string) => {
            await signInWithEmailAndPassword(auth, email, password);
      };

      const logout = async () => {
            await signOut(auth);
      };

      const value = {
            currentUserAuth,
            currentUserProfile,
            loading,
            login,
            logout
      };

      return (
            <AuthContext.Provider value={value}>
                  {!loading && children}
            </AuthContext.Provider>
      );
};
