// Lipur_ui/src/components/CustomSlider.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, PanResponder, Animated, Pressable } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { usePlayerContext } from '../contexts/PlayerContext';

const KNOB_SIZE = 10;     

interface CustomSliderProps {
  isMiniPlayerVariant?: boolean; 
}

const CustomSlider: React.FC<CustomSliderProps> = ({ isMiniPlayerVariant = false }) => {
  const { duration, position, seekTo } = usePlayerContext();
  const [sliderWidth, setSliderWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [sliderLeft, setSliderLeft] = useState(0); 
  
  const animatedX = useRef(new Animated.Value(0)).current;
  const knobScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isDragging && duration > 0 && sliderWidth > 0) {
      const newX = (position / duration) * sliderWidth;
      Animated.timing(animatedX, {
        toValue: newX,
        duration: 200, 
        useNativeDriver: true, // 🔹 Safely preserved!
      }).start();
    }
  }, [position, duration, sliderWidth, isDragging]);

  useEffect(() => {
    if (!isMiniPlayerVariant) {
      Animated.spring(knobScale, {
        toValue: isDragging ? 1.4 : 1,
        useNativeDriver: true,
        friction: 6,
        tension: 120,
      }).start();
    }
  }, [isDragging, isMiniPlayerVariant]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => setIsDragging(true),
      onPanResponderMove: (e, g) => {
        const localX = g.moveX - sliderLeft;
        const constrainedX = Math.min(Math.max(0, localX), sliderWidth);
        animatedX.setValue(constrainedX);
      },
      onPanResponderRelease: async (e, g) => {
        setIsDragging(false);
        const localX = g.moveX - sliderLeft;
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
    <View style={[styles.container, isMiniPlayerVariant && styles.miniContainerBypass]}>
      <Pressable
        onPress={handleTap}
        style={[styles.touchArea, isMiniPlayerVariant && styles.miniTouchAreaBypass]}
        onLayout={e => {
          setSliderWidth(e.nativeEvent.layout.width);
          e.currentTarget.measure((x, y, w, h, pageX) => {
            setSliderLeft(pageX);
          });
        }}
        {...(isMiniPlayerVariant ? {} : panResponder.panHandlers)}
      >
        <View style={[styles.trackMask, isMiniPlayerVariant && styles.miniTrackMaskBypass]}>
          <View style={styles.trackBackground} />

          {/* 🔹 FIXED: Progress container width is now set statically, 
              while the rendering fill shifts cleanly using native-supported transform animations! */}
          <Animated.View
            style={[
              styles.progressContainer,
              {
                width: sliderWidth || 1, 
                transform: [
                  {
                    translateX: animatedX.interpolate({
                      inputRange: [0, sliderWidth || 1],
                      outputRange: [-(sliderWidth || 1), 0], 
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

        {!isMiniPlayerVariant && (
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
        )}
      </Pressable>

      {!isMiniPlayerVariant && (
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{formatTime(position)}</Text>
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>
      )}
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
  container: { width: '100%', justifyContent: 'center' },
  miniContainerBypass: { width: '100%', position: 'absolute', bottom: 0, left: 0, right: 0 },
  touchArea: { height: 32, justifyContent: 'center', width: '100%' },
  miniTouchAreaBypass: { height: 2, padding: 0, margin: 0 },
  
  trackMask: { height: 3, borderRadius: 2, width: '100%', overflow: 'hidden', position: 'relative', backgroundColor: 'rgba(255, 255, 255, 0.12)' },
  miniTrackMaskBypass: { height: 2, borderRadius: 0, backgroundColor: 'rgba(255, 255, 255, 0.06)' },
  trackBackground: { ...StyleSheet.absoluteFillObject, backgroundColor: 'transparent' },
  progressContainer: { height: '100%', position: 'absolute', left: 0 },
  
  knob: { position: 'absolute', left: 0, marginLeft: -(KNOB_SIZE / 2), width: KNOB_SIZE, height: KNOB_SIZE, borderRadius: KNOB_SIZE / 2, backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1.5 }, shadowOpacity: 0.25, shadowRadius: 2, elevation: 3 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  timeText: { color: 'rgba(255, 255, 255, 0.5)', fontSize: 11, fontWeight: '600', fontVariant: ['tabular-nums'] },
});

export default CustomSlider;