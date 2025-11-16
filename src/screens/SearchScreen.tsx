// Lipur_ui/src/screens/SearchScreen.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, FlatList, ActivityIndicator, TouchableOpacity, Alert, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useDebounce } from '../hooks/useDebounce';
import { Track } from '../types'; 
import { usePlayerContext } from '../contexts/PlayerContext';
import { fetchSongsByArtist } from '../api';

// --- Configuration ---
const SEARCH_API_ENDPOINT = 'http://10.0.2.2:8080/search?q='; 
// const SEARCH_API_ENDPOINT = 'https://lipur-backend.onrender.com/search?q='; 

// Extend Track to include search-specific metadata (Type is essential for action handler)
interface SearchResult extends Track {
    type: 'song' | 'artist' | 'album';
    artistId?: string;
}


// --- NEW COMPONENT DEFINITION: Used to render songs in the artist's discography ---
interface ArtistSongListItemProps {
    track: Track;
    playlist: Track[]; // The full list of songs from the artist
    playTrack: (track: Track, playlist?: Track[]) => void;
}

const ArtistSongListItem: React.FC<ArtistSongListItemProps> = ({ track, playTrack, playlist }) => {
    const encodedUri = encodeURI(track.artwork || ''); 
    const artistList = track.artist;

    return (
        <TouchableOpacity style={styles.listItem} onPress={() => playTrack(track, playlist)}>
            <Image
                source={{ uri: encodedUri }}
                style={styles.coverArt} 
            />
            <View style={styles.resultTextContainer}>
                <Text style={styles.resultTitle} numberOfLines={1}>{track.title}</Text>
                <Text style={styles.resultSubtitle} numberOfLines={1}>{artistList}</Text>
            </View>
            <Icon name="play-circle-outline" size={24} color="#1DB954" style={{ marginLeft: 15 }} />
        </TouchableOpacity>
    );
};
// ------------------------------------------------------------------------------------


const SearchScreen: React.FC = () => {
    const { playTrack } = usePlayerContext();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const debouncedQuery = useDebounce(query, 400);

    const [artistSongs, setArtistSongs] = useState<Track[] | null>(null);
    const [artistName, setArtistName] = useState('');
    const [loadingSongs, setLoadingSongs] = useState(false);

    // Placeholder data for initial screen (UX boost)
    const recentSearches = ['Pop Hits', '90s Rock', 'Dhani Marandi'];
    const trendingGenres = ['Hip Hop', 'Instrumental', 'Workout'];

    // 🚀 Universal Click Handler: Decides whether to Play or Navigate
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
            const response = await fetch(`${SEARCH_API_ENDPOINT}${encodeURIComponent(searchTerm)}`);
            const data: { results: SearchResult[] } = await response.json(); 
            
            setResults(data.results || []); 
            
        } catch (e) {
            console.error("Search API failed:", e);
            setResults([]);
        } finally {
            setIsSearching(false);
        }
    };
    
    const handleArtistPress = async (item: SearchResult) => {
        if (item.type !== 'artist') return;

        setLoadingSongs(true);
        setArtistSongs(null); // Clear previous state
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
    
    const handleSongPlay = (track: Track, playlist?: Track[]) => { 
    // The playTrack function in the context expects an optional playlist
    // We pass the playlist if it exists, otherwise pass undefined/rely on context fallback
    playTrack(track, playlist); 
};

    // 🚀 EFFECT: Trigger search when the debounced query changes
    useEffect(() => {
        performSearch(debouncedQuery);
    }, [debouncedQuery]);

    // --- Render Functions ---

    const renderRecents = () => (
        <View style={styles.section}>
            <Text style={styles.sectionHeader}>Recent Searches</Text>
            {recentSearches.map(item => (
                <TouchableOpacity key={item} style={styles.recentItem} onPress={() => setQuery(item)}>
                    <Text style={styles.recentText}>{item}</Text>
                </TouchableOpacity>
            ))}
            
            <Text style={styles.sectionHeader}>Trending Genres</Text>
            <View style={styles.genreGrid}>
                {trendingGenres.map(item => (
                    <TouchableOpacity key={item} style={styles.genreBox} onPress={() => setQuery(item)}>
                        <Text style={styles.genreText}>{item}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );


    const renderArtistSongsList = () => {
        if (loadingSongs) {
            return <ActivityIndicator size="large" color="#1DB954" style={{ marginTop: 50 }} />;
        }
        
        if (!artistSongs || artistSongs.length === 0) {
             return (
                <View style={styles.artistListContainer}>
                    <TouchableOpacity onPress={() => setArtistSongs(null)} style={styles.backButton}>
                         <Icon name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={[styles.artistSongHeader, {marginTop: 50}]}>No songs found for {artistName}.</Text>
                </View>
            );
        }

        return (
            <View style={styles.artistListContainer}>
                <View style={styles.artistHeaderRow}>
                    <TouchableOpacity onPress={() => setArtistSongs(null)} style={styles.backButton}>
                         <Icon name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.artistSongHeader}>{artistName}'s Discography</Text>
                </View>
                
                <FlatList
                    data={artistSongs}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                        <ArtistSongListItem track={item} playTrack={handleSongPlay} playlist={artistSongs} />
                    )}
                    style={styles.resultsList}
                    contentContainerStyle={{ paddingBottom: 150 }}
                />
            </View>
        );
    };


    const renderResultItem = ({ item }: { item: SearchResult }) => (
        <TouchableOpacity 
            style={styles.resultItem} 
            onPress={() => handleResultPress(item)} 
        >
            <View style={styles.iconPlaceholder}>
                <Icon name={item.type === 'artist' ? 'person' : 'music-note'} size={24} color="white" />
            </View>
            <View style={styles.resultTextContainer}>
                <Text style={styles.resultTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.resultSubtitle} numberOfLines={1}>{item.artist} • {item.type}</Text>
            </View>
        </TouchableOpacity>
    );

    // --- Main Render ---
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.searchContainer}>
                <Icon name="search" size={24} color="#B3B3B3" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Songs, artists, podcasts..."
                    placeholderTextColor="#B3B3B3"
                    value={query}
                    onChangeText={setQuery}
                    autoCapitalize="none"
                    autoCorrect={false}
                />
                {isSearching && <ActivityIndicator size="small" color="#1DB954" style={styles.loadingIndicator} />}
            </View>

            {/* Conditional Rendering: Show recents/categories OR live results */}
            {artistSongs ? (
                renderArtistSongsList() // RENDER ARTIST DISCOGRAPHY
            ) : query.length < 2 ? (
                renderRecents() // RENDER RECENTS/CATEGORIES
            ) : (
                <FlatList
                    data={results}
                    keyExtractor={item => item.id}
                    renderItem={renderResultItem}
                    ListEmptyComponent={!isSearching && query.length >= 2 ? <Text style={styles.emptyText}>No results found for "{query}"</Text> : null}
                    style={styles.resultsList}
                    contentContainerStyle={{ paddingBottom: 150 }}
                />
            )}
        </SafeAreaView>
    );
};


