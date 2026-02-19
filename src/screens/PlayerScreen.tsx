import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Slider from '@react-native-community/slider';
import { usePlayerStore } from '../store/playerStore';
import { useAudioPlayer } from '../hooks/useAudioPlayer';

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function PlayerScreen() {
  const { currentSong, isPlaying, position, duration, toggle } = usePlayerStore();
  const { seekTo } = useAudioPlayer();

  if (!currentSong) {
    return (
      <View style={styles.container}>
        <Text style={styles.placeholder}>No song selected</Text>
      </View>
    );
  }

  const safeDuration = duration > 0 ? duration : currentSong.durationSeconds;

  return (
    <View style={styles.container}>
      <Image source={{ uri: currentSong.imageUrl }} style={styles.artwork} />
      <Text style={styles.title} numberOfLines={1}>{currentSong.name}</Text>
      <Text style={styles.artist} numberOfLines={1}>{currentSong.artists}</Text>
      <View style={styles.progress}>
        <Text style={styles.time}>{formatTime(position)}</Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={safeDuration}
          value={position}
          onSlidingComplete={(v) => seekTo(v)}
          minimumTrackTintColor="#333"
          maximumTrackTintColor="#ccc"
        />
        <Text style={styles.time}>{formatTime(safeDuration)}</Text>
      </View>
      <TouchableOpacity style={styles.playBtn} onPress={toggle}>
        <Text style={styles.playBtnText}>{isPlaying ? 'Pause' : 'Play'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', padding: 24 },
  placeholder: { fontSize: 16, color: '#999' },
  artwork: { width: 200, height: 200, borderRadius: 8, marginTop: 24 },
  title: { fontSize: 20, fontWeight: '700', marginTop: 16 },
  artist: { fontSize: 16, color: '#666', marginTop: 4 },
  progress: { flexDirection: 'row', alignItems: 'center', width: '100%', marginTop: 24 },
  time: { fontSize: 12, color: '#666', width: 40 },
  slider: { flex: 1, height: 40 },
  playBtn: { marginTop: 24, backgroundColor: '#333', paddingHorizontal: 48, paddingVertical: 14, borderRadius: 24 },
  playBtnText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});
