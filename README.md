# Music Player

A React Native (Expo) music player for Android that streams and plays music via a Saavn-style API, with search, queue, favourites, and offline downloads.

---

## 1. Core design and behavior

- **Single queue, one current track**  
  Playback is driven by a global queue and current song. You can play from Home (suggested or search results), Favourites, or Downloaded; each action sets or extends the queue and starts from the chosen track.

- **Suggested + search on Home**  
  Home shows a “Suggested” list (loaded from cache first, then refreshed in the background) and a search bar. Search results replace the list; tapping a result sets the queue from that list and starts playback.

- **Now Playing and Queue**  
  A full-screen Player shows artwork, progress, and controls (play/pause, next, previous, shuffle). The Queue screen lists the current queue, reorder/remove items, and “Clear queue” (clears everything and returns to Home).

- **Favourites and Downloads**  
  Favourites are stored locally; Downloaded uses `expo-file-system` to store files and plays from local URIs when available. Both are persisted across restarts.

- **Mini player**  
  When a song is playing and the user is not on the Player screen, a mini player bar is shown (e.g. on Home) with thumbnail, title, and play/pause/next; tapping it opens the full Player.

---

## 2. Getting started

### Prerequisites

- Node.js (e.g. v20) and npm
- For local Android run/build: Android Studio (or Android SDK) and JDK 17 (see [Building a standalone Android APK](#building-a-standalone-android-apk))

### Install and run (development)

```bash
git clone https://github.com/parulhardaha/music-player.git
cd music-player
npm install
npm start
```

Then:

- **Android device/emulator:**  
  `npm run android` (or `npm run android:clear` to clear Metro cache).  
  Or open the Expo dev tools and choose “Run on Android device/emulator”.

The app will connect to Metro for reload

---

## 3. External SDKs chosen and why

| SDK / library | Purpose | Why chosen |
|---------------|--------|------------|
| **Expo (SDK 54)** | App runtime, native modules, build tooling | Single toolchain for JS + native; `expo-av`, `expo-file-system`, and prebuild for generating the Android project and standalone APK. |
| **React Navigation (native-stack)** | Screen navigation | Standard, well-supported stack navigator; fits a small set of full-screen flows (Home, Player, Queue, Favourites, Downloaded). |
| **Zustand** | Global state (player, favourites, downloads) | Lightweight, no provider wrapper; simple selectors and minimal boilerplate for queue, current song, and UI state. |
| **expo-av** | Audio playback | Built-in Expo API for loading and playing remote/local audio with progress and playback status; avoids extra native linking. |
| **expo-file-system** | File storage for downloads | Same ecosystem as Expo; straightforward API to download and store files and resolve local URIs for playback. |
| **@react-native-async-storage/async-storage** | Persistence | Persist queue, favourites, and small app data across restarts; widely used and recommended for React Native. |
| **Saavn-style API** | Search and suggested songs | External API (`saavn.sumit.co`) used for search and “suggested” content; keeps the app focused on playback and local features. |

---