// Lipur_ui/src/api.ts

import { SongApiData, Track } from './types';
import { API_ENDPOINT } from '@env';
// Use 10.0.2.2 to access the host machine's localhost from the Android Emulator
const API_URL = 'http://10.0.2.2:8080/songs';
const API_BASE_URL = 'http://10.0.2.2:8080';
// const API_URL = 'https://lipur-backend.onrender.com/songs';
// const API_BASE_URL = 'https://lipur-backend.onrender.com';

export async function fetchSongs(): Promise<Track[]> {
  try {
    const response = await fetch(API_URL);
    console.log(`Fetching songs from ${API_URL}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: { songs: SongApiData[] } = await response.json();

    // Map the raw API data to the cleaner Track format required by react-native-track-player and UI
    const tracks: Track[] = data.songs.map(song => {
        const cleanCoverUrl = song.coverUrl.split('?')[0];
        const namesArray = Array.isArray(song.artistNames) 
            ? song.artistNames 
            : [song.artistNames || 'Unknown Artist'];
        return {
      id: song.id,
      url: song.fileUrl,
      title: song.title,
      artist: namesArray.join(', '),
      artistNames: namesArray,
      likes: song.likes,
      playCount: song.playCount,
      duration: song.duration,
      artwork: cleanCoverUrl,
  }});
    
    return tracks;
    
  } catch (error) {
    console.error('Failed to fetch songs:', error);
    // Return an empty array on failure
    return [];
  }
}

export async function getStreamingUrl(restrictedFileUrl: string): Promise<string> {
    // 1. Construct the query string with the full restricted URL
    // The query key is 'file', and the value must be encoded.
    const queryString = new URLSearchParams({ file: restrictedFileUrl }).toString();
    
    const STREAM_URL = `${API_BASE_URL}/stream-url?${queryString}`;
    
    try {
        const response = await fetch(STREAM_URL);
        if (!response.ok) {
            // Log the full response body for debugging if status is not OK
            const errorBody = await response.text();
            console.error('Failed to get signed URL. Response body:', errorBody);
            throw new Error(`Failed to get signed URL: HTTP status ${response.status}`);
        }
        
        // 2. Expect a JSON object with a key named 'url'
        const data: { url: string } = await response.json(); 
        
        // 3. The signed URL might also need a final URI encoding if it contains unencoded spaces
        // However, we return it as is first, assuming the backend has encoded it correctly.
        return data.url; 
    } catch (error) {
        console.error('Error fetching signed URL:', error);
        throw new Error('Could not retrieve streaming URL.');
    }
}

export async function fetchSongsByArtist(artistId: string): Promise<Track[]> {
    // Note: API_BASE_URL is assumed to be 'http://10.0.2.2:8080'
    const ARTIST_SONGS_URL = `${API_BASE_URL}/songs-by-artist?artistId=${artistId}`;
    
    try {
        const response = await fetch(ARTIST_SONGS_URL);
        console.log(`Fetching songs for artist ID: ${artistId}`);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        // The backend returns a JSON object like { songs: [...] }
        const data: { songs: SongApiData[] } = await response.json();

        // Re-use your existing robust mapping logic
        const tracks: Track[] = data.songs.map(song => {
            const cleanCoverUrl = song.coverUrl.split('?')[0];
            const namesArray = Array.isArray(song.artistNames) 
                ? song.artistNames 
                : [song.artistNames || 'Unknown Artist'];
                
            return {
                id: song.id,
                url: song.fileUrl,
                title: song.title,
                artist: namesArray.join(', '),
                artistNames: namesArray,
                likes: song.likes || 0,
                playCount: song.playCount || 0,
                duration: song.duration || 0,
                artwork: cleanCoverUrl,
            };
        });
        
        return tracks;
        
    } catch (error) {
        console.error('Failed to fetch artist songs:', error);
        return [];
    }
}