// Lipur_ui/src/screens/HomeScreen.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import { fetchSongs } from '../api';
import { Track } from '../types';
import MiniPlayer from '../components/MiniPlayer';
import { usePlayerContext } from '../contexts/PlayerContext';
import { IconButton } from 'react-native-paper';
import PlaybackSlider from '../components/PlaybackSlider';

interface SongListItemProps {
    track: Track;
    playTrack: (track: Track) => Promise<void>;
}

const onMorePress = () => {
    console.log("More options pressed");
}

// Component for a single song item in the list
const SongListItem: React.FC<SongListItemProps> = ({ track,playTrack }) => {
    const encodedUri = encodeURI(track.artwork);
    // console.log('Loading image from:', encodedUri);
    console.log("track like", track.likes);
    return(

  <TouchableOpacity
      style={styles.listItem}
      onPress={() => playTrack(track)}
    >
      <Image
        source={{ uri: encodedUri }}
        style={styles.coverArt}
        onError={(e) => console.error(`Image Load Failed for ${track.title}:`, e.nativeEvent.error)}
      />

      <View style={styles.textContainer}>
        <Text style={styles.title} numberOfLines={1}>{track.title}</Text>
        <Text style={styles.artist} numberOfLines={1}>{track.artist}</Text>

        {/* <View style={styles.statsRow}>
          <View style={styles.iconWithText}>
            <IconButton icon="heart-outline" size={16} iconColor="#B3B3B3" onPress={() => console.log("Like pressed")} />
            <Text style={styles.statsText}>{track.likes}</Text>
          </View>

          <View style={styles.iconWithText}>
            <IconButton icon="play" size={16} iconColor="#B3B3B3" onPress={() => playTrack(track)} />
            <Text style={styles.statsText}>{track.playCount}</Text>
          </View>
        </View> */}
      </View>

      <TouchableOpacity onPress={onMorePress} style={styles.moreButton}>
        <IconButton icon="dots-vertical" size={24} iconColor="#B3B3B3" />
      </TouchableOpacity>
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
        // Pass the entire 'tracks' array (the playlist) to SongListItem
        renderItem={({ item }) => (
          <SongListItem 
            track={item} 
            playTrack={() => playTrack(item, tracks)} // <--- UPDATED: Pass item AND tracks
          />
        )}
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

  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: '#444',
  },
  coverArt: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 4,
    paddingLeft: 10,
  },
  title: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    paddingLeft: 15, 
  },
  artist: {
    color: '#B3B3B3',
    fontSize: 14,
    paddingTop: 2,
    paddingLeft  : 15,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  iconWithText: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  statsText: {
    color: '#B3B3B3',
    fontSize: 12,
    marginLeft: 2,
  },
  moreButton: {
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 180, // Make room for the mini player bar
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
  iconRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  infoText: {
    color: '#B3B3B3',
    fontSize: 12,
    marginLeft: 4,
  },
});

export default HomeScreen;