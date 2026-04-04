import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Routes, RootTabParamList } from './routes';
import MainStack from './MainStack';
import HistoryScreen from '../features/history/HistoryScreen';

const Tab = createBottomTabNavigator<RootTabParamList>();

function tabIcon(
  route: string,
  focused: boolean,
): keyof typeof Ionicons.glyphMap {
  switch (route) {
    case Routes.FeedTab:
      return focused ? 'newspaper' : 'newspaper-outline';
    case Routes.HistoryTab:
      return focused ? 'time' : 'time-outline';
    case Routes.BriefingTab:
      return focused ? 'mic' : 'mic-outline';
    default:
      return 'ellipse-outline';
  }
}

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#1A1A2E',
        tabBarInactiveTintColor: '#9AA5B1',
        tabBarStyle: { backgroundColor: '#FFFFFF', borderTopColor: '#E2E8F0' },
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons name={tabIcon(route.name, focused)} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen
        name={Routes.FeedTab}
        component={MainStack}
        options={{ tabBarLabel: 'Feed' }}
      />
      <Tab.Screen
        name={Routes.HistoryTab}
        component={HistoryScreen}
        options={{ tabBarLabel: 'History' }}
      />
      <Tab.Screen
        name={Routes.BriefingTab}
        component={PlaceholderBriefing}
        options={{ tabBarLabel: 'Briefing' }}
      />
    </Tab.Navigator>
  );
}

/** Placeholder until Person 1 builds the briefing screen */
function PlaceholderBriefing() {
  const { View, Text } = require('react-native');
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' }}>
      <Text style={{ color: '#9AA5B1', fontSize: 16 }}>Briefing — coming soon</Text>
    </View>
  );
}
