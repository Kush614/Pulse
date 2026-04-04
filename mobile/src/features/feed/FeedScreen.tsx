import { useDeferredValue, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import {
  ActionButton,
  BodyText,
  ChipGroup,
  HeroPanel,
  ScreenShell,
  ToggleChip,
} from '../../theme/ui';
import { palette, spacing, typography } from '../../theme/tokens';
import { Routes } from '../../navigation';
import { useRecentStoriesStore, useSessionStore } from '../../state';
import { useAppFlow } from '../../state/appFlowContext';
import { toStoryContext } from '../story/story-adapters';
import type { FeedFilter, FocusProfile, Story } from '../story/types';
import { filterStories } from './story-helpers';
import { StoryCard } from './StoryCard';

const filters: FeedFilter[] = ['Top Picks', 'My Sectors', 'Breaking', 'Policy', 'Supply Chain'];

const styles = StyleSheet.create({
  utilityRow: {
    gap: spacing.md,
  },
  helper: {
    fontFamily: typography.body,
    fontSize: 13,
    color: palette.textMuted,
    lineHeight: 20,
  },
  heading: {
    fontFamily: typography.display,
    fontSize: 28,
    lineHeight: 32,
    color: palette.text,
  },
});

export function FeedScreen({
  focusProfile,
  stories,
  onBack,
  onOpenStory,
}: {
  focusProfile: FocusProfile;
  stories: Story[];
  onBack: () => void;
  onOpenStory: (story: Story) => void;
}) {
  const [activeFilter, setActiveFilter] = useState<FeedFilter>('Top Picks');
  const deferredFilter = useDeferredValue(activeFilter);
  const visibleStories = filterStories(stories, deferredFilter, focusProfile);

  return (
    <ScreenShell>
      <HeroPanel
        eyebrow="Personalized Feed"
        title="The stories most likely to move your names rise first."
        body={`Ranking is shaped by ${focusProfile.sectors.join(', ')} plus ${focusProfile.tickers.join(', ')}. This is a mock feed, but the prioritization logic matches the live product direction.`}
      >
        <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
          <ChipGroup>
            {focusProfile.sectors.map((sector) => (
              <ToggleChip key={sector} label={sector} active onPress={() => undefined} />
            ))}
          </ChipGroup>
        </View>
      </HeroPanel>

      <View style={styles.utilityRow}>
        <View style={{ flex: 1, gap: spacing.xs }}>
          <Text style={styles.heading}>Morning Focus</Text>
          <Text style={styles.helper}>
            Filter the feed by urgency or by the part of your focus profile you want to stress.
          </Text>
        </View>
        <View style={{ minWidth: 120 }}>
          <ActionButton label="Edit Focus" variant="secondary" onPress={onBack} />
        </View>
      </View>

      <ChipGroup>
        {filters.map((filter) => (
          <ToggleChip
            key={filter}
            label={filter}
            active={activeFilter === filter}
            onPress={() => setActiveFilter(filter)}
          />
        ))}
      </ChipGroup>

      <BodyText emphasized>
        {visibleStories.length} stories match your current lens. Open any card to read the full thesis and compare how outlets frame the same event.
      </BodyText>

      {visibleStories.map((story) => (
        <StoryCard key={story.id} story={story} onPress={() => onOpenStory(story)} />
      ))}
    </ScreenShell>
  );
}

export default function FeedRouteScreen() {
  const navigation = useNavigation<any>();
  const { focusProfile, reopenSetup, stories } = useAppFlow();
  const addRecentStory = useRecentStoriesStore((state) => state.addStory);
  const setActiveStory = useSessionStore((state) => state.setActiveStory);

  const handleOpenStory = (story: Story) => {
    const context = toStoryContext(story);
    addRecentStory(context);
    setActiveStory(story.id);
    navigation.navigate(Routes.StoryDetail, {
      storyId: story.id,
      story: context,
    });
  };

  return (
    <FeedScreen
      focusProfile={focusProfile}
      stories={stories}
      onBack={reopenSetup}
      onOpenStory={handleOpenStory}
    />
  );
}
