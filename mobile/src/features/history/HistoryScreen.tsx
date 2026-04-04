import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useChatStore, useDecisionStore, useRecentStoriesStore } from '../../state';
import ThreadListItem from './ThreadListItem';
import DecisionListItem from './DecisionListItem';
import RecentStoryItem from './RecentStoryItem';

type Tab = 'threads' | 'decisions' | 'stories';

export default function HistoryScreen() {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<Tab>('threads');

  const threads = useChatStore((s) => s.threads);
  const decisions = useDecisionStore((s) => s.decisions);
  const stories = useRecentStoriesStore((s) => s.stories);

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'threads', label: 'Chats', count: threads.length },
    { key: 'decisions', label: 'Decisions', count: decisions.length },
    { key: 'stories', label: 'Recent', count: stories.length },
  ];

  return (
    <View style={styles.container}>
      {/* Tab bar */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
            {tab.count > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{tab.count}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Thread list */}
      {activeTab === 'threads' && (
        <FlatList
          data={threads}
          keyExtractor={(t) => t.id}
          renderItem={({ item }) => (
            <ThreadListItem
              thread={item}
              onPress={() =>
                navigation.navigate('Chat', {
                  storyId: item.storyId,
                  threadId: item.id,
                })
              }
            />
          )}
          ListEmptyComponent={<EmptyState text="No chat threads yet" />}
        />
      )}

      {/* Decisions list */}
      {activeTab === 'decisions' && (
        <FlatList
          data={decisions}
          keyExtractor={(d) => d.id}
          renderItem={({ item }) => (
            <DecisionListItem
              decision={item}
              onPress={() =>
                navigation.navigate('Decision', {
                  storyId: item.storyId,
                  decisionId: item.id,
                })
              }
            />
          )}
          ListEmptyComponent={<EmptyState text="No saved decisions" />}
        />
      )}

      {/* Recent stories */}
      {activeTab === 'stories' && (
        <FlatList
          data={stories}
          keyExtractor={(s) => s.event.id}
          renderItem={({ item }) => (
            <RecentStoryItem
              story={item}
              onPress={() =>
                navigation.navigate('StoryDetail', {
                  storyId: item.event.id,
                  story: item,
                })
              }
            />
          )}
          ListEmptyComponent={<EmptyState text="No recently viewed stories" />}
        />
      )}
    </View>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginRight: 20,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#1A1A2E' },
  tabText: { fontSize: 15, fontWeight: '500', color: '#9AA5B1' },
  tabTextActive: { color: '#1A1A2E', fontWeight: '600' },
  badge: {
    backgroundColor: '#F0F4F8',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 1,
    marginLeft: 6,
  },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#9AA5B1' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 15, color: '#9AA5B1' },
});
