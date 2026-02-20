import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList } from 'react-native';
import { usePlayerStore } from '../store/playerStore';
import type { PlayableSong } from '../types/saavn';

export function QueueScreen() {
  const { queue, currentIndex, setQueueAndPlay, removeFromQueue, reorderQueue } = usePlayerStore();

  if (queue.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Queue is empty</Text>
        <Text style={styles.emptySubtext}>Add songs from Home or search results</Text>
      </View>
    );
  }

  const renderItem = ({ item, index }: { item: PlayableSong; index: number }) => {
    const isCurrent = index === currentIndex;
    const canMoveUp = index > 0;
    const canMoveDown = index < queue.length - 1;
    return (
      <View style={[styles.row, isCurrent && styles.rowCurrent]}>
        <TouchableOpacity
          style={styles.rowMain}
          onPress={() => setQueueAndPlay(queue, index)}
          activeOpacity={0.7}
        >
          <Image source={{ uri: item.imageUrl }} style={styles.thumb} />
          <View style={styles.rowText}>
            <Text style={styles.title} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.artist} numberOfLines={1}>{item.artists}</Text>
          </View>
          {isCurrent ? <Text style={styles.playingBadge}>Playing</Text> : null}
        </TouchableOpacity>
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, !canMoveUp && styles.actionBtnDisabled]}
            onPress={() => reorderQueue(index, index - 1)}
            disabled={!canMoveUp}
          >
            <Text style={styles.actionIcon}>↑</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, !canMoveDown && styles.actionBtnDisabled]}
            onPress={() => reorderQueue(index, index + 1)}
            disabled={!canMoveDown}
          >
            <Text style={styles.actionIcon}>↓</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => removeFromQueue(index)}
          >
            <Text style={styles.actionIconRemove}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={queue}
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
  emptyText: { fontSize: 18, fontWeight: '600', color: '#333' },
  emptySubtext: { fontSize: 14, color: '#666', marginTop: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  rowCurrent: { backgroundColor: '#f0f8ff' },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', minWidth: 0 },
  thumb: { width: 48, height: 48, borderRadius: 4 },
  rowText: { flex: 1, marginLeft: 12, minWidth: 0 },
  title: { fontSize: 16, fontWeight: '600' },
  artist: { fontSize: 14, color: '#666', marginTop: 2 },
  playingBadge: { fontSize: 11, color: '#333', fontWeight: '600', marginLeft: 8 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionBtn: { padding: 8 },
  actionBtnDisabled: { opacity: 0.4 },
  actionIcon: { fontSize: 18, color: '#333' },
  actionIconRemove: { fontSize: 16, color: '#c00' },
});
