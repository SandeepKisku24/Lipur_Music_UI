// Lipur_ui/src/services/DownloadService.js
import ReactNativeBlobUtil from 'react-native-blob-util';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';

const DOWNLOAD_MAPPING_KEY = '@lipur_local_downloads';
// const BASE_API = 'http://10.0.2.2:8080'; 
const BASE_API = 'https://lipur-backend.onrender.com'; 

/**
 * Downloads a song binary using the pre-signed URL from Go backend and caches its local path.
 * @param {string} songId 
 * @returns {Promise<boolean>}
 */
export async function downloadSongAsset(songId) {
    try {
        // 1. Grab the current user signature token to pass authentication checks safely
        const currentUser = auth().currentUser;
        if (!currentUser) {
            console.warn('[Download Engine] Aborting. User must be signed in to clear asset rules.');
            return false;
        }
        const token = await currentUser.getIdToken();

        // 2. Fetch authorized storage bucket pre-signed URL with Bearer token injected
        const response = await fetch(`${BASE_API}/songs/download?songId=${songId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            console.error(`[Download] Server handshake rejected: ${response.status}`);
            throw new Error('Authorization failure against backend asset validation pipeline');
        }
        
        const data = await response.json();
        const secureDownloadUrl = data.downloadUrl;
        
        // 3. Resolve safe target local path inside application sandbox directories
        const fileExtension = data.fileName.split('.').pop() || 'mp3';
        const { dirs } = ReactNativeBlobUtil.fs;
        const localTargetUri = `${dirs.DocumentDir}/downloads/${songId}.${fileExtension}`;
        
        console.log(`[Download Engine] Direct path initialized: ${localTargetUri}`);
        
        // 4. Initiate native download chunk transaction straight to device storage
        const downloadTask = ReactNativeBlobUtil.config({
            path: localTargetUri,
            fileCache: true,
        }).fetch('GET', secureDownloadUrl);

        const res = await downloadTask;
        const statusCode = res.info().status;

        if (statusCode !== 200) {
            console.warn(`[Download] Server responded with storage error status: ${statusCode}`);
            return false;
        }

        // 5. Save path coordinates to local key-value store
        const existingMappingRaw = await AsyncStorage.getItem(DOWNLOAD_MAPPING_KEY);
        const mapping = existingMappingRaw ? JSON.parse(existingMappingRaw) : {};
        
        mapping[songId] = localTargetUri;
        await AsyncStorage.setItem(DOWNLOAD_MAPPING_KEY, JSON.stringify(mapping));
        
        console.log(`[Download] Track ${songId} successfully saved to native disk.`);
        return true;
    } catch (error) {
        console.error('[Download System Failure]', error);
        return false;
    }
}

/**
 * Checks if a song exists on disk and returns its file URI string, or null if streaming is required.
 * @param {string} songId 
 * @returns {Promise<string|null>}
 */
export async function getLocalTrackUri(songId) {
    try {
        const raw = await AsyncStorage.getItem(DOWNLOAD_MAPPING_KEY);
        if (!raw) return null;
        
        const mapping = JSON.parse(raw);
        const path = mapping[songId] || null;

        if (path) {
            const exists = await ReactNativeBlobUtil.fs.exists(path);
            return exists ? path : null;
        }
        return null;
    } catch (error) {
        return null;
    }
}