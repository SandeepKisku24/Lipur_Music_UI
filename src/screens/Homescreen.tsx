import React, { useState, useEffect, useMemo } from 'react';
import { 
    View, 
    Text, 
    FlatList, 
    StyleSheet, 
    Image, 
    TouchableOpacity,
    ScrollView 
} from 'react-native';
import { fetchListeningHistory, fetchSongs } from '../api';
import { Track } from '../types';
// NO MOTI IMPORT (Prevents Crash)
import { usePlayerContext } from '../contexts/PlayerContext';
import auth from '@react-native-firebase/auth';
import Ionicons from 'react-native-vector-icons/Ionicons';

// ==========================================
// 0. FAIL-SAFE SKELETON (No Crash)
// ==========================================
const SkeletonBox: React.FC<{ width: number | string; height: number; borderRadius?: number; style?: any }> = ({ 
    width, 
    height, 
    borderRadius = 4,
    style 
}) => (
    <View style={[{ 
        width, 
        height, 
        borderRadius, 
        backgroundColor: '#333', 
        opacity: 0.7 
    }, style]} />
);

// ==========================================
// 1. COMPONENTS
// ==========================================

const StandardCard: React.FC<{ track: Track; onPress: () => void; rank?: number }> = ({ track, onPress, rank }) => (
  <TouchableOpacity style={styles.standardCardContainer} onPress={onPress}>
    <View>
      <Image source={{ uri: encodeURI(track.artwork) }} style={styles.standardImage} />
      {rank && (
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>{rank}</Text>
        </View>
      )}
    </View>
    <Text style={styles.standardTitle} numberOfLines={1}>{track.title}</Text>
    <Text style={styles.standardArtist} numberOfLines={1}>{track.artist}</Text>
  </TouchableOpacity>
);

const HistoryCard: React.FC<{ track: Track; onPress: () => void }> = ({ track, onPress }) => (
  <TouchableOpacity style={styles.historyCardContainer} onPress={onPress}>
    <Image source={{ uri: encodeURI(track.artwork) }} style={styles.historyImage} />
    <View style={styles.historyTextContainer}>
      <Text style={styles.historyTitle} numberOfLines={1}>{track.title}</Text>
      <Text style={styles.historyArtist} numberOfLines={1}>{track.artist}</Text>
      <View style={styles.historyIndicator}>
        <Ionicons name="time-outline" size={12} color="#1DB954" />
        <Text style={styles.historySubtext}> Recently Played</Text>
      </View>
    </View>
  </TouchableOpacity>
);

const ArtistCard: React.FC<{ track: Track; onPress: () => void }> = ({ track, onPress }) => (
  <TouchableOpacity style={styles.artistCardContainer} onPress={onPress}>
    <Image source={{ uri: encodeURI(track.artwork) }} style={styles.artistImage} />
    <Text style={styles.artistName} numberOfLines={1}>{track.artist}</Text>
  </TouchableOpacity>
);

const RowSkeleton: React.FC = () => (
  <View style={styles.rowContainer}>
    <View style={{ marginLeft: 20, marginBottom: 15 }}>
      <SkeletonBox width={200} height={22} />
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 20 }}>
      {[1, 2, 3].map(i => (
        <View key={i} style={{ marginRight: 15 }}>
          <SkeletonBox width={140} height={140} borderRadius={8} />
          <View style={{ marginTop: 8 }}>
            <SkeletonBox width={100} height={15} />
          </View>
        </View>
      ))}
    </ScrollView>
  </View>
);

// ==========================================
// 2. MAIN SCREEN
// ==========================================

