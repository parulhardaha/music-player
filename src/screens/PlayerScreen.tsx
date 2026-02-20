import { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { usePlayerStore } from '../store/playerStore';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Player'>;

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function PlayerScreen() {
  const navigation = useNavigation<Nav>();
  const { currentSong, isPlaying, position, duration, toggle, queue, currentIndex, next, previous, shuffleEnabled, setShuffleEnabled, setPlayerScreenFocused } = usePlayerStore();
  const { seekTo, setSliding } = useAudioPlayer();
  const [isSliding, setIsSliding] = useState(false);
  const [slideValue, setSlideValue] = useState(0);
  const slidingRef = useRef(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => navigation.navigate('Queue')} style={{ padding: 8 }}>
          <Text style={{ fontSize: 16, color: '#007AFF' }}>Queue</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const setFocusedRef = useRef(setPlayerScreenFocused);
  setFocusedRef.current = setPlayerScreenFocused;
  useFocusEffect(
    useCallback(() => {
      setFocusedRef.current(true);
      return () => setFocusedRef.current(false);
    }, [])
  );

  useEffect(() => {
    if (!isSliding) setSlideValue(position);
  }, [position, isSliding]);

  if (!currentSong) {
    return (
      <View style={styles.container}>
        <Text style={styles.placeholder}>No song selected</Text>
      </View>
    );
  }

  const safeDuration = duration > 0 ? duration : currentSong.durationSeconds;
  const displayValue = isSliding ? slideValue : position;

  return (
    <View style={styles.container}>
      <Image source={{ uri: currentSong.imageUrl }} style={styles.artwork} />
      <Text style={styles.title} numberOfLines={1}>{currentSong.name}</Text>
      <Text style={styles.artist} numberOfLines={1}>{currentSong.artists}</Text>
      {currentSong.albumName ? (
        <Text style={styles.album} numberOfLines={1}>{currentSong.albumName}</Text>
      ) : null}
      <View style={styles.progress}>
        <Text style={styles.time}>{formatTime(displayValue)}</Text>
        <Slider
          key={currentSong.id}
          style={styles.slider}
          minimumValue={0}
          maximumValue={safeDuration}
          value={displayValue}
          onSlidingStart={() => {
            slidingRef.current = true;
            setSliding(true);
            setIsSliding(true);
            setSlideValue(position);
          }}
          onValueChange={(v) => {
            if (!slidingRef.current) {
              slidingRef.current = true;
              setSliding(true);
              setIsSliding(true);
            }
            setSlideValue(v);
          }}
          onSlidingComplete={(v) => {
            seekTo(v);
            setSlideValue(v);
            slidingRef.current = false;
            setSliding(false);
            setIsSliding(false);
          }}
          minimumTrackTintColor="#333"
          maximumTrackTintColor="#ccc"
        />
        <Text style={styles.time}>{formatTime(safeDuration)}</Text>
      </View>
      <View style={styles.controlsRow}>
        <TouchableOpacity
          style={styles.shuffleBtn}
          onPress={() => setShuffleEnabled(!shuffleEnabled)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <MaterialIcons
            name="shuffle"
            size={28}
            color={shuffleEnabled ? '#333' : '#999'}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.iconBtn, (queue.length === 0 || (currentIndex <= 0 && position <= 3)) && styles.iconBtnDisabled]}
          onPress={() => {
            if (position > 3) seekTo(0);
            else if (currentIndex > 0) previous();
          }}
          disabled={queue.length === 0 || (currentIndex <= 0 && position <= 3)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <MaterialIcons
            name="skip-previous"
            size={32}
            color={queue.length === 0 || (currentIndex <= 0 && position <= 3) ? '#999' : '#333'}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.playBtn, styles.playBtnTransparent]}
          onPress={toggle}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <MaterialIcons
            name={isPlaying ? 'pause' : 'play-arrow'}
            size={40}
            color="#333"
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.iconBtn, (queue.length === 0 || (!shuffleEnabled && currentIndex >= queue.length - 1)) && styles.iconBtnDisabled]}
          onPress={next}
          disabled={queue.length === 0 || (!shuffleEnabled && currentIndex >= queue.length - 1)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <MaterialIcons
            name="skip-next"
            size={32}
            color={queue.length === 0 || (!shuffleEnabled && currentIndex >= queue.length - 1) ? '#999' : '#333'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', padding: 24 },
  placeholder: { fontSize: 16, color: '#999' },
  artwork: { width: 200, height: 200, borderRadius: 8, marginTop: 24 },
  title: { fontSize: 20, fontWeight: '700', marginTop: 16 },
  artist: { fontSize: 16, color: '#666', marginTop: 4 },
  album: { fontSize: 14, color: '#999', marginTop: 2 },
  progress: { flexDirection: 'row', alignItems: 'center', width: '100%', marginTop: 24 },
  time: { fontSize: 12, color: '#666', width: 40 },
  slider: { flex: 1, height: 40 },
  controlsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 24, gap: 16 },
  shuffleBtn: { padding: 12 },
  iconBtn: { padding: 12 },
  iconBtnDisabled: { opacity: 0.6 },
  playBtn: { padding: 12 },
  playBtnTransparent: { backgroundColor: 'transparent' },
});
