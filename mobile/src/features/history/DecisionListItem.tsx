import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DecisionRecord } from '../../contracts';

const ACTION_CONFIG: Record<
  string,
  { icon: keyof typeof Ionicons.glyphMap; color: string }
> = {
  watchlist: { icon: 'eye', color: '#4DA3FF' },
  alert: { icon: 'notifications', color: '#FF9500' },
  avoid: { icon: 'close-circle', color: '#FF3B30' },
  conviction: { icon: 'rocket', color: '#34C759' },
};

interface Props {
  decision: DecisionRecord;
  onPress: () => void;
}

export default function DecisionListItem({ decision, onPress }: Props) {
  const cfg = ACTION_CONFIG[decision.action] ?? ACTION_CONFIG.watchlist;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={[styles.iconWrap, { backgroundColor: cfg.color + '18' }]}>
        <Ionicons name={cfg.icon} size={20} color={cfg.color} />
      </View>
      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={[styles.actionBadge, { color: cfg.color }]}>
            {decision.action.toUpperCase()}
          </Text>
          {decision.ticker && (
            <Text style={styles.ticker}>{decision.ticker}</Text>
          )}
        </View>
        <Text style={styles.headline} numberOfLines={1}>
          {decision.storyHeadline}
        </Text>
        {decision.note ? (
          <Text style={styles.note} numberOfLines={1}>
            {decision.note}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color="#CBD5E0" />
    </TouchableOpacity>
  );
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
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  body: { flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionBadge: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  ticker: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1A2E',
    backgroundColor: '#F0F4F8',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  headline: { fontSize: 14, fontWeight: '500', color: '#1A1A2E', marginTop: 3 },
  note: { fontSize: 13, color: '#9AA5B1', marginTop: 2 },
});
