import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { searchSongs } from '../api/saavn';
import { usePlayerStore } from '../store/playerStore';
import type { PlayableSong } from '../types/saavn';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export function HomeScreen() {
  const [query, setQuery] = useState('');
  const [songs, setSongs] = useState<PlayableSong[]>([]);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<Nav>();
  const setSong = usePlayerStore((s) => s.setSong);
  const play = usePlayerStore((s) => s.play);

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

  const onSelectSong = (song: PlayableSong) => {
    setSong(song);
    play();
    navigation.navigate('Player');
  };

  const renderItem = ({ item }: { item: PlayableSong }) => (
    <TouchableOpacity style={styles.row} onPress={() => onSelectSong(item)} activeOpacity={0.7}>
      <Image source={{ uri: item.imageUrl }} style={styles.thumb} />
      <View style={styles.rowText}>
        <Text style={styles.title} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.artist} numberOfLines={1}>{item.artists}</Text>
      </View>
    </TouchableOpacity>
  );

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
      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" />
      ) : (
        <FlatList
          data={songs}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={
            <Text style={styles.empty}>Search for songs to play</Text>
          }
        />
      )}
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
  loader: { marginTop: 24 },
  row: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  thumb: { width: 48, height: 48, borderRadius: 4 },
  rowText: { flex: 1, marginLeft: 12, justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '600' },
  artist: { fontSize: 14, color: '#666', marginTop: 2 },
  empty: { textAlign: 'center', color: '#999', marginTop: 24 },
});
