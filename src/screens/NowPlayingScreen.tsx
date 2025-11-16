import React from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    Image, 
    TouchableOpacity, 
    Dimensions, 
    SafeAreaView 
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { usePlayerContext } from '../contexts/PlayerContext';
import CustomSlider from '../components/CustomSlider'; // We'll reuse your slider

// Get device dimensions for styling
const { width, height } = Dimensions.get('window');

// This is just a placeholder prop for now. 
// It will be used to close the screen (trigger the "swipe down" animation)
type NowPlayingScreenProps = {
  onClose: () => void;
};

const NowPlayingScreen: React.FC<NowPlayingScreenProps> = ({ onClose }) => {
  // Get all the data and controls directly from the context
  const { 
    currentTrack, 
    isPlaying, 
    isBuffering, 
    togglePlayback, 
    playNextTrack, 
    playPreviousTrack 
  } = usePlayerContext();

  // If there's no track, we shouldn't be on this screen.
  if (!currentTrack) {
    // In a real scenario, this screen would be hidden,
    // but this is a good safeguard.
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 1. Header (with Close Button) */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="chevron-down" size={30} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Playing From: {currentTrack.artist} 
        </Text>
        <TouchableOpacity style={styles.closeButton} /* Extra space */>
           <Ionicons name="ellipsis-vertical" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* 2. Album Art (Large) */}
      <View style={styles.artworkContainer}>
        <Image 
          source={{ uri: encodeURI(currentTrack.artwork) }}
          style={styles.artwork}
        />
      </View>

      {/* 3. Track Info */}
      <View style={styles.trackInfoContainer}>
        <Text style={styles.title} numberOfLines={2}>{currentTrack.title}</Text>
        <Text style={styles.artist} numberOfLines={1}>{currentTrack.artist}</Text>
      </View>

      {/* 4. Slider */}
      <View style={styles.sliderContainer}>
        <CustomSlider />
      </View>

      {/* 5. Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity onPress={playPreviousTrack} style={styles.controlButton}>
          <Ionicons name="play-skip-back" size={40} color="white" />
        </TouchableOpacity>

        <TouchableOpacity onPress={togglePlayback} style={styles.playPauseButton}>
          <Ionicons 
            name={isPlaying ? 'pause-circle' : 'play-circle'} 
            size={70} // Larger main button
            color="white" 
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={playNextTrack} style={styles.controlButton}>
          <Ionicons name="play-skip-forward" size={40} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', // Same as home
    alignItems: 'center',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  closeButton: {
    padding: 5, // Make tap target bigger
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  artworkContainer: {
    width: width - 40, // Square artwork, 20px padding on each side
    height: width - 40,
    marginTop: 30, // Space from header
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  artwork: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  trackInfoContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 40,
    paddingHorizontal: 40,
  },
  title: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  artist: {
    color: '#B3B3B3',
    fontSize: 18,
    marginTop: 5,
  },
  sliderContainer: {
    width: '100%',
    marginTop: 30,
    // We reuse CustomSlider, which has its own padding/height
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around', // Distribute controls
    width: '80%', // Not full width
    marginTop: 30,
  },
  controlButton: {},
  playPauseButton: {},
});

export default NowPlayingScreen;