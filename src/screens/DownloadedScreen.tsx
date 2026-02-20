import { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { usePlayerStore } from '../store/playerStore';
import { useDownloadsStore } from '../store/downloadsStore';
import type { PlayableSong } from '../types/saavn';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Downloaded'>;

export function DownloadedScreen() {
  const navigation = useNavigation<Nav>();
  const downloaded = useDownloadsStore((s) => s.downloaded);
  const loadDownloads = useDownloadsStore((s) => s.loadDownloads);
  const removeDownload = useDownloadsStore((s) => s.removeDownload);
  const setQueueAndPlay = usePlayerStore((s) => s.setQueueAndPlay);

  const songs = downloaded.map((e) => e.song);

  useEffect(() => {
    loadDownloads();
  }, [loadDownloads]);

  const playFromDownloaded = (index: number) => {
    setQueueAndPlay(songs, index);
    navigation.navigate('Player');
  };

  const onRemoveDownload = (item: PlayableSong) => {
    Alert.alert(
      'Remove download',
      `Remove "${item.name}" from offline storage?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeDownload(item.id) },
      ]
    );
  };

  if (songs.length === 0) {
    return (
      <View style={styles.empty}>
        <MaterialIcons name="offline-pin" size={48} color="#ccc" />
        <Text style={styles.emptyText}>No downloaded songs</Text>
        <Text style={styles.emptySubtext}>Use the song menu (⋮) and tap "Download" for offline listening</Text>
      </View>
    );
  }

  const renderItem = ({ item, index }: { item: PlayableSong; index: number }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={() => playFromDownloaded(index)}
      activeOpacity={0.7}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.thumb} />
      <View style={styles.rowText}>
        <Text style={styles.title} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.artist} numberOfLines={1}>{item.artists}</Text>
      </View>
      <TouchableOpacity
        style={styles.removeBtn}
        onPress={(e) => { e.stopPropagation(); onRemoveDownload(item); }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <MaterialIcons name="delete-outline" size={24} color="#666" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={songs}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
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
