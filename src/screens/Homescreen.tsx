// Lipur_ui/src/screens/HomeScreen.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import { fetchSongs } from '../api';
import { Track } from '../types';
import MiniPlayer from '../components/MiniPlayer';
import { usePlayerContext } from '../contexts/PlayerContext';

interface SongListItemProps {
    track: Track;
    playTrack: (track: Track) => Promise<void>;
}

// Component for a single song item in the list
const SongListItem: React.FC<SongListItemProps> = ({ track,playTrack }) => {
    const encodedUri = encodeURI(track.artwork);
    // console.log('Loading image from:', encodedUri);
    return(

  <TouchableOpacity style={styles.listItem} onPress={() => {
            console.log(`[UI] Playing track: ${track.title}`);
            playTrack(track);}}>
    <Image source={{ uri: encodedUri }} 
          style={styles.coverArt} 
          onError={(e) => console.error(`Image Load Failed for ${track.title}:`, e.nativeEvent.error)}/>
    <View style={styles.textContainer}>
      <Text style={styles.title} numberOfLines={1}>{track.title}</Text>
      <Text style={styles.artist} numberOfLines={1}>{track.artist}</Text>
    </View>
  </TouchableOpacity>
    )
};


const HomeScreen: React.FC = () => {
  const { playTrack } = usePlayerContext();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTracks() {
      const fetchedTracks = await fetchSongs();
      setTracks(fetchedTracks);
      setLoading(false);
    }
    loadTracks();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#1DB954" />
        <Text style={styles.loadingText}>Loading Music...</Text>
      </View>
    );
  }
  
  // Clean UI like Spotify: Dark background and clear list items
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Your Library</Text>
      <FlatList
        data={tracks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <SongListItem track={item} playTrack={playTrack} />}
        contentContainerStyle={styles.listContent}
      />
      {/* Placeholder for the fixed Mini Player bar (bottom bar) */}
      {/* <View style={styles.miniPlayerBar}>
        <Text style={styles.miniPlayerText}>Mini Player Placeholder</Text>
      </View> */}
      <MiniPlayer />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', // Dark background like Spotify
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#B3B3B3',
    marginTop: 10,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    padding: 20,
    paddingTop: 50, // Space for status bar
  },
  listContent: {
    paddingBottom: 80, // Make room for the mini player bar
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  coverArt: {
    width: 50,
    height: 50,
    borderRadius: 5,
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  artist: {
    color: '#B3B3B3', // Gray text for artist name
    fontSize: 14,
  },
  miniPlayerBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#1DB954', // Spotify green/accent color
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  miniPlayerText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default HomeScreen;