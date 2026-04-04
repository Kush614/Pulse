import { join } from 'node:path';
import { readJsonFile } from '../lib/json-file.js';

export interface MarketSymbol {
  symbol: string;
  name: string;
  display: string;
}

export interface MarketSector {
  symbol: string;
  name: string;
}

export interface MarketReference {
  symbols: MarketSymbol[];
  sectors: MarketSector[];
}

const marketPath = join(process.cwd(), 'backend', 'data', 'market-reference.json');

export async function loadMarketReference(): Promise<MarketReference> {
  return readJsonFile<MarketReference>(marketPath, {
    symbols: [],
    sectors: [],
  });
}
