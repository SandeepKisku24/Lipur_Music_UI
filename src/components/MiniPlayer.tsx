import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Pressable, Dimensions } from 'react-native';
import { usePlayerContext } from '../contexts/PlayerContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { BlurView } from '@react-native-community/blur';
import CustomSlider from './CustomSlider';

const BAR_HEIGHT = 60;   
const PROGRESS_HEIGHT = 60; // Very thin, sleek progress bar
const TOTAL_PLAYER_HEIGHT = BAR_HEIGHT + PROGRESS_HEIGHT; 

interface MiniPlayerProps {
  onPress?: () => void;
}

const MiniPlayer: React.FC<MiniPlayerProps> = ({ onPress }) => {
  const { currentTrack, isPlaying, isBuffering, togglePlayback, playNextTrack, playPreviousTrack, position, duration } = usePlayerContext();
  
  if (!currentTrack) return null;

  // Calculate progress percentage for the simple bar
  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <View style={styles.playerContainer}>
      <BlurView
        style={styles.blurBackground}
        blurType="dark"
        blurAmount={15} 
      />

      <Pressable onPress={onPress} style={{ flex: 1 }}>
        
        {/* 1. NEW: Simple Progress Bar (Replaces CustomSlider) */}

        
        <View style={styles.progressBarContainer}>
          <CustomSlider/>        
        </View>
        
        <View style={styles.miniPlayerBar}>
          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={1}>{currentTrack.title}</Text>
            <Text style={styles.artist} numberOfLines={1}>{currentTrack.artist}</Text>
          </View>
          
          <View style={styles.controls}>
            <TouchableOpacity onPress={playPreviousTrack} style={styles.controlButton}>
              <Ionicons name="play-skip-back" size={28} color="white" />
            </TouchableOpacity>

            {isBuffering ? (
              <ActivityIndicator size="small" color="#FFF" style={{ marginHorizontal: 10 }} />
            ) : (
              <TouchableOpacity onPress={togglePlayback} style={styles.playPauseButton}>
                <Ionicons name={isPlaying ? 'pause' : 'play'} size={32} color="white" />
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={playNextTrack} style={styles.controlButton}>
              <Ionicons name="play-skip-forward" size={28} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  playerContainer: { 
    position: 'absolute',
    bottom: 65, // Above TabBar
    left: 8,     // Margin from left
    right: 8,    // Margin from right
    height: TOTAL_PLAYER_HEIGHT,
    zIndex: 1000,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(30,30,30,0.6)', // Fallback if blur fails
  },
  blurBackground: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
  },
  // 2. NEW STYLES for the simple progress bar
  progressBarContainer: {
    width: '80%',
    marginHorizontal: '10%',
    justifyContent: 'center',
   // Faint track
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#1DB954', // Spotify Green
  },
  miniPlayerBar: {
    height: BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 10,
  },
  title: { color: 'white', fontSize: 14, fontWeight: '600' },
  artist: { color: '#B3B3B3', fontSize: 12 },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: { marginHorizontal: 5 },
  playPauseButton: { marginHorizontal: 8 },
});

export default MiniPlayer;