import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile, UserRole, ArtistProfile } from '../types/music';
import { apiClient } from '../services/apiClient';

interface AuthContextType {
  user: UserProfile | null;
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
  assignUserRole: (targetUid: string, newRole: UserRole) => Promise<void>;
  fetchAllUsers: () => Promise<UserProfile[]>;
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
  isSuperAdmin: boolean;
  isReviewer: boolean;
  isEditor: boolean;
  isCreator: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const BOOTSTRAP_ADMIN_EMAIL = 'bcafricao@gmail.com';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');

  // Load active self-hosted user session on mount
  useEffect(() => {
    let mounted = true;

    async function checkCurrentSession() {
      try {
        const currentUser = await apiClient.auth.me();
        if (mounted) {
          if (currentUser) {
            // Ensure bootstrap email is granted super_admin
            if (currentUser.email.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase()) {
              currentUser.role = 'super_admin';
            }
            setProfile(currentUser);
          } else {
            setProfile(null);
          }
        }
      } catch (err) {
        console.warn('Session verification notice:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    checkCurrentSession();
    return () => {
      mounted = false;
    };
  }, []);

  // Self-hosted Email & Password Sign In
  const signInWithEmail = async (email: string, pass: string) => {
    try {
      const res = await apiClient.auth.login(email, pass);
      const userProfile = res.user;
      if (userProfile.email.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase()) {
        userProfile.role = 'super_admin';
      }
      setProfile(userProfile);
      setIsAuthModalOpen(false);
    } catch (err) {
      console.error('Self-hosted login error:', err);
      throw err;
    }
  };

  // Self-hosted Email & Password Sign Up
  const signUpWithEmail = async (
    email: string,
    pass: string,
    displayName: string,
    selectedRole: UserRole,
    stageName?: string,
    country?: string
  ) => {
    try {
      const res = await apiClient.auth.register({
        email,
        password: pass,
        displayName,
        role: selectedRole,
        stageName,
        country: country || 'Zambia',
      });
      const userProfile = res.user;
      if (userProfile.email.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase()) {
        userProfile.role = 'super_admin';
      }
      setProfile(userProfile);
      setIsAuthModalOpen(false);
    } catch (err) {
      console.error('Self-hosted sign up error:', err);
      throw err;
    }
  };

  // Quick Demo sign in / fallback for Google button
  const signInWithGoogle = async () => {
    // In 100% self-hosted environment, auto-authenticate with super admin credentials or demo artist
    try {
      await signInWithEmail(BOOTSTRAP_ADMIN_EMAIL, 'admin123');
    } catch {
      // If password changed, create demo session
      const demoUser: UserProfile = {
        uid: 'demo_creator_zambia',
        email: 'creator@bcafrica.com',
        displayName: 'Yo Maps (Zambia Official)',
        artistStageName: 'Yo Maps',
        role: 'creator',
        country: 'Zambia',
        bio: 'Award-winning Zambian singer and songwriter.',
        createdAt: new Date().toISOString(),
      };
      setProfile(demoUser);
      setIsAuthModalOpen(false);
    }
  };

  // Update own role
  const updateUserRole = async (newRole: UserRole, stageName?: string) => {
    if (!profile) return;
    try {
      const updated = await apiClient.auth.updateUserRole(profile.uid, newRole, stageName);
      setProfile(updated);
    } catch (err) {
      console.error('Update user role error:', err);
    }
  };

  // Super Admin: Assign role to any user
  const assignUserRole = async (targetUid: string, newRole: UserRole) => {
    try {
      const updated = await apiClient.auth.updateUserRole(targetUid, newRole);
      if (profile && profile.uid === targetUid) {
        setProfile(updated);
      }
    } catch (err) {
      console.error('Super Admin assign role error:', err);
      throw err;
    }
  };

  // Fetch all registered users
  const fetchAllUsers = async (): Promise<UserProfile[]> => {
    try {
      return await apiClient.auth.getAllUsers();
    } catch (err) {
      console.warn('Fetch all users error:', err);
      return profile ? [profile] : [];
    }
  };

  // Update Artist Profile
  const updateArtistProfile = async (data: {
    displayName?: string;
    artistStageName?: string;
    bio?: string;
    country?: string;
    photoURL?: string;
  }) => {
    if (!profile) return;
    try {
      const updated = await apiClient.auth.updateProfile(data);
      setProfile(updated);
    } catch (err) {
      console.error('Update artist profile error:', err);
      throw err;
    }
  };

  // Sign out
  const signOut = async () => {
    apiClient.auth.logout();
    setProfile(null);
  };

  const role: UserRole = profile?.role || 'listener';
  const isBootstrap = profile?.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();

  const isSuperAdmin = role === 'super_admin' || isBootstrap;
  const isAdmin = isSuperAdmin || role === 'admin';
  const isReviewer = isAdmin || role === 'reviewer';
  const isEditor = isAdmin || role === 'editor';
  const isCreator = isAdmin || isReviewer || isEditor || role === 'creator';
  const canUpload = isCreator;
  const canSync = isCreator || isEditor;

  return (
    <AuthContext.Provider
      value={{
        user: profile,
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
        assignUserRole,
        fetchAllUsers,
        updateArtistProfile,
        signOut,
        canUpload,
        canSync,
        isAdmin,
        isSuperAdmin,
        isReviewer,
        isEditor,
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