const HomeScreen: React.FC = () => {
  const { playTrack } = usePlayerContext();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [historyIds, setHistoryIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const user = auth().currentUser;
        const userId = user ? user.uid : 'anonymous';
        const [fetchedTracks, fetchedHistory] = await Promise.all([
            fetchSongs(),
            fetchListeningHistory(userId)
        ]);
        setTracks(fetchedTracks);
        setHistoryIds(fetchedHistory);
      } catch (e) {
          console.error("Home load failed", e);
      } finally {
          setLoading(false);
      }
    }
    loadData();
  }, []);

  const sections = useMemo(() => {
    if (loading || tracks.length === 0) return [];

    const trackMap = new Map(tracks.map(t => [t.id, t]));

    // 1. History
    const recentTracks: Track[] = [];
    const seenIds = new Set<string>();
    historyIds.forEach(id => {
        const track = trackMap.get(id);
        if (track && !seenIds.has(id)) {
            recentTracks.push(track);
            seenIds.add(id);
        }
    });

    // 2. Trending
    const trendingTracks = [...tracks].map(track => {
        const timeScore = track.totalPlayTime || 0;
        const clickScore = (track.playCount || 0) * 30; 
        return { ...track, trendScore: timeScore + clickScore };
    })
    .sort((a, b) => b.trendScore - a.trendScore)
    .slice(0, 10);

    // 3. Recently Added
    const recentlyAdded = tracks.slice(0, 10);

    // 4. Genres & Artists
    const genresMap = new Map<string, Track[]>();
    const artistMap = new Map<string, { name: string, tracks: Track[] }>();

    tracks.forEach(track => {
        const genre = track.genre ? track.genre.charAt(0).toUpperCase() + track.genre.slice(1).toLowerCase() : 'Unknown';
        if (!genresMap.has(genre)) genresMap.set(genre, []);
        genresMap.get(genre)!.push(track);

        // Artist Grouping Logic
        if (track.artistIds && track.artistNames && track.artistIds.length > 0) {
            track.artistIds.forEach((id, index) => {
                const name = track.artistNames![index];
                if (!id || !name || name === "Unknown Artist") return;
                if (!artistMap.has(id)) artistMap.set(id, { name, tracks: [] });
                artistMap.get(id)!.tracks.push(track);
            });
        } else if (track.artist && track.artist !== "Unknown Artist") {
             const name = track.artist;
             if (!artistMap.has(name)) artistMap.set(name, { name, tracks: [] });
             artistMap.get(name)!.tracks.push(track);
        }
    });

    // --- BUILD FINAL LIST ---
    const finalSections = [];

    // A. History
    if (recentTracks.length > 0) {
        finalSections.push({ type: 'history', title: 'Pick Up Where You Left Off', data: recentTracks });
    }

    // B. Trending
    if (trendingTracks.length > 0) {
        finalSections.push({ type: 'trending', title: 'Trending Now 🔥', data: trendingTracks });
    }

    // C. Standard
    finalSections.push({ type: 'standard', title: 'Fresh Arrivals', data: recentlyAdded });

    // D. Popular Artists (Circles)
    // Filter > 0 so artists appear even with 1 song
    const artistList = Array.from(artistMap.values())
        .filter(a => a.tracks.length > 0) 
        .map(a => a.tracks[0]);
    
    if (artistList.length > 0) {
        finalSections.push({ type: 'artist', title: 'Popular Artists', data: artistList.slice(0, 15) });
    }

    // E. Genres
    const genreSections = Array.from(genresMap.entries()).map(([genre, data]) => ({
      type: 'standard',
      title: `Popular in ${genre}`,
      data: data.slice(0, 10),
    }));
    finalSections.push(...genreSections);

    // F. More From Artists (Rows)
    // 🔥 RESTORED THIS SECTION: Shows "More from X" rows
    const deepArtistSections = Array.from(artistMap.values())
        .filter(a => a.tracks.length > 1) // Only show row if > 1 song
        .map(a => ({
            type: 'standard',
            title: `More from ${a.name}`,
            data: a.tracks
        }));
    finalSections.push(...deepArtistSections);

    return finalSections;

  }, [tracks, historyIds, loading]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Lipur</Text>
        <RowSkeleton /><RowSkeleton /><RowSkeleton />
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.listContent}>
        <Text style={styles.header}>Lipur</Text>
        
        {sections.map((section, sectionIndex) => (
          <View key={`${section.title}-${sectionIndex}`} style={styles.rowContainer}>
            <Text style={styles.rowTitle}>{section.title}</Text>
            
            <FlatList
              data={section.data}
              keyExtractor={(item, index) => `${item.id}-${index}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 20 }} 
              renderItem={({ item, index }) => {
                  if (section.type === 'history') {
                      return <HistoryCard track={item} onPress={() => playTrack(item, section.data)} />;
                  } 
                  else if (section.type === 'artist') {
                      return <ArtistCard track={item} onPress={() => playTrack(item, section.data)} />;
                  }
                  else if (section.type === 'trending') {
                      return <StandardCard track={item} rank={index + 1} onPress={() => playTrack(item, section.data)} />;
                  }
                  else {
                      return <StandardCard track={item} onPress={() => playTrack(item, section.data)} />;
                  }
              }}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

// ==========================================
// 3. STYLES
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: { fontSize: 32, fontWeight: 'bold', color: '#1ed760', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 10 },
  listContent: { paddingBottom: 200 },
  rowContainer: { marginBottom: 30 },
  rowTitle: { fontSize: 20, fontWeight: '700', color: 'white', marginLeft: 20, marginBottom: 15 },

  // Standard Card
  standardCardContainer: { width: 140, marginRight: 15 },
  standardImage: { width: 140, height: 140, borderRadius: 8, backgroundColor: '#333' },
  standardTitle: { color: 'white', fontSize: 14, fontWeight: '600', marginTop: 8 },
  standardArtist: { color: '#B3B3B3', fontSize: 12, marginTop: 3 },
  rankBadge: { position: 'absolute', bottom: 5, left: 5, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  rankText: { color: '#1ed760', fontWeight: 'bold', fontSize: 12 },

  // History Card
  historyCardContainer: { 
      width: 280, 
      marginRight: 15, 
      backgroundColor: '#282828', 
      borderRadius: 6,
      flexDirection: 'row', 
      alignItems: 'center',
      padding: 8 
  },
  historyImage: { width: 56, height: 56, borderRadius: 4, backgroundColor: '#333' },
  historyTextContainer: { marginLeft: 12, flex: 1 },
  historyTitle: { color: 'white', fontSize: 14, fontWeight: '600' },
  historyArtist: { color: '#B3B3B3', fontSize: 12, marginTop: 2 },
  historyIndicator: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  historySubtext: { color: '#1DB954', fontSize: 10, fontWeight: '500' },

  // Artist Card
  artistCardContainer: { width: 110, marginRight: 15, alignItems: 'center' },
  artistImage: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#333' },
  artistName: { color: 'white', fontSize: 13, fontWeight: '600', marginTop: 8, textAlign: 'center' },
});

export default HomeScreen;