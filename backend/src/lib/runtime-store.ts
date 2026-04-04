import { env } from '../env.js';
import type { RuntimeStore } from '../contracts.js';
import { readJsonFile, writeJsonFile } from './json-file.js';

const EMPTY_STORE: RuntimeStore = {
  articles: [],
  events: [],
  signals: [],
  portfolios: [],
  briefings: [],
  memoryEntries: [],
};

export class RuntimeStoreRepository {
  async read(): Promise<RuntimeStore> {
    return readJsonFile<RuntimeStore>(env.PULSE_STORE_PATH, EMPTY_STORE);
  }

  async write(store: RuntimeStore): Promise<void> {
    await writeJsonFile(env.PULSE_STORE_PATH, store);
  }
}
