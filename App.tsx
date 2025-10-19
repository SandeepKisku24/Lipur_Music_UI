
import React from 'react';
import HomeScreen from './src/screens/Homescreen.tsx';
import { StatusBar } from 'react-native';
import { PlayerProvider } from './src/contexts/PlayerContext.tsx';
const App = () => {
  return (
  
      <PlayerProvider> 
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <HomeScreen />
    </PlayerProvider>
    
  );
};

export default App;