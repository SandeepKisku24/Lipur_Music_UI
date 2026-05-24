import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Slider from '@react-native-community/slider';
import { usePlayerContext } from '../contexts/PlayerContext';

// Helper to format seconds into MM:SS format
const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
};

const PlaybackSlider: React.FC = () => {
    const { position, duration, seekTo } = usePlayerContext();
    const [isSeeking, setIsSeeking] = useState(false);
    const [seekPosition, setSeekPosition] = useState(0);

    // **FIX**: Only render if we have VALID duration
    if (!duration || duration <= 0 || duration === Infinity) {
        return null;
    }

    const currentPosition = isSeeking ? seekPosition : position;

    return (
        <View style={styles.container}>
            {/* **MASSIVE TOUCH AREA** */}
            <TouchableOpacity 
                style={styles.touchArea} 
                activeOpacity={1}
            >
                <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={duration}
                    value={currentPosition}
                    minimumTrackTintColor="#1DB954"
                    maximumTrackTintColor="#555"
                    thumbTintColor="white"
                    
                    // **VALID PROPS ONLY**
                    onSlidingStart={() => {
                        console.log("Started seeking");
                        setIsSeeking(true);
                    }}
                    onValueChange={(value) => {
                        setSeekPosition(value);
                    }}
                    onSlidingComplete={async (value) => {
                        console.log("Seek complete:", value);
                        await seekTo(value);
                        setIsSeeking(false);
                    }}
                />
            </TouchableOpacity>
            
            {/* TIME LABELS */}
            <View style={styles.timeContainer}>
                <Text style={styles.timeText}>{formatTime(currentPosition)}</Text>
                <Text style={styles.timeText}>{formatTime(duration - currentPosition)}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#303030',
    paddingBottom: 5,
    paddingTop: 5,
  },
  touchArea: {
    justifyContent: 'center',
    height: 30, // space for slider only
  },
  slider: {
    width: '100%',
    height: 30,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 15,
    marginTop: 2,
  },
  timeText: {
    color: '#B3B3B3',
    fontSize: 12,
    fontWeight: '500',
  },
});


export default PlaybackSlider;