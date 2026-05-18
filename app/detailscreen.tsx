import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function DetailScreen() {
  const { bookData } = useLocalSearchParams();
  const initialBook = bookData ? JSON.parse(bookData as string) : null;

  const [description, setDescription] = useState<string>("Đang tải nội dung giới thiệu...");
  const [loading, setLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const theme = {
    bgGradient: isDarkMode ? ['#4c1d95', '#1e3a8a', '#064e3b'] : ['#ddd6fe', '#bfdbfe', '#a7f3d0'],
    text: isDarkMode ? '#ffffff' : '#0f172a',
    btnBg: isDarkMode ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.8)',
    highlight: isDarkMode ? '#facc15' : '#3b82f6',
  };

  useFocusEffect(
    useCallback(() => {
      checkStatus();
    }, [])
  );

  const checkStatus = async () => {
    const themeStatus = await AsyncStorage.getItem('isDarkMode');
    if (themeStatus !== null) setIsDarkMode(themeStatus === 'true');

    const status = await AsyncStorage.getItem('isLoggedIn');
    const user = await AsyncStorage.getItem('currentUser');
    
    const isActuallyLoggedIn = status === 'true' && user !== null && user.trim() !== '';
    setIsLoggedIn(isActuallyLoggedIn);

    if (isActuallyLoggedIn) {
      const stored = await AsyncStorage.getItem(`favBooks_${user}`);
      if (stored) {
        const favs = JSON.parse(stored);
        setIsFavorite(favs.some((f: any) => f.key === initialBook.key));
      }
    }
  };

  useEffect(() => { if (initialBook) fetchExtraDetails(); }, []);

  const toggleFavorite = async () => {
    const user = await AsyncStorage.getItem('currentUser');
    if (!user) return;

    const stored = await AsyncStorage.getItem(`favBooks_${user}`);
    let favs = stored ? JSON.parse(stored) : [];
    
    if (isFavorite) {
      favs = favs.filter((f: any) => f.key !== initialBook.key);
    } else {
      favs.push(initialBook);
    }
    
    await AsyncStorage.setItem(`favBooks_${user}`, JSON.stringify(favs));
    setIsFavorite(!isFavorite);
  };

  const fetchExtraDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`https://openlibrary.org${initialBook.key}.json`);
      if (!res.ok) throw new Error("Lỗi mạng");
      const data = await res.json();
      
      if (data.description) {
        setDescription(typeof data.description === 'string' ? data.description : data.description.value);
      } else {
        setDescription("Cuốn sách này chưa có nội dung giới thiệu chi tiết trên hệ thống.");
      }
    } catch (e) { 
      setDescription("Không thể lấy dữ liệu giới thiệu lúc này.");
    } finally { 
      setLoading(false); 
    }
  };

  const imgUrl = initialBook?.cover_i 
    ? `https://covers.openlibrary.org/b/id/${initialBook.cover_i}-L.jpg` 
    : 'https://via.placeholder.com/800x400?text=No+Cover';
    
  // Tạo link trực tiếp đến trang của sách trên Open Library
  const webLink = `https://openlibrary.org${initialBook?.key}`;

  return (
    <LinearGradient colors={theme.bgGradient as any} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imgContainer}>
          <Image source={{ uri: imgUrl }} style={styles.backdrop} resizeMode="contain" />
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => router.back()} style={[styles.actionBtn, { backgroundColor: theme.btnBg }]}>
              <Text style={{ color: theme.text, fontWeight: 'bold' }}>{"< Quay lại"}</Text>
            </TouchableOpacity>
            
            {isLoggedIn ? (
              <TouchableOpacity onPress={toggleFavorite} style={[styles.actionBtn, { backgroundColor: theme.btnBg }]}>
                <Text style={{ fontSize: 16 }}>{isFavorite ? "❤️" : "🤍"}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => router.push("/loginscreen" as any)} style={[styles.actionBtn, { backgroundColor: '#3b82f6' }]}>
                <Text style={{ fontSize: 13, color: '#fff', fontWeight: 'bold' }}>Đăng nhập</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.text }]}>{initialBook?.title}</Text>
          <Text style={[styles.author, { color: theme.highlight }]}>
            ✍️ {initialBook?.author_name ? initialBook.author_name.join(", ") : "Nhiều tác giả"}
          </Text>
          <View style={styles.metaRow}>
            <Text style={[styles.metaText, { color: theme.text }]}>🏢 NXB: {initialBook?.publisher ? initialBook.publisher[0] : "N/A"}</Text>
            <Text style={[styles.metaText, { color: theme.text }]}>📅 Xuất bản: {initialBook?.first_publish_year || "N/A"}</Text>
          </View>

          {/* MỤC BẤM VÀO ĐỂ XEM CHI TIẾT SÁCH TRÊN WEB */}
          {initialBook?.key && (
            <TouchableOpacity style={styles.webBtn} onPress={() => Linking.openURL(webLink)}>
              <Text style={styles.webBtnText}>🌐 ĐỌC / XEM TRÊN OPEN LIBRARY</Text>
            </TouchableOpacity>
          )}

          <Text style={[styles.sectionTitle, { color: theme.highlight }]}>Nội dung giới thiệu:</Text>
          {loading ? <ActivityIndicator size="small" color={theme.text} /> : 
            <Text style={[styles.overview, { color: theme.text, opacity: 0.8 }]}>
              {description}
            </Text>
          }
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  imgContainer: { position: "relative", backgroundColor: 'rgba(0,0,0,0.3)' },
  backdrop: { width: "100%", height: 350, borderBottomLeftRadius: 25, borderBottomRightRadius: 25, marginTop: 20 },
  topBar: { position: "absolute", top: 40, left: 20, right: 20, flexDirection: "row", justifyContent: "space-between" },
  actionBtn: { padding: 10, borderRadius: 12 },
  content: { padding: 20, top: -10 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 5 },
  author: { fontSize: 16, fontWeight: "600", marginBottom: 15 },
  metaRow: { flexDirection: "row", gap: 15, marginBottom: 20, flexWrap: "wrap" },
  metaText: { fontSize: 14, fontWeight: 'bold' },
  webBtn: { backgroundColor: "#3b82f6", padding: 15, borderRadius: 12, alignItems: "center", marginBottom: 25 },
  webBtnText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 8 },
  overview: { fontSize: 15, lineHeight: 24, textAlign: 'justify' }
});