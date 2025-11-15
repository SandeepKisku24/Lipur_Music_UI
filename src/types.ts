// Lipur_ui/src/types.ts

// Defines the structure of a song object returned by your backend API
export interface SongApiData {
  // 🔹 FIX 1: Changed 'artistId' to 'artistIds' to match backend
  artistIds: string[];   
  artistNames: string[];
  
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
  
  // 🔹 FIX 2: Changed 'number' to 'string' to match backend
  createdYear: string; 
}

// Defines the simplified structure needed for rendering and track-player
// This structure is correct and does not need changes.
export interface Track {
  id: string;
  url: string; // Maps to fileUrl
  title: string;
  artist: string; // Maps to artistName (comma-separated)
  artistNames: string[]; // Optional array of artist names
  artistIds: string[];
  artwork: string; // Maps to coverUrl
  likes: number; // Optional likes property
  playCount: number; // Optional playCount property
  duration: number; // Optional duration property
  genre: string;
  createdYear: string;
}