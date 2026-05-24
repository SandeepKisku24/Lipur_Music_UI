// Lipur_ui/src/components/MiniPlayer.tsx
import React, { useEffect, useRef } from 'react';
import { 
    View, Text, StyleSheet, TouchableOpacity, 
    ActivityIndicator, Pressable, Animated, Image 
} from 'react-native'; 
import { usePlayerContext } from '../contexts/PlayerContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { BlurView } from '@react-native-community/blur';
import CustomSlider from './CustomSlider';
import { Gesture, GestureDetector } from 'react-native-gesture-handler'; // 🔹 Injected local handler bindings
import { runOnJS } from 'react-native-reanimated';

interface MiniPlayerProps {
  onPress?: () => void;
}

const MiniPlayer: React.FC<MiniPlayerProps> = ({ onPress }) => {
  const { currentTrack, isPlaying, isBuffering, togglePlayback, playNextTrack } = usePlayerContext();
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  // 🔹 FIXED GESTURE COUPLING: Capture the swipe configuration safely inside the component context boundaries
  const localizedPanGesture = Gesture.Pan()
    .onUpdate((event) => {
        if (event.translationY < -10 && onPress) { 
            runOnJS(onPress)();
        }
    })
    .activeOffsetY([-10, 100]);

  useEffect(() => {
    if (isPlaying) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.7, duration: 2200, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0.4, duration: 2200, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(0.4);
    }
  }, [isPlaying]);

  if (!currentTrack) return null;

  return (
    <View style={styles.playerContainer}>
      <BlurView style={styles.blurBackground} blurType="dark" blurAmount={20} />
      
      {isPlaying && (
        <Animated.View style={[styles.ambientGlowPulse, { opacity: pulseAnim }]} />
      )}

      {/* 🔹 Slider sits safely on top as a direct child, unblocked from touch events */}
      <View style={styles.embeddedSliderWrapper}>
        <CustomSlider isMiniPlayerVariant={true} />
      </View>

      <View style={styles.contentCoreAlignmentRow}>
        <TouchableOpacity style={styles.artworkBoundaryContainer} onPress={onPress} activeOpacity={0.9}>
          <Image 
            source={{ uri: encodeURI(currentTrack.artwork || 'https://cdn-icons-png.flaticon.com/512/847/847969.png') }} 
            style={styles.artworkImageElement}
          />
        </TouchableOpacity>

        {/* 🔹 FIXED INTERACTION LINK: The center metadata text box exclusively handles swiping and expanding */}
        <GestureDetector gesture={localizedPanGesture}>
          <Pressable onPress={onPress} style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={1}>{currentTrack.title}</Text>
            <Text style={styles.artist} numberOfLines={1}>{currentTrack.artist}</Text>
          </Pressable>
        </GestureDetector>
        
        <View style={styles.controls}>
          {isBuffering ? (
            <View style={styles.loaderBufferShell}>
              <ActivityIndicator size="small" color="#1ed760" />
            </View>
          ) : (
            <TouchableOpacity onPress={togglePlayback} style={styles.playPauseButton} activeOpacity={0.7}>
              <View style={styles.vibrantPlayCircle}>
                <Ionicons name={isPlaying ? 'pause' : 'play'} size={18} color="black" style={!isPlaying && { left: 1 }} />
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={playNextTrack} style={styles.controlButton} activeOpacity={0.7}>
            <Ionicons name="play-skip-forward" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  playerContainer: { 
    position: 'absolute',
    bottom: 50, 
    left: 12,    
    right: 12,   
    height: 60, 
    zIndex: 1000,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(15, 15, 15, 0.75)', 
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  blurBackground: { ...StyleSheet.absoluteFillObject, zIndex: -2 },
  ambientGlowPulse: {
    position: 'absolute',
    bottom: -50,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(30, 215, 96, 0.2)', 
    zIndex: -1,
  },
  contentCoreAlignmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: '100%',
  },
  embeddedSliderWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2, 
    zIndex: 1010, // Ensure slider sits confidently on top layer lines
  },
  artworkBoundaryContainer: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: '#121212',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)'
  },
  artworkImageElement: { width: '100%', height: '100%', resizeMode: 'cover' },
  textContainer: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    paddingLeft: 12,
    marginRight: 10,
  },
  title: { color: 'white', fontSize: 13, fontWeight: '700', letterSpacing: -0.1 },
  artist: { color: '#8E8E93', fontSize: 11, fontWeight: '600', marginTop: 1 },
  controls: { flexDirection: 'row', alignItems: 'center' },
  playPauseButton: { padding: 4 }, 
  controlButton: { padding: 6, marginLeft: 6 },
  loaderBufferShell: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center', marginHorizontal: 4 },
  vibrantPlayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
});

export default MiniPlayer;