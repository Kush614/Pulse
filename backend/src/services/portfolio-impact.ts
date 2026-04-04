import type {
  FeedEvent,
  PortfolioHoldingImpact,
  PortfolioImpactRequest,
  PortfolioImpactResponse,
  TradeSignal,
} from '../contracts.js';
import { RuntimeStoreRepository } from '../lib/runtime-store.js';
import { syncPortfolioToInsforge } from './insforge-sync.js';

const storeRepo = new RuntimeStoreRepository();

const SECTOR_SYMBOLS: Record<string, string[]> = {
  Technology: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'XLK'],
  Semiconductors: ['NVDA', 'AVGO', 'TSM', 'SMH'],
  Financials: ['JPM', 'BAC', 'MA', 'V', 'XLF'],
  Energy: ['XOM', 'CVX', 'XLE', 'USO'],
  Materials: ['MP', 'FCX', 'XLB'],
  'Real Estate': ['IYR', 'XLRE'],
  Industrials: ['UPS', 'XLI', 'BA'],
  'Consumer Discretionary': ['TSLA', 'HD', 'XLY'],
};

function round(value: number, digits = 2): number {
  return Number(value.toFixed(digits));
}

function parseExpectedMove(move: string): number {
  const numeric = Number(move.replace(/[^\d.-]/g, ''));
  return Number.isFinite(numeric) ? numeric : 0;
}

function inferSector(ticker: string): string | null {
  const upper = ticker.toUpperCase();
  for (const [sector, symbols] of Object.entries(SECTOR_SYMBOLS)) {
    if (symbols.includes(upper)) return sector;
  }
  return null;
}

export async function calculatePortfolioImpact(
  request: PortfolioImpactRequest,
  events: FeedEvent[],
  signals: TradeSignal[],
): Promise<PortfolioImpactResponse> {
  const totalValue = request.holdings.reduce((sum, holding) => sum + holding.shares * holding.avgCost, 0);

  const holdings: PortfolioHoldingImpact[] = request.holdings.map((holding) => {
    const upper = holding.ticker.toUpperCase();
    const sector = inferSector(upper);

    const matchingEvents = events.filter((event) => {
      const direct = event.relatedTickers.some((ticker) => ticker.symbol.toUpperCase() === upper);
      const sectorMatch = sector ? event.sectorImpact.some((impact) => impact.sector === sector) : false;
      return direct || sectorMatch;
    });

    const matchingSignals = signals.filter((signal) => signal.ticker.toUpperCase() === upper);
    const geoImpact = round(
      matchingEvents.reduce((sum, event) => {
        const direct = event.relatedTickers.find((ticker) => ticker.symbol.toUpperCase() === upper)?.change ?? 0;
        const sectorMove = sector ? (event.sectorImpact.find((impact) => impact.sector === sector)?.impact ?? 0) * 0.65 : 0;
        return sum + direct + sectorMove;
      }, 0)
      + matchingSignals.reduce((sum, signal) => sum + parseExpectedMove(signal.expectedMove) * (signal.action === 'SHORT' ? -1 : 1), 0),
    );
    const value = round(holding.shares * holding.avgCost);
    const weight = totalValue > 0 ? round((value / totalValue) * 100) : 0;

    return {
      ticker: upper,
      name: upper,
      weight,
      value,
      geoImpact,
      exposedTo: matchingEvents.map((event) => ({
        headline: event.headline,
        impact: round(
          event.relatedTickers.find((ticker) => ticker.symbol.toUpperCase() === upper)?.change
          ?? (sector ? (event.sectorImpact.find((impact) => impact.sector === sector)?.impact ?? 0) * 0.65 : 0),
        ),
      })),
    };
  });

  const result: PortfolioImpactResponse = {
    totalValue: round(totalValue),
    aggregateRisk: round(holdings.reduce((sum, holding) => sum + Math.abs(holding.geoImpact) * (holding.weight / 100), 0)),
    totalImpact: round(holdings.reduce((sum, holding) => sum + (holding.geoImpact * holding.weight / 100), 0)),
    holdings,
  };

  const store = await storeRepo.read();
  await storeRepo.write({
    ...store,
    portfolios: [...store.portfolios, request].slice(-25),
  });
  await syncPortfolioToInsforge(result);

  return result;
}
