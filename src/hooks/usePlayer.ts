import { useState, useEffect, useRef } from 'react';
import TrackPlayer, { 
  AppKilledPlaybackBehavior,
  State, 
  Capability, 
  usePlaybackState,
  useProgress,
  Event 
} from 'react-native-track-player';
import { Track } from '../types';
import { getStreamingUrl } from '../api';
import axios from 'axios';
import auth from '@react-native-firebase/auth'; // Assuming you use RN Firebase for auth
import { getLocalTrackUri } from '../services/downloadService';
import ReactNativeBlobUtil from 'react-native-blob-util';

// --- CONFIGURATION ---
// const API_BASE_URL = 'https://lipur-backend.onrender.com';
// const API_BASE_URL_FIX  ='http://10.0.2.2:8080/analytics/listen';
// const API_BASE_URL ='http://10.0.2.2:8080';
const API_BASE_URL_FIX  ='https://lipur-backend.onrender.com/analytics/listen';
const API_BASE_URL ='https://lipur-backend.onrender.com';


// Helper to get the current user's token
const getAuthToken = async () => {
    const user = auth().currentUser;
    if (user) {
        return await user.getIdToken();
    }
    return null;
};

// 1. ANALYTICS HELPER: Sends listening duration
const sendAnalyticsData = async (songId: string, seconds: number) => {
    if (seconds < 5) return;
    
    try {
        // 1. Get the current User ID (if logged in)
        const currentUser = auth().currentUser;
        const userId = currentUser ? currentUser.uid : "anonymous";

        // 2. Send it in the BODY (No Header needed anymore)
        await axios.post(`${API_BASE_URL}/analytics/listen`, { 
            userId: userId, // <--- Sending ID here
            songId, 
            durationListened: seconds 
        });
        
        console.log(`[Analytics] Sent ${seconds.toFixed(1)}s for ${songId} (User: ${userId})`);
    } catch (e) {
        console.warn('[Analytics] Failed to send data', e);
    }
};

// Update metadata function similarly (headers not needed)
const fixMetadataDuration = async (songId: string, realDuration: number) => {
    try {
        await axios.patch(`${API_BASE_URL}/songs/${songId}/metadata`, { 
            duration: realDuration 
        });
        console.log(`[Metadata] Fixed duration for ${songId}`);
    } catch (e) {
        console.warn('[Metadata] Failed to fix duration', e);
    }
};

interface PlayerState {
  currentTrack?: Track;
  isPlaying: boolean;
  isBuffering: boolean;
  playbackState: State;
  currentIndex: number;
  playlist: Track[];
}

const initialPlayerState: PlayerState = {
  isPlaying: false,
  isBuffering: false,
  playbackState: State.None,
  currentIndex: -1,
  playlist: [],
};

const playerSetupOptions = { stopWithApp: true } as any;
let isSetup = false;

