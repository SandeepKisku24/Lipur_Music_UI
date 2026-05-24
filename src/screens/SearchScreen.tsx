// Lipur_ui/src/screens/SearchScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, FlatList, ActivityIndicator, TouchableOpacity, Alert, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useDebounce } from '../hooks/useDebounce';
import { Track } from '../types'; 
import { usePlayerContext } from '../contexts/PlayerContext';
import { fetchSongsByArtist } from '../api';
import auth from '@react-native-firebase/auth';
import { useTheme } from '../contexts/ThemeContext'; // 🔹 Hooking into your dynamic theme provider

const SEARCH_API_ENDPOINT = 'https://lipur-backend.onrender.com/search?q='; 

interface SearchResult extends Track {
    type: 'song' | 'artist' | 'album';
    artistId?: string;
}

interface ArtistSongListItemProps {
    track: Track;
    playlist: Track[]; 
    playTrack: (track: Track, playlist?: Track[]) => void;
    colors: any;
}

const ArtistSongListItem: React.FC<ArtistSongListItemProps> = React.memo(({ track, playTrack, playlist, colors }) => {
    const encodedUri = encodeURI(track.artwork || ''); 
    const artistList = track.artist;

    return (
        <TouchableOpacity 
            style={[styles.listItem, { borderBottomColor: colors.border }]} 
            onPress={() => playTrack(track, playlist)} 
            activeOpacity={0.7}
        >
            <Image source={{ uri: encodedUri }} style={styles.coverArt} />
            <View style={styles.resultTextContainer}>
                <Text style={[styles.resultTitle, { color: colors.text }]} numberOfLines={1}>{track.title}</Text>
                <Text style={[styles.resultSubtitle, { color: colors.textMuted }]} numberOfLines={1}>{artistList}</Text>
            </View>
            <Icon name="play-circle-outline" size={26} color={colors.primary} style={{ marginLeft: 15 }} />
        </TouchableOpacity>
    );
});

