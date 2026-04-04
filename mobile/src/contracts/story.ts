// StoryContext — shared shape passed from feed to detail, chat, and decision screens

import { FeedEvent } from './feed';

export interface StoryContext {
  /** The full feed event this story derives from */
  event: FeedEvent;
  /** ISO-8601 timestamp when user first opened this story */
  openedAt: string;
  /** Optional chat thread ID if a discussion already exists for this story */
  existingThreadId?: string;
}
