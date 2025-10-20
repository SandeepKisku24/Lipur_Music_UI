// Lipur_ui/src/screens/MainRouter.tsx

import React, { useState } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import TabBar from '../components/TabBar';
import MiniPlayer from '../components/MiniPlayer';

// Screens
import HomeScreen from './Homescreen.tsx';
import SearchScreen from './SearchScreen.tsx'// Use your placeholders
import LibraryScreen from './LibraryScreen.tsx'// Use your placeholders
import ProfileScreen from './ProfileScreen.tsx'; // Use your placeholders

const MainRouter: React.FC = () => {
    // State to track the active tab
    const [activeTab, setActiveTab] = useState('Home');

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
            
            {/* 1. Main Content Area */}
            <View style={styles.content}>
                {renderScreen()}
            </View>

            {/* 2. MiniPlayer (Sits on top of content and tab bar) */}
            <MiniPlayer /> 
            
            {/* 3. Custom Tab Bar (Sits at the bottom) */}
            <TabBar activeTab={activeTab} setTab={setActiveTab} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    // The content needs to be flex-1 so it pushes the TabBar to the bottom
    content: {
        flex: 1,
    }
});

export default MainRouter;