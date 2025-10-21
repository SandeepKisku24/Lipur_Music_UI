// src/contexts/AuthContext.tsx (Placeholder)

import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
    userUID: string | null;
    idToken: string | null;
    isLoading: boolean;
    login: (token: string, uid: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [userUID, setUserUID] = useState<string | null>(null);
    const [idToken, setIdToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // This useEffect would normally check AsyncStorage for a saved token and validate it
    useEffect(() => {
        // TODO: Implement AsyncStorage check for saved token
        setTimeout(() => setIsLoading(false), 1000); 
    }, []);

    const login = (token: string, uid: string) => {
        setIdToken(token);
        setUserUID(uid);
        // TODO: Save token to AsyncStorage
    };

    const logout = () => {
        setIdToken(null);
        setUserUID(null);
        // TODO: Remove token from AsyncStorage
    };

    return (
        <AuthContext.Provider value={{ userUID, idToken, isLoading, login, logout }}>
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