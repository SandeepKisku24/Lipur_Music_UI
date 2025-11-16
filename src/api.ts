// Lipur_ui/src/api.ts

import { SongApiData, Track } from './types';
import { API_ENDPOINT } from '@env';

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

    const tracks: Track[] = data.songs.map(song => {
        const cleanCoverUrl = song.coverUrl.split('?')[0];
        
        // Use a safe fallback for names
        const namesArray = Array.isArray(song.artistNames) 
            ? song.artistNames 
            : ['Unknown Artist'];
        
        // Use a safe fallback for IDs
        const idsArray = Array.isArray(song.artistIds)
            ? song.artistIds
            : [];

        return {
          id: song.id,
          url: song.fileUrl,
          title: song.title,
          artist: namesArray.join(', '), // Comma-separated string
          artistNames: namesArray,
          
          // 🔹 FIX 1: Map from 'song.artistIds' (plural)
          artistIds: idsArray, 
          
          likes: song.likes || 0,
          playCount: song.playCount || 0,
          duration: song.duration || 0,
          artwork: cleanCoverUrl,
          
          // 🔹 FIX 2: Map the new fields
          genre: song.genre || 'Unknown',
          createdYear: song.createdYear || 'N/A',
        };
    });
    
    return tracks;
    
  } catch (error) {
    console.error('Failed to fetch songs:', error);
    return [];
  }
}

export async function getStreamingUrl(restrictedFileUrl: string): Promise<string> {
    // ... (This function is correct and needs no changes) ...
    const queryString = new URLSearchParams({ file: restrictedFileUrl }).toString();
    const STREAM_URL = `${API_BASE_URL}/stream-url?${queryString}`;
    
    try {
        const response = await fetch(STREAM_URL);
        if (!response.ok) {
            const errorBody = await response.text();
            console.error('Failed to get signed URL. Response body:', errorBody);
            throw new Error(`Failed to get signed URL: HTTP status ${response.status}`);
        }
        const data: { url: string } = await response.json(); 
        return data.url; 
    } catch (error) {
        console.error('Error fetching signed URL:', error);
        throw new Error('Could not retrieve streaming URL.');
    }
}

export async function fetchSongsByArtist(artistId: string): Promise<Track[]> {
    const ARTIST_SONGS_URL = `${API_BASE_URL}/songs-by-artist?artistId=${artistId}`;
    
    try {
        const response = await fetch(ARTIST_SONGS_URL);
        console.log(`Fetching songs for artist ID: ${artistId}`);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data: { songs: SongApiData[] } = await response.json();

        const tracks: Track[] = data.songs.map(song => {
            const cleanCoverUrl = song.coverUrl.split('?')[0];
            
            const namesArray = Array.isArray(song.artistNames) 
                ? song.artistNames 
                : ['Unknown Artist'];
            
            const idsArray = Array.isArray(song.artistIds)
                ? song.artistIds
                : [];
                
            return {
                id: song.id,
                url: song.fileUrl,
                title: song.title,
                artist: namesArray.join(', '),
                artistNames: namesArray,
                
                // 🔹 FIX 3: Correctly map 'song.artistIds'
                artistIds: idsArray, 
                
                likes: song.likes || 0,
                genre: song.genre || 'Unknown',
                
                // 🔹 FIX 4: Map 'song.createdYear' (string to string)
                createdYear: song.createdYear || 'N/A', 
                
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