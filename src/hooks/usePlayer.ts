// Lipur_ui/src/hooks/usePlayer.ts (Final Corrected Code)

import { useState, useEffect } from 'react';
import TrackPlayer, { State, Capability, usePlaybackState } from 'react-native-track-player';
import { Track } from '../types';
import { getStreamingUrl } from '../api';

interface PlayerState {
  currentTrack?: Track;
  isPlaying: boolean;
  isBuffering: boolean;
  playbackState: State;
}

const initialPlayerState: PlayerState = {
  isPlaying: false,
  isBuffering: false,
  playbackState: State.None, 
};

// Define the setup options object inline. 
// We use a type assertion 'as any' to bypass the missing 'stopWithApp' property in the official types, 
// ensuring the native code still receives the correct configuration.
const playerSetupOptions = {
  // This property enables background playback even when the app is swiped away
  stopWithApp: true, 
} as any; 

let isSetup = false;

export const useTrackPlayer = () => {
  const playbackState = usePlaybackState();
  const [playerState, setPlayerState] = useState<PlayerState>(initialPlayerState);
  // const [isPlayerInitialized, setIsPlayerInitialized] = useState(false);

  // 1. Setup the player
  useEffect(() => {
    if (!isSetup) {
      const setup = async () => {
        try {
          // Pass the playerSetupOptions object
          await TrackPlayer.setupPlayer(playerSetupOptions); 
          
          await TrackPlayer.updateOptions({
            // Define capabilities for lock screen/notification controls
            capabilities: [
              Capability.Play,
              Capability.Pause,
              Capability.SkipToNext,
              Capability.SkipToPrevious,
            ],
            compactCapabilities: [Capability.Play, Capability.Pause],
          });
          isSetup = true;
        } catch (error) {
          console.error("TrackPlayer setup failed:", error);
        }
      };
      setup();
    }
  }, []);

  // 2. Update player state based on TrackPlayer events
  useEffect(() => {
    // Check if playbackState.state is defined before using it
    if (playbackState.state !== undefined) {
      const isPlaying = playbackState.state === State.Playing;
      const isBuffering = playbackState.state === State.Buffering;

      // Explicitly type the returned function to satisfy TypeScript
      setPlayerState((prev): PlayerState => ({ 
        ...prev,
        isPlaying,
        isBuffering,
        playbackState: playbackState.state, 
      }));
    }
  }, [playbackState]);

  // Public methods




const playTrack = async (track: Track) => {
    if (!isSetup) return;
    
    const cleanupMalformedUrl = (malformedUrl: string, originalTrackUrl: string): string => {
        // 1. Find the start of the Authorization token
        const authIndex = malformedUrl.indexOf('?Authorization=');
        if (authIndex === -1) return originalTrackUrl; // Should not happen

        // 2. Extract ONLY the Authorization part
        const authPart = malformedUrl.substring(authIndex);
        
        // 3. Extract the clean base path and filename from the ORIGINAL track URL.
        // This is safe because the original track.url is what the backend expects to sign.
        const baseUrlMatch = originalTrackUrl.match(/https:\/\/f005\.backblazeb2\.com\/file\/LipurMusic\//);
        if (!baseUrlMatch) return originalTrackUrl;
        
        const basePath = baseUrlMatch[0];
        const fileName = originalTrackUrl.substring(basePath.length); // e.g., "let her go.mp3"

        // 4. Reconstruct the correct final URL: BasePath + ENCODED Filename + AuthToken
        // We use encodeURIComponent only on the filename to fix the spaces.
        return `${basePath}${encodeURIComponent(fileName)}${authPart}`;
    };

    try {
        // 1. Show the track is loading (visually confirm the click worked)
        setPlayerState(prev => ({ ...prev, currentTrack: track, isBuffering: true }));
        
        // 2. Fetch the dynamic signed URL using the RESTRICTED track.url
        // (track.url is mapped from song.fileUrl in api.ts)
        const signedStreamingUrl = await getStreamingUrl(track.url); 
        const cleanedUrl = cleanupMalformedUrl(signedStreamingUrl, track.url);
        console.log('Obtained signed streaming URL:', signedStreamingUrl);
        // 3. Prepare the track for TrackPlayer with the SIGNED URL
        const trackForPlayer = {
            ...track,
            // TrackPlayer requires 'url', so we overwrite the restricted URL
            url: cleanedUrl, 
        };

        // 4. Load and play the track
        await TrackPlayer.reset();
        await TrackPlayer.add([trackForPlayer]);
        await TrackPlayer.play();
        
        // 5. Update state (currentTrack remains the same, state updates via useEffect)
        setPlayerState(prev => ({ ...prev, currentTrack: track })); 
        
    } catch (error) {
        console.error('Failed to stream song:', error);
        // Reset player state to indicate failure
        setPlayerState(prev => ({ ...prev, isBuffering: false, isPlaying: false, currentTrack: undefined }));
    }
};

  const togglePlayback = async () => {
    if (playerState.currentTrack) {
      if (playerState.isPlaying) {
        await TrackPlayer.pause();
      } else {
        await TrackPlayer.play();
      }
    }
  };

  return {
    ...playerState,
    playTrack,
    togglePlayback,
    isSetup,
  };
};

export type UseTrackPlayerReturn = {
  currentTrack?: Track;
  isPlaying: boolean;
  isBuffering: boolean;
  playbackState: State;
  playTrack: (track: Track) => Promise<void>;
  togglePlayback: () => Promise<void>;
  isSetup: boolean;
};