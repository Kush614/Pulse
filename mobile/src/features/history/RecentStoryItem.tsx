import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { StoryContext } from '../../contracts';

interface Props {
  story: StoryContext;
  onPress: () => void;
}

export default function RecentStoryItem({ story, onPress }: Props) {
  const { event, openedAt } = story;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={[styles.urgencyDot, urgencyColor(event.urgency)]} />
      <View style={styles.body}>
        <Text style={[styles.topic, { color: event.topicColor }]}>
          {event.topic}
        </Text>
        <Text style={styles.headline} numberOfLines={2}>
          {event.headline}
        </Text>
        <Text style={styles.meta}>
          {event.sources} sources · {event.time}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function urgencyColor(urgency: number) {
  switch (urgency) {
    case 3:
      return { backgroundColor: '#FF3B30' };
    case 2:
      return { backgroundColor: '#FF9500' };
    default:
      return { backgroundColor: '#CBD5E0' };
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F8',
  },
  urgencyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    marginRight: 12,
  },
  body: { flex: 1 },
  topic: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headline: { fontSize: 15, fontWeight: '500', color: '#1A1A2E', marginTop: 2 },
  meta: { fontSize: 12, color: '#9AA5B1', marginTop: 4 },
});
