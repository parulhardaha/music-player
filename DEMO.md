# Technical demo: Music Player

This document walks through the implementation in technical terms: where we use **useEffect**, **useLayoutEffect**, **AsyncStorage**, **expo-file-system**, and other patterns, and why.

---

## 1. App entry and bootstrapping

**File:** `App.tsx`

- **`useAudioPlayer()`** is called once inside `AppContent`. It’s a hook that subscribes to the player store and drives **expo-av** playback; it has no UI, so it lives at the app root.
- **`useEffect` (load favourites):**  
  On mount we call `loadFavourites()` from the favourites store. That store loads from **AsyncStorage** (key `@music_player_favourites`) and populates the in-memory list. We use `useEffect` so the load runs after first paint and doesn’t block the initial render.
- **`useEffect` (load downloads + persisted queue):**  
  In a second effect we run `loadDownloads()` then `loadPersistedQueueAndApply()`.  
  - **Downloads:** The downloads store reads **AsyncStorage** (`@music_player_downloads`) to get the list of `{ song, localPath }` entries (metadata only; files live in **expo-file-system** under `documentDirectory/downloads/`).  
  - **Queue:** `loadPersistedQueueAndApply()` reads **AsyncStorage** for `@music_player_queue` and `@music_player_current_index` (and shuffle), then restores the player store’s queue and current song so playback state survives app restarts.

So: **AsyncStorage** is used at startup to rehydrate favourites, downloads metadata, and the last queue/position; **useEffect** is used so these async loads don’t block the first frame.

---

## 2. Home screen: suggested list and cache

**File:** `src/screens/HomeScreen.tsx`

- **`useEffect` (suggested list, empty dependency array):**  
  On mount we do two things in parallel (no `await` between them so both start immediately):
  1. **Cache first:** `loadCachedSuggested()` reads **AsyncStorage** (`@music_player_suggested`). If there’s a cached list, we `setSuggested(cached)` so the user sees something quickly.
  2. **Network refresh:** We call `fetchSuggested()` (API). When it resolves we `setSuggested(list)` and, if the list is non-empty, **`saveCachedSuggested(list)`** to AsyncStorage so the next launch can show cache first again.

  Cleanup sets a `cancelled` flag so we don’t call `setSuggested` after unmount. We use **useEffect** (not useLayoutEffect) because we don’t need to change DOM/layout before paint; we’re just kicking off async work and updating state when data arrives.

- **Pull-to-refresh:** The “Suggested” section uses **RefreshControl**; on refresh we call `fetchSuggested()` and then `setSuggested(list)` and **saveCachedSuggested(list)** again. So both initial load and manual refresh persist to **AsyncStorage** for the next cold start.

---

## 3. Persistence layer: AsyncStorage keys

**File:** `src/store/queueStorage.ts`

All persistent app data goes through **AsyncStorage**:

| Key | Content | Used by |
|-----|--------|--------|
| `@music_player_queue` | `JSON.stringify(queue)` (array of `PlayableSong`) | Player store |
| `@music_player_current_index` | `String(currentIndex)` | Player store |
| `@music_player_shuffle` | `'true'` / `'false'` | Player store |
| `@music_player_suggested` | `JSON.stringify(PlayableSong[])` | Home suggested cache |
| `@music_player_favourites` | `JSON.stringify(PlayableSong[])` | Favourites store |
| `@music_player_downloads` | `JSON.stringify(DownloadedEntry[])` (`{ song, localPath }`) | Downloads store |

- **Queue/position:** Saved on every queue change via **`savePersistedQueue(queue, currentIndex)`** from the player store (e.g. `setQueueAndPlay`, `addToQueue`, `removeFromQueue`, `reorderQueue`, `next`, `previous`, `clearQueue`).
- **Downloads:** The actual audio files are written with **expo-file-system**; only the list of `{ song, localPath }` is in AsyncStorage so we know what’s downloaded and where to find the file for playback.

---

## 4. Downloads: expo-file-system + AsyncStorage

**File:** `src/store/downloadsStore.ts`

- **Download flow:**  
  `downloadSong(song)` uses **expo-file-system**:
  1. **`FileSystem.makeDirectoryAsync(DOWNLOADS_DIR, { intermediates: true })`** so `documentDirectory/downloads/` exists.
  2. **`FileSystem.downloadAsync(song.playUrl, localPath)`** downloads the stream to a file (e.g. `song.id + '.m4a'`). The returned `uri` is the local file path.
  3. We then **`addDownload(song, uri)`**: update the Zustand store and call **`saveDownloads(next)`** so the new entry is written to **AsyncStorage** (`@music_player_downloads`).

