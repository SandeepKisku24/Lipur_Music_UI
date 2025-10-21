import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode, JwtPayload } from 'jwt-decode';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { decode as atob, encode as btoa } from 'base-64';

// Polyfill for React Native (some environments lack atob/btoa)
if (typeof global.atob === 'undefined') {
  global.atob = atob;
}
if (typeof global.btoa === 'undefined') {
  global.btoa = btoa;
}

// ---------- Types ----------
interface AuthContextType {
  userUID: string | null;
  idToken: string | null;
  userName: string | null;
  userEmail: string | null;
  isLoading: boolean;
  login: (token: string, uid: string) => Promise<void>;
  logout: () => Promise<void>;
}

interface UserClaims extends JwtPayload {
  email?: string;
  name?: string;
  sub?: string;
}

// ---------- Context ----------
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ---------- Provider ----------
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userUID, setUserUID] = useState<string | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount → check for saved token
  useEffect(() => {
    const checkStoredToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('idToken');
        if (storedToken) {
            console.log("Found stored token:");
          const decoded = jwtDecode<UserClaims>(storedToken);
          if (decoded.exp && decoded.exp * 1000 > Date.now()) {
            setIdToken(storedToken);
            setUserUID(decoded.sub ?? null);
            setUserName(decoded.name ?? 'User');
            setUserEmail(decoded.email ?? 'Unknown');
          } else {
            await AsyncStorage.removeItem('idToken');
          }
        }
      } catch (error) {
        console.error('Error restoring session:', error);
        await AsyncStorage.removeItem('idToken');
      } finally {
        setIsLoading(false);
      }
    };

    checkStoredToken();
  }, []);

  // ---------- Login ----------
  const login = async (token: string, uid: string) => {
    try {
      const decoded = jwtDecode<UserClaims>(token);
      setIdToken(token);
      setUserUID(uid);
      setUserName(decoded.name ?? uid);
      setUserEmail(decoded.email ?? 'user@gmail.com');
      await AsyncStorage.setItem('idToken', token);
      console.log('User logged in and token stored.');
    } catch (error) {
      console.error('Failed to decode JWT:', error);
    }
  };

  // ---------- Logout ----------
  const logout = async () => {
    setIdToken(null);
    setUserUID(null);
    setUserName(null);
    setUserEmail(null);
    await AsyncStorage.removeItem('idToken');
    console.log('User logged out.');
  };

  return (
    <AuthContext.Provider
      value={{ userUID, idToken, userName, userEmail, isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ---------- Hook ----------
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
