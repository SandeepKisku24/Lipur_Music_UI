// Lipur_ui/src/screens/ArtistDetailScreen.tsx

import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { Track } from '../types';
import { usePlayerContext } from '../contexts/PlayerContext';
import { IconButton } from 'react-native-paper'; // For the list item actions

interface ArtistDetailScreenProps {
    artistName: string;
    songs: Track[];
    onBack: () => void;
}

// Reuse the SongListItem structure for consistency
const ArtistSongListItem: React.FC<{ track: Track, playTrack: (t: Track, p: Track[]) => void, playlist: Track[] }> = ({ track, playTrack, playlist }) => {
    const encodedUri = encodeURI(track.artwork);
    
    return(
        <TouchableOpacity style={styles.listItem} onPress={() => playTrack(track, playlist)}>
            <Image source={{ uri: encodedUri }} style={styles.coverArt} />
            <View style={styles.textContainer}>
                <Text style={styles.title} numberOfLines={1}>{track.title}</Text>
                <Text style={styles.artist} numberOfLines={1}>{track.artist}</Text>
            </View>
            <IconButton icon="play" size={20} iconColor="#1DB954" onPress={() => playTrack(track, playlist)} />
        </TouchableOpacity>
    );
};


const ArtistDetailScreen: React.FC<ArtistDetailScreenProps> = ({ artistName, songs, onBack }) => {
    const { playTrack } = usePlayerContext();

    // Function to play a song and pass the artist's full discography as the playlist
    const handlePlay = (track: Track) => {
        playTrack(track, songs);
    };

    return (
        <SafeAreaView style={styles.container}>
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
                <IconButton icon="arrow" size={24} />
            </TouchableOpacity>
            
            <Text style={styles.header}>All Songs by</Text>
            <Text style={styles.artistNameHeader}>{artistName}</Text>

            <FlatList
                data={songs}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <ArtistSongListItem track={item} playTrack={handlePlay} playlist={songs} />
                )}
                style={styles.list}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#121212', paddingBottom: 150 },
    backButton: { margin: 15, position: 'absolute', top: 30, zIndex: 10 },
    header: { fontSize: 20, color: '#B3B3B3', textAlign: 'center', marginTop: 40 },
    artistNameHeader: { fontSize: 36, fontWeight: 'bold', color: 'white', textAlign: 'center', marginBottom: 20 },
    list: { paddingHorizontal: 10 },
    listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomColor: '#333', borderBottomWidth: 0.5 },
    coverArt: { width: 50, height: 50, borderRadius: 5, marginRight: 15 },
    textContainer: { flex: 1 },
    title: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    artist: { color: '#B3B3B3', fontSize: 14 },
});

export default ArtistDetailScreen;