export const useTrackPlayer = () => {
  const playbackState = usePlaybackState();
  const [playerState, setPlayerState] = useState<PlayerState>(initialPlayerState);
  const progress = useProgress();

  // Refs for access inside event listeners
  const playerStateRef = useRef(playerState);
  // Ref to prevent spamming the metadata fix API
  const metadataFixedRef = useRef<string | null>(null);

  useEffect(() => {
    playerStateRef.current = playerState;
  }, [playerState]);

  const seekTo = async (newPosition: number) => { 
        await TrackPlayer.seekTo(newPosition);
  };
  
  const cleanupMalformedUrl = (malformedUrl: string, originalTrackUrl: string): string => {
    const authIndex = malformedUrl.indexOf('?Authorization=');
    if (authIndex === -1) return malformedUrl; // 🔹 FIX: Return the parsed signed url safely instead of forcing fallback
    const authPart = malformedUrl.substring(authIndex);
    const baseUrlMatch = originalTrackUrl.match(/https:\/\/f005\.backblazeb2\.com\/file\/LipurMusic\//);
    if (!baseUrlMatch) return originalTrackUrl;
    const basePath = baseUrlMatch[0];
    const fileName = originalTrackUrl.substring(basePath.length);
    return `${basePath}${encodeURIComponent(fileName)}${authPart}`;
  };

  // --- NEW: Watch for Zero Duration Songs ---
  useEffect(() => {
      const { currentTrack } = playerState;
      const { duration } = progress;

      // If DB says 0, but Player says > 0, we found the real duration.
      if (currentTrack && currentTrack.duration === 0 && duration > 0) {
          // Only attempt to fix this specific song ID once per session
          if (metadataFixedRef.current !== currentTrack.id) {
              metadataFixedRef.current = currentTrack.id;
              fixMetadataDuration(currentTrack.id, duration);
          }
      }
  }, [progress.duration, playerState.currentTrack]);

  // Play a specific track
  const playTrack = async (track: Track, playlist: Track[] = []) => {
    if (!isSetup) return;

    try {
      // --- NEW: Send Analytics for the PREVIOUS track before switching ---
      const oldTrack = playerStateRef.current.currentTrack;
      if (oldTrack) {
          const currentPos = await TrackPlayer.getPosition();
          // Fire and forget (don't await)
          sendAnalyticsData(oldTrack.id, currentPos);
      }

      // Reset the metadata lock for the new track
      metadataFixedRef.current = null;

      // Standard Play Logic
      const trackIndex = playlist.findIndex(t => t.id === track.id);
      console.log("Setting index:", trackIndex);

      setPlayerState(prev => ({
        ...prev,
        currentTrack: track,
        isBuffering: true,
        playlist: playlist.length ? playlist : prev.playlist, 
        currentIndex: trackIndex >= 0 ? trackIndex : prev.currentIndex,
      }));

      const localCachedUri = await getLocalTrackUri(track.id);
let finalPlayerUrl = '';

if (localCachedUri) {
  const filename = localCachedUri.split('/').pop();
  
  // 🔹 Bulletproof dynamic resolution for every device in the world:
  finalPlayerUrl = `file://${ReactNativeBlobUtil.fs.dirs.DocumentDir}/downloads/${filename}`;
  
  console.log(`🎯 Active Runtime Source Path Mounted: ${finalPlayerUrl}`);
} else {
  const signedUrl = await getStreamingUrl(track.url);
  finalPlayerUrl = cleanupMalformedUrl(signedUrl, track.url);
}
      
      const cleanedUrl = cleanupMalformedUrl(finalPlayerUrl, track.url);
      const trackForPlayer = { ...track, url: cleanedUrl };

      await TrackPlayer.reset();
      await TrackPlayer.add([trackForPlayer]);
      await TrackPlayer.play();
    } catch (error) {
      console.error('Failed to stream song:', error);
      setPlayerState(prev => ({
        ...prev,
        isBuffering: false,
        isPlaying: false,
        currentTrack: undefined,
      }));
    }
  };

  // Next track
  const playNextTrack = async () => {
    const { playlist, currentIndex } = playerStateRef.current;
    if (currentIndex < playlist.length - 1) {
      const nextTrack = playlist[currentIndex + 1];
      await playTrack(nextTrack, playlist);
    } else {
      console.log("End of playlist reached.");
    }
  };

  // Previous track
  const playPreviousTrack = async () => {
    const { playlist, currentIndex } = playerStateRef.current;
    if (currentIndex > 0) {
      const prevTrack = playlist[currentIndex - 1];
      await playTrack(prevTrack, playlist);
    }
  };

  // Toggle Playback
  const togglePlayback = async () => {
    if (playerState.currentTrack) {
      if (playerState.isPlaying) {
          // --- NEW: Send Analytics on Pause ---
          // Capture the session up to this point
          const currentPos = await TrackPlayer.getPosition();
          sendAnalyticsData(playerState.currentTrack.id, currentPos);
          
          await TrackPlayer.pause();
      } else {
          await TrackPlayer.play();
      }
    }
  };

  // Autoplay Logic
  useEffect(() => {
    const queueEndedSub = TrackPlayer.addEventListener(Event.PlaybackQueueEnded, async (event) => {
      console.log('[Event] Queue Ended - Triggering Autoplay');
      
      // Note: When queue ends, the track technically finished.
      // We could try to send analytics here, but often 'playNextTrack' handles the transition nicely.
      
      await playNextTrack();
    });

    return () => {
      queueEndedSub.remove();
    };
  }, []);

  // Handle interruptions
  useEffect(() => {
    const handleInterruption = async (event: any) => {
      if (event.type === Event.RemoteDuck) {
        if (event.paused) {
          await TrackPlayer.pause();
        } else if (event.permanent) {
          await TrackPlayer.stop();
        } else {
          await TrackPlayer.play();
        }
      }
    };
    const sub = TrackPlayer.addEventListener(Event.RemoteDuck, handleInterruption);
    return () => sub.remove();
  }, []);

  // Setup
  useEffect(() => {
    if (!isSetup) {
      const setup = async () => {
        try {
          await TrackPlayer.setupPlayer(playerSetupOptions);
          await TrackPlayer.updateOptions({
            stoppingAppPausesPlayback: true,
            android: {
              appKilledPlaybackBehavior: AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
            },
            capabilities: [
                Capability.Play,
                Capability.Pause,
                Capability.SkipToNext,
                Capability.SkipToPrevious,
                Capability.SeekTo,],
              compactCapabilities: [Capability.Play, Capability.Pause, Capability.SkipToNext],
            });
          isSetup = true;
        } catch (error) {
          console.error('TrackPlayer setup failed:', error);
        }
      };
      setup();
    }
  }, []);

  // Sync playback state
  useEffect(() => {
    if (playbackState.state !== undefined) {
      setPlayerState(prev => ({
        ...prev,
        isPlaying: playbackState.state === State.Playing,
        isBuffering: playbackState.state === State.Buffering,
        playbackState: playbackState.state,
      }));
    }
  }, [playbackState]);

  return {
    ...playerState,
    duration: progress.duration,
    position: progress.position,
    buffered: progress.buffered,
    playTrack,
    togglePlayback,
    playNextTrack,
    seekTo,
    playPreviousTrack,
    isSetup,
  };
};

export type UseTrackPlayerReturn = {
  currentTrack?: Track;
  isPlaying: boolean;
  isBuffering: boolean;
  playbackState: State;
  currentIndex: number;
  playlist: Track[];
  playTrack: (track: Track, playlist?: Track[]) => Promise<void>;
  togglePlayback: () => Promise<void>;
  playNextTrack: () => Promise<void>;
  playPreviousTrack: () => Promise<void>;
  isSetup: boolean;
  duration: number;
  position: number;
  buffered: number;
  seekTo: (newPosition: number) => Promise<void>;
};