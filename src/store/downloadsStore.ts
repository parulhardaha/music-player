import * as FileSystem from 'expo-file-system/legacy';
import { create } from 'zustand';
import type { PlayableSong } from '../types/saavn';
import { loadDownloads as loadDownloadsStorage, saveDownloads, type DownloadedEntry } from './queueStorage';

const DOWNLOADS_DIR = FileSystem.documentDirectory + 'downloads/';

interface DownloadsState {
  downloaded: DownloadedEntry[];
  loadDownloads: () => Promise<void>;
  addDownload: (song: PlayableSong, localPath: string) => void;
  removeDownload: (songId: string) => Promise<void>;
  getPlaybackUri: (songId: string) => string | null;
  isDownloaded: (songId: string) => boolean;
  getDownloadedSongs: () => PlayableSong[];
  downloadSong: (song: PlayableSong) => Promise<{ success: boolean; error?: string }>;
}

export const useDownloadsStore = create<DownloadsState>((set, get) => ({
  downloaded: [],
  loadDownloads: async () => {
    const list = await loadDownloadsStorage();
    set({ downloaded: list });
  },
  addDownload: (song, localPath) => {
    const { downloaded } = get();
    if (downloaded.some((e) => e.song.id === song.id)) return;
    const next = [...downloaded, { song, localPath }];
    set({ downloaded: next });
    saveDownloads(next);
  },
  removeDownload: async (songId) => {
    const { downloaded } = get();
    const entry = downloaded.find((e) => e.song.id === songId);
    if (entry) {
      try {
        await FileSystem.deleteAsync(entry.localPath, { idempotent: true });
      } catch (_) {}
      const next = downloaded.filter((e) => e.song.id !== songId);
      set({ downloaded: next });
      saveDownloads(next);
    }
  },
  getPlaybackUri: (songId) => {
    const entry = get().downloaded.find((e) => e.song.id === songId);
    return entry ? entry.localPath : null;
  },
  isDownloaded: (songId) => get().downloaded.some((e) => e.song.id === songId),
  getDownloadedSongs: () => get().downloaded.map((e) => e.song),
  downloadSong: async (song) => {
    if (get().isDownloaded(song.id)) {
      return { success: false, error: 'already_downloaded' };
    }
    const ext = song.playUrl.includes('.mp4') ? '.mp4' : '.m4a';
    const localPath = DOWNLOADS_DIR + song.id + ext;
    try {
      await FileSystem.makeDirectoryAsync(DOWNLOADS_DIR, { intermediates: true });
      const { uri } = await FileSystem.downloadAsync(song.playUrl, localPath);
      get().addDownload(song, uri);
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Download failed';
      return { success: false, error: message };
    }
  },
}));
