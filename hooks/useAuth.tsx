import React, { createContext, ReactNode, useContext, useState } from 'react';
import { Platform } from 'react-native';

export interface User {
  id: number;
  full_name: string;
  email: string;
  username: string;
  phone_number: string;
  program: string;
  created_at: string;
  balance?: number;
  sold?: number;
  avatar?: string;
}

let API_URL = '';
if (process.env.EXPO_PUBLIC_API_URL) {
  API_URL = process.env.EXPO_PUBLIC_API_URL;
} else if (Platform.OS === 'android') {
  // Use 10.0.2.2 for Android emulator, LAN IP for physical device
  API_URL = Platform.isTV ? 'http://localhost:4000' : 'http://192.168.18.11:4000'; // Replace with your computer's LAN IP
} else if (Platform.OS === 'ios') {
  // Use your computer's LAN IP for iOS simulator/physical
  API_URL = 'http://192.168.18.11:4000'; // Replace with your computer's LAN IP
} else {
  API_URL = 'http://localhost:4000';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string;
  signIn: (identifier: string, password: string) => Promise<any>;
  signUp: (data: {
    full_name: string;
    email: string;
    username: string;
    phone_number: string;
    password: string;
    program: string;
  }) => Promise<any>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const signIn = async (identifier: string, password: string) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      setUser(data.user);
      setToken(data.token);
      setIsLoading(false);
      return data;
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
      throw err;
    }
  };

  const signUp = async (data: {
    full_name: string;
    email: string;
    username: string;
    phone_number: string;
    password: string;
    program: string;
  }) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Registration failed');
      setIsLoading(false);
      return result;
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
      throw err;
    }
  };

  const signOut = () => {
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, error, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 