import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { FixedClock, InMemoryDataContext, Repository, loadDataset } from '../../src';
import type { Dataset } from '../../src';

export const STACK_ID = 'ZEDLAND_GUILD_REGULATOR__HARBOUR_GUILD_HALL';
export const ROW_1_ID = `${STACK_ID}__STACK1`;
export const ROW_2_ID = `${STACK_ID}__STACK2`;
export const EVIDENCE_ID = 'ZEDLAND__GUILD_LICENCE';

export const T0 = '2026-01-01T00:00:00.000Z';
export const T1 = '2026-02-01T00:00:00.000Z';
export const T2 = '2026-03-01T00:00:00.000Z';

export function readDataset(name: string): Dataset {
  const path = fileURLToPath(new URL(`../../fixtures/stacks/${name}.json`, import.meta.url));
  return JSON.parse(readFileSync(path, 'utf8')) as Dataset;
}

export interface Harness {
  context: InMemoryDataContext;
  repository: Repository;
  clock: FixedClock;
}

export function createHarness(): Harness {
  const context = new InMemoryDataContext();
  const clock = new FixedClock(T0);
  const repository = new Repository(context, clock);
  return { context, repository, clock };
}

/** A harness with the guild-licence stack loaded at T0 and the clock moved on to T1. */
export async function createGuildLicenceHarness(dataset: Dataset = readDataset('guild-licence')): Promise<Harness> {
  const harness = createHarness();
  await loadDataset(harness.repository, harness.context, dataset);
  harness.clock.set(T1);
  return harness;
}
