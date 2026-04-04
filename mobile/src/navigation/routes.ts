// Route names and param types for the entire app

import { StoryContext } from '../contracts';

export const Routes = {
  // Tab routes
  FeedTab: 'FeedTab',
  HistoryTab: 'HistoryTab',
  BriefingTab: 'BriefingTab',

  // Stack routes
  Feed: 'Feed',
  StoryDetail: 'StoryDetail',
  Chat: 'Chat',
  Decision: 'Decision',
  History: 'History',
  SourceLens: 'SourceLens',
} as const;

export type RootTabParamList = {
  [Routes.FeedTab]: undefined;
  [Routes.HistoryTab]: undefined;
  [Routes.BriefingTab]: undefined;
};

export type MainStackParamList = {
  [Routes.Feed]: undefined;
  [Routes.StoryDetail]: { storyId: string; story: StoryContext };
  [Routes.Chat]: { storyId: string; threadId?: string };
  [Routes.Decision]: { storyId: string; decisionId?: string };
  [Routes.History]: undefined;
  [Routes.SourceLens]: { storyId: string };
};
