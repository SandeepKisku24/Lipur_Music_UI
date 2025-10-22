// Lipur_ui/src/api/uploadService.ts

import axios from 'axios';
import { BASE_API   } from '@env'; // Use your environment variable base URL

const UPLOAD_URL = `https://lipur-backend.onrender.com/upload`; 
// const UPLOAD_URL = `http://10.0.2.2:8080/upload`; 

export interface UploadMetadata {
    title: string;
    artist: string;
    genre: string;
    coverUrl: string;
    createdYear: string;
    upload_user: string;
    artistId?: string;
}

// The file object comes from react-native-document-picker
export interface DocumentPickerResponse {
    uri: string;
    name: string;
    type: string;
    size: number | null;
}

export async function uploadSong(file: DocumentPickerResponse, metadata: UploadMetadata) {
    if (!file.uri || !file.name) {
        throw new Error("File selection is incomplete.");
    }

    // 1. Create FormData object
    const formData = new FormData();

    // 2. Append the file data in the format expected by the Go backend (key: "file")
    formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.type || 'audio/mpeg', // Default to audio/mpeg if type is missing
    } as any); // Use 'as any' to satisfy TypeScript for RN's Blob/File structure

    // 3. Append all metadata fields
    Object.entries(metadata).forEach(([key, value]) => {
        if (value) {
            formData.append(key, value);
        }
    });

    // 4. Send the POST request
    const response = await axios.post(UPLOAD_URL, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
        // Set a higher timeout for large file uploads
        timeout: 60000, 
    });

    return response.data;
}