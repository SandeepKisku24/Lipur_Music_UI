// Defines the structure of a song object returned by your backend API
export interface SongApiData {
  artistId: string;
  artistName: string;
  coverUrl: string;
  downloads: number;
  duration: number;
  fileName: string;
  fileUrl: string; // The URL for the actual audio file
  genre: string;
  id: string;
  likes: number;
  playCount: number;
  title: string;
  uploadedAt: number;
}

// Defines the simplified structure needed for rendering and track-player
// We map the backend data to this structure
export interface Track {
  id: string;
  url: string; // Maps to fileUrl
  title: string;
  artist: string; // Maps to artistName
  artwork: string; // Maps to coverUrl
  likes: number; // Optional likes property
  playCount: number; // Optional playCount property
  duration: number; // Optional duration property
}