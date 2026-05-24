/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import TrackPlayer from 'react-native-track-player';
import { playbackService } from './src/services/playbackService';

// --- OUR NEW IMPORTS ---
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
// ------------------------

// --- NEW COMPONENT ---
// We create a new "root" component that wraps your <App>.
const AppRoot = () => (
  <GestureHandlerRootView style={{ flex: 1 }}>
    <App />
  </GestureHandlerRootView>
);
// ---------------------

AppRegistry.registerComponent(appName, () => AppRoot);

// This line stays exactly the same
TrackPlayer.registerPlaybackService(() => playbackService);