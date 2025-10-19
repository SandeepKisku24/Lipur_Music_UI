// Lipur_ui/src/contexts/PlayerContext.tsx (Updated)

import React, { createContext, useContext, ReactNode } from 'react';
import { useTrackPlayer } from '../hooks/usePlayer'; 
// FIX: Use 'import type' for type definitions
import type { UseTrackPlayerReturn } from '../hooks/usePlayer'; 

// Define the return type 
interface PlayerContextType extends UseTrackPlayerReturn {
    isSetup: boolean; 
}

// Create the Context object
const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

// Define the Provider component
export const PlayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Use the hook once here!
  const playerState = useTrackPlayer(); 

  return (
    <PlayerContext.Provider value={playerState as PlayerContextType}>
      {children}
    </PlayerContext.Provider>
  );
};

// Custom hook to use the context
export const usePlayerContext = () => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayerContext must be used within a PlayerProvider');
  }
  return context;
};