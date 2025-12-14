import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, PanResponder, Animated, Pressable, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { usePlayerContext } from '../contexts/PlayerContext';

const { width } = Dimensions.get('window');
const SCREEN_MARGIN = 30; 
const KNOB_SIZE = 8;     

const CustomSlider: React.FC = () => {
  const { duration, position, seekTo, isPlaying } = usePlayerContext();
  const [sliderWidth, setSliderWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  // Animated Values
  const animatedX = useRef(new Animated.Value(0)).current;
  const knobScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isDragging && duration > 0 && sliderWidth > 0) {
      const newX = (position / duration) * sliderWidth;
      Animated.timing(animatedX, {
        toValue: newX,
        duration: 200, 
        useNativeDriver: true,
      }).start();
    }
  }, [position, duration, sliderWidth, isDragging]);

  useEffect(() => {
    Animated.spring(knobScale, {
      toValue: isDragging ? 1.5 : 1,
      useNativeDriver: true,
      friction: 7,
      tension: 100,
    }).start();
  }, [isDragging]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => setIsDragging(true),
      onPanResponderMove: (_, g) => {
        const localX = g.moveX - SCREEN_MARGIN;
        const constrainedX = Math.min(Math.max(0, localX), sliderWidth);
        animatedX.setValue(constrainedX);
      },
      onPanResponderRelease: async (_, g) => {
        setIsDragging(false);
        const localX = g.moveX - SCREEN_MARGIN;
        const constrainedX = Math.min(Math.max(0, localX), sliderWidth);
        
        if (sliderWidth > 0 && duration > 0) {
          const newPos = (constrainedX / sliderWidth) * duration;
          await seekTo(newPos);
        }
      },
    })
  ).current;

  const handleTap = async (e: any) => {
    if (!sliderWidth || !duration) return;
    const tapX = e.nativeEvent.locationX;
    const newPosition = (tapX / sliderWidth) * duration;
    animatedX.setValue(tapX);
    await seekTo(newPosition);
  };

  return (
    <View style={styles.container}>
      <Pressable
        onPress={handleTap}
        style={styles.touchArea}
        onLayout={e => setSliderWidth(e.nativeEvent.layout.width)}
        {...panResponder.panHandlers}
      >
        {/* 1. THE FIX: TRACK MASK 
            We wrap the background and the progress bar in a view with overflow: 'hidden'.
            This chops off the "sliding" part of the bar that is to the left of 0.
        */}
        <View style={styles.trackMask}>
          {/* Track Background */}
          <View style={styles.trackBackground} />

          {/* Progress Fill */}
          <Animated.View
            style={[
              styles.progressContainer,
              {
                width: sliderWidth, // It is full width...
                transform: [
                  {
                    translateX: animatedX.interpolate({
                      inputRange: [0, sliderWidth || 1],
                      outputRange: [(-sliderWidth || 1), 0], // ...but slides in from the left
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
              style={{ flex: 1 }}
            />
          </Animated.View>
        </View>

        {/* 2. THE KNOB (OUTSIDE THE MASK)
            The knob stays outside the mask so it isn't cut in half 
            when it is at the very start or very end.
        */}
        <Animated.View
          style={[
            styles.knob,
            {
              transform: [
                { translateX: animatedX }, 
                { scale: knobScale },      
              ],
            },
          ]}
        />
      </Pressable>

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
    width: '100%',
    justifyContent: 'center',
  },
  touchArea: {
    height: 40,
    justifyContent: 'center', 
    width: '100%',
  },
  // NEW STYLE: Holds the track and clips the progress bar
  trackMask: {
    height: 2,
    borderRadius: 2,
    width: '100%',
    overflow: 'hidden', // <--- THIS IS THE KEY FIX
    position: 'relative', // Keeps children positioned relative to this
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // Moved background color here
  },
  trackBackground: {
    ...StyleSheet.absoluteFillObject, // Fill the mask
    backgroundColor: 'transparent', // Color is now on the mask
  },
  progressContainer: {
    height: '100%', // Match mask height
    position: 'absolute',
    left: 0,
  },
  knob: {
    position: 'absolute',
    left: 0, 
    marginLeft: -(KNOB_SIZE / 2), // Center knob on tip
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    backgroundColor: '#FFFFFF',
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timeText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
});

export default CustomSlider;