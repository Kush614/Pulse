import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { FocusSetupScreen } from './src/features/focus/FocusSetupScreen';
import { TabNavigator } from './src/navigation';
import {
  AppFlowProvider,
  DEFAULT_APP_STORIES,
} from './src/state/appFlowContext';
import { DEFAULT_FOCUS_PROFILE, type FocusProfile } from './src/features/story/types';
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

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: palette.canvas,
    card: palette.surface,
    text: palette.text,
    primary: palette.accent,
    border: palette.line,
    notification: palette.warning,
  },
};

export default function App() {
  const [fontsLoaded] = usePulseFonts();
  const [focusProfile, setFocusProfile] = useState<FocusProfile>(DEFAULT_FOCUS_PROFILE);
  const [setupComplete, setSetupComplete] = useState(false);

  if (!fontsLoaded) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={palette.accent} size="small" />
        <StatusBar style="dark" />
      </View>
    );
  }

  const contextValue = {
    focusProfile,
    setFocusProfile,
    setupComplete,
    completeSetup: (profile: FocusProfile) => {
      setFocusProfile(profile);
      setSetupComplete(true);
    },
    reopenSetup: () => setSetupComplete(false),
    stories: DEFAULT_APP_STORIES,
  };

  return (
    <AppFlowProvider value={contextValue}>
      {!setupComplete ? (
        <FocusSetupScreen
          initialProfile={focusProfile}
          onContinue={contextValue.completeSetup}
        />
      ) : (
        <NavigationContainer theme={navTheme}>
          <TabNavigator />
        </NavigationContainer>
      )}
      <StatusBar style="dark" />
    </AppFlowProvider>
  );
}
