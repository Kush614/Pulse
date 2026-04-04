import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChatThreadSummary } from '../../contracts';

interface Props {
  thread: ChatThreadSummary;
  onPress: () => void;
}

export default function ThreadListItem({ thread, onPress }: Props) {
  const timeAgo = formatTimeAgo(thread.updatedAt);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.iconWrap}>
        <Ionicons name="chatbubble-outline" size={20} color="#4DA3FF" />
      </View>
      <View style={styles.body}>
        <Text style={styles.headline} numberOfLines={1}>
          {thread.storyHeadline}
        </Text>
        <Text style={styles.preview} numberOfLines={1}>
          {thread.lastMessagePreview || 'No messages yet'}
        </Text>
        <View style={styles.meta}>
          <Text style={styles.metaText}>{thread.messageCount} messages</Text>
          <Text style={styles.metaDot}> · </Text>
          <Text style={styles.metaText}>{timeAgo}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#CBD5E0" />
    </TouchableOpacity>
  );
}

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F8',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EBF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  body: { flex: 1 },
  headline: { fontSize: 15, fontWeight: '600', color: '#1A1A2E' },
  preview: { fontSize: 13, color: '#9AA5B1', marginTop: 2 },
  meta: { flexDirection: 'row', marginTop: 4 },
  metaText: { fontSize: 12, color: '#CBD5E0' },
  metaDot: { fontSize: 12, color: '#CBD5E0' },
});
