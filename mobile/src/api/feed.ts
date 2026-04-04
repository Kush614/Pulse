import { FeedEvent } from '../contracts';
import { apiRequest } from './client';

export function fetchFeed(signal?: AbortSignal): Promise<FeedEvent[]> {
  return apiRequest<FeedEvent[]>('/api/feed', { signal });
}
