// Lipur_ui/src/api.ts
import auth from '@react-native-firebase/auth'; // 🔹 FIXED: Added missing Firebase Auth import definition
import { SongApiData, Track } from './types';
import { API_ENDPOINT } from '@env';

const API_URL = 'https://lipur-backend.onrender.com/songs';
const API_BASE_URL = 'https://lipur-backend.onrender.com';

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
          artistIds: idsArray, 
          likes: song.likes || 0,
          playCount: song.playCount || 0,
          duration: song.duration || 0,
          artwork: cleanCoverUrl,
          totalPlayTime: song.totalPlayTime || 0,
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

export const fetchSongsByArtist = async (artistId: string): Promise<any[]> => {
  try {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      throw new Error("No authenticated session found.");
    }
    
    const token = await currentUser.getIdToken();

    const response = await fetch(`https://lipur-backend.onrender.com/songs-by-artist?artistId=${artistId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    return data.songs || data; 
  } catch (error) {
    console.error(`Error inside fetchSongsByArtist utility layer:`, error);
    throw error;
  }
};

export async function fetchListeningHistory(userId: string): Promise<string[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/analytics/history?userId=${userId}`);
        if (!response.ok) return [];
        
        const data = await response.json();
        return data.history.map((item: any) => item.songId);
    } catch (error) {
        console.error('Failed to fetch history:', error);
        return [];
    }
}