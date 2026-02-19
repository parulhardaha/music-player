import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Slider from '@react-native-community/slider';
import { useNavigation } from '@react-navigation/native';
import { usePlayerStore } from '../store/playerStore';
import { getSeekTo } from '../hooks/useAudioPlayer';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export function MiniPlayer() {
  const navigation = useNavigation<Nav>();
  const { currentSong, isPlaying, queue, currentIndex, toggle, next, previous, position, duration, playerScreenFocused } = usePlayerStore();
  const seekTo = getSeekTo();

  if (!currentSong || playerScreenFocused) return null;

  const canGoPrev = queue.length > 0 && currentIndex > 0;
  const canGoNext = queue.length > 0 && currentIndex < queue.length - 1;
  const safeDuration = duration > 0 ? duration : currentSong.durationSeconds;

  return (
    <View style={styles.bar}>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={safeDuration}
        value={position}
        onSlidingComplete={(v) => seekTo?.(v)}
        minimumTrackTintColor="#333"
        maximumTrackTintColor="#ccc"
      />
      <TouchableOpacity
        style={styles.barRow}
        activeOpacity={1}
        onPress={() => navigation.navigate('Player')}
      >
        <Image source={{ uri: currentSong.imageUrl }} style={styles.thumb} />
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>{currentSong.name}</Text>
          <Text style={styles.artist} numberOfLines={1}>{currentSong.artists}</Text>
        </View>
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.iconBtn, !canGoPrev && styles.iconBtnDisabled]}
            onPress={(e) => { e.stopPropagation(); previous(); }}
            disabled={!canGoPrev}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={[styles.icon, !canGoPrev && styles.iconDisabled]}>⏮</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, styles.iconBtnPlayPause]}
            onPress={(e) => { e.stopPropagation(); toggle(); }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.iconPlay}>{isPlaying ? '⏸' : '▶'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, !canGoNext && styles.iconBtnDisabled]}
            onPress={(e) => { e.stopPropagation(); next(); }}
            disabled={!canGoNext}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={[styles.icon, !canGoNext && styles.iconDisabled]}>⏭</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: '#f5f5f5',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 8,
  },
  slider: { width: '100%', height: 24, marginBottom: 6 },
  barRow: { flexDirection: 'row', alignItems: 'center' },
  thumb: { width: 44, height: 44, borderRadius: 4 },
  info: { flex: 1, marginLeft: 12, minWidth: 0 },
  title: { fontSize: 14, fontWeight: '600' },
  artist: { fontSize: 12, color: '#666', marginTop: 2 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBtn: { padding: 8 },
  iconBtnPlayPause: { backgroundColor: 'transparent' },
  iconBtnDisabled: { opacity: 0.6 },
  icon: { fontSize: 22, color: '#333' },
  iconDisabled: { color: '#999' },
  iconPlay: { fontSize: 26, color: '#333' },
});
