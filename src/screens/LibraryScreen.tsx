// Lipur_ui/src/screens/LibraryScreen.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import { fetchSongs } from '../api';
import { Track } from '../types';
import MiniPlayer from '../components/MiniPlayer';
import { usePlayerContext } from '../contexts/PlayerContext';
import { IconButton } from 'react-native-paper';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext'; // 🔹 Consume global tokens

type LibraryTab = 'ALL' | 'LIKED' | 'PLAYLISTS' | 'DOWNLOADS';
const DOWNLOAD_MAPPING_KEY = '@lipur_local_downloads';

interface LibrarySongRowProps {
  track: Track;
  onPress: () => void;
  colors: any;
}

const LibrarySongRow = React.memo(({ track, onPress, colors }: LibrarySongRowProps) => (
  <TouchableOpacity style={[styles.rowWrapper, { borderBottomColor: colors.border }]} onPress={onPress} activeOpacity={0.75}>
    <Image source={{ uri: encodeURI(track.artwork || 'https://cdn-icons-png.flaticon.com/512/847/847969.png') }} style={styles.rowArtwork} />
    <View style={styles.rowMetadata}>
      <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={1}>{track.title}</Text>
      <View style={styles.rowSubtitleFlex}>
        <Ionicons name="sparkles-sharp" size={12} color={colors.primary} style={{ marginRight: 5 }} />
        <Text style={[styles.rowArtist, { color: colors.textMuted }]} numberOfLines={1}>{track.artist}</Text>
      </View>
    </View>
    <IconButton icon="chevron-right" iconColor={colors.textMuted} size={24} />
  </TouchableOpacity>
));

const LibraryScreen: React.FC = () => {
  const { playTrack } = usePlayerContext();
  const { colors } = useTheme(); // 🔹 Deconstruct shared style states
  const [activeTab, setActiveTab] = useState<LibraryTab>('ALL');
  const [allTracks, setAllTracks] = useState<Track[]>([]);
  const [localDownloads, setLocalDownloads] = useState<Track[]>([]); // 🔹 Dedicated offline tracker state
  const [loading, setLoading] = useState(true);

  const loadLibraryData = async () => {
    try {
      // 1. Instantly pull down your offline download keys from native storage coordinates
      const rawMapping = await AsyncStorage.getItem(DOWNLOAD_MAPPING_KEY);
      const offlineMapping = rawMapping ? JSON.parse(rawMapping) : {};
      const downloadedIds = new Set(Object.keys(offlineMapping));

      // 2. Fetch tracks from network fallback gracefully to empty collection if offline
      const liveCollection = await fetchSongs().catch(() => []);
      setAllTracks(liveCollection);

      // 3. Match track objects to local storage files
      if (liveCollection.length > 0) {
        const filteredDownloads = liveCollection.filter(t => downloadedIds.has(t.id));
        setLocalDownloads(filteredDownloads);
      } else {
        // 🔹 FIXED: Rebuild fully compliant offline track objects to satisfy core types.ts interface
        const offlineTracks: Track[] = Object.keys(offlineMapping).map(id => ({
          id,
          url: offlineMapping[id], // Maps directly onto your native physical device file binary
          title: 'Cached Offline Track',
          artist: 'Local Asset Storage',
          artistNames: ['Local Asset Storage'],
          artistIds: [],
          duration: 0,
          totalPlayTime: 0,
          artwork: 'https://cdn-icons-png.flaticon.com/512/847/847969.png',
          likes: 0,
          genre: 'Local',
          createdYear: '2026',
          playCount: 0
        }));
        setLocalDownloads(offlineTracks);
      }
    } catch (err) {
      console.warn("Offline library initialization safety pass handled:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLibraryData();
  }, [activeTab]);

  const viewData = useMemo(() => {
    switch (activeTab) {
      case 'DOWNLOADS': 
        return localDownloads; // 🔹 Resolves true disk variables dynamically under any server state
      case 'LIKED': 
        return allTracks.filter(t => t.likes > 0);
      case 'PLAYLISTS': 
        return [];
      case 'ALL':
      default: 
        return allTracks;
    }
  }, [activeTab, allTracks, localDownloads]);

  const PillComponentHeader = () => (
    <View style={styles.pillContainerRow}>
      {([
        { id: 'ALL', label: 'All Audio', icon: 'disc-outline' },
        { id: 'LIKED', label: 'Liked Tracks', icon: 'heart' },
        { id: 'PLAYLISTS', label: 'Playlists', icon: 'list-circle-outline' },
        { id: 'DOWNLOADS', label: 'Downloads', icon: 'cloud-download-outline' }
      ] as const).map((tab) => {
        const isCurrent = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.vibrantPillButton, 
              { backgroundColor: colors.surface, borderColor: colors.border },
              isCurrent && { backgroundColor: colors.primary, borderColor: colors.primary }
            ]}
            onPress={() => setActiveTab(tab.id)}
            activeOpacity={0.8}
          >
            <Ionicons name={tab.icon} size={15} color={isCurrent ? "black" : colors.primary} style={{ marginRight: 6 }} />
            <Text style={[styles.pillLabelText, { color: colors.textMuted }, isCurrent && styles.pillLabelTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.mainTitleHeader, { color: colors.text }]}>Your Library</Text>
      <FlatList
        data={viewData}
        keyExtractor={(item) => `lib-row-${item.id}`}
        ListHeaderComponent={PillComponentHeader}
        renderItem={({ item }) => <LibrarySongRow track={item} onPress={() => playTrack(item, viewData)} colors={colors} />}
        contentContainerStyle={styles.verticalScrollBounds}
        removeClippedSubviews={true}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name={activeTab === 'DOWNLOADS' ? "cloud-offline-outline" : "folder-open-outline"} size={45} color={colors.border} />
            <Text style={[styles.emptyTextSub, { color: colors.textMuted }]}>
              {activeTab === 'DOWNLOADS' 
                ? "No downloaded audio assets stored on this device yet." 
                : "No tracks available inside this category section."}
            </Text>
          </View>
        }
      />
      <MiniPlayer />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  mainTitleHeader: { fontSize: 30, fontWeight: '900', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 10, letterSpacing: -0.5 },
  verticalScrollBounds: { paddingBottom: 150 },
  pillContainerRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, justifyContent: 'space-between', marginBottom: 15 },
  vibrantPillButton: { flexDirection: 'row', alignItems: 'center', width: '48%', height: 46, borderRadius: 23, justifyContent: 'center', marginBottom: 10, borderWidth: 1 },
  pillLabelText: { fontSize: 13, fontWeight: '700' },
  pillLabelTextActive: { color: 'black' },
  rowWrapper: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 20, borderBottomWidth: 1 },
  rowArtwork: { width: 56, height: 56, borderRadius: 8, backgroundColor: '#161616' },
  rowMetadata: { flex: 1, justifyContent: 'center', paddingLeft: 16 },
  rowTitle: { fontSize: 15, fontWeight: '700', letterSpacing: -0.1 },
  rowSubtitleFlex: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  rowArtist: { fontSize: 13, fontWeight: '500' },
  emptyContainer: { alignItems: 'center', marginTop: 60, paddingHorizontal: 40 },
  emptyTextSub: { fontSize: 13, fontWeight: '600', marginTop: 12, textAlign: 'center' }
});

export default LibraryScreen;