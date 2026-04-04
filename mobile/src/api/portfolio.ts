import {
  PortfolioImpactRequest,
  PortfolioImpactResponse,
} from '../contracts';
import { apiRequest } from './client';

export function fetchPortfolioImpact(
  request: PortfolioImpactRequest,
  signal?: AbortSignal,
): Promise<PortfolioImpactResponse> {
  return apiRequest<PortfolioImpactResponse>('/api/portfolio-impact', {
    method: 'POST',
    body: request,
    signal,
  });
}
