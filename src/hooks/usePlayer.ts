import { useState, useEffect } from 'react';
import TrackPlayer, { AppKilledPlaybackBehavior,State, Capability, usePlaybackState,useProgress,Event } from 'react-native-track-player';
import { Track } from '../types';
import { getStreamingUrl } from '../api';

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

  const seekTo = async (newPosition: number) => { // <--- NEW METHOD
        await TrackPlayer.seekTo(newPosition);
    };
  
  // handle intruptions and app killed behavior

  useEffect(() => {
  const handleInterruption = async (event: any) => {
    console.log('[Audio Interruption]', event);

    if (event.type === Event.RemoteDuck) {
      if (event.paused) {
        console.log('Audio focus lost or call incoming — pausing playback');
        await TrackPlayer.pause();
      } else if (event.permanent) {
        console.log('Permanent audio focus loss');
        await TrackPlayer.stop();
      } else {
        console.log('Audio focus regained');
        await TrackPlayer.play();
      }
    }
  };

  const sub = TrackPlayer.addEventListener(Event.RemoteDuck, handleInterruption);

  return () => sub.remove();
}, []);

  // Player setup
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
              compactCapabilities: [Capability.Play, Capability.Pause],
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

  useEffect(() => {
  console.log(
    `[useTrackPlayer] progress: position=${progress.position.toFixed(2)}, duration=${progress.duration.toFixed(2)}`
  );
  if(progress.position && progress.duration && progress.duration <= progress.position){
    // Track ended
    console.log("Track ended, playing next...");
    playNextTrack();
  }
}, [progress.position, progress.duration]);


  // Internal helper
  const cleanupMalformedUrl = (malformedUrl: string, originalTrackUrl: string): string => {
    const authIndex = malformedUrl.indexOf('?Authorization=');
    if (authIndex === -1) return originalTrackUrl;
    const authPart = malformedUrl.substring(authIndex);
    const baseUrlMatch = originalTrackUrl.match(/https:\/\/f005\.backblazeb2\.com\/file\/LipurMusic\//);
    if (!baseUrlMatch) return originalTrackUrl;
    const basePath = baseUrlMatch[0];
    const fileName = originalTrackUrl.substring(basePath.length);
    return `${basePath}${encodeURIComponent(fileName)}${authPart}`;
  };

  // Play a specific track
  const playTrack = async (track: Track, playlist: Track[] = []) => {
  if (!isSetup) return;

  try {
    // Find index within playlist
    const trackIndex = playlist.findIndex(t => t.id === track.id);
    console.log("Setting index:", trackIndex);

    // Update local state (currentTrack, index, etc.)
    setPlayerState(prev => ({
      ...prev,
      currentTrack: track,
      isBuffering: true,
      playlist: playlist.length ? playlist : prev.playlist, // keep old if not passed
      currentIndex: trackIndex >= 0 ? trackIndex : prev.currentIndex,
    }));

    const signedUrl = await getStreamingUrl(track.url);
    const cleanedUrl = cleanupMalformedUrl(signedUrl, track.url);

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

  //  Play/Pause toggle
  const togglePlayback = async () => {
    console.log(playerState['currentIndex']);
    if (playerState.currentTrack) {
      if (playerState.isPlaying) await TrackPlayer.pause();
      else await TrackPlayer.play();
    }
  };

  //  Next track
  const playNextTrack = async () => {
    console.log(playerState['currentIndex']);
    const { playlist, currentIndex } = playerState;
    if (currentIndex < playlist.length - 1) {
      const nextTrack = playlist[currentIndex + 1];
      await playTrack(nextTrack, playlist);
    }
  };

  //  Previous track
  const playPreviousTrack = async () => {
    console.log(playerState['currentIndex']);
    const { playlist, currentIndex } = playerState;
    if (currentIndex > 0) {
      const prevTrack = playlist[currentIndex - 1];
      await playTrack(prevTrack, playlist);
    }
  };

  return {
    ...playerState,
    duration: progress.duration,     // Total track duration in seconds
    position: progress.position,     // Current playback position
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