// Lipur_ui/src/services/playbackService.js

import TrackPlayer, { Event } from 'react-native-track-player';

// This function handles events triggered by the system (notifications, car controls, etc.)
export async function playbackService() {
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteSkipToNext, () => TrackPlayer.skipToNext());
  TrackPlayer.addEventListener(Event.RemoteSkipToPrevious, () => TrackPlayer.skipToPrevious());
  TrackPlayer.addEventListener(Event.RemoteSeek, ({ position }) => TrackPlayer.seekTo(position));
  
  // Optional: Add logic for RemoteStop if you want the notification to destroy the player
  // TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.destroy());
}