"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth, googleProvider } from "./firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  configured: boolean;
  signInGoogle: () => Promise<void>;
  signInEmail: (e: string, p: string) => Promise<void>;
  signUpEmail: (e: string, p: string) => Promise<void>;
  logout: () => Promise<void>;
  signInDemo: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    // Check if Firebase is configured
    if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
      setConfigured(true);
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const signInEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signUpEmail = async (email: string, pass: string) => {
    await createUserWithEmailAndPassword(auth, email, pass);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const signInDemo = () => {
    // Mock user for demo purposes
    setUser({
      uid: "demo-user",
      email: "demo@arvia.ai",
      displayName: "Demo User",
    } as any);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        configured,
        signInGoogle,
        signInEmail,
        signUpEmail,
        logout,
        signInDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
