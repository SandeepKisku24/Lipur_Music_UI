// Lipur_ui/srcscreens/HomeScreen.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { 
    View, 
    Text, 
    FlatList, 
    StyleSheet, 
    ActivityIndicator, 
    Image, 
    TouchableOpacity,
    ScrollView // 1. Use ScrollView for the main page
} from 'react-native';
import { fetchSongs } from '../api';
import { Track } from '../types';
import MiniPlayer from '../components/MiniPlayer';
import { usePlayerContext } from '../contexts/PlayerContext';

// 2. NEW COMPONENT: A small card for horizontal lists
const SongCard: React.FC<{ 
  track: Track; 
  onPress: () => void 
}> = ({ track, onPress }) => {
  return (
    <TouchableOpacity style={styles.cardContainer} onPress={onPress}>
      <Image 
        source={{ uri: encodeURI(track.artwork) }} 
        style={styles.cardImage} 
      />
      <Text style={styles.cardTitle} numberOfLines={1}>{track.title}</Text>
      <Text style={styles.cardArtist} numberOfLines={1}>{track.artist}</Text>
    </TouchableOpacity>
  );
};

// 3. NEW COMPONENT: A horizontal row (FlatList) for a section
const SongRow: React.FC<{ 
  title: string; 
  tracks: Track[]; 
  playTrack: (track: Track, playlist: Track[]) => Promise<void> 
}> = ({ title, tracks, playTrack }) => {
  
  // Don't render the row if there's no data
  if (!tracks || tracks.length === 0) {
    return null;
  }

  return (
    <View style={styles.rowContainer}>
      <Text style={styles.rowTitle}>{title}</Text>
      <FlatList
        data={tracks}
        keyExtractor={item => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <SongCard 
            track={item} 
            // When a song in this row is pressed,
            // set the playlist to ONLY the songs in this row
            onPress={() => playTrack(item, tracks)} 
          />
        )}
        contentContainerStyle={{ paddingLeft: 20 }} // Indent the start of the list
      />
    </View>
  );
};


// 4. UPDATED HomeScreen: Manages and displays the sections
const HomeScreen: React.FC = () => {
  const { playTrack } = usePlayerContext();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all songs on mount
  useEffect(() => {
    async function loadTracks() {
      // The API already sorts by 'uploadedAt' descending
      const fetchedTracks = await fetchSongs(); 
      setTracks(fetchedTracks);
      setLoading(false);
    }
    loadTracks();
  }, []);

  // 5. DATA PROCESSING: Convert the flat track list into sections
  // useMemo ensures this only recalculates when 'tracks' changes
  const sections = useMemo(() => {
    if (loading) return [];

    // --- Section 1: Recently Added ---
    // The API already sorts by upload date, so just take the first 10
    const recentlyAdded = {
      title: 'Recently Added',
      data: tracks.slice(0, 10),
    };

    // --- Section 2: Group by Genre ---
    const genresMap = new Map<string, Track[]>();
    tracks.forEach(track => {
      // Normalize genre names (e.g., "Pop" and "pop" are the same)
      const genre = track.genre ? track.genre.charAt(0).toUpperCase() + track.genre.slice(1).toLowerCase() : 'Unknown';
      if (!genresMap.has(genre)) genresMap.set(genre, []);
      genresMap.get(genre)!.push(track);
    });
    // Convert the Map into an array of sections
    const genreSections = Array.from(genresMap.entries()).map(([genre, data]) => ({
      title: `Popular in ${genre}`,
      data: data.slice(0, 10), // Limit to 10 songs per genre
    }));

    // --- Section 3: Group by Artist (if they have multiple songs) ---
    const artistMap = new Map<string, { name: string, tracks: Track[] }>();
    tracks.forEach(track => {
      // Loop through the artists for this track
      if (track.artistIds && track.artistNames && track.artistIds.length > 0) {
        track.artistIds.forEach((id, index) => {
          const name = track.artistNames[index];
          if (!id || !name || name === "Unknown Artist") return; // Skip invalid
          
          if (!artistMap.has(id)) artistMap.set(id, { name, tracks: [] });
          artistMap.get(id)!.tracks.push(track);
        });
      }
    });
    // Convert Map to array, but only show artists with 3 or more songs
    const artistSections = Array.from(artistMap.entries())
      .filter(([id, data]) => data.tracks.length > 2) 
      .map(([id, data]) => ({
        title: `More from ${data.name}`,
        data: data.tracks,
      }));

    // Combine all sections
    return [recentlyAdded, ...genreSections, ...artistSections];

  }, [tracks, loading]); // Dependencies for useMemo

  // --- Render Logic ---
  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#1DB954" />
        <Text style={styles.loadingText}>Loading Music...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      {/* 6. MAIN RENDER: Use ScrollView + .map() */}
      <ScrollView contentContainerStyle={styles.listContent}>
        <Text style={styles.header}>Lipur</Text>
        
        {sections.map(section => (
          <SongRow
            key={section.title}
            title={section.title}
            tracks={section.data}
            playTrack={playTrack} // Pass the context's playTrack function
          />
        ))}

      </ScrollView>
      <MiniPlayer />
    </View>
  );
};

// 7. ALL STYLES (Includes new styles for cards and rows)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  center: {
    flex: 1, // Make center fill the screen
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#B3B3B3',
    marginTop: 10,
  },
  header: {
    fontSize: 32, // Larger header
    fontWeight: 'bold',
    color: '#1ed760',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
  },
  listContent: {
    // Total height of MiniPlayer (130) + TabBar (65)
    paddingBottom: 200, 
  },
  
  // --- SongRow Styles ---
  rowContainer: {
    marginBottom: 25,
  },
  rowTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 20,
    marginBottom: 15,
  },

  // --- SongCard Styles ---
  cardContainer: {
    width: 150,
    marginRight: 15,
  },
  cardImage: {
    width: 150,
    height: 150,
    borderRadius: 8,
    backgroundColor: '#333', // Placeholder color
  },
  cardTitle: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 8,
  },
  cardArtist: {
    color: '#B3B3B3',
    fontSize: 13,
    marginTop: 3,
  },

  // --- (Old styles for reference, no longer used by main list) ---
  listItem: {},
  coverArt: {},
  textContainer: {},
  title: {},
  artist: {},
  moreButton: {},
});

export default HomeScreen;