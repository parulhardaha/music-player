import { create } from 'zustand';
import type { PlayableSong } from '../types/saavn';

interface PlayerState {
  currentSong: PlayableSong | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  queue: PlayableSong[];
  currentIndex: number;
  playerScreenFocused: boolean;
  setPlayerScreenFocused: (focused: boolean) => void;
  setSong: (song: PlayableSong | null) => void;
  setQueueAndPlay: (queue: PlayableSong[], index: number) => void;
  next: () => void;
  previous: () => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek: (seconds: number) => void;
  setPosition: (seconds: number) => void;
  setDuration: (seconds: number) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentSong: null,
  isPlaying: false,
  position: 0,
  duration: 0,
  queue: [],
  currentIndex: 0,
  playerScreenFocused: false,
  setPlayerScreenFocused: (focused) => set({ playerScreenFocused: focused }),
  setSong: (song) => set({ currentSong: song, position: 0, duration: song?.durationSeconds ?? 0 }),
  setQueueAndPlay: (queue, index) => set({
    queue,
    currentIndex: index,
    currentSong: queue[index] ?? null,
    position: 0,
    duration: queue[index]?.durationSeconds ?? 0,
    isPlaying: true,
  }),
  next: () => {
    const { queue, currentIndex } = get();
    if (queue.length === 0 || currentIndex >= queue.length - 1) return;
    const nextIndex = currentIndex + 1;
    const song = queue[nextIndex];
    set({
      currentIndex: nextIndex,
      currentSong: song,
      position: 0,
      duration: song.durationSeconds,
      isPlaying: true,
    });
  },
  previous: () => {
    const { queue, currentIndex } = get();
    if (queue.length === 0 || currentIndex <= 0) return;
    const prevIndex = currentIndex - 1;
    const song = queue[prevIndex];
    set({
      currentIndex: prevIndex,
      currentSong: song,
      position: 0,
      duration: song.durationSeconds,
      isPlaying: true,
    });
  },
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  toggle: () => set((s) => ({ isPlaying: !s.isPlaying })),
  seek: (seconds) => set({ position: seconds }),
  setPosition: (position) => set({ position }),
  setDuration: (duration) => set({ duration }),
}));
