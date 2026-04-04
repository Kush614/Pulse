import { TradeSignal } from '../contracts';
import { apiRequest } from './client';

export function fetchSignals(signal?: AbortSignal): Promise<TradeSignal[]> {
  return apiRequest<TradeSignal[]>('/api/signals', { signal });
}
