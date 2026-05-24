// Lipur_ui/src/screens/Homescreen.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
    View, Text, FlatList, StyleSheet, Image, 
    TouchableOpacity, ActivityIndicator, Dimensions, AppState, AppStateStatus
} from 'react-native';
import { fetchListeningHistory, fetchSongs } from '../api';
import { Track } from '../types';
import { usePlayerContext } from '../contexts/PlayerContext';
import auth from '@react-native-firebase/auth';
import Ionicons from 'react-native-vector-icons/Ionicons';
import TrackPlayer, { State } from 'react-native-track-player';
import axios from 'axios';
import { useTheme } from '../contexts/ThemeContext'; // 🔹 Consume theme token provider

const { width } = Dimensions.get('window');
const GRID_COLUMN_WIDTH = (width - 50) / 2; 
const PAGING_COLUMN_WIDTH = width * 0.44;

const SONG_TYPES = [
    { name: 'Don', icon: 'musical-notes' },
    { name: 'Lagre', icon: 'sparkles' },
    { name: 'Sohrai', icon: 'flame' },
    { name: 'Traditional', icon: 'earth' },
    { name: 'Modern', icon: 'pulse' },
    { name: 'Romantic', icon: 'heart' }
];

interface CardProps {
  track: Track;
  onPress: () => void;
  onLike?: () => void;
  isLiked?: boolean;
  rank?: number;
  colors: any; // 🔹 Added dynamic theme colors parameter configuration
}

interface HomeSection {
  type: 'HORIZONTAL_HISTORY_RECT' | 'HORIZONTAL_CIRCLES' | 'HORIZONTAL_LARGE' | 'GRID_TWO_COLUMNS' | 'HORIZONTAL_PAGING_GRID';
  title: string;
  data: Track[];
  isArtistSection?: boolean;
}

// ==========================================
// 🛠️ HIGH-FIDELITY STRUCTURAL COMPONENTS (FIXED FOR THEMES)
// ==========================================

const HistoryRectCard = React.memo(({ track, onPress, colors }: CardProps) => (
  <TouchableOpacity 
    style={[styles.historyRectContainer, { backgroundColor: colors.surface, borderColor: colors.border }]} 
    onPress={onPress} 
    activeOpacity={0.85}
  >
    <View style={styles.imageCenterWrapper}>
      <Image source={{ uri: encodeURI(track.artwork) }} style={styles.historyRectImage} />
    </View>
    <View style={styles.historyRectMetadata}>
      <Text style={[styles.historyRectTitle, { color: colors.text }]} numberOfLines={1}>{track.title}</Text>
      <Text style={[styles.historyRectArtist, { color: colors.textMuted }]} numberOfLines={1}>{track.artist}</Text>
    </View>
  </TouchableOpacity>
));

const CircularTrackCard = React.memo(({ track, onPress, rank, colors }: CardProps) => (
  <TouchableOpacity style={styles.circularCarouselContainer} onPress={onPress} activeOpacity={0.85}>
    <View style={[styles.circularImageWrapper, { backgroundColor: colors.surface }]}>
      <Image source={{ uri: encodeURI(track.artwork) }} style={styles.fullImage} />
      {rank && (
        <View style={[styles.rankCircleBadge, { backgroundColor: colors.primary }]}>
          <Text style={styles.rankCircleText}>{rank}</Text>
        </View>
      )}
    </View>
    <Text style={[styles.circularCardTitle, { color: colors.text }]} numberOfLines={1}>{track.title}</Text>
    <Text style={[styles.circularCardArtist, { color: colors.textMuted }]} numberOfLines={1}>{track.artist}</Text>
  </TouchableOpacity>
));

const LargeFreshCard = React.memo(({ track, onPress, colors }: CardProps) => (
  <TouchableOpacity style={styles.largeCardContainer} onPress={onPress} activeOpacity={0.85}>
    <Image source={{ uri: encodeURI(track.artwork) }} style={styles.fullImage} />
    <View style={styles.largeTextGradientOverlay}>
      <Text style={styles.largeTitle} numberOfLines={1}>{track.title}</Text>
      <Text style={styles.largeArtist} numberOfLines={1}>{track.artist}</Text>
    </View>
  </TouchableOpacity>
));

