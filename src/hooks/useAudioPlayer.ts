import { useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import { usePlayerStore } from '../store/playerStore';

export function useAudioPlayer() {
  const soundRef = useRef<Audio.Sound | null>(null);
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
    let cancelled = false;
    const load = async () => {
      if (soundRef.current) {
        try {
          await soundRef.current.unloadAsync();
        } catch (_) {}
        soundRef.current = null;
      }
      const { sound } = await Audio.Sound.createAsync(
        { uri: currentSong.playUrl },
        { shouldPlay: true, progressUpdateIntervalMillis: 500 },
        (status) => {
          if (cancelled || !status.isLoaded) return;
          setPosition(status.positionMillis / 1000);
          if (status.durationMillis != null) setDuration(status.durationMillis / 1000);
          if (status.didJustFinish) pause();
        }
      );
      if (cancelled) {
        sound.unloadAsync();
        return;
      }
      soundRef.current = sound;
      play();
    };
    load();
    return () => {
      cancelled = true;
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
    };
  }, [currentSong?.id]);

  useEffect(() => {
    const s = soundRef.current;
    if (!s) return;
    if (isPlaying) s.playAsync();
    else s.pauseAsync();
  }, [isPlaying]);

  const seekTo = async (seconds: number) => {
    const s = soundRef.current;
    if (s) {
      await s.setPositionAsync(seconds * 1000);
      seek(seconds);
    }
  };

  return { seekTo };
}
