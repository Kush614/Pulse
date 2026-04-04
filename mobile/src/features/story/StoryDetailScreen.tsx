import { StyleSheet, Text, View } from 'react-native';

import {
  ActionButton,
  BodyText,
  Card,
  ChipGroup,
  Divider,
  HeroPanel,
  MetricPair,
  ScreenShell,
  SectionLabel,
  ToggleChip,
} from '../../theme/ui';
import { palette, radius, spacing, typography } from '../../theme/tokens';
import type { FocusProfile, Story } from './types';

const styles = StyleSheet.create({
  summary: {
    fontFamily: typography.body,
    fontSize: 16,
    lineHeight: 24,
    color: palette.textMuted,
  },
  impactCard: {
    borderRadius: radius.md,
    backgroundColor: palette.surfaceMuted,
    padding: spacing.md,
    gap: spacing.xs,
  },
  impactLabel: {
    fontFamily: typography.body,
    color: palette.textMuted,
    fontSize: 12,
  },
  impactValue: {
    fontFamily: typography.mono,
    fontSize: 18,
    color: palette.text,
  },
  actionGrid: {
    gap: spacing.sm,
  },
  placeholderCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.line,
    padding: spacing.md,
    backgroundColor: palette.surface,
    gap: spacing.xs,
  },
  placeholderTitle: {
    fontFamily: typography.medium,
    color: palette.text,
    fontSize: 14,
  },
  placeholderBody: {
    fontFamily: typography.body,
    color: palette.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
});

export function StoryDetailScreen({
  focusProfile,
  story,
  onBack,
  onOpenSources,
}: {
  focusProfile: FocusProfile;
  story: Story;
  onBack: () => void;
  onOpenSources: () => void;
}) {
  return (
    <ScreenShell>
      <HeroPanel
        eyebrow={`${story.topic} | ${story.time}`}
        title={story.headline}
        body={story.impactHint}
      >
        <View style={{ marginTop: spacing.lg }}>
          <MetricPair
            firstLabel="Objectivity score"
            firstValue={String(story.objectivityScore)}
            secondLabel="Sources corroborating"
            secondValue={String(story.sourceCount)}
          />
        </View>
      </HeroPanel>

      <View style={{ gap: spacing.sm }}>
        <Text style={styles.summary}>{story.summary}</Text>
        <BodyText emphasized>{story.whyItMatters}</BodyText>
      </View>

      <Card>
        <SectionLabel>Overlaps With Your Focus</SectionLabel>
        <ChipGroup>
          {focusProfile.sectors.map((sector) => (
            <ToggleChip
              key={sector}
              label={sector}
              active={story.relatedSectors.includes(sector)}
              onPress={() => undefined}
            />
          ))}
        </ChipGroup>
      </Card>

      <Card>
        <SectionLabel>Sector Impact</SectionLabel>
        <View style={{ gap: spacing.sm }}>
          {story.sectorImpact.map((impact) => (
            <View key={impact.label} style={styles.impactCard}>
              <Text style={styles.impactLabel}>{impact.label}</Text>
              <Text style={styles.impactValue}>{impact.value > 0 ? '+' : ''}{impact.value}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <SectionLabel>Related Tickers</SectionLabel>
        <ChipGroup>
          {story.relatedTickers.map((ticker) => (
            <ToggleChip key={ticker} label={ticker} active={focusProfile.tickers.includes(ticker)} onPress={() => undefined} />
          ))}
        </ChipGroup>
      </Card>

      <Divider />

      <View style={styles.actionGrid}>
        <ActionButton label="View Source Lens" onPress={onOpenSources} />
        <ActionButton label="Back To Feed" variant="secondary" onPress={onBack} />
      </View>

      <Card>
        <SectionLabel>Next Touchpoints</SectionLabel>
        <View style={{ gap: spacing.sm }}>
          <View style={styles.placeholderCard}>
            <Text style={styles.placeholderTitle}>Discuss With AI</Text>
            <Text style={styles.placeholderBody}>
              Person 2 will attach the active story context, chat prompts, and previous thread history here.
            </Text>
          </View>
          <View style={styles.placeholderCard}>
            <Text style={styles.placeholderTitle}>Save Decision</Text>
            <Text style={styles.placeholderBody}>
              Person 2 will connect watchlist, alert, and conviction actions once decision persistence lands.
            </Text>
          </View>
        </View>
      </Card>
    </ScreenShell>
  );
}
