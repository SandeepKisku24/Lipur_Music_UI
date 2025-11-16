// Lipur_ui/src/screens/LoginScreen.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../contexts/AuthContext'; 
import axios from 'axios';
import { GoogleSignin, statusCodes, User } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';

// Use the type assertion for the icon component
const VectorIcon = Icon as unknown as React.ComponentClass<any, any>; 

// NOTE: Use the Type 3 (Web Client ID) for the JavaScript configuration.
// This ID is associated with the successful OAuth token request.
const WEB_CLIENT_ID = '248925932805-itqu8cpfolffqdhot0h238gc2v8cm191.apps.googleusercontent.com'; 


const LoginScreen: React.FC = () => {
    const { login } = useAuth();
    const [loading, setLoading] = useState(false);
    const [isPhoneMode, setIsPhoneMode] = useState(false);

    // --- 1. CONFIGURATION: Initializes the native Google Sign-In client ---
    useEffect(() => {
        // This relies on the system automatically finding the Type 1 (Android) Client ID
        // from google-services.json for the security check.
        GoogleSignin.configure({
            webClientId: WEB_CLIENT_ID, 
            offlineAccess: true,
            scopes: ['profile', 'email'], 
        });
    }, []);
    
    // --- 2. LOGIN LOGIC: Handles the Sign-In Flow ---
    const handleGoogleLogin = async () => {
  setLoading(true);
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const userInfo = await GoogleSignin.signIn();

    // console.log('Full Google user info:', JSON.stringify(userInfo, null, 2));

    const idToken = (userInfo as any).data?.idToken;
    if (!idToken) throw new Error("Failed to get ID Token from Google");
    console.log("Google ID Token:", idToken);

    const googleCredential = auth.GoogleAuthProvider.credential(idToken);
    const userCredential = await auth().signInWithCredential(googleCredential);

    const firebaseUID = userCredential.user.uid;
    const firebaseIDToken = await userCredential.user.getIdToken();

    // 🔹 Send token to backend to register/login user in Firestore
    // const response = await axios.post("https://lipur-backend.onrender.com/register", {
    const response = await axios.post("http://10.0.2.2:8080/register", {
      idToken: firebaseIDToken,
    });

    // const response = await axios.post(
    //   "https://lipur-backend.onrender.com/register",
    //   {
    //     idToken: firebaseIDToken, // only ID token is required
    //   },
    //   { headers: { "Content-Type": "application/json" } }
    // );

    console.log("Backend response:", response.data);

    // 🔹 Store token locally and mark user as logged in
    login(firebaseIDToken, firebaseUID);

  } catch (error: any) {
    console.error(
      "Google Sign-In Error:",
      error.code || "No code",
      error.message || "Unknown error"
    );

    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      Alert.alert("Sign In Cancelled", "You closed the sign-in prompt.");
    } else if (error.code === statusCodes.IN_PROGRESS) {
      Alert.alert("Configuration Error", "Authentication setup is incorrect.");
    } else {
      Alert.alert("Login Failed", `An error occurred: ${error.message}`);
    }
  } finally {
    setLoading(false);
  }
};
    
    const handlePhoneLogin = () => {
        Alert.alert("Feature Pending", "Phone/OTP login functionality will be implemented here.");
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.logoContainer}>
                <Text style={styles.logoText}>Lipur</Text>
                <Text style={styles.subtitle}>Music & Podcast</Text>
            </View>

            <View style={styles.buttonContainer}>
                
                <Text style={styles.promptText}>Sign In to Continue</Text>
                
                {/* Google Sign-In Button */}
                <TouchableOpacity 
                    style={styles.googleButton} 
                    onPress={handleGoogleLogin} 
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <View style={styles.buttonContent}>
                            {/* Using same size/color as tab bar */}
                            <Icon name="account-circle" size={28} color="white" style={{marginRight: 12}} />
                            <Text style={styles.buttonText}>Sign in with Google</Text>
                        </View>
                    )}
                </TouchableOpacity>


                {/* Phone/OTP Button (Placeholder for now) */}
                <TouchableOpacity 
                    style={styles.phoneButton} 
                    onPress={handlePhoneLogin}
                    disabled={loading}
                >
                    <Text style={styles.phoneText}>Use Phone Number (OTP)</Text>
                </TouchableOpacity>

            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
        justifyContent: 'space-around',
        paddingHorizontal: 30,
    },
    logoContainer: {
        alignItems: 'center',
        paddingTop: 50,
    },
    logoText: {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#1DB954', // Spotify Green
    },
    subtitle: {
        fontSize: 18,
        color: '#B3B3B3',
        marginTop: 5,
    },
    buttonContainer: {
        width: '100%',
        alignItems: 'center',
    },
    promptText: {
        color: 'white',
        fontSize: 16,
        marginBottom: 20,
    },
    googleButton: {
        backgroundColor: '#4285F4', // Google Blue
        paddingVertical: 15,
        borderRadius: 50,
        width: '100%',
        alignItems: 'center',
        marginBottom: 15,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    },
    phoneButton: {
        padding: 10,
    },
    phoneText: {
        color: '#B3B3B3',
        fontSize: 16,
    }
});

export default LoginScreen;