import { useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import { usePlayerStore } from '../store/playerStore';

let globalSound: Audio.Sound | null = null;
let globalSongId: string | null = null;
let loadQueue: Promise<void> = Promise.resolve();
let seekToRef: ((seconds: number) => void) | null = null;

export function getSeekTo(): ((seconds: number) => void) | null {
  return seekToRef;
}

async function stopAndUnload(sound: Audio.Sound | null) {
  if (!sound) return;
  try {
    await sound.pauseAsync();
  } catch (_) {}
  try {
    await sound.unloadAsync();
  } catch (_) {}
}

export function useAudioPlayer() {
  const soundRef = useRef<Audio.Sound | null>(null);
  const skipPositionUpdateRef = useRef(false);
  const lastPositionUpdateRef = useRef(0);
  const {
    currentSong,
    isPlaying,
    setPosition,
    setDuration,
    setSong,
    play,
    pause,
    seek,
  } = usePlayerStore();

  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: false,
      playThroughEarpieceAndroid: false,
    });
  }, []);

  useEffect(() => {
    if (!currentSong?.playUrl) return;
    const songId = currentSong.id;
    let cancelled = false;

    loadQueue = loadQueue.then(async () => {
      if (cancelled) return;
      if (globalSongId === songId && globalSound) {
        soundRef.current = globalSound;
        if (isPlaying) globalSound.playAsync();
        return;
      }
      await stopAndUnload(globalSound);
      globalSound = null;
      globalSongId = null;
      soundRef.current = null;
      await new Promise((r) => setTimeout(r, 150));
      if (cancelled) return;

      const { sound } = await Audio.Sound.createAsync(
        { uri: currentSong.playUrl },
        { shouldPlay: false, progressUpdateIntervalMillis: 1000 },
        (status) => {
          if (!status.isLoaded) return;
          if (skipPositionUpdateRef.current) return;
          if (globalSongId !== songId) return;
          const now = Date.now();
          if (now - lastPositionUpdateRef.current < 800) return;
          lastPositionUpdateRef.current = now;
          setPosition(status.positionMillis / 1000);
          if (status.durationMillis != null) setDuration(status.durationMillis / 1000);
          if (status.didJustFinish) {
            const state = usePlayerStore.getState();
            if (state.queue.length > 0 && state.currentIndex < state.queue.length - 1) state.next();
            else state.pause();
          }
        }
      );
      if (cancelled) return;
      globalSound = sound;
      globalSongId = songId;
      soundRef.current = sound;
      play();
      sound.playAsync();
    });

    return () => {
      cancelled = true;
      soundRef.current = null;
    };
  }, [currentSong?.id]);

  useEffect(() => {
    const s = soundRef.current;
    if (!s || globalSongId !== currentSong?.id) return;
    if (isPlaying) s.playAsync();
    else s.pauseAsync();
  }, [isPlaying, currentSong?.id]);

  const setSliding = (sliding: boolean) => {
    skipPositionUpdateRef.current = sliding;
    if (!sliding) lastPositionUpdateRef.current = 0;
  };

  const seekTo = async (seconds: number) => {
    const s = soundRef.current;
    if (!s) return;
    skipPositionUpdateRef.current = true;
    try {
      await s.pauseAsync();
      await s.setPositionAsync(seconds * 1000);
      seek(seconds);
      if (isPlaying) await s.playAsync();
    } finally {
      setTimeout(() => { skipPositionUpdateRef.current = false; }, 600);
    }
  };

  seekToRef = seekTo;
  return { seekTo, setSliding };
}
