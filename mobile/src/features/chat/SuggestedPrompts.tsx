import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SuggestedPrompt } from '../../contracts';

interface Props {
  prompts: SuggestedPrompt[];
  onSelect: (prompt: SuggestedPrompt) => void;
}

export default function SuggestedPrompts({ prompts, onSelect }: Props) {
  if (prompts.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Suggested questions</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {prompts.map((p) => (
          <TouchableOpacity
            key={p.id}
            style={styles.chip}
            onPress={() => onSelect(p)}
          >
            <Text style={styles.chipText}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 12, paddingHorizontal: 16 },
  label: { fontSize: 13, color: '#9AA5B1', marginBottom: 8 },
  chip: {
    backgroundColor: '#F0F4F8',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
  },
  chipText: { fontSize: 14, color: '#1A1A2E' },
});
