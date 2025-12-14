import React from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    Image, 
    TouchableOpacity, 
    Dimensions, 
    SafeAreaView,
    ImageBackground, 
    Platform
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { usePlayerContext } from '../contexts/PlayerContext';
import CustomSlider from '../components/CustomSlider';
import { BlurView } from '@react-native-community/blur';

const { width } = Dimensions.get('window');
// This creates a 30px margin on left and right
const CONTENT_WIDTH = width - 60; 

type NowPlayingScreenProps = {
  onClose: () => void;
};

const NowPlayingScreen: React.FC<NowPlayingScreenProps> = ({ onClose }) => {
  const { 
    currentTrack, 
    isPlaying, 
    togglePlayback, 
    playNextTrack, 
    playPreviousTrack 
  } = usePlayerContext();

  if (!currentTrack) {
    return null;
  }

  return (
    <ImageBackground 
        source={{ uri: encodeURI(currentTrack.artwork) }}
        style={styles.container}
        blurRadius={Platform.OS === 'android' ? 10 : 0} 
    >
      <BlurView
        style={styles.absoluteFill}
        blurType="dark" 
        blurAmount={30} 
        reducedTransparencyFallbackColor="black"
      />

      <SafeAreaView style={styles.contentContainer}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="chevron-down" size={30} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Playing From: {currentTrack.artist} 
          </Text>
          <TouchableOpacity style={styles.closeButton}>
             <Ionicons name="ellipsis-vertical" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Album Art */}
        <View style={styles.artworkContainer}>
          <Image 
            source={{ uri: encodeURI(currentTrack.artwork) }}
            style={styles.artwork}
          />
        </View>

        {/* Track Info */}
        <View style={styles.trackInfoContainer}>
          <Text style={styles.title} numberOfLines={2}>{currentTrack.title}</Text>
          <Text style={styles.artist} numberOfLines={1}>{currentTrack.artist}</Text>
        </View>

        {/* Slider - STRICT WIDTH APPLIED HERE */}
        <View style={styles.sliderContainer}>
          <CustomSlider />
        </View>

        {/* Controls */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity onPress={playPreviousTrack}>
            <Ionicons name="play-skip-back" size={40} color="white" />
          </TouchableOpacity>

          <TouchableOpacity onPress={togglePlayback}>
            <Ionicons 
              name={isPlaying ? 'pause-circle' : 'play-circle'} 
              size={80} 
              color="white" 
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={playNextTrack}>
            <Ionicons name="play-skip-forward" size={40} color="white" />
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  absoluteFill: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    zIndex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)', 
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
    padding: 5,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    opacity: 0.7,
  },
  artworkContainer: {
    width: CONTENT_WIDTH, // Strictly calculated
    height: CONTENT_WIDTH, // Square
    marginTop: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 20,
  },
  artwork: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  trackInfoContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 50,
    paddingHorizontal: 40,
  },
  title: {
    color: 'white',
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  artist: {
    color: '#rgba(255,255,255,0.7)',
    fontSize: 18,
    fontWeight: '500',
  },
  sliderContainer: {
    width: CONTENT_WIDTH, // EXACTLY THE SAME AS ARTWORK
    marginTop: 40,
    // No padding needed here, the CustomSlider handles its own internal layout
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '70%',
    marginTop: 20,
  },
});

export default NowPlayingScreen;