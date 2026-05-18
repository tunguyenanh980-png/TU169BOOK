import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function HomeScreen() {
  const [books, setBooks] = useState<any[]>([]);
  const [favoriteBooks, setFavoriteBooks] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(""); 
  
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'fav'>('all');

  const { tab } = useLocalSearchParams();

  const theme = {
    bgGradient: isDarkMode ? ['#4c1d95', '#1e3a8a', '#064e3b'] : ['#ddd6fe', '#bfdbfe', '#a7f3d0'],
    text: isDarkMode ? '#ffffff' : '#0f172a',
    subText: isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)',
    cardBg: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.8)',
    inputBg: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.7)',
    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.1)',
    bottomBarBg: isDarkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    activeColor: isDarkMode ? '#facc15' : '#3b82f6',
    inactiveColor: isDarkMode ? '#94a3b8' : '#64748b',
  };

  useEffect(() => {
    if (tab === 'fav') setActiveTab('fav');
  }, [tab]);

  useFocusEffect(
    useCallback(() => {
      checkLoginAndLoadFavs();
    }, [activeTab])
  );

  const checkLoginAndLoadFavs = async () => {
    const storedTheme = await AsyncStorage.getItem('isDarkMode');
    if (storedTheme !== null) setIsDarkMode(storedTheme === 'true');

    const status = await AsyncStorage.getItem('isLoggedIn');
    const currentUser = await AsyncStorage.getItem('currentUser');
    
    const isActuallyLoggedIn = status === 'true' && currentUser !== null && currentUser.trim() !== '';
    setIsLoggedIn(isActuallyLoggedIn);
    
    if (isActuallyLoggedIn) {
      const stored = await AsyncStorage.getItem(`favBooks_${currentUser}`);
      if (stored) setFavoriteBooks(JSON.parse(stored));
    } else {
      setFavoriteBooks([]);
      if (activeTab === 'fav') setActiveTab('all');
    }
  };

  useEffect(() => { fetchPopularBooks(); }, []);

  // SỬ DỤNG OPEN LIBRARY API - MIỄN PHÍ VÀ KHÔNG BỊ CHẶN RATE LIMIT
  const fetchPopularBooks = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const url = `https://openlibrary.org/search.json?q=bestseller&limit=20`;
      const res = await fetch(url);

      if (!res.ok) throw new Error("Lỗi kết nối máy chủ");
      
      const data = await res.json();
      if (data.docs && data.docs.length > 0) {
        setBooks(data.docs);
      } else {
        setErrorMsg("Không tải được sách.");
      }
    } catch (err: any) { 
      setErrorMsg("Lỗi tải sách: " + err.message);
    } finally { 
      setLoading(false); 
    }
  };

  const handleSearch = async () => {
    if (!search.trim()) { fetchPopularBooks(); return; }
    setLoading(true); setActiveTab('all'); setErrorMsg("");
    try {
      const query = encodeURIComponent(search.trim());
      const res = await fetch(`https://openlibrary.org/search.json?q=${query}&limit=20`);
      
      if (!res.ok) throw new Error("Lỗi API");

      const data = await res.json();
      if (data.docs && data.docs.length > 0) {
        setBooks(data.docs);
      } else {
        setBooks([]);
        setErrorMsg("Không tìm thấy cuốn sách nào với từ khóa này.");
      }
    } catch (err: any) { 
      setErrorMsg("Lỗi khi tìm kiếm: " + err.message);
    } finally { 
      setLoading(false); 
    }
  };

  const handleTabFav = () => {
    if (isLoggedIn) setActiveTab('fav');
    else router.push("/loginscreen" as any);
  };

  const renderItem = ({ item }: any) => {
    const imgUrl = item.cover_i 
      ? `https://covers.openlibrary.org/b/id/${item.cover_i}-M.jpg` 
      : 'https://via.placeholder.com/500x750?text=No+Cover';
    
    return (
      <TouchableOpacity style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]} 
        onPress={() => router.push({ pathname: "/detailscreen" as any, params: { bookData: JSON.stringify(item) } })}>
        <View style={styles.imageWrapper}>
          <Image source={{ uri: imgUrl }} style={styles.poster} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.rating} numberOfLines={1}>{item.author_name ? item.author_name.join(", ") : "Nhiều tác giả"}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const displayData = activeTab === 'all' ? books : favoriteBooks;

  return (
    <View style={styles.flexContainer}>
      <LinearGradient colors={theme.bgGradient as any} style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>BOOK NAT</Text>
          <TouchableOpacity onPress={() => router.push("/settingscreen" as any)} style={[styles.gearBtn, { backgroundColor: theme.inputBg }]}>
            <Text style={{ fontSize: 20 }}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'all' && (
          <View style={styles.searchRow}>
            <TextInput style={[styles.searchInput, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.borderColor }]} 
              placeholder="Tìm tên sách..." placeholderTextColor={theme.subText} value={search} onChangeText={setSearch} onSubmitEditing={handleSearch} />
            <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}><Text style={styles.searchBtnText}>Tìm</Text></TouchableOpacity>
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          {activeTab === 'all' ? "Sách Khám Phá" : "Sách Yêu Thích"}
        </Text>

        {errorMsg !== "" && <Text style={{color: '#ef4444', textAlign: 'center', marginBottom: 15, fontWeight: 'bold'}}>{errorMsg}</Text>}

        {loading ? <ActivityIndicator size="large" color={theme.text} style={{ marginTop: 50 }} /> : (
          <FlatList 
            data={displayData} 
            keyExtractor={(item, index) => item.key || index.toString()} 
            renderItem={renderItem} 
            numColumns={2} 
            showsVerticalScrollIndicator={false}
            columnWrapperStyle={{ justifyContent: 'space-between' }} 
            contentContainerStyle={{ paddingBottom: 100 }} 
            ListEmptyComponent={<Text style={{ color: theme.text, textAlign: 'center', marginTop: 50 }}>Danh sách trống.</Text>} 
          />
        )}

        <View style={[styles.bottomBar, { backgroundColor: theme.bottomBarBg, borderColor: theme.borderColor }]}>
          <TouchableOpacity style={styles.bottomTab} onPress={() => setActiveTab('all')}>
            <Text style={{ fontSize: 22, opacity: activeTab === 'all' ? 1 : 0.5 }}>📚</Text>
            <Text style={[styles.bottomTabText, { color: activeTab === 'all' ? theme.activeColor : theme.inactiveColor }]}>Khám phá</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.bottomTab} onPress={handleTabFav}>
            <Text style={{ fontSize: 22, opacity: activeTab === 'fav' ? 1 : 0.5 }}>❤️</Text>
            <Text style={[styles.bottomTabText, { color: activeTab === 'fav' ? theme.activeColor : theme.inactiveColor }]}>Yêu thích</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.bottomTab} onPress={() => router.push(isLoggedIn ? "/profilescreen" as any : "/loginscreen" as any)}>
            <Text style={{ fontSize: 22, opacity: 0.5 }}>👤</Text>
            <Text style={[styles.bottomTabText, { color: theme.inactiveColor }]}>{isLoggedIn ? "Profile" : "Đăng nhập"}</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  flexContainer: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 15, paddingTop: 15 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 40, marginBottom: 20 },
  headerTitle: { fontSize: 28, fontWeight: "900", letterSpacing: 1 },
  gearBtn: { padding: 10, borderRadius: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, marginLeft: 5 },
  searchRow: { flexDirection: "row", marginBottom: 20 },
  searchInput: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1 },
  searchBtn: { marginLeft: 10, backgroundColor: "#3b82f6", justifyContent: "center", paddingHorizontal: 20, borderRadius: 10 },
  searchBtnText: { color: "#fff", fontWeight: "bold" },
  card: { width: "48%", borderRadius: 15, marginBottom: 15, overflow: "hidden", borderWidth: 1 },
  imageWrapper: { position: 'relative' },
  poster: { width: "100%", height: 250, resizeMode: "cover" },
  cardInfo: { padding: 10, height: 80 },
  title: { fontWeight: "bold", fontSize: 14, marginBottom: 4 },
  rating: { color: "#94a3b8", fontSize: 12 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, borderTopWidth: 1, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  bottomTab: { alignItems: 'center' },
  bottomTabText: { fontSize: 11, marginTop: 2 }
});