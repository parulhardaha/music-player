import { useEffect } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from './src/screens/HomeScreen';
import { PlayerScreen } from './src/screens/PlayerScreen';
import { QueueScreen } from './src/screens/QueueScreen';
import { FavouritesScreen } from './src/screens/FavouritesScreen';
import { DownloadedScreen } from './src/screens/DownloadedScreen';
import { MiniPlayer } from './src/components/MiniPlayer';
import { useAudioPlayer } from './src/hooks/useAudioPlayer';
import { usePlayerStore } from './src/store/playerStore';
import { useFavouritesStore } from './src/store/favouritesStore';
import { useDownloadsStore } from './src/store/downloadsStore';
import type { RootStackParamList } from './src/navigation/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppContent() {
  useAudioPlayer();
  const loadPersistedQueueAndApply = usePlayerStore((s) => s.loadPersistedQueueAndApply);

  const loadFavourites = useFavouritesStore((s) => s.loadFavourites);
  const loadDownloads = useDownloadsStore((s) => s.loadDownloads);

  useEffect(() => {
    loadFavourites();
  }, [loadFavourites]);

  useEffect(() => {
    (async () => {
      await loadDownloads();
      loadPersistedQueueAndApply();
    })();
  }, [loadPersistedQueueAndApply, loadDownloads]);

  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Music' }} />
      <Stack.Screen name="Player" component={PlayerScreen} options={{ title: 'Now Playing' }} />
      <Stack.Screen name="Queue" component={QueueScreen} options={{ title: 'Queue' }} />
      <Stack.Screen name="Favourites" component={FavouritesScreen} options={{ title: 'Favourites' }} />
      <Stack.Screen name="Downloaded" component={DownloadedScreen} options={{ title: 'Downloaded' }} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <View style={{ flex: 1 }}>
          <AppContent />
          <MiniPlayer />
        </View>
        <StatusBar style="auto" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
