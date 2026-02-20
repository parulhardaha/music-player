import { create } from 'zustand';
import type { PlayableSong } from '../types/saavn';
import { loadFavourites as loadFavouritesStorage, saveFavourites } from './queueStorage';

interface FavouritesState {
  favourites: PlayableSong[];
  loadFavourites: () => Promise<void>;
  addFavourite: (song: PlayableSong) => void;
  removeFavourite: (songId: string) => void;
  clearFavourites: () => void;
  isFavourite: (songId: string) => boolean;
}

export const useFavouritesStore = create<FavouritesState>((set, get) => ({
  favourites: [],
  loadFavourites: async () => {
    const list = await loadFavouritesStorage();
    set({ favourites: list });
  },
  addFavourite: (song) => {
    const { favourites } = get();
    if (favourites.some((s) => s.id === song.id)) return;
    const next = [...favourites, song];
    set({ favourites: next });
    saveFavourites(next);
  },
  removeFavourite: (songId) => {
    const next = get().favourites.filter((s) => s.id !== songId);
    set({ favourites: next });
    saveFavourites(next);
  },
  clearFavourites: () => {
    set({ favourites: [] });
    saveFavourites([]);
  },
  isFavourite: (songId) => get().favourites.some((s) => s.id === songId),
}));
