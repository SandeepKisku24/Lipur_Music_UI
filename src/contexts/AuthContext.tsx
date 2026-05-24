// Lipur_ui/src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode, JwtPayload } from 'jwt-decode';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { decode as atob, encode as btoa } from 'base-64';
import axios from 'axios';

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
  userType: string; // 🔹 Added explicit account role type
  isLoading: boolean;
  login: (token: string, uid: string) => Promise<void>;
  logout: () => Promise<void>;
}

interface UserClaims extends JwtPayload {
  email?: string;
  name?: string;
  sub?: string;
  role?: string; // 🔹 Support custom properties extracted straight from JWT claims
}

const USER_ROLE_CACHE_KEY = '@lipur_cached_role';
// const BACKEND_PROFILE_URL = 'http://10.0.2.2:8080/me/profile';
const BACKEND_PROFILE_URL = 'https://lipur-backend.onrender.com/me/profile';

// ---------- Context ----------
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ---------- Provider ----------
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userUID, setUserUID] = useState<string | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userType, setUserType] = useState<string>('Listener'); // 🔹 Default fallback role configuration
  const [isLoading, setIsLoading] = useState(true);

  // Helper routine to fetch and cache user metadata safely across connection breaks
  const fetchAndCacheUserRole = async (token: string, fallbackRole: string = 'Listener') => {
    try {
      // 1. Instantly check if we have a locally pinned role to avoid screen flickering
      const cachedRole = await AsyncStorage.getItem(USER_ROLE_CACHE_KEY);
      if (cachedRole) {
        setUserType(cachedRole);
      } else {
        setUserType(fallbackRole);
      }

      // 2. Fire background network sync handshake to get latest authoritative database rules
      const response = await axios.get(BACKEND_PROFILE_URL, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 4000 // Close transaction bounds early if connection drops
      });

      if (response.data && response.data.role) {
        const structuralRole = response.data.role;
        setUserType(structuralRole);
        await AsyncStorage.setItem(USER_ROLE_CACHE_KEY, structuralRole);
        console.log(`[Cache System] Synchronized current user role metadata profile: ${structuralRole}`);
      }
    } catch (err) {
      // 📢 SERVER OFFLINE RETENTION PASS
      console.log("[Cache System] Go backend unreachable or timeout triggered. Retaining native state constants safely.");
    }
  };

  // On mount → check for saved token
  useEffect(() => {
    const checkStoredToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('idToken');
        if (storedToken) {
          console.log("Found stored token verification parameters.");
          const decoded = jwtDecode<UserClaims>(storedToken);
          
          if (decoded.exp && decoded.exp * 1000 > Date.now()) {
            setIdToken(storedToken);
            setUserUID(decoded.sub ?? null);
            setUserName(decoded.name ?? 'User');
            setUserEmail(decoded.email ?? 'Unknown');

            // 🔹 Progressive Background Role Sync Logic Pass
            const claimsRoleFallback = decoded.role ?? 'Listener';
            await fetchAndCacheUserRole(storedToken, claimsRoleFallback);
          } else {
            await cleanLocalSession();
          }
        }
      } catch (error) {
        console.error('Error restoring session parameters:', error);
        await cleanLocalSession();
      } finally {
        setIsLoading(false);
      }
    };

    checkStoredToken();
  }, []);

  const cleanLocalSession = async () => {
    await AsyncStorage.removeItem('idToken');
    await AsyncStorage.removeItem(USER_ROLE_CACHE_KEY);
  };

  // ---------- Login ----------
  const login = async (token: string, uid: string) => {
    try {
      const decoded = jwtDecode<UserClaims>(token);
      setIdToken(token);
      setUserUID(uid);
      setUserName(decoded.name ?? uid);
      setUserEmail(decoded.email ?? 'user@gmail.com');
      
      await AsyncStorage.setItem('idToken', token);
      console.log('User logged in and token coordinates stored.');

      // 🔹 Cache user properties on explicit sign-in entry actions
      const claimsRoleFallback = decoded.role ?? 'Listener';
      await fetchAndCacheUserRole(token, claimsRoleFallback);
    } catch (error) {
      console.error('Failed to parse validation JWT token sequence:', error);
    }
  };

  // ---------- Logout ----------
  const logout = async () => {
    setIdToken(null);
    setUserUID(null);
    setUserName(null);
    setUserEmail(null);
    setUserType('Listener'); // Reset state footprint
    
    await cleanLocalSession();
    console.log('User logged out completely.');
  };

  return (
    <AuthContext.Provider
      value={{ userUID, idToken, userName, userEmail, userType, isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ---------- Hook ----------
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider root target context configuration layout');
  return context;
};