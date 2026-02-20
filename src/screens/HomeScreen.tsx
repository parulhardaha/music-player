import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  Alert,
  RefreshControl,
  Modal,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { searchSongs, fetchSuggested } from '../api/saavn';
import { usePlayerStore } from '../store/playerStore';
import { useFavouritesStore } from '../store/favouritesStore';
import { useDownloadsStore } from '../store/downloadsStore';
import { loadCachedSuggested, saveCachedSuggested } from '../store/queueStorage';
import type { PlayableSong } from '../types/saavn';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Home'>;

function SongRow({
  item,
  onPress,
  onOpenMenu,
}: {
  item: PlayableSong;
  onPress: () => void;
  onOpenMenu: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.thumb} />
      <View style={styles.rowText}>
        <Text style={styles.title} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.artist} numberOfLines={1}>{item.artists}</Text>
      </View>
      <TouchableOpacity
        style={styles.menuBtn}
        onPress={(e) => { e.stopPropagation(); onOpenMenu(); }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <MaterialIcons name="more-vert" size={24} color="#333" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export function HomeScreen() {
  const [query, setQuery] = useState('');
  const [songs, setSongs] = useState<PlayableSong[]>([]);
  const [suggested, setSuggested] = useState<PlayableSong[]>([]);
  const [loadingSuggested, setLoadingSuggested] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<Nav>();
  const setQueueAndPlay = usePlayerStore((s) => s.setQueueAndPlay);
  const addToQueue = usePlayerStore((s) => s.addToQueue);
  const queue = usePlayerStore((s) => s.queue);
  const addFavourite = useFavouritesStore((s) => s.addFavourite);
  const isFavourite = useFavouritesStore((s) => s.isFavourite);
  const downloadSong = useDownloadsStore((s) => s.downloadSong);
  const isDownloaded = useDownloadsStore((s) => s.isDownloaded);

  const [menuSong, setMenuSong] = useState<PlayableSong | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadCachedSuggested().then((cached) => {
      if (!cancelled && cached.length > 0) setSuggested(cached);
    });
    (async () => {
      try {
        const list = await fetchSuggested();
        if (!cancelled) {
          setSuggested(list);
          if (list.length > 0) saveCachedSuggested(list);
        }
      } finally {
        if (!cancelled) setLoadingSuggested(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const onSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const results = await searchSongs(query);
      setSongs(results);
    } finally {
      setLoading(false);
    }
  };

  const playFromList = (list: PlayableSong[], index: number) => {
    setQueueAndPlay(list, index);
    navigation.navigate('Player');
  };

  const handleMenuAddToQueue = (item: PlayableSong) => {
    const inQueue = queue.some((s) => s.id === item.id);
    if (inQueue) {
      Alert.alert('', 'Song already in queue', [
        { text: 'OK', onPress: () => setMenuSong(null) },
      ]);
    } else {
      addToQueue(item);
      setMenuSong(null);
    }
  };

  const handleMenuAddToFavourite = (item: PlayableSong) => {
    if (isFavourite(item.id)) {
      Alert.alert('', 'Already in favourite list', [
        { text: 'OK', onPress: () => setMenuSong(null) },
      ]);
    } else {
      addFavourite(item);
      setMenuSong(null);
    }
  };

  const handleMenuDownload = async (item: PlayableSong) => {
    if (isDownloaded(item.id)) {
      Alert.alert('', 'Already downloaded for offline', [
        { text: 'OK', onPress: () => setMenuSong(null) },
      ]);
      return;
    }
    setDownloadingId(item.id);
    const result = await downloadSong(item);
    setDownloadingId(null);
    if (result.success) {
      setMenuSong(null);
      Alert.alert('', 'Downloaded for offline listening');
    } else {
      Alert.alert('', result.error === 'already_downloaded' ? 'Already downloaded' : result.error ?? 'Download failed');
    }
  };

  const onRefreshSuggested = async () => {
    setRefreshing(true);
    try {
      const list = await fetchSuggested();
      setSuggested(list);
      if (list.length > 0) saveCachedSuggested(list);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Modal
        visible={menuSong != null}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuSong(null)}
      >
        <Pressable style={styles.menuBackdrop} onPress={() => setMenuSong(null)}>
          <View style={styles.menuCard}>
            <Pressable onPress={() => setMenuSong(null)}>
              <Text style={styles.menuTitle} numberOfLines={1}>
                {menuSong?.name ?? ''}
              </Text>
            </Pressable>
            <TouchableOpacity
              style={styles.menuOption}
              onPress={() => menuSong && handleMenuAddToQueue(menuSong)}
            >
              <Text style={styles.menuOptionText}>Add to queue</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuOption}
              onPress={() => menuSong && handleMenuAddToFavourite(menuSong)}
            >
              <Text style={styles.menuOptionText}>Add to favourite</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuOption}
              onPress={() => menuSong && handleMenuDownload(menuSong)}
              disabled={menuSong != null && downloadingId === menuSong.id}
            >
              <Text style={styles.menuOptionText}>
                {menuSong && downloadingId === menuSong.id ? 'Downloading…' : 'Download for offline'}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="Search songs"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={onSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchBtn} onPress={onSearch}>
          <MaterialIcons name="search" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.favBtn} onPress={() => navigation.navigate('Favourites')}>
          <MaterialIcons name="favorite-border" size={24} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.favBtn} onPress={() => navigation.navigate('Downloaded')}>
          <MaterialIcons name="offline-pin" size={24} color="#333" />
        </TouchableOpacity>
      </View>
      <ScrollView
        style={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefreshSuggested} />
        }
      >
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Suggested</Text>
        </View>
        {loadingSuggested && suggested.length === 0 ? (
          <ActivityIndicator style={styles.sectionLoader} size="small" />
        ) : (
          suggested.map((item, index) => (
            <SongRow
              key={item.id}
              item={item}
              onPress={() => playFromList(suggested, index)}
              onOpenMenu={() => setMenuSong(item)}
            />
          ))
        )}
        {songs.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Search results</Text>
            {songs.map((item, index) => (
              <SongRow
                key={item.id}
                item={item}
                onPress={() => playFromList(songs, index)}
                onOpenMenu={() => setMenuSong(item)}
              />
            ))}
          </>
        ) : null}
        {!loading && songs.length === 0 && !loadingSuggested && (
          <Text style={styles.empty}>Search for more songs</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  searchRow: { flexDirection: 'row', padding: 12, gap: 8, alignItems: 'center' },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchBtn: { backgroundColor: '#333', padding: 10, justifyContent: 'center', borderRadius: 8 },
  favBtn: { padding: 10, justifyContent: 'center' },
  scroll: { flex: 1 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 16, paddingBottom: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  sectionLoader: { marginVertical: 12 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  thumb: { width: 48, height: 48, borderRadius: 4 },
  rowText: { flex: 1, marginLeft: 12, justifyContent: 'center', minWidth: 0 },
  title: { fontSize: 16, fontWeight: '600' },
  artist: { fontSize: 14, color: '#666', marginTop: 2 },
  menuBtn: { padding: 8 },
  empty: { textAlign: 'center', color: '#999', paddingVertical: 24 },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    minWidth: 240,
    overflow: 'hidden',
  },
  menuTitle: {
    fontSize: 14,
    color: '#666',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  menuOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  menuOptionText: { fontSize: 16, color: '#333' },
});
