import { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { usePlayerStore } from '../store/playerStore';
import { useFavouritesStore } from '../store/favouritesStore';
import type { PlayableSong } from '../types/saavn';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Favourites'>;

export function FavouritesScreen() {
  const navigation = useNavigation<Nav>();
  const { favourites, loadFavourites, clearFavourites, removeFavourite } = useFavouritesStore();
  const setQueueAndPlay = usePlayerStore((s) => s.setQueueAndPlay);

  useEffect(() => {
    loadFavourites();
  }, [loadFavourites]);

  const onClearFavourites = () => {
    if (favourites.length === 0) return;
    Alert.alert(
      'Clear favourites',
      'Remove all songs from favourites?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: clearFavourites },
      ]
    );
  };

  const playFromFavourites = (index: number) => {
    setQueueAndPlay(favourites, index);
    navigation.navigate('Player');
  };

  if (favourites.length === 0) {
    return (
      <View style={styles.empty}>
        <MaterialIcons name="favorite-border" size={48} color="#ccc" />
        <Text style={styles.emptyText}>No favourites yet</Text>
        <Text style={styles.emptySubtext}>Tap the heart on any song to add it here</Text>
      </View>
    );
  }

  const renderItem = ({ item, index }: { item: PlayableSong; index: number }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={() => playFromFavourites(index)}
      activeOpacity={0.7}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.thumb} />
      <View style={styles.rowText}>
        <Text style={styles.title} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.artist} numberOfLines={1}>{item.artists}</Text>
      </View>
      <TouchableOpacity
        style={styles.removeBtn}
        onPress={(e) => { e.stopPropagation(); removeFavourite(item.id); }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <MaterialIcons name="favorite" size={24} color="#c00" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.clearBtn} onPress={onClearFavourites}>
        <Text style={styles.clearBtnText}>Clear favourites</Text>
      </TouchableOpacity>
      <FlatList
        data={favourites}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  clearBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  clearBtnText: { fontSize: 15, color: '#c00', fontWeight: '500' },
  list: { paddingBottom: 24 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#333', marginTop: 16 },
  emptySubtext: { fontSize: 14, color: '#666', marginTop: 8, textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  thumb: { width: 48, height: 48, borderRadius: 4 },
  rowText: { flex: 1, marginLeft: 12, minWidth: 0 },
  title: { fontSize: 16, fontWeight: '600' },
  artist: { fontSize: 14, color: '#666', marginTop: 2 },
  removeBtn: { padding: 8 },
});
