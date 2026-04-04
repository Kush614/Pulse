import { mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { writeJsonFile } from '../backend/src/lib/json-file.js';

type Lean = 'left' | 'center' | 'right';

interface SourceRecord {
  name: string;
  url: string;
  category: string;
  lean: Lean;
  propagandaRisk: 'low' | 'medium' | 'high';
  stateAffiliated?: string;
  note?: string;
}

interface MarketReference {
  symbols: Array<{ symbol: string; name: string; display: string }>;
  sectors: Array<{ symbol: string; name: string }>;
}

const root = process.cwd();
const worldmonitor = (...parts: string[]) => join(root, 'worldmonitor', ...parts);
const out = (...parts: string[]) => join(root, 'backend', 'data', ...parts);

function inferLean(name: string): Lean {
  const left = ['Guardian', 'NPR', 'Vox', 'Atlantic', 'PBS', 'MSNBC'];
  const right = ['Fox', 'National Review', 'WSJ', 'Al Arabiya'];
  if (left.some((needle) => name.includes(needle))) return 'left';
  if (right.some((needle) => name.includes(needle))) return 'right';
  return 'center';
}

function extractPropagandaRisk(fileText: string) {
  const match = fileText.match(/export const SOURCE_PROPAGANDA_RISK: Record<string, SourceRiskProfile> = \{([\s\S]*?)\n\};/);
  if (!match) return new Map<string, Omit<SourceRecord, 'url' | 'category' | 'lean'>>();

  const body = match[1];
  const entryRegex = /'([^']+)': \{([^}]+)\}/g;
  const result = new Map<string, Omit<SourceRecord, 'url' | 'category' | 'lean'>>();
  for (const entry of body.matchAll(entryRegex)) {
    const name = entry[1];
    const fields = entry[2];
    const risk = (fields.match(/risk: '([^']+)'/)?.[1] ?? 'low') as SourceRecord['propagandaRisk'];
    const stateAffiliated = fields.match(/stateAffiliated: '([^']+)'/)?.[1];
    const note = fields.match(/note: '([^']+)'/)?.[1];
    result.set(name, { name, propagandaRisk: risk, stateAffiliated, note });
  }
  return result;
}

function extractThreatKeywords(fileText: string) {
  const blockNames = [
    'CRITICAL_KEYWORDS',
    'HIGH_KEYWORDS',
    'MEDIUM_KEYWORDS',
    'LOW_KEYWORDS',
    'EXCLUSIONS',
  ] as const;

  const keywords: Record<string, string[]> = {
    critical: [],
    high: [],
    medium: [],
    low: [],
    exclusions: [],
  };

  for (const blockName of blockNames) {
    if (blockName === 'EXCLUSIONS') {
      const match = fileText.match(/const EXCLUSIONS = \[([\s\S]*?)\];/);
      if (!match) continue;
      keywords.exclusions = [...match[1].matchAll(/'([^']+)'/g)].map((entry) => entry[1]);
      continue;
    }

    const level = blockName.toLowerCase().replace('_keywords', '');
    const match = fileText.match(new RegExp(`const ${blockName}: KeywordMap = \\{([\\s\\S]*?)\\n\\};`));
    if (!match) continue;
    keywords[level] = [...match[1].matchAll(/'([^']+)':\s*'[^']+'/g)].map((entry) => entry[1]);
  }

  return keywords;
}

function extractFeedSources(fileText: string, categoryWhitelist: string[]) {
  const sources: Array<{ name: string; url: string; category: string }> = [];
  for (const category of categoryWhitelist) {
    const categoryPattern = new RegExp(`${category}: \\[([\\s\\S]*?)\\n  \\],`, 'm');
    const section = fileText.match(categoryPattern)?.[1];
    if (!section) continue;
    for (const entry of section.matchAll(/\{\s*name: '([^']+)',\s*url: rss\('([^']+)'\)/g)) {
      sources.push({ name: entry[1], url: entry[2], category });
    }
  }
  return sources;
}

async function main() {
  await mkdir(out(), { recursive: true });

  const feedsText = await readFile(worldmonitor('src', 'config', 'feeds.ts'), 'utf8');
  const financeVariantText = await readFile(worldmonitor('src', 'config', 'variants', 'finance.ts'), 'utf8');
  const threatText = await readFile(worldmonitor('src', 'services', 'threat-classifier.ts'), 'utf8');
  const stocks = JSON.parse(await readFile(worldmonitor('shared', 'stocks.json'), 'utf8')) as { symbols: MarketReference['symbols'] };
  const sectors = JSON.parse(await readFile(worldmonitor('shared', 'sectors.json'), 'utf8')) as { sectors: MarketReference['sectors'] };

  const propagandaRisk = extractPropagandaRisk(feedsText);
  const financeCategories = [
    'markets',
    'forex',
    'bonds',
    'commodities',
    'crypto',
    'centralbanks',
    'economic',
    'ipo',
    'derivatives',
    'fintech',
    'regulation',
    'institutional',
    'analysis',
  ];
  const financeSources = extractFeedSources(financeVariantText, financeCategories);

  const geoSourceNames = ['BBC World', 'Guardian World', 'AP News', 'Reuters World', 'NPR News', 'Politico', 'Axios', 'Al Jazeera', 'France 24', 'DW News', 'Le Monde', 'Nikkei Asia', 'The Diplomat', 'SCMP'];
  const geoSources = [...feedsText.matchAll(/\{\s*name: '([^']+)',\s*url: rss\('([^']+)'\)/g)]
    .filter((entry) => geoSourceNames.includes(entry[1]))
    .map((entry) => ({ name: entry[1], url: entry[2], category: 'geopolitics' }));

  const mergedSources: SourceRecord[] = [...financeSources, ...geoSources].map((source) => {
    const risk = propagandaRisk.get(source.name);
    return {
      ...source,
      lean: inferLean(source.name),
      propagandaRisk: risk?.propagandaRisk ?? 'low',
      stateAffiliated: risk?.stateAffiliated,
      note: risk?.note,
    };
  });

  await writeJsonFile(out('sources.json'), mergedSources);
  await writeJsonFile(out('urgency-keywords.json'), extractThreatKeywords(threatText));
  await writeJsonFile(out('market-reference.json'), {
    symbols: stocks.symbols.slice(0, 50),
    sectors: sectors.sectors,
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
