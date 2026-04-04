import { join } from 'node:path';
import { readJsonFile } from '../lib/json-file.js';

export interface UrgencyCatalog {
  critical: string[];
  high: string[];
  medium: string[];
  low: string[];
  exclusions: string[];
}

const urgencyPath = join(process.cwd(), 'backend', 'data', 'urgency-keywords.json');

export async function loadUrgencyCatalog(): Promise<UrgencyCatalog> {
  return readJsonFile<UrgencyCatalog>(urgencyPath, {
    critical: [],
    high: [],
    medium: [],
    low: [],
    exclusions: [],
  });
}
