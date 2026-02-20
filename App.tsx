import { useEffect } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from './src/screens/HomeScreen';
import { PlayerScreen } from './src/screens/PlayerScreen';
import { QueueScreen } from './src/screens/QueueScreen';
import { MiniPlayer } from './src/components/MiniPlayer';
import { useAudioPlayer } from './src/hooks/useAudioPlayer';
import { usePlayerStore } from './src/store/playerStore';
import type { RootStackParamList } from './src/navigation/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppContent() {
  useAudioPlayer();
  const loadPersistedQueueAndApply = usePlayerStore((s) => s.loadPersistedQueueAndApply);

  useEffect(() => {
    loadPersistedQueueAndApply();
  }, [loadPersistedQueueAndApply]);

  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Music' }} />
      <Stack.Screen name="Player" component={PlayerScreen} options={{ title: 'Now Playing' }} />
      <Stack.Screen name="Queue" component={QueueScreen} options={{ title: 'Queue' }} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <View style={{ flex: 1 }}>
        <AppContent />
        <MiniPlayer />
      </View>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}
