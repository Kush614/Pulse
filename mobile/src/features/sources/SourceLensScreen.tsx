import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  ActionButton,
  BodyText,
  Card,
  ChipGroup,
  HeroPanel,
  ScreenShell,
  SectionLabel,
  ToggleChip,
} from '../../theme/ui';
import { palette, radius, spacing, typography } from '../../theme/tokens';
import type { BiasBucket, Story } from '../story/types';

const styles = StyleSheet.create({
  bucketTitle: {
    fontFamily: typography.display,
    fontSize: 28,
    lineHeight: 32,
    color: palette.text,
  },
  countBadge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    backgroundColor: palette.surfaceMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  countText: {
    fontFamily: typography.mono,
    fontSize: 12,
    color: palette.text,
  },
  outletChip: {
    borderRadius: radius.pill,
    backgroundColor: palette.surfaceMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  outletText: {
    fontFamily: typography.medium,
    color: palette.text,
    fontSize: 12,
  },
  wordingCard: {
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: palette.surfaceMuted,
  },
  wordingLabel: {
    fontFamily: typography.mono,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: palette.textSoft,
  },
  wordRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  wordChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.line,
  },
  wordText: {
    fontFamily: typography.body,
    color: palette.text,
    fontSize: 13,
  },
});

function bucketAccent(bucket: BiasBucket) {
  if (bucket.id === 'left') {
    return { tint: '#EAF2FF', line: palette.biasLeft };
  }

  if (bucket.id === 'center') {
    return { tint: '#EEF3F8', line: palette.biasCenter };
  }

  return { tint: '#FFF1E8', line: palette.biasRight };
}

export function SourceLensScreen({
  story,
  onBack,
}: {
  story: Story;
  onBack: () => void;
}) {
  const [activeBucketId, setActiveBucketId] = useState<BiasBucket['id']>('center');
  const activeBucket = story.sourceLens.find((bucket) => bucket.id === activeBucketId) ?? story.sourceLens[0];
  const accent = bucketAccent(activeBucket);

  return (
    <ScreenShell>
      <HeroPanel
        eyebrow="Source Lens"
        title="Compare the wording, not just the headlines."
        body="This view does not guess intent from scratch. It groups known outlet lean, summarizes framing, and shows the language differences users can inspect directly."
      />

      <ChipGroup>
        {story.sourceLens.map((bucket) => (
          <ToggleChip
            key={bucket.id}
            label={`${bucket.label} ${bucket.share}%`}
            active={bucket.id === activeBucket.id}
            onPress={() => setActiveBucketId(bucket.id)}
          />
        ))}
      </ChipGroup>

      <Card>
        <View style={{ gap: spacing.md }}>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{activeBucket.outlets.length} primary outlets in this bucket</Text>
          </View>
          <Text style={styles.bucketTitle}>{activeBucket.label} framing</Text>
          <BodyText>{activeBucket.framingSummary}</BodyText>
        </View>
      </Card>

      <Card>
        <SectionLabel>Source Outlets</SectionLabel>
        <ChipGroup>
          {activeBucket.outlets.map((outlet) => (
            <View key={outlet} style={[styles.outletChip, { backgroundColor: accent.tint }]}>
              <Text style={styles.outletText}>{outlet}</Text>
            </View>
          ))}
        </ChipGroup>
      </Card>

      <Card>
        <SectionLabel>Language Map</SectionLabel>
        <View style={[styles.wordingCard, { borderLeftWidth: 4, borderLeftColor: accent.line }]}>
          <Text style={styles.wordingLabel}>Common phrasing in this bucket</Text>
          <View style={styles.wordRow}>
            {activeBucket.framingWords.map((word) => (
              <View key={word} style={styles.wordChip}>
                <Text style={styles.wordText}>{word}</Text>
              </View>
            ))}
          </View>
        </View>
      </Card>

      <ActionButton label="Back To Story" variant="secondary" onPress={onBack} />
    </ScreenShell>
  );
}