- **Playback:**  
  When the player needs a URI for a song, it calls **`getPlaybackUri(songId)`**. The downloads store looks up the entry and returns **`localPath`** (the expo-file-system URI) if the song is downloaded; otherwise the player uses the remote `playUrl`. So we use **AsyncStorage** to remember *which* songs are downloaded and their local paths; **expo-file-system** for the actual file storage and paths.

- **Remove download:**  
  **`removeDownload(songId)`** calls **`FileSystem.deleteAsync(entry.localPath)`** to delete the file, then updates the store and **saveDownloads** so AsyncStorage no longer lists that entry.

---

## 5. Audio playback hook: useEffect and refs

**File:** `src/hooks/useAudioPlayer.ts`

Playback is driven by the player store (`currentSong`, `isPlaying`) and implemented with **expo-av** and three **useEffect**s:

- **`useEffect` (audio mode, `[]`):**  
  Runs once on mount: **`Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: true, ... })`** so playback works in background and when the device is silent.

- **`useEffect` (current song, dependency `[currentSong?.id]`):**  
  - If there’s **no** `currentSong` (e.g. queue cleared): we enqueue work that **`stopAndUnload(globalSound)`** (pause + unload the expo-av instance), then clear `globalSound` / `globalSongId`. So when the last song is removed, we actually stop and release the native audio.  
  - If there **is** a song: we resolve the playback URI via **`useDownloadsStore.getState().getPlaybackUri(songId) ?? currentSong.playUrl`** (local file if downloaded, else remote). We then chain work on a **`loadQueue`** promise so we don’t load two songs at once: we **stopAndUnload** the previous sound, wait a short delay, then **`Audio.Sound.createAsync({ uri: playbackUri }, { shouldPlay: false, progressUpdateIntervalMillis: 1000 }, statusCallback)`**. In the status callback we update **position/duration** in the store and, when **`didJustFinish`**, call **`next()`** or **`pause()`** from the player store. After creating the sound we assign it to **`globalSound`** / **`globalSongId`** and, if the store says playing, call **`sound.playAsync()`**.  
  Cleanup sets **`cancelled = true`** so in-flight async work doesn’t update state or refs after unmount or after the song changed again.

