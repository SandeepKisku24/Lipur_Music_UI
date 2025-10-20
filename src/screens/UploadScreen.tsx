// Lipur_ui/src/screens/UploadScreen.tsx

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, SafeAreaView, ScrollView, Alert, ActivityIndicator } from 'react-native';
// FIX 1: Import DocumentPicker and Dp from the external library
import DocumentPicker from 'react-native-document-picker';
import * as Dp from 'react-native-document-picker'; 
// FIX 2: Import ONLY the types/functions from the uploadService
import { uploadSong, UploadMetadata, DocumentPickerResponse } from '../api/uploadService'; 

interface UploadScreenProps {
    onClose: () => void; 
}

// FINAL FIX: We use the external Dp.DocumentPickerResponse for the state, 
// as it correctly includes the nullable properties (name: string | null).
const UploadScreen: React.FC<UploadScreenProps> = ({ onClose }) => {
    const [file, setFile] = useState<Dp.DocumentPickerResponse | null>(null);
    const [metadata, setMetadata] = useState<UploadMetadata>({
        title: '',
        artist: '',
        genre: 'Pop',
        coverUrl: '',
        createdYear: new Date().getFullYear().toString(),
        upload_user: 'admin', 
        artistId: '', // Ensure all properties are initialized
    });
    const [loading, setLoading] = useState(false);

    const handleFilePick = async () => {
        try {
            const res = await Dp.pickSingle({ 
                type: [Dp.types.audio, Dp.types.allFiles],
            });
            setFile(res);
            
            // Handle potentially null name property for auto-filling title
            const fileName = res.name ?? res.uri.split('/').pop() ?? '';
            if (!metadata.title) {
                // Strip extension for a clean title
                setMetadata(p => ({ ...p, title: fileName.replace(/\.[^/.]+$/, "") }));
            }

        } catch (err) {
            if (DocumentPicker.isCancel(err)) {
                console.log('User cancelled the picker');
            } else {
                Alert.alert("Error", "Failed to select file.");
                console.error(err);
            }
        }
    };

    const handleSubmit = async () => {
        if (!file || !metadata.title || !metadata.artist) {
            Alert.alert("Missing Info", "Please select a file and provide Title/Artist.");
            return;
        }

        // --- TYPE CONVERSION AND NULL CHECKING FOR API CALL ---
        const apiFile: DocumentPickerResponse = {
            uri: file.uri,
            // Ensure name is a string, providing a fallback if null
            name: file.name ?? file.uri.split('/').pop() ?? 'uploaded_file.mp3', 
            // Ensure type is a string, providing a fallback if null
            type: file.type ?? 'audio/mpeg',
            size: file.size ?? null // Size can remain null/number
        };

        setLoading(true);
        try {
            const response = await uploadSong(apiFile, metadata); 
            Alert.alert("Success!", `File uploaded: ${response.filename}`);
            onClose();
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || error.message || "An unknown error occurred during upload.";
            Alert.alert("Upload Failed", errorMessage);
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#121212' }}>
  
            <View style={styles.headerContainer}>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Text style={styles.closeText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.header}>Upload Music</Text>
            </View>
            
            <ScrollView 
                style={styles.scrollContainer}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                
                {/* File Picker */}
                <TouchableOpacity style={styles.filePicker} onPress={handleFilePick} disabled={loading}>
                    <Text style={styles.filePickerText}>
                        {file ? `Selected: ${file.name ?? file.uri.split('/').pop()}` : 'Tap to Select Audio File (.mp3, etc.)'}
                    </Text>
                </TouchableOpacity>

                {/* Metadata Form */}
                <Text style={styles.label}>Title*</Text>
                <TextInput
                    style={styles.input}
                    value={metadata.title}
                    onChangeText={(text) => setMetadata(p => ({ ...p, title: text }))}
                    placeholder="Song Title"
                    placeholderTextColor="#666"
                />
                
                <Text style={styles.label}>Artist*</Text>
                <TextInput
                    style={styles.input}
                    value={metadata.artist}
                    onChangeText={(text) => setMetadata(p => ({ ...p, artist: text }))}
                    placeholder="Artist Name"
                    placeholderTextColor="#666"
                />
                
                <Text style={styles.label}>Cover Image URL</Text>
                <TextInput
                    style={styles.input}
                    value={metadata.coverUrl}
                    onChangeText={(text) => setMetadata(p => ({ ...p, coverUrl: text }))}
                    placeholder="https://example.com/cover.jpg"
                    placeholderTextColor="#666"
                />

                <Text style={styles.label}>Genre</Text>
                <TextInput
                    style={styles.input}
                    value={metadata.genre}
                    onChangeText={(text) => setMetadata(p => ({ ...p, genre: text }))}
                    placeholder="Pop, Rock, Folk"
                    placeholderTextColor="#666"
                />

                <Text style={styles.label}>Upload User (Debug)</Text>
                <TextInput
                    style={styles.input}
                    value={metadata.upload_user}
                    onChangeText={(text) => setMetadata(p => ({ ...p, upload_user: text }))}
                    placeholder="admin"
                    placeholderTextColor="#666"
                />
                 
                 <Text style={styles.label}>Created Year</Text>
                <TextInput
                    style={styles.input}
                    value={metadata.createdYear}
                    onChangeText={(text) => setMetadata(p => ({ ...p, createdYear: text }))}
                    placeholder={new Date().getFullYear().toString()}
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                />

            
            
            {/* Submit Button */}
            <TouchableOpacity 
                style={[styles.submitButton, loading && styles.submitDisabled]} 
                onPress={handleSubmit} 
                disabled={loading || !file || !metadata.title || !metadata.artist}
            >
                {loading ? <ActivityIndicator color="white" /> : <Text style={styles.submitText}>Upload Song</Text>}
            </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        height: '80%',
        marginTop: 'auto',
        marginBottom: 'auto',
        flex: 1,
        backgroundColor: '#121212',
        paddingHorizontal: 20,
    },
    scrollContainer: {
        flexGrow: 1,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        borderBottomColor: '#333',
        borderBottomWidth: 1,
        marginBottom: 20,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
    closeButton: {
        position: 'absolute',
        left: 0,
        padding: 5,
    },
    closeText: {
        color: '#B3B3B3',
        fontSize: 16,
    },
    filePicker: {
        backgroundColor: '#282828',
        padding: 20,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 25,
        borderWidth: 1,
        borderColor: '#1DB954',
    },
    filePickerText: {
        color: '#1DB954',
        fontWeight: 'bold',
    },
    label: {
        color: 'white',
        fontSize: 14,
        marginBottom: 5,
        marginTop: 10,
        fontWeight: '600',
    },
    input: {
        backgroundColor: '#282828',
        color: 'white',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 5,
        fontSize: 16,
        marginBottom: 10,
    },
    submitButton: {
        backgroundColor: '#1DB954',
        padding: 15,
        borderRadius: 50,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 20,
    },
    submitDisabled: {
        backgroundColor: '#156b35',
    },
    submitText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default UploadScreen;