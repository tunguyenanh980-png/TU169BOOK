import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ProfileScreen() {
  const [isChecking, setIsChecking] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [username, setUsername] = useState("");
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadProfileData();
    }, [])
  );

  const loadProfileData = async () => {
    setIsChecking(true);
    const themeStatus = await AsyncStorage.getItem('isDarkMode');
    if (themeStatus !== null) setIsDarkMode(themeStatus === 'true');

    const status = await AsyncStorage.getItem('isLoggedIn');
    const currentUser = await AsyncStorage.getItem('currentUser');
    
    if (status !== 'true' || !currentUser) {
      router.replace("/loginscreen" as any);
      return;
    }

    setUsername(currentUser);
    const savedImg = await AsyncStorage.getItem(`avatar_${currentUser}`);
    if (savedImg) setUserAvatar(savedImg);
    
    setIsChecking(false); 
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setUserAvatar(uri);
      await AsyncStorage.setItem(`avatar_${username}`, uri);
    }
  };

  const theme = {
    bg: isDarkMode ? '#121212' : '#f1f5f9',
    cardBg: isDarkMode ? '#1e1e1e' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#0f172a',
    subText: isDarkMode ? '#9ca3af' : '#64748b',
  };

  if (isChecking) {
    return <View style={{ flex: 1, backgroundColor: theme.bg, justifyContent: 'center' }}><ActivityIndicator size="large" color="#3b82f6" /></View>;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/" as any)} style={styles.backBtn}>
          <Text style={{ color: theme.text }}>{"< Quay lại"}</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Hồ Sơ Của Bạn</Text>
        <View style={{ width: 80 }} />
      </View>

      <View style={styles.profileSection}>
        <TouchableOpacity onPress={pickImage}>
          {userAvatar ? (
            <Image source={{ uri: userAvatar }} style={styles.avatarImage} />
          ) : (
            <View style={[styles.avatarCircle, { backgroundColor: '#8b5cf6' }]}>
              <Text style={styles.avatarText}>{username ? username.charAt(0).toUpperCase() : ""}</Text>
            </View>
          )}
          <View style={styles.editBadge}><Text style={{fontSize: 10}}>📷</Text></View>
        </TouchableOpacity>
        
        <Text style={[styles.profileName, { color: theme.text }]}>{username}</Text>
        <Text style={[styles.appVersion, { color: theme.subText }]}>Phiên bản 1.0.0 (Books)</Text>
      </View>

      <View style={{ marginHorizontal: 20 }}>
        <TouchableOpacity style={[styles.row, { backgroundColor: theme.cardBg }]} 
          onPress={() => router.replace({ pathname: "/", params: { tab: 'fav' } } as any)}>
          <Text style={{ color: theme.text, fontWeight: 'bold' }}>❤️ Sách đã lưu</Text>
          <Text style={{ color: theme.subText }}>{">"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingTop: 50, paddingBottom: 20 },
  backBtn: { padding: 10 },
  headerTitle: { fontSize: 20, fontWeight: "bold" },
  profileSection: { alignItems: 'center', marginVertical: 30 },
  avatarImage: { width: 110, height: 110, borderRadius: 55 },
  avatarCircle: { width: 110, height: 110, borderRadius: 55, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 45, color: '#fff', fontWeight: 'bold' },
  editBadge: { position: 'absolute', bottom: 5, right: 5, backgroundColor: '#fff', padding: 5, borderRadius: 10, elevation: 5 },
  profileName: { fontSize: 24, fontWeight: 'bold', marginTop: 15 },
  appVersion: { fontSize: 13, marginTop: 5 },
  row: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderRadius: 15 }
});