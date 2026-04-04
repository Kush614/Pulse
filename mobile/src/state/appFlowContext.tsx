import { createContext, useContext, type ReactNode } from 'react';

import {
  demoStories,
  type FocusProfile,
  type Story,
} from '../features/story/types';

type AppFlowContextValue = {
  focusProfile: FocusProfile;
  setFocusProfile: (profile: FocusProfile) => void;
  setupComplete: boolean;
  completeSetup: (profile: FocusProfile) => void;
  reopenSetup: () => void;
  stories: Story[];
};

const AppFlowContext = createContext<AppFlowContextValue | null>(null);

export function AppFlowProvider({
  value,
  children,
}: {
  value: AppFlowContextValue;
  children: ReactNode;
}) {
  return <AppFlowContext.Provider value={value}>{children}</AppFlowContext.Provider>;
}

export function useAppFlow() {
  const value = useContext(AppFlowContext);

  if (!value) {
    throw new Error('useAppFlow must be used inside AppFlowProvider');
  }

  return value;
}

export const DEFAULT_APP_STORIES = demoStories;
