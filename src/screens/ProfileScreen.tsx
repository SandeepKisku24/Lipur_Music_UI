import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Image, Alert } from 'react-native';
import UploadScreen from './UploadScreen';
import { useAuth } from '../contexts/AuthContext'; // ✅ Import the AuthContext
import { GoogleSignin } from '@react-native-google-signin/google-signin';

const ProfileScreen: React.FC = () => {
  const [isUploading, setIsUploading] = useState(false);
  const { userName, userEmail,logout } = useAuth(); // ✅ Access name & email

  if (isUploading) {
    return <UploadScreen onClose={() => setIsUploading(false)} />;
  }

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await GoogleSignin.signOut(); // ✅ Logout from Google if signed in
            } catch (error) {
              console.warn('Google SignOut error:', error);
            }
            await logout(); // ✅ Clear local session
            console.log('✅ User logged out completely.');
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Profile</Text>

      {/* Profile info section */}
      <View style={styles.profileBox}>
        <Image
          source={{
            uri: 'https://cdn-icons-png.flaticon.com/512/847/847969.png', // Default avatar
          }}
          style={styles.avatar}
        />
        <Text style={styles.name}>{userName || 'Guest User'}</Text>
        <Text style={styles.email}>{userEmail || 'No Email Found'}</Text>
      </View>

      {/* Upload Music Button */}
      <TouchableOpacity
        style={styles.uploadButton}
        onPress={() => setIsUploading(true)}
      >
        <Text style={styles.buttonText}>Upload Music</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
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
    marginBottom: 30,
  },
  profileBox: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 15,
  },
  name: {
    fontSize: 22,
    color: 'white',
    fontWeight: '600',
  },
  email: {
    fontSize: 16,
    color: '#B3B3B3',
    marginTop: 5,
  },
  uploadButton: {
    backgroundColor: '#1DB954',
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
  logoutButton: {
    backgroundColor: '#E53935',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 50,
    alignItems: 'center',
    marginBottom: 20,
  },
  logoutText: {
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
