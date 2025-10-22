// Lipur_ui/src/components/MiniPlayer.tsx

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { usePlayerContext } from '../contexts/PlayerContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import PlaybackSlider from './PlaybackSlider';
const Icon = Ionicons as unknown as React.ComponentClass<any, any>;


const SLIDER_HEIGHT = 40; // Approx height needed for slider container (20px slider + padding)
const BAR_HEIGHT = 60;   // Height of the controls/text bar
const TOTAL_PLAYER_HEIGHT = SLIDER_HEIGHT + BAR_HEIGHT; // 100px total

const MiniPlayer: React.FC = () => {
  const { currentTrack, isPlaying, isBuffering, togglePlayback, playNextTrack, playPreviousTrack } = usePlayerContext();
  
  if (!currentTrack) return null;

  return (
    <View style={styles.playerContainer}>
      {/* SLIDER CONTAINER - Fixed positioning */}
      <View style={styles.sliderContainer}>
        <PlaybackSlider />
      </View>
      
      {/* CONTROLS BAR */}
      <View style={styles.miniPlayerBar}>
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>{currentTrack.title}</Text>
          <Text style={styles.artist} numberOfLines={1}>{currentTrack.artist}</Text>
        </View>
        
        <View style={styles.controls}>
          <TouchableOpacity onPress={playPreviousTrack} style={styles.controlButton}>
            <Ionicons name="play-skip-back" size={30} color="white" />
          </TouchableOpacity>

          {isBuffering ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <TouchableOpacity onPress={togglePlayback} style={styles.playPauseButton}>
              <Ionicons name={isPlaying ? 'pause-circle' : 'play-circle'} size={40} color="white" />
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={playNextTrack} style={styles.controlButton}>
            <Ionicons name="play-skip-forward" size={30} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  playerContainer: { 
    position: 'absolute',
    bottom: 65,  // Above TabBar
    left: 0,
    right: 0,
    height: TOTAL_PLAYER_HEIGHT, // 100px
    zIndex: 100,
  },
  sliderContainer: {
    height: SLIDER_HEIGHT, // 40px
    backgroundColor: '#303030',
    // **CRITICAL FIX**: Allow touch events
    pointerEvents: 'box-none',
  },
  miniPlayerBar: {
    height: BAR_HEIGHT, // 60px
    backgroundColor: '#303030',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 10,
  },
  title: { color: 'white', fontSize: 14, fontWeight: 'bold' },
  artist: { color: '#B3B3B3', fontSize: 12 },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: { marginHorizontal: 8 },
  playPauseButton: { marginHorizontal: 10 },
});

export default MiniPlayer;