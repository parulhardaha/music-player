import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { searchSongs, fetchSuggested } from '../api/saavn';
import { usePlayerStore } from '../store/playerStore';
import type { PlayableSong } from '../types/saavn';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Home'>;

function SongRow({
  item,
  onPress,
}: {
  item: PlayableSong;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <Image source={{ uri: item.imageUrl }} style={styles.thumb} />
      <View style={styles.rowText}>
        <Text style={styles.title} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.artist} numberOfLines={1}>{item.artists}</Text>
      </View>
    </TouchableOpacity>
  );
}

export function HomeScreen() {
  const [query, setQuery] = useState('');
  const [songs, setSongs] = useState<PlayableSong[]>([]);
  const [suggested, setSuggested] = useState<PlayableSong[]>([]);
  const [loadingSuggested, setLoadingSuggested] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<Nav>();
  const setQueueAndPlay = usePlayerStore((s) => s.setQueueAndPlay);

  useEffect(() => {
    let cancelled = false;
    fetchSuggested().then((list) => {
      if (!cancelled) setSuggested(list);
    }).finally(() => {
      if (!cancelled) setLoadingSuggested(false);
    });
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

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="Search songs"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={onSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.btn} onPress={onSearch}>
          <Text style={styles.btnText}>Search</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.scroll}>
        <Text style={styles.sectionTitle}>Suggested</Text>
        {loadingSuggested ? (
          <ActivityIndicator style={styles.sectionLoader} size="small" />
        ) : (
          suggested.map((item, index) => (
            <SongRow
              key={item.id}
              item={item}
              onPress={() => playFromList(suggested, index)}
            />
          ))
        )}
        {songs.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Search results</Text>
            {songs.map((item, index) => (
              <SongRow
                key={item.id}
                item={item}
                onPress={() => playFromList(songs, index)}
              />
            ))}
          </>
        )}
        {!loading && songs.length === 0 && !loadingSuggested && (
          <Text style={styles.empty}>Search for more songs</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  searchRow: { flexDirection: 'row', padding: 12, gap: 8 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  btn: { backgroundColor: '#333', paddingHorizontal: 16, justifyContent: 'center', borderRadius: 8 },
  btnText: { color: '#fff', fontWeight: '600' },
  scroll: { flex: 1 },
  sectionTitle: { fontSize: 18, fontWeight: '700', paddingHorizontal: 12, paddingTop: 16, paddingBottom: 8 },
  sectionLoader: { marginVertical: 12 },
  row: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  thumb: { width: 48, height: 48, borderRadius: 4 },
  rowText: { flex: 1, marginLeft: 12, justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '600' },
  artist: { fontSize: 14, color: '#666', marginTop: 2 },
  empty: { textAlign: 'center', color: '#999', paddingVertical: 24 },
});
