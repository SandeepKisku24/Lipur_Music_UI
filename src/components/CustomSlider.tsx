// Lipur_ui/src/components/CustomSlider.tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, PanResponder, Animated, Pressable } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { usePlayerContext } from '../contexts/PlayerContext';

const CustomSlider: React.FC = () => {
  const { duration, position, seekTo, isPlaying } = usePlayerContext();
  const [sliderWidth, setSliderWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const animatedX = useState(new Animated.Value(0))[0];
  const glow = useState(new Animated.Value(0))[0];

  // Animate knob glow when playing
  useEffect(() => {
    if (isPlaying) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glow, { toValue: 1, duration: 1000, useNativeDriver: true }),
          Animated.timing(glow, { toValue: 0, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    } else {
      glow.stopAnimation();
      glow.setValue(0);
    }
  }, [isPlaying]);

  // Update knob position based on playback
  useEffect(() => {
    if (!isDragging && duration > 0 && sliderWidth > 0) {
      const newX = (position / duration) * sliderWidth;
      Animated.timing(animatedX, {
        toValue: newX,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [position, duration, sliderWidth, isDragging]);

  // Pan gesture
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => setIsDragging(true),
    onPanResponderMove: (_, g) => {
      const newX = Math.min(Math.max(0, g.moveX), sliderWidth);
      animatedX.setValue(newX);
    },
    onPanResponderRelease: async (_, g) => {
      setIsDragging(false);
      const newX = Math.min(Math.max(0, g.moveX), sliderWidth);
      const newPos = sliderWidth > 0 ? (newX / sliderWidth) * duration : 0;
      await seekTo(newPos);
    },
  });

  // Tap-to-seek support
  const handleTap = async (e: any) => {
    if (!sliderWidth || !duration) return;
    const tapX = e.nativeEvent.locationX;
    const newPosition = (tapX / sliderWidth) * duration;
    animatedX.setValue(tapX);
    await seekTo(newPosition);
  };

  // Knob scaling animation
  const knobScale = useState(new Animated.Value(1))[0];
  useEffect(() => {
    Animated.spring(knobScale, { toValue: isDragging ? 1.3 : 1, useNativeDriver: true }).start();
  }, [isDragging]);

  // Glow interpolate for shadow intensity
  const glowScale = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.15],
  });

  return (
    <View style={styles.container}>
      <Pressable
        onPress={handleTap}
        style={styles.sliderContainer}
        onLayout={e => setSliderWidth(e.nativeEvent.layout.width)}
        {...panResponder.panHandlers}
      >
        {/* Track */}
        <View style={styles.track} />

        {/* Gradient progress bar */}
        <Animated.View
          style={[
            styles.progressContainer,
            {
              transform: [
                {
                  translateX: animatedX.interpolate({
                    inputRange: [0, sliderWidth || 1],
                    outputRange: [(-sliderWidth || 1), 0],
                    extrapolate: 'clamp',
                  }),
                },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={['#1DB954', '#1ed760']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.progress}
          />
        </Animated.View>

        {/* Knob with glow */}
        <Animated.View
          style={[
            styles.knob,
            {
              transform: [
                { translateX: animatedX },
                { scale: Animated.multiply(knobScale, glowScale) },
              ],
              shadowOpacity: isPlaying ? 0.7 : 0.3,
            },
          ]}
        />
      </Pressable>

      {/* Time labels */}
      <View style={styles.timeRow}>
        <Text style={styles.timeText}>{formatTime(position)}</Text>
        <Text style={styles.timeText}>{formatTime(duration)}</Text>
      </View>
    </View>
  );
};

const formatTime = (sec: number) => {
  if (!sec || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' + s : s}`;
};

const styles = StyleSheet.create({
  container: {
    width: '90%',
    marginRight: 'auto',
    marginLeft: 'auto',
    height: 75,
    justifyContent: 'center',
  },
  sliderContainer: {
    height: 40,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  track: {
    height: 3,
    backgroundColor: '#444',
    borderRadius: 3,
  },
  progressContainer: {
    position: 'absolute',
    // left: '5%',
    // right: '5%',
    // backgroundColor: '#1ed760',
    marginLeft : '5%'
  },
  progress: {
    height: 3,
    borderRadius: 3,
  },
  knob: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#ffffff',
    top: 13,
    shadowColor: '#1ed760',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 6,
  },
  timeText: {
    color: '#aaa',
    fontSize: 12,
  },
});

export default CustomSlider;
