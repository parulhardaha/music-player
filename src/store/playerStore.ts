import { create } from 'zustand';
import type { PlayableSong } from '../types/saavn';

interface PlayerState {
  currentSong: PlayableSong | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  setSong: (song: PlayableSong | null) => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek: (seconds: number) => void;
  setPosition: (seconds: number) => void;
  setDuration: (seconds: number) => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  currentSong: null,
  isPlaying: false,
  position: 0,
  duration: 0,
  setSong: (song) => set({ currentSong: song, position: 0, duration: song?.durationSeconds ?? 0 }),
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  toggle: () => set((s) => ({ isPlaying: !s.isPlaying })),
  seek: (seconds) => set({ position: seconds }),
  setPosition: (position) => set({ position }),
  setDuration: (duration) => set({ duration }),
}));
