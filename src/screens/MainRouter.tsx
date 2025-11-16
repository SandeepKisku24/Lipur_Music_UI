import React, { useState, useRef, useMemo } from 'react'; // 1. Import useRef and useMemo
import { 
    View, 
    StyleSheet, 
    StatusBar,
    TouchableOpacity // We still use this, but it's simpler now
} from 'react-native';
import TabBar from '../components/TabBar';
import MiniPlayer from '../components/MiniPlayer';
import NowPlayingScreen from './NowPlayingScreen';

import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated'; // To call our 'open' function

// --- 2. NEW IMPORTS ---
import {
  BottomSheetModal,
  BottomSheetModalProvider,
} from '@gorhom/bottom-sheet';
import { usePlayerContext } from '../contexts/PlayerContext'; // We need this to hide the MiniPlayer

// Screens
import HomeScreen from './Homescreen.tsx';
import SearchScreen from './SearchScreen.tsx';
import LibraryScreen from './LibraryScreen.tsx';
import ProfileScreen from './ProfileScreen.tsx';

const MainRouter: React.FC = () => {
    const [activeTab, setActiveTab] = useState('Home');
    
    // 4. ADD a ref for the BottomSheet
    const bottomSheetModalRef = useRef<BottomSheetModal>(null);

    // 5. DEFINE the "snap points" for the player
    // This tells the sheet its heights
    const snapPoints = useMemo(() => ['100%'], []); // Only one snap point: 100% (full screen)

    // 6. GET the current track to know if the MiniPlayer should be visible
    const { currentTrack } = usePlayerContext();

    // 7. Functions to control the new BottomSheet
    const openNowPlaying = () => {
        bottomSheetModalRef.current?.present(); // This opens the sheet
    };
    const closeNowPlaying = () => {
        bottomSheetModalRef.current?.dismiss(); // This closes it
    };

    const renderScreen = () => {
        // ... (This code stays exactly the same)
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

    const tapGesture = Gesture.Tap()
        .onEnd(() => {
            // We must use runOnJS because 'openNowPlaying' is a JS function,
            // and this gesture code runs on the native UI thread.
            runOnJS(openNowPlaying)();
        });
    const panGesture = Gesture.Pan()
        .onUpdate((event) => {
            // Check if the swipe is primarily upwards (negative translationY)
            if (event.translationY < -10) { // If swiped up by 10 pixels
                runOnJS(openNowPlaying)();
            }
        })
        .activeOffsetY([-10, 100]); // Only activate if swipe starts vertically
    const combinedGesture = Gesture.Race(panGesture, tapGesture);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#121212" />
            
            <View style={styles.content}>
                {renderScreen()}
            </View>

            {/* 8. Show the MiniPlayer ONLY if a track is playing */}
            {currentTrack && (
                <GestureDetector gesture={combinedGesture}>
                    {/* The <MiniPlayer /> is now gesture-controlled */}
                    <MiniPlayer /> 
                </GestureDetector>
            )}
            
            <TabBar activeTab={activeTab} setTab={setActiveTab} />

            {/* 9. REPLACE the <Modal> with <BottomSheetModal> */}
            <BottomSheetModal
                ref={bottomSheetModalRef}
                index={0} // The first snap point in the array (which is '100%')
                snapPoints={snapPoints}
                // These props make it look like a full-screen modal
                stackBehavior="replace" 
                handleComponent={() => null} // Hides the little grab-bar
                backgroundStyle={{ backgroundColor: '#121212' }}
            >
                {/* The content of the sheet is our NowPlayingScreen */}
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