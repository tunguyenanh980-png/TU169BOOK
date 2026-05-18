import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { Alert, Keyboard, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function LoginScreen() {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [savedUsers, setSavedUsers] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadInitialData();
    }, [])
  );

  const loadInitialData = async () => {
    const themeStatus = await AsyncStorage.getItem('isDarkMode');
    if (themeStatus !== null) setIsDarkMode(themeStatus === 'true');

    const usersData = await AsyncStorage.getItem('registeredUsers');
    if (usersData) setSavedUsers(JSON.parse(usersData));
  };

  const handleAuth = async () => {
    Keyboard.dismiss(); 
    const validUser = username.trim();
    const validPass = password.trim();

    if (!validUser || !validPass) {
      Alert.alert("Lỗi", "Thông tin không hợp lệ");
      return;
    }

    let currentUsers = [...savedUsers];

    if (!isLoginMode) {
      if (currentUsers.find(u => u.username.toLowerCase() === validUser.toLowerCase())) {
        Alert.alert("Lỗi", "Tài khoản đã tồn tại!");
        return;
      }
      const newUser = { username: validUser, password: validPass };
      currentUsers.push(newUser);
      await AsyncStorage.setItem('registeredUsers', JSON.stringify(currentUsers));
      setSavedUsers(currentUsers);
      Alert.alert("Thành công", "Đã tạo tài khoản đọc sách!");
      setIsLoginMode(true);
      setPassword("");
    } else {
      const matchedUser = currentUsers.find(u => u.username === validUser && u.password === validPass);
      if (matchedUser) {
        loginSuccess(matchedUser);
      } else {
        Alert.alert("Lỗi", "Sai thông tin đăng nhập!");
      }
    }
  };

  const loginSuccess = async (user: any) => {
    await AsyncStorage.setItem('isLoggedIn', 'true');
    await AsyncStorage.setItem('currentUser', user.username);
    
    if (Platform.OS === 'web') {
      (window as any).location.href = '/'; 
    } else {
      router.replace("/" as any);
    }
  };

  const deleteSavedUser = async (userToDelete: string) => {
    Alert.alert("Xóa tài khoản", `Bạn có muốn gỡ tài khoản "${userToDelete}" khỏi bộ nhớ?`, [
      { text: "Hủy", style: "cancel" },
      { text: "Xóa", style: "destructive", onPress: async () => {
          const updatedUsers = savedUsers.filter(u => u.username !== userToDelete);
          setSavedUsers(updatedUsers);
          await AsyncStorage.setItem('registeredUsers', JSON.stringify(updatedUsers));
        }
      }
    ]);
  };

  const theme = {
    bgGradient: isDarkMode ? ['#0f172a', '#1e293b'] : ['#f8fafc', '#e2e8f0'],
    cardBg: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
    text: isDarkMode ? '#ffffff' : '#0f172a',
    subText: isDarkMode ? '#cbd5e1' : '#64748b',
    inputBg: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
  };

  return (
    <LinearGradient colors={theme.bgGradient as any} style={styles.container}>
      <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]}>
        <Text style={[styles.title, { color: theme.text }]}>{isLoginMode ? "ĐĂNG NHẬP" : "ĐĂNG KÝ"}</Text>
        
        {isLoginMode && savedUsers.length > 0 && (
          <View style={styles.quickLogin}>
            <Text style={{ color: theme.subText, fontSize: 12, marginBottom: 10 }}>Đăng nhập nhanh:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {savedUsers.map((user, i) => (
                <TouchableOpacity key={i} style={styles.qBtn} onPress={() => loginSuccess(user)} onLongPress={() => deleteSavedUser(user.username)}>
                  <View style={styles.qAvatar}><Text style={styles.qText}>{user.username.charAt(0).toUpperCase()}</Text></View>
                  <Text style={{ color: theme.text, fontSize: 10, marginTop: 5 }} numberOfLines={1}>{user.username}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <TextInput style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.borderColor }]}
          placeholder="Tên đăng nhập" placeholderTextColor={theme.subText} value={username} onChangeText={setUsername} autoCapitalize="none" />
        <TextInput style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.borderColor }]}
          placeholder="Mật khẩu" placeholderTextColor={theme.subText} secureTextEntry value={password} onChangeText={setPassword} />

        {/* Đổi màu nút sang xanh dương để hợp với App Sách */}
        <TouchableOpacity style={styles.loginBtn} onPress={handleAuth}>
          <Text style={styles.loginBtnText}>{isLoginMode ? "VÀO HỆ THỐNG" : "TẠO TÀI KHOẢN"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={{ marginTop: 20 }} onPress={() => { setIsLoginMode(!isLoginMode); setUsername(""); setPassword(""); }}>
          <Text style={{ color: '#3b82f6', fontWeight: 'bold' }}>{isLoginMode ? "Chưa có tài khoản? Đăng ký ngay" : "Đã có tài khoản? Đăng nhập"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={{ marginTop: 25 }} onPress={() => router.replace("/" as any)}>
          <Text style={{ color: theme.subText, fontWeight: 'bold' }}>Quay lại Trang Chủ</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  card: { width: "100%", padding: 30, borderRadius: 20, borderWidth: 1, alignItems: "center" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  quickLogin: { width: '100%', marginBottom: 20 },
  qBtn: { alignItems: 'center', marginRight: 15, width: 60 },
  qAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center' },
  qText: { color: '#fff', fontWeight: 'bold', fontSize: 20 },
  input: { width: "100%", padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1 },
  loginBtn: { width: "100%", backgroundColor: "#3b82f6", padding: 15, borderRadius: 12, alignItems: "center", marginTop: 10 },
  loginBtnText: { color: "#fff", fontWeight: "bold" }
});