const GridSongCell = React.memo(({ track, onPress, onLike, isLiked, colors }: CardProps) => (
  <TouchableOpacity 
    style={[styles.gridCellWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]} 
    onPress={onPress} 
    activeOpacity={0.75}
  >
    <View style={styles.imageCenterWrapper}>
      <Image source={{ uri: encodeURI(track.artwork) }} style={styles.gridCellArtwork} />
    </View>
    <View style={styles.gridCellMetadata}>
      <Text style={[styles.gridCellTitle, { color: colors.text }]} numberOfLines={1}>{track.title}</Text>
      <Text style={[styles.gridCellArtist, { color: colors.textMuted }]} numberOfLines={1}>{track.artist}</Text>
    </View>
    <TouchableOpacity style={styles.cellActionIcon} onPress={onLike}>
      <Ionicons name={isLiked ? "heart" : "heart-outline"} size={16} color={isLiked ? colors.primary : colors.textMuted} />
    </TouchableOpacity>
  </TouchableOpacity>
));

const PagingGridCell = React.memo(({ track, onPress, onLike, isLiked, colors }: CardProps) => (
  <TouchableOpacity 
    style={[styles.pagingCellWrapper, { backgroundColor: colors.surface, borderColor: colors.border, width: PAGING_COLUMN_WIDTH }]} 
    onPress={onPress} 
    activeOpacity={0.75}
  >
    <View style={styles.imageCenterWrapper}>
      <Image source={{ uri: encodeURI(track.artwork) }} style={styles.pagingCellArtwork} />
    </View>
    <View style={styles.gridCellMetadata}>
      <Text style={[styles.gridCellTitle, { color: colors.text }]} numberOfLines={1}>{track.title}</Text>
      <Text style={[styles.gridCellArtist, { color: colors.textMuted }]} numberOfLines={1}>{track.artist}</Text>
    </View>
    <TouchableOpacity style={styles.cellActionIcon} onPress={onLike}>
      <Ionicons name={isLiked ? "heart" : "heart-outline"} size={15} color={isLiked ? colors.primary : colors.textMuted} />
    </TouchableOpacity>
  </TouchableOpacity>
));

// ==========================================
// 🚀 MAIN LAZY-LOADING FEED ENGINE
// ==========================================

