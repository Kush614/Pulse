import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Routes, MainStackParamList } from './routes';

// Lazy imports — screens are provided by feature owners
// Person 1 screens
import FeedScreen from '../features/feed/FeedScreen';
import StoryDetailScreen from '../features/story/StoryDetailScreen';
import SourceLensScreen from '../features/sources/SourceLensScreen';

// Person 2 screens
import ChatScreen from '../features/chat/ChatScreen';
import DecisionScreen from '../features/decision/DecisionScreen';
import HistoryScreen from '../features/history/HistoryScreen';

const Stack = createNativeStackNavigator<MainStackParamList>();

export default function MainStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerTintColor: '#1A1A2E',
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTitleStyle: { fontWeight: '600', fontSize: 17 },
      }}
    >
      <Stack.Screen
        name={Routes.Feed}
        component={FeedScreen}
        options={{ title: 'PULSE' }}
      />
      <Stack.Screen
        name={Routes.StoryDetail}
        component={StoryDetailScreen}
        options={{ title: 'Story' }}
      />
      <Stack.Screen
        name={Routes.Chat}
        component={ChatScreen}
        options={{ title: 'AI Discussion' }}
      />
      <Stack.Screen
        name={Routes.Decision}
        component={DecisionScreen}
        options={{ title: 'Decision' }}
      />
      <Stack.Screen
        name={Routes.History}
        component={HistoryScreen}
        options={{ title: 'History' }}
      />
      <Stack.Screen
        name={Routes.SourceLens}
        component={SourceLensScreen}
        options={{ title: 'Sources' }}
      />
    </Stack.Navigator>
  );
}
