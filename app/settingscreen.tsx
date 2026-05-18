import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { Alert, Platform, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";

export default function SettingScreen() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useFocusEffect(
    useCallback(() => {
      checkStatus();
    }, [])
  );

  const checkStatus = async () => {
    const status = await AsyncStorage.getItem('isLoggedIn');
    const currentUser = await AsyncStorage.getItem('currentUser');
    setIsLoggedIn(status === 'true' && currentUser !== null);

    const themeStatus = await AsyncStorage.getItem('isDarkMode');
    if (themeStatus !== null) setIsDarkMode(themeStatus === 'true');
  };

  const toggleTheme = async (value: boolean) => {
    setIsDarkMode(value);
    await AsyncStorage.setItem('isDarkMode', value.toString());
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if ((window as any).confirm("Bạn có chắc chắn muốn đăng xuất?")) performLogout();
    } else {
      Alert.alert("Xác nhận", "Bạn có chắc chắn muốn đăng xuất khỏi ứng dụng?", [
        { text: "Hủy", style: "cancel" },
        { text: "Đăng xuất", style: "destructive", onPress: performLogout }
      ]);
    }
  };

  const performLogout = async () => {
    await AsyncStorage.removeItem('isLoggedIn');
    await AsyncStorage.removeItem('currentUser'); 
    
    if (Platform.OS === 'web') {
      (window as any).location.href = '/';
    } else {
      Alert.alert("Thành công", "Đã đăng xuất tài khoản!");
      router.replace("/" as any);
    }
  };

  // CHỨC NĂNG XÓA TÀI KHOẢN VĨNH VIỄN KHỎI BỘ NHỚ LOCAL
  const handleDeleteAccount = () => {
    if (Platform.OS === 'web') {
      if ((window as any).confirm("CẢNH BÁO NGUY HIỂM:\nHành động này sẽ XÓA VĨNH VIỄN tài khoản của bạn và mọi danh sách yêu thích đã lưu. Bạn có chắc chắn muốn xóa không?")) {
        performDeleteAccount();
      }
    } else {
      Alert.alert(
        "🚨 CẢNH BÁO NGUY HIỂM",
        "Hành động này sẽ XÓA VĨNH VIỄN tài khoản và mọi dữ liệu truyện yêu thích đã lưu của bạn. Bạn có chắc chắn muốn thực hiện?",
        [
          { text: "Hủy bỏ", style: "cancel" },
          { text: "Xóa vĩnh viễn", style: "destructive", onPress: performDeleteAccount }
        ]
      );
    }
  };

  const performDeleteAccount = async () => {
    try {
      const currentUser = await AsyncStorage.getItem('currentUser');
      const usersData = await AsyncStorage.getItem('registeredUsers');

      if (currentUser && usersData) {
        const users = JSON.parse(usersData);
        // Lọc loại bỏ tài khoản hiện tại ra khỏi danh sách đã đăng ký
        const updatedUsers = users.filter((u: any) => u.username !== currentUser);
        await AsyncStorage.setItem('registeredUsers', JSON.stringify(updatedUsers));

        // Xóa sạch dữ liệu liên quan của người dùng này
        await AsyncStorage.removeItem(`favBooks_${currentUser}`);
        await AsyncStorage.removeItem(`avatar_${currentUser}`);
      }

      // Đăng xuất xóa phiên làm việc hiện tại
      await AsyncStorage.removeItem('isLoggedIn');
      await AsyncStorage.removeItem('currentUser');

      if (Platform.OS === 'web') {
        alert("Tài khoản của bạn đã được xóa vĩnh viễn thành công!");
        (window as any).location.href = '/';
      } else {
        Alert.alert("Thành công", "Tài khoản của bạn đã được gỡ bỏ vĩnh viễn khỏi hệ thống!");
        router.replace("/" as any);
      }
    } catch (e) {
      console.log(e);
    }
  };

  const theme = {
    bg: isDarkMode ? '#121212' : '#f1f5f9',
    cardBg: isDarkMode ? '#1e1e1e' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#0f172a',
    border: isDarkMode ? '#333333' : '#e2e8f0'
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={{ color: theme.text, fontSize: 16 }}>{"< Quay lại"}</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Cài đặt</Text>
        <View style={{ width: 80 }} /> 
      </View>

      <View style={styles.section}>
        <View style={[styles.card, { backgroundColor: theme.cardBg }]}>
          <View style={[styles.row, { borderBottomWidth: isLoggedIn ? 1 : 0, borderBottomColor: theme.border }]}>
            <View style={styles.rowLeft}>
              <Text style={styles.icon}>🌙</Text>
              <Text style={[styles.rowText, { color: theme.text }]}>Giao diện Sáng / Tối</Text>
            </View>
            <Switch 
              value={isDarkMode} 
              onValueChange={toggleTheme} 
              trackColor={{ false: '#cbd5e1', true: '#3b82f6' }}
            />
          </View>

          {isLoggedIn && (
            <>
              {/* Nút Đăng xuất */}
              <TouchableOpacity style={[styles.row, { borderBottomWidth: 1, borderBottomColor: theme.border }]} onPress={handleLogout}>
                <View style={styles.rowLeft}>
                  <Text style={styles.icon}>🚪</Text>
                  <Text style={[styles.rowText, { color: '#3b82f6' }]}>Đăng xuất tài khoản</Text>
                </View>
              </TouchableOpacity>

              {/* NÚT XÓA TÀI KHOẢN MỚI THÊM */}
              <TouchableOpacity style={styles.row} onPress={handleDeleteAccount}>
                <View style={styles.rowLeft}>
                  <Text style={styles.icon}>🗑️</Text>
                  <Text style={[styles.rowText, { color: '#ef4444', fontWeight: 'bold' }]}>Xóa tài khoản vĩnh viễn</Text>
                </View>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {!isLoggedIn && (
        <View style={styles.bottomContainer}>
          <TouchableOpacity style={styles.loginBtnBottom} onPress={() => router.push("/loginscreen" as any)}>
            <Text style={styles.loginBtnText}>ĐĂNG NHẬP NGAY</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, position: 'relative' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingTop: 50, paddingBottom: 30 },
  backBtn: { padding: 10 },
  headerTitle: { fontSize: 20, fontWeight: "bold" },
  section: { marginHorizontal: 20 },
  card: { borderRadius: 15, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 18, paddingHorizontal: 20 },
  rowLeft: { flexDirection: 'row', alignItems: 'center' },
  icon: { fontSize: 22, marginRight: 15 },
  rowText: { fontSize: 17, fontWeight: '500' },
  bottomContainer: { position: 'absolute', bottom: 40, left: 20, right: 20 },
  loginBtnBottom: { backgroundColor: '#3b82f6', padding: 16, borderRadius: 15, alignItems: 'center' },
  loginBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 }
});