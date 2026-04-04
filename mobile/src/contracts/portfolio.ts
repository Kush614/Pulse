// Portfolio impact types for POST /api/portfolio-impact

export interface PortfolioHolding {
  ticker: string;
  shares: number;
  avgCost: number;
}

export interface HoldingExposure {
  headline: string;
  impact: number;
}

export interface PortfolioHoldingImpact {
  ticker: string;
  name: string;
  weight: number;
  value: number;
  geoImpact: number;
  exposedTo: HoldingExposure[];
}

export interface PortfolioImpactRequest {
  holdings: PortfolioHolding[];
}

export interface PortfolioImpactResponse {
  totalValue: number;
  aggregateRisk: number;
  totalImpact: number;
  holdings: PortfolioHoldingImpact[];
}