const SearchScreen: React.FC = () => {
    const { playTrack } = usePlayerContext();
    const { colors, isDark } = useTheme(); // 🔹 Destructuring your dynamic design tokens
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const debouncedQuery = useDebounce(query, 400);

    const [artistSongs, setArtistSongs] = useState<Track[] | null>(null);
    const [artistName, setArtistName] = useState('');
    const [loadingSongs, setLoadingSongs] = useState(false);

    const recentSearches = ['Stephan Tudu', 'Classic', 'Dhani Marandi'];
    const trendingGenres = ['Pop', 'Classic', 'Folk'];

    const handleResultPress = async (item: SearchResult) => {
        if (item.type === 'song') {
            const trackToPlay: Track = item as Track; 
            if (!trackToPlay.url) {
                 Alert.alert("Error", "Track data is incomplete. Cannot stream.");
                 return;
            }
            playTrack(trackToPlay, [trackToPlay]); 
            
        } else if (item.type === 'artist') {
            handleArtistPress(item);
        }
    };

    const performSearch = async (searchTerm: string) => {
        if (searchTerm.length < 2) {
            setResults([]);
            return;
        }
        setIsSearching(true);
        
        try {
            const currentUser = auth().currentUser;
            if (!currentUser) {
                console.warn('[Search Engine] Action blocked. User session unavailable.');
                setIsSearching(false);
                return;
            }
            
            const token = await currentUser.getIdToken(true);

            const response = await fetch(`${SEARCH_API_ENDPOINT}${encodeURIComponent(searchTerm)}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                console.error(`[Search failure] Server rejected signature handshake: ${response.status}`);
                setResults([]);
                return;
            }

            const data: { results: SearchResult[] } = await response.json(); 
            setResults(data.results || []); 
        } catch (e) {
            console.error("Search API transaction failed:", e);
            setResults([]);
        } finally {
            setIsSearching(false);
        }
    };
    
    const handleArtistPress = async (item: SearchResult) => {
        if (item.type !== 'artist') return;

        setLoadingSongs(true);
        setArtistSongs(null); 
        setArtistName(item.title);
        
        try {
            const songs = await fetchSongsByArtist(item.id); 
            setArtistSongs(songs); 
        } catch (e) {
            Alert.alert("Error", "Could not fetch songs for this artist.");
            setArtistSongs([]);
        } finally {
            setLoadingSongs(false);
        }
    };
    
    const handleSongPlay = useCallback((track: Track, playlist?: Track[]) => { 
        playTrack(track, playlist); 
    }, [playTrack]);

    useEffect(() => {
        performSearch(debouncedQuery);
    }, [debouncedQuery]);

    const renderRecents = () => (
        <View style={styles.section}>
            <Text style={[styles.sectionHeader, { color: colors.text }]}>Recent Searches</Text>
            {recentSearches.map(item => (
                <TouchableOpacity 
                    key={item} 
                    style={[styles.recentItem, { borderBottomColor: colors.border }]} 
                    onPress={() => setQuery(item)} 
                    activeOpacity={0.6}
                >
                    <Icon name="history" size={20} color={colors.textMuted} style={{ marginRight: 15 }} />
                    <Text style={[styles.recentText, { color: colors.textMuted }]}>{item}</Text>
                </TouchableOpacity>
            ))}
            
            <Text style={[styles.sectionHeader, { color: colors.text }]}>Trending Genres</Text>
            <View style={styles.genreGrid}>
                {trendingGenres.map(item => (
                    <TouchableOpacity 
                        key={item} 
                        style={[styles.genreBox, { backgroundColor: colors.surface, borderColor: colors.border }]} 
                        onPress={() => setQuery(item)} 
                        activeOpacity={0.85}
                    >
                        <Text style={[styles.genreText, { color: colors.text }]}>{item}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    const renderArtistSongsList = () => {
        if (loadingSongs) {
            return <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />;
        }
        
        if (!artistSongs || artistSongs.length === 0) {
             return (
                <View style={[styles.artistListContainer, { backgroundColor: colors.background }]}>
                    <TouchableOpacity onPress={() => setArtistSongs(null)} style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                         <Icon name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.artistSongHeader, { color: colors.text, marginTop: 50 }]}>No songs found for {artistName}.</Text>
                </View>
            );
        }

        return (
            <View style={[styles.artistListContainer, { backgroundColor: colors.background }]}>
                <View style={styles.artistHeaderRow}>
                    <TouchableOpacity onPress={() => setArtistSongs(null)} style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                         <Icon name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.artistSongHeader, { color: colors.text }]}>{artistName}'s Discography</Text>
                </View>
                
                <FlatList
                    data={artistSongs}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                        <ArtistSongListItem track={item} playTrack={handleSongPlay} playlist={artistSongs} colors={colors} />
                    )}
                    contentContainerStyle={{ paddingBottom: 150 }}
                    removeClippedSubviews={true}
                />
            </View>
        );
    };

    const renderResultItem = ({ item }: { item: SearchResult }) => {
        const isArtistCell = item.type === 'artist';
        return (
            <TouchableOpacity 
                style={[styles.resultItem, { borderBottomColor: colors.border }]} 
                onPress={() => handleResultPress(item)} 
                activeOpacity={0.75}
            >
                <View style={[
                    styles.iconPlaceholder, 
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    isArtistCell && [styles.circularArtistAvatar, { borderColor: colors.primary }]
                ]}>
                    {item.artwork ? (
                        <Image source={{ uri: encodeURI(item.artwork) }} style={styles.cellImageInline} />
                    ) : (
                        <Icon name={isArtistCell ? 'person' : 'music-note'} size={22} color={isArtistCell ? colors.primary : colors.text} />
                    )}
                </View>
                <View style={styles.resultTextContainer}>
                    <Text style={[styles.resultTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
                    <Text style={[styles.resultSubtitle, { color: colors.textMuted }]} numberOfLines={1}>
                        {isArtistCell ? 'Verified Singer Profile' : `${item.artist} • Track`}
                    </Text>
                </View>
                <Icon name="chevron-right" size={20} color={colors.border} />
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Icon name="search" size={22} color={colors.textMuted} style={styles.searchIcon} />
                <TextInput
                    style={[styles.searchInput, { color: colors.text }]}
                    placeholder="Songs, artists, genres..."
                    placeholderTextColor={isDark ? "#555" : "#A0A0A0"}
                    value={query}
                    onChangeText={setQuery}
                    autoCapitalize="none"
                    autoCorrect={false}
                />
                {isSearching && <ActivityIndicator size="small" color={colors.primary} style={styles.loadingIndicator} />}
            </View>

            {artistSongs ? (
                renderArtistSongsList() 
            ) : query.length < 2 ? (
                renderRecents() 
            ) : (
                <FlatList
                    data={results}
                    keyExtractor={item => `search-${item.id}`}
                    renderItem={renderResultItem}
                    ListEmptyComponent={!isSearching && query.length >= 2 ? <Text style={[styles.emptyText, { color: colors.textMuted }]}>No results found for "{query}"</Text> : null}
                    contentContainerStyle={{ paddingBottom: 150 }}
                    removeClippedSubviews={true}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    section: { marginBottom: 20 },
    searchContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 25, margin: 15, paddingHorizontal: 16, height: 48, borderWidth: 1 },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, fontSize: 15, fontWeight: '600' },
    loadingIndicator: { marginLeft: 10 },
    
    sectionHeader: { fontSize: 19, fontWeight: '800', marginLeft: 20, marginTop: 22, marginBottom: 12, letterSpacing: -0.3 },
    recentItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1 },
    recentText: { fontSize: 15, fontWeight: '500' },
    
    genreGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 15, justifyContent: 'space-between' },
    genreBox: { paddingVertical: 16, paddingHorizontal: 20, borderRadius: 8, marginVertical: 5, width: '48%', borderWidth: 1, alignItems: 'center' },
    genreText: { fontWeight: '700', fontSize: 14 },
    
    resultItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 20, borderBottomWidth: 1 },
    iconPlaceholder: { width: 44, height: 44, borderRadius: 6, justifyContent: 'center', alignItems: 'center', marginRight: 15, overflow: 'hidden', borderWidth: 1 },
    circularArtistAvatar: { borderRadius: 22, borderWidth: 1.5 },
    cellImageInline: { width: '100%', height: '100%', resizeMode: 'cover' },
    resultTextContainer: { flex: 1 },
    resultTitle: { fontSize: 15, fontWeight: '700' },
    resultSubtitle: { fontSize: 13, marginTop: 2, fontWeight: '500' },
    emptyText: { textAlign: 'center', marginTop: 60, fontSize: 14, fontWeight: '600' },
    
    artistListContainer: { flex: 1 },
    artistHeaderRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingBottom: 15, paddingTop: 10 },
    artistSongHeader: { fontSize: 21, fontWeight: '800', flex: 1, textAlign: 'center', marginRight: 30, letterSpacing: -0.2 },
    backButton: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center', zIndex: 10, borderRadius: 18, borderWidth: 1 },
    
    listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 20, borderBottomWidth: 1 },
    coverArt: { width: 44, height: 44, borderRadius: 6, marginRight: 15, backgroundColor: '#121212' }
});

export default SearchScreen;