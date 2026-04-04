import { join } from 'node:path';
import { readJsonFile } from '../lib/json-file.js';

export interface SourceCatalogItem {
  name: string;
  url: string;
  category: string;
  lean: 'left' | 'center' | 'right';
  propagandaRisk: 'low' | 'medium' | 'high';
  stateAffiliated?: string;
  note?: string;
}

const sourcesPath = join(process.cwd(), 'backend', 'data', 'sources.json');

export async function loadSourceCatalog(): Promise<SourceCatalogItem[]> {
  return readJsonFile<SourceCatalogItem[]>(sourcesPath, []);
}
