import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase/config';
import { UserProfile, UserRole, ArtistProfile } from '../types/music';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  role: UserRole;
  loading: boolean;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'signup';
  setIsAuthModalOpen: (open: boolean) => void;
  setAuthModalMode: (mode: 'login' | 'signup') => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    pass: string,
    displayName: string,
    selectedRole: UserRole,
    stageName?: string,
    country?: string
  ) => Promise<void>;
  updateUserRole: (newRole: UserRole, stageName?: string) => Promise<void>;
  updateArtistProfile: (data: {
    displayName?: string;
    artistStageName?: string;
    bio?: string;
    country?: string;
    photoURL?: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  canUpload: boolean;
  canSync: boolean;
  isAdmin: boolean;
  isCreator: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const BOOTSTRAP_ADMIN_EMAIL = 'bcafricao@gmail.com';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('signup');

  // Load user profile from Firestore or bootstrap initial document
  const fetchOrCreateProfile = async (firebaseUser: User, roleHint: UserRole = 'listener', stageName?: string, country?: string): Promise<UserProfile> => {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    try {
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        // Verify bootstrap admin email
        if (firebaseUser.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase() && data.role !== 'admin') {
          await updateDoc(userDocRef, { role: 'admin' });
          data.role = 'admin';
        }
        setProfile(data);
        return data;
      } else {
        // Create new user profile document
        const initialRole: UserRole = firebaseUser.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase() ? 'admin' : roleHint;
        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || stageName || 'BC Music User',
          photoURL: firebaseUser.photoURL || '',
          role: initialRole,
          bio: initialRole === 'creator' ? 'African Music Creator & Songwriter' : 'Music Lover & Explorer',
          artistStageName: stageName || (initialRole === 'creator' ? firebaseUser.displayName || 'BC Artist' : ''),
          country: country || 'Nigeria',
          createdAt: new Date().toISOString(),
        };

        await setDoc(userDocRef, newProfile);
        setProfile(newProfile);
        return newProfile;
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${firebaseUser.uid}`);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchOrCreateProfile(currentUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        await fetchOrCreateProfile(result.user);
        setIsAuthModalOpen(false);
      }
    } catch (err: unknown) {
      console.error('Google sign in error:', err);
      throw err;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, pass);
      if (result.user) {
        await fetchOrCreateProfile(result.user);
        setIsAuthModalOpen(false);
      }
    } catch (err: unknown) {
      console.error('Email sign in error:', err);
      throw err;
    }
  };

  const signUpWithEmail = async (
    email: string,
    pass: string,
    displayName: string,
    selectedRole: UserRole,
    stageName?: string,
    country?: string
  ) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, pass);
      if (result.user) {
        await updateProfile(result.user, { displayName });
        await fetchOrCreateProfile(result.user, selectedRole, stageName, country);
        setIsAuthModalOpen(false);
      }
    } catch (err: unknown) {
      console.error('Email sign up error:', err);
      throw err;
    }
  };

  const updateUserRole = async (newRole: UserRole, stageName?: string) => {
    if (!user || !profile) return;
    const userDocRef = doc(db, 'users', user.uid);
    try {
      const updates: Partial<UserProfile> = {
        role: newRole,
        updatedAt: new Date().toISOString(),
      };
      if (stageName) updates.artistStageName = stageName;

      await updateDoc(userDocRef, updates);
      setProfile((prev) => (prev ? { ...prev, ...updates } : null));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const updateArtistProfile = async (data: {
    displayName?: string;
    artistStageName?: string;
    bio?: string;
    country?: string;
    photoURL?: string;
  }) => {
    if (!user || !profile) return;
    const userDocRef = doc(db, 'users', user.uid);
    const artistDocRef = doc(db, 'artists', user.uid);
    const now = new Date().toISOString();

    try {
      const userUpdates: Partial<UserProfile> = {
        ...data,
        updatedAt: now,
      };
      await updateDoc(userDocRef, userUpdates);

      const artistData: ArtistProfile = {
        id: user.uid,
        displayName: data.displayName || profile.displayName || 'BC Artist',
        artistStageName: data.artistStageName || profile.artistStageName || profile.displayName || 'BC Artist',
        bio: data.bio !== undefined ? data.bio : (profile.bio || 'African Music Creator & Songwriter'),
        country: data.country !== undefined ? data.country : (profile.country || 'Nigeria'),
        photoURL: data.photoURL !== undefined ? data.photoURL : (profile.photoURL || ''),
        isVerified: profile.role === 'admin' || profile.role === 'creator',
        createdAt: profile.createdAt || now,
        updatedAt: now,
      };
      await setDoc(artistDocRef, artistData, { merge: true });

      setProfile((prev) => (prev ? { ...prev, ...data, updatedAt: now } : null));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setProfile(null);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const role: UserRole = profile?.role || 'listener';
  const isAdmin = role === 'admin' || user?.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();
  const isCreator = role === 'creator' || isAdmin;
  const canUpload = isCreator;
  const canSync = isCreator;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        loading,
        isAuthModalOpen,
        authModalMode,
        setIsAuthModalOpen,
        setAuthModalMode,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        updateUserRole,
        updateArtistProfile,
        signOut,
        canUpload,
        canSync,
        isAdmin,
        isCreator,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