const styles = StyleSheet.create({
    section:{
        marginBottom: 20,
    },
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#282828',
        borderRadius: 8,
        margin: 15,
        paddingHorizontal: 10,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        height: 50,
        color: 'white',
        fontSize: 18,
    },
    loadingIndicator: {
        marginLeft: 10,
    },
    // --- Recents & Categories Styles ---
    sectionHeader: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 15,
        marginTop: 20,
        marginBottom: 10,
    },
    recentItem: {
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderBottomWidth: 0.5,
        borderBottomColor: '#333',
    },
    recentText: {
        color: '#B3B3B3',
        fontSize: 16,
    },
    genreGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 15,
    },
    genreBox: {
        backgroundColor: '#333',
        padding: 15,
        borderRadius: 8,
        margin: 5,
        minWidth: '45%',
    },
    genreText: {
        color: 'white',
        fontWeight: 'bold',
    },
    // --- Results Styles ---
    resultsList: {
        // paddingBottom is now set in the component's style prop, not here.
    },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
    },
    iconPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    resultTextContainer: {
        flex: 1,
    },
    resultTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    resultSubtitle: {
        color: '#B3B3B3',
        fontSize: 14,
    },
    emptyText: {
        color: '#B3B3B3',
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
    },
    
    // --- Artist List Specific Styles ---
    artistListContainer: {
        flex: 1,
        backgroundColor: '#121212',
        paddingTop: 10,
    },
    artistHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#282828',
    },
    artistSongHeader: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        flex: 1,
        textAlign: 'center',
        marginRight: 24, 
    },
    backButton: {
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        position: 'absolute',
        left: 5,
    },
    // --- Song List Item Styles (Reused from HomeScreen/ArtistSongListItem) ---
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderBottomWidth: 0.5,
        borderBottomColor: '#333',
    },
    coverArt: {
        width: 50,
        height: 50,
        borderRadius: 5,
        marginRight: 15,
        backgroundColor: '#333', // Placeholder color
    },
});

export default SearchScreen;