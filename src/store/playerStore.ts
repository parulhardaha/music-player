import { create } from 'zustand';
import type { PlayableSong } from '../types/saavn';
import { loadPersistedQueue, savePersistedQueue, loadShuffleEnabled, saveShuffleEnabled } from './queueStorage';

function persistQueue(queue: PlayableSong[], currentIndex: number) {
  savePersistedQueue(queue, Math.max(0, Math.min(currentIndex, queue.length - 1)));
}

interface PlayerState {
  currentSong: PlayableSong | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  queue: PlayableSong[];
  currentIndex: number;
  shuffleEnabled: boolean;
  setShuffleEnabled: (enabled: boolean) => void;
  playerScreenFocused: boolean;
  setPlayerScreenFocused: (focused: boolean) => void;
  setSong: (song: PlayableSong | null) => void;
  setQueueAndPlay: (queue: PlayableSong[], index: number) => void;
  addToQueue: (songs: PlayableSong | PlayableSong[], atIndex?: number) => boolean;
  removeFromQueue: (index: number) => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  clearQueue: () => void;
  loadPersistedQueueAndApply: () => Promise<void>;
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
  shuffleEnabled: false,
  setShuffleEnabled: (enabled) => {
    set({ shuffleEnabled: enabled });
    saveShuffleEnabled(enabled);
  },
  playerScreenFocused: false,
  setPlayerScreenFocused: (focused) => set({ playerScreenFocused: focused }),
  setSong: (song) => set({ currentSong: song, position: 0, duration: song?.durationSeconds ?? 0 }),
  setQueueAndPlay: (queue, index) => {
    const safeIndex = Math.max(0, Math.min(index, queue.length - 1));
    const song = queue[safeIndex] ?? null;
    set({
      queue,
      currentIndex: safeIndex,
      currentSong: song,
      position: 0,
      duration: song?.durationSeconds ?? 0,
      isPlaying: true,
    });
    persistQueue(queue, safeIndex);
  },
  addToQueue: (songsOrOne, atIndex) => {
    const songs = Array.isArray(songsOrOne) ? songsOrOne : [songsOrOne];
    if (songs.length === 0) return false;
    const { queue, currentIndex, currentSong } = get();
    const existingIds = new Set(queue.map((s) => s.id));
    const toAdd = songs.filter((s) => !existingIds.has(s.id));
    if (toAdd.length === 0) return false;
    const idx = atIndex ?? queue.length;
    const newQueue = [...queue.slice(0, idx), ...toAdd, ...queue.slice(idx)];
    let newCurrentIndex = currentIndex;
    if (idx <= currentIndex) newCurrentIndex = currentIndex + toAdd.length;
    const newSong = newQueue[newCurrentIndex] ?? null;
    const wasEmpty = queue.length === 0;
    const sameTrack = !wasEmpty && currentSong && newSong && currentSong.id === newSong.id;
    set({
      queue: newQueue,
      currentIndex: newCurrentIndex,
      ...(sameTrack ? {} : { currentSong: newSong, ...(newSong ? { position: 0, duration: newSong.durationSeconds } : {}) }),
    });
    persistQueue(newQueue, newCurrentIndex);
    return true;
  },
  removeFromQueue: (index) => {
    const { queue, currentIndex } = get();
    if (index < 0 || index >= queue.length) return;
    const newQueue = queue.filter((_, i) => i !== index);
    if (newQueue.length === 0) {
      set({ queue: [], currentIndex: 0, currentSong: null, position: 0, duration: 0, isPlaying: false });
      persistQueue([], 0);
      return;
    }
    let newCurrentIndex: number;
    if (index < currentIndex) newCurrentIndex = currentIndex - 1;
    else if (index === currentIndex) newCurrentIndex = Math.min(currentIndex, newQueue.length - 1);
    else newCurrentIndex = currentIndex;
    const song = newQueue[newCurrentIndex] ?? null;
    set({
      queue: newQueue,
      currentIndex: newCurrentIndex,
      currentSong: song,
      position: 0,
      duration: song?.durationSeconds ?? 0,
    });
    persistQueue(newQueue, newCurrentIndex);
  },
  reorderQueue: (fromIndex, toIndex) => {
    const { queue, currentIndex } = get();
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= queue.length || toIndex >= queue.length) return;
    const item = queue[fromIndex];
    const newQueue = queue.slice();
    newQueue.splice(fromIndex, 1);
    newQueue.splice(toIndex, 0, item);
    let newCurrentIndex: number;
    if (currentIndex === fromIndex) newCurrentIndex = toIndex;
    else if (fromIndex < currentIndex && toIndex >= currentIndex) newCurrentIndex = currentIndex - 1;
    else if (fromIndex > currentIndex && toIndex <= currentIndex) newCurrentIndex = currentIndex + 1;
    else newCurrentIndex = currentIndex;
    const song = newQueue[newCurrentIndex] ?? null;
    set({
      queue: newQueue,
      currentIndex: newCurrentIndex,
      currentSong: song,
      position: 0,
      duration: song?.durationSeconds ?? 0,
    });
    persistQueue(newQueue, newCurrentIndex);
  },
  clearQueue: () => {
    set({ queue: [], currentIndex: 0, currentSong: null, position: 0, duration: 0, isPlaying: false });
    persistQueue([], 0);
  },
  loadPersistedQueueAndApply: async () => {
    const [persisted, shuffleEnabled] = await Promise.all([
      loadPersistedQueue(),
      loadShuffleEnabled(),
    ]);
    set({ shuffleEnabled });
    if (!persisted) return;
    const { queue, currentIndex } = persisted;
    const song = queue[currentIndex] ?? null;
    set({
      queue,
      currentIndex,
      currentSong: song,
      position: 0,
      duration: song?.durationSeconds ?? 0,
    });
  },
  next: () => {
    const { queue, currentIndex, shuffleEnabled } = get();
    if (queue.length === 0) return;
    let nextIndex: number;
    if (shuffleEnabled && queue.length > 1) {
      const otherIndices = queue.map((_, i) => i).filter((i) => i !== currentIndex);
      nextIndex = otherIndices[Math.floor(Math.random() * otherIndices.length)]!;
    } else {
      if (currentIndex >= queue.length - 1) {
        set({ isPlaying: false });
        return;
      }
      nextIndex = currentIndex + 1;
    }
    const song = queue[nextIndex];
    set({
      currentIndex: nextIndex,
      currentSong: song,
      position: 0,
      duration: song.durationSeconds,
      isPlaying: true,
    });
    persistQueue(queue, nextIndex);
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
    persistQueue(queue, prevIndex);
  },
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  toggle: () => set((s) => ({ isPlaying: !s.isPlaying })),
  seek: (seconds) => set({ position: seconds }),
  setPosition: (position) => set({ position }),
  setDuration: (duration) => set({ duration }),
}));
