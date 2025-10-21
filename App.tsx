// Lipur_ui/App.tsx (Updated Root)

import React from 'react';
import { PlayerProvider } from './src/contexts/PlayerContext.tsx';
import { AuthProvider, useAuth } from './src/contexts/AuthContext.tsx'; // NEW
import MainRouter from './src/screens/MainRouter.tsx';
import LoginScreen from './src/screens/LoginScreen.tsx'; 
import { ActivityIndicator, View } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Top-level component to decide which router to render
const RootNavigation = () => {
    const { userUID, isLoading } = useAuth();

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#121212' }}>
                <ActivityIndicator size="large" color="#1DB954" />
            </View>
        );
    }
    
    // RENDER LOGIC: If UID exists, show Main Tabs. Otherwise, show Login.
    return userUID ? <MainRouter /> : <LoginScreen />; 
};

const App = () => {
  return (
    <SafeAreaProvider>
    <PaperProvider>
    <AuthProvider>
      <PlayerProvider> 
        <RootNavigation />
      </PlayerProvider>
    </AuthProvider>
    </PaperProvider>
    </SafeAreaProvider>
  );
};

export default App;