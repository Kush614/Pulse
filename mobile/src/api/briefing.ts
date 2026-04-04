import { BriefingResponse } from '../contracts';
import { apiRequest } from './client';

export function fetchBriefing(
  signal?: AbortSignal,
): Promise<BriefingResponse> {
  return apiRequest<BriefingResponse>('/api/briefing', { signal });
}
