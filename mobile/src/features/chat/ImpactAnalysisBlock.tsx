import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ImpactAnalysisBlock as ImpactData } from '../../contracts';

interface Props {
  data: ImpactData;
}

export default function ImpactAnalysisBlock({ data }: Props) {
  const isPositive = data.expectedMove.startsWith('+');
  const moveColor = isPositive ? '#34C759' : '#FF3B30';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.ticker}>{data.ticker}</Text>
        <Text style={[styles.move, { color: moveColor }]}>
          {data.expectedMove}
        </Text>
      </View>
      <View style={styles.confidenceBar}>
        <View
          style={[
            styles.confidenceFill,
            { width: `${data.confidence}%`, backgroundColor: moveColor },
          ]}
        />
      </View>
      <Text style={styles.confidenceLabel}>
        Confidence: {data.confidence}%
      </Text>
      <Text style={styles.rationale}>{data.rationale}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ticker: { fontSize: 16, fontWeight: '700', color: '#1A1A2E' },
  move: { fontSize: 16, fontWeight: '600' },
  confidenceBar: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    marginBottom: 4,
  },
  confidenceFill: { height: 4, borderRadius: 2 },
  confidenceLabel: { fontSize: 12, color: '#9AA5B1', marginBottom: 6 },
  rationale: { fontSize: 13, color: '#4A5568', lineHeight: 18 },
});
