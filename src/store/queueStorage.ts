import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PlayableSong } from '../types/saavn';

const QUEUE_KEY = '@music_player_queue';
const CURRENT_INDEX_KEY = '@music_player_current_index';
const SHUFFLE_KEY = '@music_player_shuffle';

export interface PersistedQueue {
  queue: PlayableSong[];
  currentIndex: number;
  shuffleEnabled?: boolean;
}

export async function loadPersistedQueue(): Promise<PersistedQueue | null> {
  try {
    const [queueJson, indexStr, shuffleStr] = await Promise.all([
      AsyncStorage.getItem(QUEUE_KEY),
      AsyncStorage.getItem(CURRENT_INDEX_KEY),
      AsyncStorage.getItem(SHUFFLE_KEY),
    ]);
    if (queueJson == null) return null;
    const queue: PlayableSong[] = JSON.parse(queueJson);
    const currentIndex = indexStr != null ? Math.max(0, Math.min(parseInt(indexStr, 10), queue.length - 1)) : 0;
    if (!Array.isArray(queue) || queue.length === 0) return null;
    const shuffleEnabled = shuffleStr === 'true';
    return { queue, currentIndex, shuffleEnabled };
  } catch {
    return null;
  }
}

export async function loadShuffleEnabled(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(SHUFFLE_KEY);
    return v === 'true';
  } catch {
    return false;
  }
}

export async function saveShuffleEnabled(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(SHUFFLE_KEY, enabled ? 'true' : 'false');
  } catch (_) {}
}

export async function savePersistedQueue(queue: PlayableSong[], currentIndex: number): Promise<void> {
  try {
    await Promise.all([
      AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue)),
      AsyncStorage.setItem(CURRENT_INDEX_KEY, String(currentIndex)),
    ]);
  } catch (_) {}
}

const SUGGESTED_KEY = '@music_player_suggested';

export async function loadCachedSuggested(): Promise<PlayableSong[]> {
  try {
    const json = await AsyncStorage.getItem(SUGGESTED_KEY);
    if (json == null) return [];
    const list = JSON.parse(json);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export async function saveCachedSuggested(songs: PlayableSong[]): Promise<void> {
  try {
    await AsyncStorage.setItem(SUGGESTED_KEY, JSON.stringify(songs));
  } catch (_) {}
}

const FAVOURITES_KEY = '@music_player_favourites';

export async function loadFavourites(): Promise<PlayableSong[]> {
  try {
    const json = await AsyncStorage.getItem(FAVOURITES_KEY);
    if (json == null) return [];
    const list = JSON.parse(json);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export async function saveFavourites(songs: PlayableSong[]): Promise<void> {
  try {
    await AsyncStorage.setItem(FAVOURITES_KEY, JSON.stringify(songs));
  } catch (_) {}
}

const DOWNLOADS_KEY = '@music_player_downloads';

export interface DownloadedEntry {
  song: PlayableSong;
  localPath: string;
}

export async function loadDownloads(): Promise<DownloadedEntry[]> {
  try {
    const json = await AsyncStorage.getItem(DOWNLOADS_KEY);
    if (json == null) return [];
    const list = JSON.parse(json);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export async function saveDownloads(entries: DownloadedEntry[]): Promise<void> {
  try {
    await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(entries));
  } catch (_) {}
}
