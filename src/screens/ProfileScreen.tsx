// Lipur_ui/src/screens/ProfileScreen.tsx (Updated to handle screen switching)

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import UploadScreen from './UploadScreen'; // <--- NEW IMPORT

const ProfileScreen: React.FC = () => {
    // State to manage whether the upload form is visible
    const [isUploading, setIsUploading] = useState(false);

    if (isUploading) {
        // Render the upload form if state is true
        return <UploadScreen onClose={() => setIsUploading(false)} />;
    }

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.header}>Profile</Text>
            
            {/* Upload Music Button */}
            <TouchableOpacity 
                style={styles.uploadButton} 
                onPress={() => setIsUploading(true)} // <--- SWITCH STATE
            >
                <Text style={styles.buttonText}>Upload Music</Text>
            </TouchableOpacity>

            <Text style={styles.smallText}>Other profile settings coming soon.</Text>
        </SafeAreaView>
    );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 40,
  },
  uploadButton: {
    backgroundColor: '#1DB954', // Spotify green/accent color
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 50,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  smallText: {
    color: '#B3B3B3',
    marginTop: 20,
    textAlign: 'center',
  },
});

export default ProfileScreen;