- **`useEffect` (play/pause, dependency `[isPlaying, currentSong?.id]):**  
  When `isPlaying` or `currentSong?.id` changes, if the current **soundRef** still matches the current song we call **`sound.playAsync()`** or **`sound.pauseAsync()`**. So play/pause is a separate effect from load; we don’t reload the sound when the user only toggles pause.

We use **useRef** for **soundRef**, **skipPositionUpdateRef**, and **lastPositionUpdateRef** so we can read/write from inside the **expo-av** status callback without triggering re-renders and to throttle position updates (e.g. during seek). **seekTo** sets **skipPositionUpdateRef** and uses **setPositionAsync** + **seek(seconds)** in the store; the 800 ms throttle in the status callback avoids fighting with the slider. **getSeekTo()** exposes the current **seekTo** function so **MiniPlayer** and **PlayerScreen** can seek without being inside the hook.

So: **useEffect** is used for one-off config, for “when song id changes” (load/unload), and for “when isPlaying changes” (play/pause); **AsyncStorage** is not used in this hook (playback state is in the player store; persistence is in queueStorage). **expo-file-system** is only used indirectly via **getPlaybackUri** (local path for downloaded songs).

---

## 6. Player screen: useLayoutEffect and useFocusEffect

**File:** `src/screens/PlayerScreen.tsx`

- **`useLayoutEffect` (header right button):**  
  We set **`navigation.setOptions({ headerRight: () => <TouchableOpacity ...>Queue</TouchableOpacity> })** so the “Queue” button appears in the native header. We use **useLayoutEffect** (not useEffect) so the header is updated before the browser/app has painted; that avoids a visible flash where the header first renders without the button and then gets it.

- **`useFocusEffect` (player focused flag):**  
  We call **`setPlayerScreenFocused(true)`** when the screen gains focus and **`setPlayerScreenFocused(false)`** in the cleanup when it loses focus. The **MiniPlayer** component returns **null** when **playerScreenFocused** is true so we don’t show the mini bar on top of the full Player screen. We use a **ref** (**setFocusedRef**) so the callback passed to **useFocusEffect** doesn’t need to depend on **setPlayerScreenFocused** and we avoid re-running the effect unnecessarily.

- **`useEffect` (slider value when not sliding):**  
  When the user is not dragging the slider we sync **slideValue** to **position** from the store: **`if (!isSliding) setSlideValue(position)`**. So the slider reflects store updates (from the audio status callback) except while the user is seeking.

---

## 7. Favourites and Downloaded screens: loading from store

**Files:** `src/screens/FavouritesScreen.tsx`, `src/screens/DownloadedScreen.tsx`

- **FavouritesScreen:**  
  **`useEffect(() => { loadFavourites(); }, [loadFavourites])`** runs on mount (and when the store’s **loadFavourites** reference changes, which is stable). **loadFavourites** in the store calls **loadFavouritesStorage()** from queueStorage, which reads **AsyncStorage** (`@music_player_favourites`) and then **set({ favourites: list })**. So the list is rehydrated from **AsyncStorage** when the screen mounts.

- **DownloadedScreen:**  
  Same idea: **`useEffect(() => { loadDownloads(); }, [loadDownloads])`**. **loadDownloads** in the downloads store calls **loadDownloadsStorage()**, which reads **AsyncStorage** (`@music_player_downloads`) and sets **downloaded** in the store. The actual files are on disk via **expo-file-system**; AsyncStorage only holds the metadata list so we know what to show and which **localPath** to use for playback.

So on both screens we use **useEffect** to trigger a load from the store, and the store layers on top of **AsyncStorage** (and for downloads, **expo-file-system** for the files).

---

## 8. Player store: queue persistence

**File:** `src/store/playerStore.ts`

Every mutation that changes the queue or current index calls **`persistQueue(newQueue, newCurrentIndex)`**, which calls **`savePersistedQueue(queue, currentIndex)`** in queueStorage. That writes **AsyncStorage** with **`Promise.all([ AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue)), AsyncStorage.setItem(CURRENT_INDEX_KEY, String(currentIndex)) ])`**. So we don’t use **useEffect** inside the store to “watch” the queue; we persist at the source on every update (setQueueAndPlay, addToQueue, removeFromQueue, reorderQueue, clearQueue, next, previous). Shuffle is persisted separately via **saveShuffleEnabled** when the user toggles it.

---

## 9. Mini player and seek

**File:** `src/components/MiniPlayer.tsx`

The mini player doesn’t use **useEffect** or **useLayoutEffect** for playback. It reads **currentSong**, **isPlaying**, **position**, **duration**, **queue**, **currentIndex**, **playerScreenFocused**, etc., from the player store and renders the bar. Seek is done by calling **getSeekTo()** and then **seekTo?.(v)** in **onSlidingComplete** on the Slider; that invokes the **seekTo** function from **useAudioPlayer** (held in a module-level **seekToRef**). So the mini player is purely presentational and control; all playback and persistence logic lives in the hook and the stores, with **AsyncStorage** used to save queue/position and **expo-av** used for actual playback (and **expo-file-system** for local playback URIs when a song is downloaded).

---

## 10. Summary table

| What | Where | How |
|------|--------|-----|
| Suggested list on Home | HomeScreen | **useEffect** mounts: **loadCachedSuggested()** (AsyncStorage) + **fetchSuggested()** (API), then **saveCachedSuggested()** (AsyncStorage). |
| Queue + current index | playerStore + queueStorage | **savePersistedQueue()** (AsyncStorage) called from store on every queue/index change. |
| Favourites | favouritesStore + queueStorage | **loadFavourites** / **saveFavourites** use AsyncStorage; FavouritesScreen **useEffect** calls **loadFavourites()**. |
| Downloads metadata | downloadsStore + queueStorage | **saveDownloads** / **loadDownloads** use AsyncStorage; files stored with **expo-file-system**; DownloadedScreen **useEffect** calls **loadDownloads()**. |
| Audio playback | useAudioPlayer | **useEffect** (audio mode), **useEffect** (song load/unload, **expo-av** + **getPlaybackUri** for local/remote), **useEffect** (play/pause). |
| Player header “Queue” | PlayerScreen | **useLayoutEffect** to set **navigation.setOptions({ headerRight })**. |
| Player focused (hide mini bar) | PlayerScreen + MiniPlayer | **useFocusEffect** sets **setPlayerScreenFocused(true/false)**; MiniPlayer returns null when focused. |
| App bootstrap | App.tsx | **useEffect** for **loadFavourites()**; **useEffect** for **loadDownloads()** + **loadPersistedQueueAndApply()** (AsyncStorage). |

This is the technical picture you can use for the demo: **useEffect** for async side effects and syncing UI to store/AsyncStorage, **useLayoutEffect** for header options before paint, **useFocusEffect** for screen focus and mini player visibility, **AsyncStorage** for all persistent app state (queue, favourites, suggested cache, downloads list), and **expo-file-system** for download files and local playback URIs.
