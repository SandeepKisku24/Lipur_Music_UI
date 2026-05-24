// Lipur_ui/src/screens/NowPlayingScreen.tsx
import React, { useState, useEffect } from 'react';
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
import { downloadSongAsset } from '../services/downloadService';
import auth from '@react-native-firebase/auth';
import axios from 'axios';

const { width } = Dimensions.get('window');
const CONTENT_WIDTH = width - 60; 

// Explicit fallback mapping to prevent undefined module variable exports from api.ts
// const BACKEND_HOST = 'http://10.0.2.2:8080';
const BACKEND_HOST = 'https://lipur-backend.onrender.com';

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

  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (currentTrack) {
      setIsLiked(currentTrack.likes > 0);
    }
  }, [currentTrack]);

  if (!currentTrack) {
    return null;
  }

  const toggleLike = async (songId: string) => {
    try {
      const user = auth().currentUser;
      if (!user) return;
      
      // FIX WARNINGS: Call getIdToken() explicitly as a function per Firebase modular architecture updates
      const token = await user.getIdToken(true);
      
      const nextLikedState = !isLiked;
      setIsLiked(nextLikedState);

      // Explicitly passing full route to bypass non-exported string variables safely
      await axios.post(`${BACKEND_HOST}/songs/like`, 
        {
          songId,
          action: nextLikedState ? 'like' : 'unlike'
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log(`[Interaction Matrix] Successfully synchronized like parameters for: ${songId}`);
    } catch (err) {
      console.warn("Failed syncing player state change parameters with server context:", err);
      setIsLiked(prev => !prev);
    }
  };

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

        {/* Track Info Row Section */}
        <View style={styles.trackInfoContainer}>
          <View style={styles.titleActionRow}>
            <View style={{ flex: 1, alignItems: 'flex-start' }}>
              <Text style={styles.title} numberOfLines={1}>{currentTrack.title}</Text>
              <Text style={styles.artist} numberOfLines={1}>{currentTrack.artist}</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.playerActionBtn} 
              onPress={() => toggleLike(currentTrack.id)}
            >
              <Ionicons 
                name={isLiked ? "heart" : "heart-outline"} 
                size={28} 
                color={isLiked ? "#1ed760" : "white"} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.playerActionBtn} 
              onPress={() => downloadSongAsset(currentTrack.id)}
            >
              <Ionicons name="cloud-download-outline" size={28} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Slider */}
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
  titleActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  playerActionBtn: {
    padding: 10,
    marginLeft: 10,
  },
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
    width: CONTENT_WIDTH, 
    height: CONTENT_WIDTH, 
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
    marginTop: 40,
    paddingHorizontal: 30,
  },
  title: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'left',
    marginBottom: 4,
  },
  artist: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'left',
  },
  sliderContainer: {
    width: CONTENT_WIDTH, 
    marginTop: 30,
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