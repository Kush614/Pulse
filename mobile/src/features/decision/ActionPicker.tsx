import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DecisionAction } from '../../contracts';

const ACTIONS: {
  key: DecisionAction;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}[] = [
  { key: 'watchlist', label: 'Watchlist', icon: 'eye-outline', color: '#4DA3FF' },
  { key: 'alert', label: 'Alert', icon: 'notifications-outline', color: '#FF9500' },
  { key: 'avoid', label: 'Avoid', icon: 'close-circle-outline', color: '#FF3B30' },
  { key: 'conviction', label: 'Conviction', icon: 'rocket-outline', color: '#34C759' },
];

interface Props {
  selected: DecisionAction | null;
  onSelect: (action: DecisionAction) => void;
}

export default function ActionPicker({ selected, onSelect }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Action</Text>
      <View style={styles.row}>
        {ACTIONS.map((a) => {
          const active = selected === a.key;
          return (
            <TouchableOpacity
              key={a.key}
              style={[
                styles.chip,
                active && { backgroundColor: a.color, borderColor: a.color },
              ]}
              onPress={() => onSelect(a.key)}
            >
              <Ionicons
                name={a.icon}
                size={18}
                color={active ? '#FFF' : a.color}
              />
              <Text
                style={[
                  styles.chipText,
                  active && { color: '#FFF' },
                ]}
              >
                {a.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#9AA5B1', marginBottom: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipText: { fontSize: 14, color: '#4A5568', fontWeight: '500' },
});
