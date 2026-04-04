import { StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

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
import { Routes } from '../../navigation';
import { useAppFlow } from '../../state/appFlowContext';
import type { StoryContext } from '../../contracts';
import { fromStoryContext } from './story-adapters';
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
  onDiscuss,
  onSaveDecision,
}: {
  focusProfile: FocusProfile;
  story: Story;
  onBack: () => void;
  onOpenSources: () => void;
  onDiscuss?: () => void;
  onSaveDecision?: () => void;
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
              Open the story-bound chat to compare viewpoints, ask about second-order effects, and build a reusable thread history.
            </Text>
            {onDiscuss ? (
              <ActionButton label="Open Discussion" onPress={onDiscuss} />
            ) : null}
          </View>
          <View style={styles.placeholderCard}>
            <Text style={styles.placeholderTitle}>Save Decision</Text>
            <Text style={styles.placeholderBody}>
              Capture a watchlist, alert, avoid, or conviction decision and link it back to the active discussion.
            </Text>
            {onSaveDecision ? (
              <ActionButton label="Save Decision" variant="secondary" onPress={onSaveDecision} />
            ) : null}
          </View>
        </View>
      </Card>
    </ScreenShell>
  );
}

export default function StoryDetailRouteScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { focusProfile, stories } = useAppFlow();

  const storyFromRoute = route.params?.story as StoryContext | undefined;
  const storyId = route.params?.storyId as string | undefined;
  const story =
    (storyFromRoute ? fromStoryContext(storyFromRoute) : undefined) ??
    stories.find((item) => item.id === storyId);

  if (!story) {
    return (
      <ScreenShell>
        <Card>
          <SectionLabel>Story Missing</SectionLabel>
          <BodyText>The selected story could not be loaded in this session.</BodyText>
          <ActionButton label="Back To Feed" onPress={() => navigation.navigate(Routes.Feed)} />
        </Card>
      </ScreenShell>
    );
  }

  return (
    <StoryDetailScreen
      focusProfile={focusProfile}
      story={story}
      onBack={() => navigation.goBack()}
      onOpenSources={() => navigation.navigate(Routes.SourceLens, { storyId: story.id })}
      onDiscuss={() => navigation.navigate(Routes.Chat, { storyId: story.id })}
      onSaveDecision={() => navigation.navigate(Routes.Decision, { storyId: story.id })}
    />
  );
}
