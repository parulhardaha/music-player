import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PlayableSong } from '../types/saavn';

const QUEUE_KEY = '@music_player_queue';
const CURRENT_INDEX_KEY = '@music_player_current_index';

export interface PersistedQueue {
  queue: PlayableSong[];
  currentIndex: number;
}

export async function loadPersistedQueue(): Promise<PersistedQueue | null> {
  try {
    const [queueJson, indexStr] = await Promise.all([
      AsyncStorage.getItem(QUEUE_KEY),
      AsyncStorage.getItem(CURRENT_INDEX_KEY),
    ]);
    if (queueJson == null) return null;
    const queue: PlayableSong[] = JSON.parse(queueJson);
    const currentIndex = indexStr != null ? Math.max(0, Math.min(parseInt(indexStr, 10), queue.length - 1)) : 0;
    if (!Array.isArray(queue) || queue.length === 0) return null;
    return { queue, currentIndex };
  } catch {
    return null;
  }
}

export async function savePersistedQueue(queue: PlayableSong[], currentIndex: number): Promise<void> {
  try {
    await Promise.all([
      AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue)),
      AsyncStorage.setItem(CURRENT_INDEX_KEY, String(currentIndex)),
    ]);
  } catch (_) {}
}
