// Lipur_ui/src/components/MiniPlayer.tsx

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { usePlayerContext } from '../contexts/PlayerContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
const Icon = Ionicons as unknown as React.ComponentClass<any, any>;



const MiniPlayer: React.FC = () => {
  const { currentTrack, isPlaying, isBuffering, togglePlayback } = usePlayerContext();
  console.log(`[MiniPlayer] currentTrack: ${currentTrack ? currentTrack.title : 'None'}`);
  if (!currentTrack) {
    // Render nothing if no track is loaded (default empty state)
    return null; 
  }

  const playPauseIcon = isPlaying ? 'pause-circle' : 'play-circle';

  return (
    <View style={styles.miniPlayerBar}>
      <View style={styles.textContainer}>
        <Text style={styles.title} numberOfLines={1}>{currentTrack.title}</Text>
        <Text style={styles.artist} numberOfLines={1}>{currentTrack.artist}</Text>
      </View>
      <View style={styles.controls}>
        {isBuffering ? (
          <ActivityIndicator size="small" color="#FFF" style={{ marginRight: 10 }} />
        ) : (
          <TouchableOpacity onPress={togglePlayback}>
            <Ionicons name={playPauseIcon} size={40} color="white" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  miniPlayerBar: {
    position: 'absolute',
    bottom: 65, // Above the TabBar
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#303030', // Darker gray for a Spotify-like bar
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 10,
  },
  title: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  artist: {
    color: '#B3B3B3',
    fontSize: 12,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default MiniPlayer;