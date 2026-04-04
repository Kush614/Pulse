import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BodyText, Card, ChipGroup, Divider, SectionLabel } from '../../theme/ui';
import { palette, radius, spacing, typography } from '../../theme/tokens';
import type { Story } from '../story/types';
import { formatImpact } from './story-helpers';

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  topicPill: {
    alignSelf: 'flex-start',
    backgroundColor: palette.accentSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
  },
  topicText: {
    color: palette.accent,
    fontFamily: typography.mono,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  scoreBlock: {
    alignItems: 'flex-end',
  },
  scoreValue: {
    fontFamily: typography.mono,
    fontSize: 24,
    color: palette.text,
  },
  scoreLabel: {
    fontFamily: typography.body,
    fontSize: 11,
    color: palette.textSoft,
  },
  headline: {
    fontFamily: typography.display,
    fontSize: 24,
    lineHeight: 28,
    color: palette.text,
  },
  biasTrack: {
    height: 10,
    backgroundColor: palette.surfaceMuted,
    borderRadius: radius.pill,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  biasSegment: {
    height: 10,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  metaText: {
    fontFamily: typography.monoRegular,
    fontSize: 12,
    color: palette.textMuted,
  },
  impactGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  impactCard: {
    flex: 1,
    borderRadius: radius.md,
    backgroundColor: palette.surfaceMuted,
    padding: spacing.md,
    gap: 4,
  },
  impactLabel: {
    fontFamily: typography.body,
    fontSize: 12,
    color: palette.textMuted,
  },
  impactValue: {
    fontFamily: typography.mono,
    fontSize: 16,
    color: palette.text,
  },
  tickerChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: palette.surfaceMuted,
  },
  tickerText: {
    fontFamily: typography.mono,
    color: palette.text,
    fontSize: 12,
  },
});

export function StoryCard({ story, onPress }: { story: Story; onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <Card>
        <View style={styles.header}>
          <View style={styles.topicPill}>
            <Text style={styles.topicText}>{story.topic}</Text>
          </View>
          <View style={styles.scoreBlock}>
            <Text style={styles.scoreValue}>{story.objectivityScore}</Text>
            <Text style={styles.scoreLabel}>objectivity</Text>
          </View>
        </View>

        <Text style={styles.headline}>{story.headline}</Text>

        <BodyText>{story.summary}</BodyText>

        <View>
          <SectionLabel>Bias Split</SectionLabel>
          <View style={{ marginTop: spacing.sm }}>
            <View style={styles.biasTrack}>
              {story.sourceLens.map((bucket) => (
                <View
                  key={bucket.id}
                  style={[
                    styles.biasSegment,
                    {
                      width: `${bucket.share}%`,
                      backgroundColor:
                        bucket.id === 'left'
                          ? palette.biasLeft
                          : bucket.id === 'center'
                            ? palette.biasCenter
                            : palette.biasRight,
                    },
                  ]}
                />
              ))}
            </View>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{story.sourceCount} sources</Text>
          <Text style={styles.metaText}>{story.urgency}</Text>
          <Text style={styles.metaText}>{story.time}</Text>
        </View>

        <Divider />

        <View style={styles.impactGrid}>
          {story.sectorImpact.slice(0, 3).map((impact) => (
            <View key={impact.label} style={styles.impactCard}>
              <Text style={styles.impactLabel}>{impact.label}</Text>
              <Text style={styles.impactValue}>{formatImpact(impact.value)}</Text>
            </View>
          ))}
        </View>

        <ChipGroup>
          {story.relatedTickers.map((ticker) => (
            <View key={ticker} style={styles.tickerChip}>
              <Text style={styles.tickerText}>{ticker}</Text>
            </View>
          ))}
        </ChipGroup>
      </Card>
    </Pressable>
  );
}
