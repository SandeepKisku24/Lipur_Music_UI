// Lipur_ui/src/contexts/PlayerContext.tsx

import React, { createContext, useContext, ReactNode, useState } from 'react';
import { useTrackPlayer } from '../hooks/usePlayer';
import type { UseTrackPlayerReturn } from '../hooks/usePlayer';
import { Track } from '../types';

interface PlayerContextType extends UseTrackPlayerReturn {
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const playerState = useTrackPlayer();

  return (
    <PlayerContext.Provider
      value={{
        ...playerState,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayerContext = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayerContext must be used within a PlayerProvider');
  }
  return context;
};
