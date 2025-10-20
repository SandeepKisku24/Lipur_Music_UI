
import React from 'react';
import HomeScreen from './src/screens/Homescreen.tsx';
import { StatusBar } from 'react-native';
import { PlayerProvider } from './src/contexts/PlayerContext.tsx';
import MainRouter from './src/screens/MainRouter.tsx';
const App = () => {
  return (
  
      <PlayerProvider> 
      <MainRouter />
      {/* <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <HomeScreen /> */}
    </PlayerProvider>
    
  );
};

export default App;