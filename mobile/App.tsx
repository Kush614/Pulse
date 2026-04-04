import { StatusBar } from 'expo-status-bar';
import { useState, startTransition } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { FeedScreen } from './src/features/feed/FeedScreen';
import { FocusSetupScreen } from './src/features/focus/FocusSetupScreen';
import { SourceLensScreen } from './src/features/sources/SourceLensScreen';
import { StoryDetailScreen } from './src/features/story/StoryDetailScreen';
import {
  DEFAULT_FOCUS_PROFILE,
  demoStories,
  findStoryById,
  type FocusProfile,
  type ScreenName,
  type Story,
} from './src/features/story/types';
import { usePulseFonts } from './src/theme/usePulseFonts';
import { palette } from './src/theme/tokens';

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.canvas,
  },
});

export default function App() {
  const [fontsLoaded] = usePulseFonts();
  const [screen, setScreen] = useState<ScreenName>('focus');
  const [focusProfile, setFocusProfile] = useState<FocusProfile>(DEFAULT_FOCUS_PROFILE);
  const [selectedStoryId, setSelectedStoryId] = useState<string>(demoStories[0]?.id ?? '');

  if (!fontsLoaded) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={palette.accent} size="small" />
        <StatusBar style="dark" />
      </View>
    );
  }

  const selectedStory = findStoryById(selectedStoryId) ?? demoStories[0];

  const navigate = (next: ScreenName) => {
    startTransition(() => {
      setScreen(next);
    });
  };

  const handleFocusContinue = (profile: FocusProfile) => {
    setFocusProfile(profile);
    navigate('feed');
  };

  const handleSelectStory = (story: Story) => {
    setSelectedStoryId(story.id);
    navigate('story');
  };

  return (
    <>
      {screen === 'focus' ? (
        <FocusSetupScreen
          initialProfile={focusProfile}
          onContinue={handleFocusContinue}
        />
      ) : null}
      {screen === 'feed' ? (
        <FeedScreen
          focusProfile={focusProfile}
          stories={demoStories}
          onBack={() => navigate('focus')}
          onOpenStory={handleSelectStory}
        />
      ) : null}
      {screen === 'story' && selectedStory ? (
        <StoryDetailScreen
          focusProfile={focusProfile}
          story={selectedStory}
          onBack={() => navigate('feed')}
          onOpenSources={() => navigate('sources')}
        />
      ) : null}
      {screen === 'sources' && selectedStory ? (
        <SourceLensScreen
          story={selectedStory}
          onBack={() => navigate('story')}
        />
      ) : null}
      <StatusBar style="dark" />
    </>
  );
}
