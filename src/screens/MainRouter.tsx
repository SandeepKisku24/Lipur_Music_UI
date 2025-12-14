import React, { useState, useRef, useMemo } from 'react';
import { 
    View, 
    StyleSheet, 
    StatusBar,
} from 'react-native';
import TabBar from '../components/TabBar';
import MiniPlayer from '../components/MiniPlayer';
import NowPlayingScreen from './NowPlayingScreen';

import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

import {
  BottomSheetModal,
} from '@gorhom/bottom-sheet';
import { usePlayerContext } from '../contexts/PlayerContext';

// Screens
import HomeScreen from './Homescreen.tsx';
import SearchScreen from './SearchScreen.tsx';
import LibraryScreen from './LibraryScreen.tsx';
import ProfileScreen from './ProfileScreen.tsx';

const MainRouter: React.FC = () => {
    const [activeTab, setActiveTab] = useState('Home');
    
    const bottomSheetModalRef = useRef<BottomSheetModal>(null);
    const snapPoints = useMemo(() => ['100%'], []);
    const { currentTrack } = usePlayerContext();

    const openNowPlaying = () => {
        bottomSheetModalRef.current?.present();
    };
    const closeNowPlaying = () => {
        bottomSheetModalRef.current?.dismiss();
    };

    const renderScreen = () => {
        switch (activeTab) {
            case 'Search':
                return <SearchScreen />;
            case 'Library':
                return <LibraryScreen />;
            case 'Profile':
                return <ProfileScreen />;
            case 'Home':
            default:
                return <HomeScreen />;
        }
    };

    // 1. REMOVE TapGesture. We only want gestures for SWIPING up.
    //    Clicking is now handled by the MiniPlayer itself.
    const panGesture = Gesture.Pan()
        .onUpdate((event) => {
            if (event.translationY < -10) { 
                runOnJS(openNowPlaying)();
            }
        })
        .activeOffsetY([-10, 100]); 

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#121212" />
            
            <View style={styles.content}>
                {renderScreen()}
            </View>

            {currentTrack && (
                // 2. Just use panGesture (no Race)
                <GestureDetector gesture={panGesture}>
                    {/* 3. Pass the onPress prop to MiniPlayer */}
                    <MiniPlayer onPress={openNowPlaying} /> 
                </GestureDetector>
            )}
            
            <TabBar activeTab={activeTab} setTab={setActiveTab} />

            <BottomSheetModal
                ref={bottomSheetModalRef}
                index={0}
                snapPoints={snapPoints}
                stackBehavior="replace" 
                handleComponent={() => null} 
                backgroundStyle={{ backgroundColor: '#121212' }}
            >
                <NowPlayingScreen onClose={closeNowPlaying} />
            </BottomSheetModal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    content: {
        flex: 1,
    }
});

export default MainRouter;