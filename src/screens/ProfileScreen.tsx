// Lipur_ui/src/screens/ProfileScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Image, Alert } from 'react-native';
import UploadScreen from './UploadScreen';
import { useAuth } from '../contexts/AuthContext'; 
import { useTheme } from '../contexts/ThemeContext'; // 🔹 Import global theme
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import Ionicons from 'react-native-vector-icons/Ionicons';

const ProfileScreen: React.FC = () => {
  const [isUploading, setIsUploading] = useState(false);
  const { userName, userEmail, logout, userType } = useAuth() as any; 
  const { isDark, toggleTheme, colors } = useTheme(); // 🔹 Consume theme values

  if (isUploading) {
    return <UploadScreen onClose={() => setIsUploading(false)} />;
  }

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [{ text: 'Cancel', style: 'cancel' }, { text: 'Logout', style: 'destructive', onPress: async () => { await logout(); } }]
    );
  };

  const isAuthorizedCreator = userType?.toLowerCase() === 'artist' || userType?.toLowerCase() === 'admin';

  return (
    <SafeAreaView style={[styles.baseContainer, { backgroundColor: colors.background }]}>
      <Text style={[styles.header, { color: colors.text }]}>Profile</Text>

      {/* Profile Info Card */}
      <View style={[styles.premiumProfileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/847/847969.png' }}
            style={[styles.avatarImage, { borderColor: colors.primary }]}
          />
        </View>
        <Text style={[styles.nameText, { color: colors.text }]}>{userName || 'Guest User'}</Text>
        <Text style={[styles.emailText, { color: colors.textMuted }]}>{userEmail || 'No Email Linked'}</Text>
        
        <View style={[styles.roleTagBox, { backgroundColor: isDark ? '#1C1C1C' : '#EAEAEA' }]}>
          <Text style={[styles.roleTagText, { color: colors.primary }]}>{userType || 'Listener'}</Text>
        </View>
      </View>

      {/* Global Appearance Settings Row */}
      <View style={[styles.settingRowCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.settingRowLeft}>
          <Ionicons name={isDark ? "moon-outline" : "sunny-outline"} size={20} color={colors.primary} />
          <Text style={[styles.settingRowLabel, { color: colors.text }]}>App Appearance</Text>
        </View>
        <TouchableOpacity 
          style={[styles.togglePillFrame, { backgroundColor: isDark ? colors.primary : '#333' }]}
          onPress={toggleTheme} // 🔹 Triggers the app-wide global transformation!
          activeOpacity={0.8}
        >
          <View style={[styles.toggleKnobCircle, isDark ? styles.toggleKnobRight : styles.toggleKnobLeft]} />
          <Text style={styles.toggleDisplayModeText}>{isDark ? "DARK" : "LIGHT"}</Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionBlockWrapper}>
        {isAuthorizedCreator ? (
          <TouchableOpacity style={[styles.vibrantUploadBtn, { backgroundColor: colors.primary }]} onPress={() => setIsUploading(true)}>
            <Ionicons name="cloud-upload" size={18} color="white" style={{ marginRight: 10 }} />
            <Text style={styles.buttonText}>Upload Music Portal</Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.lockedCreatorBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="lock-closed-outline" size={16} color="#555" style={{ marginRight: 8 }} />
            <Text style={styles.lockedCreatorText}>Creator features locked for this account</Text>
          </View>
        )}
        <TouchableOpacity style={styles.sleekLogoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="white" style={{ marginRight: 10 }} />
          <Text style={styles.buttonText}>Sign Out Account</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  baseContainer: { flex: 1, paddingHorizontal: 20 },
  header: { fontSize: 32, fontWeight: '900', marginTop: 50, marginBottom: 25, letterSpacing: -0.5 },
  premiumProfileCard: { alignItems: 'center', borderRadius: 16, paddingVertical: 26, paddingHorizontal: 20, borderWidth: 1, marginBottom: 15 },
  avatarContainer: { position: 'relative', marginBottom: 14 },
  avatarImage: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#222', borderWidth: 2 },
  nameText: { fontSize: 22, fontWeight: '800', letterSpacing: -0.2 },
  emailText: { fontSize: 14, marginTop: 4, fontWeight: '500' },
  roleTagBox: { marginTop: 14, paddingHorizontal: 14, height: 24, borderRadius: 12, justifyContent: 'center' },
  roleTagText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  settingRowCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 56, borderRadius: 12, borderWidth: 1, marginBottom: 25 },
  settingRowLeft: { flexDirection: 'row', alignItems: 'center' },
  settingRowLabel: { fontSize: 14, fontWeight: '700', marginLeft: 12 },
  togglePillFrame: { flexDirection: 'row', alignItems: 'center', width: 78, height: 28, borderRadius: 14, paddingHorizontal: 6, position: 'relative' },
  toggleKnobCircle: { width: 20, height: 20, borderRadius: 10, backgroundColor: 'white', position: 'absolute', zIndex: 5 },
  toggleKnobLeft: { left: 4 },
  toggleKnobRight: { right: 4 },
  toggleDisplayModeText: { flex: 1, textAlign: 'center', fontSize: 10, color: 'black', fontWeight: '900', paddingLeft: 12, letterSpacing: 0.2 },
  actionBlockWrapper: { width: '100%' },
  vibrantUploadBtn: { flexDirection: 'row', height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  buttonText: { color: 'white', fontSize: 14, fontWeight: '800' },
  lockedCreatorBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 50, borderRadius: 25, marginBottom: 15, borderWidth: 1 },
  lockedCreatorText: { color: '#555', fontSize: 13, fontWeight: '600' },
  sleekLogoutBtn: { flexDirection: 'row', backgroundColor: '#E53935', height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }
});

export default ProfileScreen;