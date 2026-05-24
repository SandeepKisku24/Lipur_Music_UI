// Lipur_ui/src/screens/MainRouter.tsx
import React, { useState, useRef, useMemo } from 'react';
import { 
    View, 
    StyleSheet, 
    StatusBar,
} from 'react-native';
import TabBar from '../components/TabBar';
import MiniPlayer from '../components/MiniPlayer';
import NowPlayingScreen from './NowPlayingScreen';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
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

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#121212" />
            
            <View style={styles.content}>
                {renderScreen()}
            </View>

            {currentTrack && (
                /* 🔹 FIXED: Removed global GestureDetector wrapping to stop hit-test hijacking */
                <MiniPlayer onPress={openNowPlaying} /> 
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