const HomeScreen: React.FC = () => {
  const { playTrack } = usePlayerContext();
  const { colors, isDark } = useTheme(); // 🔹 Hook link connections mapping global configurations
  const [initialTracks, setInitialTracks] = useState<Track[]>([]);
  const [allTracks, setAllTracks] = useState<Track[]>([]); 
  const [likedSongIds, setLikedSongIds] = useState<Set<string>>(new Set());
  const [historyIds, setHistoryIds] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState(''); 
  const [selectedArtist, setSelectedArtist] = useState('');
  const [loading, setLoading] = useState(true);
  const [hydrating, setHydrating] = useState(false); 

  const BACKEND_HOST = 'https://lipur-backend.onrender.com';
  // const BACKEND_HOST = 'http://10.0.2.2:8080';

  const loadData = async () => {
    try {
      const user = auth().currentUser;
      const userId = user ? user.uid : 'anonymous';
      
      const fetchedHistory = await fetchListeningHistory(userId);
      setHistoryIds(fetchedHistory);

      const fetchedTracks = await fetchSongs();
      setInitialTracks(fetchedTracks.slice(0, 15));
      setLoading(false); 

      setHydrating(true);
      setTimeout(() => {
        setAllTracks(fetchedTracks);
        setHydrating(false);
      }, 100);

    } catch (e) {
        console.error("Failed loading progressive chunks:", e);
        setLoading(false);
    }
  };

  useEffect(() => { 
    loadData(); 

    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        try {
          const state = await TrackPlayer.getPlaybackState();
          if (state.state !== State.Playing) {
            await TrackPlayer.reset();
          }
        } catch (err) {
          console.log("Background audio release bypassed", err);
        }
      }
    };

    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      appStateSubscription.remove();
    };
  }, []);

  const toggleLike = useCallback(async (songId: string) => {
    try {
      const user = auth().currentUser;
      if (!user) return;
      
      const token = await user.getIdToken(true);
      const isCurrentlyLiked = likedSongIds.has(songId);
      
      setLikedSongIds(prev => {
        const next = new Set(prev);
        if (isCurrentlyLiked) next.delete(songId);
        else next.add(songId);
        return next;
      });

      await axios.post(`${BACKEND_HOST}/songs/like`, 
        {
          songId,
          action: isCurrentlyLiked ? 'unlike' : 'like'
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (err) {
      console.warn("Failed modifying track like state:", err);
      setLikedSongIds(prev => {
        const next = new Set(prev);
        if (next.has(songId)) next.delete(songId);
        else next.add(songId);
        return next;
      });
    }
  }, [likedSongIds]);

  const activeTrackPool = useMemo(() => {
    return allTracks.length > 0 ? allTracks : initialTracks;
  }, [allTracks, initialTracks]);

  const processedTracks = useMemo(() => {
    let filtered = activeTrackPool;
    if (selectedType) {
      filtered = filtered.filter(t => t.genre?.toLowerCase() === selectedType.toLowerCase());
    }
    if (selectedArtist) {
      filtered = filtered.filter(t => t.artist?.toLowerCase() === selectedArtist.toLowerCase());
    }
    return filtered;
  }, [selectedType, selectedArtist, activeTrackPool]);

  const dynamicSections = useMemo<HomeSection[]>(() => {
    if (loading || activeTrackPool.length === 0) return [];
    
    if (selectedType || selectedArtist) {
      const displayTitle = selectedArtist ? `All Tracks by ${selectedArtist}` : `Songs matching type: ${selectedType}`;
      return [{ type: 'GRID_TWO_COLUMNS', title: displayTitle, data: processedTracks }];
    }

    const trackMap = new Map(activeTrackPool.map(t => [t.id, t]));
    const uniqueHistoryIds = Array.from(new Set(historyIds));
    const recentItems = uniqueHistoryIds.map(id => trackMap.get(id)).filter((t): t is Track => !!t).slice(0, 6);

    const top20Charts = [...processedTracks].sort((a, b) => (b.playCount || 0) - (a.playCount || 0)).slice(0, 20);
    const freshArrivals = processedTracks.slice(0, 8);

    const rows: HomeSection[] = [];

    if (recentItems.length > 0) {
      rows.push({ type: 'HORIZONTAL_HISTORY_RECT', title: 'Pick up where you left off', data: recentItems });
    }
    if (top20Charts.length > 0) {
      rows.push({ type: 'HORIZONTAL_LARGE', title: 'Top 20 Trending Charts 🔥', data: top20Charts });
    }

    if (allTracks.length === 0) return rows;

    const genreGroupMap = new Map<string, Track[]>();
    processedTracks.forEach(t => {
      const targetGenre = t.genre ? t.genre.charAt(0).toUpperCase() + t.genre.slice(1).toLowerCase() : 'Unassigned';
      if (!genreGroupMap.has(targetGenre)) genreGroupMap.set(targetGenre, []);
      genreGroupMap.get(targetGenre)!.push(t);
    });

    const artistGroupMap = new Map<string, Track[]>();
    processedTracks.forEach(t => {
      if (t.artist && t.artist !== 'Unknown Artist') {
        if (!artistGroupMap.has(t.artist)) artistGroupMap.set(t.artist, []);
        artistGroupMap.get(t.artist)!.push(t);
      }
    });
    
    const singleArtistTracks = Array.from(artistGroupMap.values()).map(arr => arr[0]).slice(0, 10);
    if (singleArtistTracks.length > 0) {
      rows.push({ type: 'HORIZONTAL_CIRCLES', title: 'Featured Singers', data: singleArtistTracks });
    }
    if (freshArrivals.length > 0) {
      rows.push({ type: 'HORIZONTAL_LARGE', title: 'Fresh Musical Arrivals', data: freshArrivals });
    }
    
    Array.from(artistGroupMap.entries()).forEach(([artistName, artistTracks]) => {
        if (artistTracks.length >= 3) {
            rows.push({ 
              type: 'GRID_TWO_COLUMNS', 
              title: `More from ${artistName}`, 
              data: artistTracks,
              isArtistSection: true 
            });
        }
    });

    Array.from(genreGroupMap.entries()).forEach(([genreTitle, genreSongs]) => {
      if (genreSongs.length > 0) {
        rows.push({ type: 'GRID_TWO_COLUMNS', title: `${genreTitle} Hits`, data: genreSongs.slice(0, 10) });
        
        if (genreSongs.length > 10) {
          rows.push({ 
            type: 'HORIZONTAL_PAGING_GRID', 
            title: `Discover More ${genreTitle}`, 
            data: genreSongs.slice(10) 
          });
        }
      }
    });

    return rows;
  }, [processedTracks, activeTrackPool, allTracks, historyIds, loading, selectedType, selectedArtist]);

  const renderVerticalRowItem = useCallback(({ item: section }: { item: HomeSection }) => {
    if (section.type === 'GRID_TWO_COLUMNS') {
        return (
          <View style={styles.sectionRowContainer}>
            <Text style={[styles.sectionRowTitle, { color: colors.text }, section.isArtistSection && styles.artistSectionTitle]}>
              {section.title}
            </Text>
            <View style={styles.gridBlocksRowWrapper}>
              {section.data.map((trackItem, index) => (
                <GridSongCell 
                  key={`grid-cell-${trackItem.id}-${index}`}
                  track={trackItem}
                  onPress={() => playTrack(trackItem, section.data)}
                  onLike={() => toggleLike(trackItem.id)}
                  isLiked={likedSongIds.has(trackItem.id)}
                  colors={colors} // 🔹 Pass dynamic configurations down
                />
              ))}
            </View>
          </View>
        );
    }

    if (section.type === 'HORIZONTAL_PAGING_GRID') {
        return (
          <View style={styles.sectionRowContainer}>
            <Text style={[styles.sectionRowTitle, { color: colors.text }]}>{section.title}</Text>
            <FlatList
              data={section.data}
              keyExtractor={(trackItem, idx) => `paging-${trackItem.id}-${idx}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.rowListPadding}
              removeClippedSubviews={true}
              initialNumToRender={6}
              renderItem={({ item: trackItem }) => (
                <PagingGridCell 
                  track={trackItem}
                  onPress={() => playTrack(trackItem, section.data)}
                  onLike={() => toggleLike(trackItem.id)}
                  isLiked={likedSongIds.has(trackItem.id)}
                  colors={colors} // 🔹 Pass dynamic configurations down
                />
              )}
            />
          </View>
        );
    }

    return (
      <View style={styles.sectionRowContainer}>
        <Text style={[styles.sectionRowTitle, { color: colors.text }]}>{section.title}</Text>
        <FlatList
          data={section.data}
          keyExtractor={(trackItem, idx) => `${trackItem.id}-${section.title}-${idx}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rowListPadding}
          removeClippedSubviews={true}
          initialNumToRender={4}
          renderItem={({ item: trackItem, index }) => {
            if (section.type === 'HORIZONTAL_HISTORY_RECT') {
              return <HistoryRectCard track={trackItem} onPress={() => playTrack(trackItem, section.data)} colors={colors} />;
            }
            if (section.type === 'HORIZONTAL_CIRCLES' && section.title === 'Featured Singers') {
              return <CircularTrackCard track={trackItem} onPress={() => setSelectedArtist(trackItem.artist)} colors={colors} />;
            }
            if (section.type === 'HORIZONTAL_CIRCLES') {
              return <CircularTrackCard track={trackItem} onPress={() => playTrack(trackItem, section.data)} rank={index + 1} colors={colors} />;
            }
            if (section.type === 'HORIZONTAL_LARGE') {
              return <LargeFreshCard track={trackItem} onPress={() => playTrack(trackItem, section.data)} colors={colors} />;
            }
            return null;
          }}
        />
      </View>
    );
  }, [likedSongIds, toggleLike, playTrack, colors]);

  const LayoutHeader = () => {
    if (selectedType || selectedArtist) {
      return (
        <View style={styles.headerBlock}>
          <TouchableOpacity style={styles.backButtonWrapper} onPress={() => { setSelectedType(''); setSelectedArtist(''); }}>
            <Ionicons name="arrow-back" size={22} color={colors.primary} />
            <Text style={[styles.backButtonText, { color: colors.primary }]}>Return to Main Feed</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.headerBlock}>
        <Text style={[styles.appHeaderLogo, { color: colors.primary }]}>Lipur</Text>
        
        <FlatList
          data={SONG_TYPES}
          keyExtractor={(typeItem) => typeItem.name}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.typeRowPadding}
          renderItem={({ item: typeItem }) => {
            const isActive = selectedType.toLowerCase() === typeItem.name.toLowerCase();
            return (
              <TouchableOpacity 
                style={[
                  styles.typeRectChip, 
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  isActive && { backgroundColor: colors.primary, borderColor: colors.primary }
                ]}
                onPress={() => setSelectedType(isActive ? '' : typeItem.name)}
                activeOpacity={0.8}
              >
                <Ionicons name={typeItem.icon} size={14} color={isActive ? "black" : colors.primary} style={{ marginRight: 6 }} />
                <Text style={[styles.typeText, { color: colors.text }, isActive && { color: 'black' }]}>{typeItem.name}</Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    );
  };

  const FooterHydrationLoader = () => {
    if (!hydrating) return null;
    return (
      <View style={styles.hydrationContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={[styles.hydrationText, { color: colors.textMuted }]}>Optimizing personalized collections...</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.fullLoaderContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={dynamicSections}
        keyExtractor={(sectionItem, idx) => `${sectionItem.title}-${idx}`}
        renderItem={renderVerticalRowItem}
        ListHeaderComponent={LayoutHeader}
        ListFooterComponent={FooterHydrationLoader}
        contentContainerStyle={styles.parentScrollPadding}
        removeClippedSubviews={true}
        initialNumToRender={3}
        maxToRenderPerBatch={4}
        windowSize={5}
      />
    </View>
  );
};

// ==========================================
// 🎨 PREMIUM STYLESHEET REFUND HOOKS
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1 },
  fullLoaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  parentScrollPadding: { paddingBottom: 130 },
  headerBlock: { paddingTop: 50, paddingBottom: 5 },
  appHeaderLogo: { fontSize: 34, fontWeight: '900', paddingHorizontal: 20, letterSpacing: -0.8 },
  
  typeRowPadding: { paddingLeft: 20, paddingTop: 16, paddingBottom: 8 },
  typeRectChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 36, borderRadius: 8, marginRight: 10, borderWidth: 1 },
  typeText: { fontSize: 13, fontWeight: '700' },

  backButtonWrapper: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10 },
  backButtonText: { fontSize: 14, fontWeight: '700', marginLeft: 10 },

  sectionRowContainer: { marginTop: 26 },
  sectionRowTitle: { fontSize: 19, fontWeight: '800', marginLeft: 20, marginBottom: 14, letterSpacing: -0.2 },
  artistSectionTitle: { fontSize: 14, fontWeight: '700', color: '#666' }, 
  rowListPadding: { paddingLeft: 20, paddingRight: 5 },
  
  imageCenterWrapper: { justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  fullImage: { width: '100%', height: '100%', resizeMode: 'cover', alignSelf: 'center' },

  historyRectContainer: { flexDirection: 'row', alignItems: 'center', width: width * 0.58, height: 56, borderRadius: 6, padding: 8, marginRight: 12, borderWidth: 1 },
  historyRectImage: { width: 40, height: 40, borderRadius: 4, resizeMode: 'cover' },
  historyRectMetadata: { flex: 1, paddingLeft: 10, justifyContent: 'center' },
  historyRectTitle: { fontSize: 13, fontWeight: '700' },
  historyRectArtist: { fontSize: 11, fontWeight: '500', marginTop: 1 },

  circularCarouselContainer: { width: 90, marginRight: 16, alignItems: 'center' },
  circularImageWrapper: { width: 80, height: 80, borderRadius: 40, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  rankCircleBadge: { position: 'absolute', top: 2, left: 2, width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  rankCircleText: { color: 'black', fontWeight: '900', fontSize: 9 },
  circularCardTitle: { fontSize: 12, fontWeight: '700', marginTop: 8, textAlign: 'center', width: '100%' },
  circularCardArtist: { fontSize: 10, fontWeight: '500', marginTop: 1, textAlign: 'center', width: '100%' },

  largeCardContainer: { width: width * 0.68, marginRight: 15, height: 130, borderRadius: 10, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  largeTextGradientOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end', padding: 12, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  largeTitle: { color: 'white', fontSize: 15, fontWeight: '800' },
  largeArtist: { color: '#B3B3B3', fontSize: 11, fontWeight: '500', marginTop: 1 },

  gridBlocksRowWrapper: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, justifyContent: 'space-between' },
  gridCellWrapper: { flexDirection: 'row', alignItems: 'center', width: GRID_COLUMN_WIDTH, height: 48, borderRadius: 6, paddingHorizontal: 8, marginBottom: 10, borderWidth: 1 },
  gridCellArtwork: { width: 34, height: 34, borderRadius: 4, resizeMode: 'cover' },
  gridCellMetadata: { flex: 1, paddingLeft: 10, justifyContent: 'center' },
  gridCellTitle: { fontSize: 13, fontWeight: '700' },
  gridCellArtist: { fontSize: 11, fontWeight: '500', marginTop: 1 },
  cellActionIcon: { padding: 4 },

  pagingCellWrapper: { flexDirection: 'row', alignItems: 'center', height: 48, borderRadius: 6, paddingHorizontal: 8, marginRight: 12, borderWidth: 1 },
  pagingCellArtwork: { width: 32, height: 32, borderRadius: 4, resizeMode: 'cover' },

  hydrationContainer: { paddingVertical: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  hydrationText: { fontSize: 12, fontWeight: '600', marginLeft: 8 }
});

export default HomeScreen;