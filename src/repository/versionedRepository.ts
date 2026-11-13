import type { VersionedRecord } from '../entities';
import type { Clock } from '../util/clock';
import { jsonEquals } from '../util/json';
import type { Table } from './table';

/** The fields of a record that the caller supplies; the versioning fields are the repository's. */
export type RecordBody<T extends VersionedRecord> = Omit<T, keyof VersionedRecord>;

const VERSIONING_FIELDS: readonly (keyof VersionedRecord)[] = ['stableId', 'temporalId', 'from', 'to'];

/**
 * What every repository does: read current versions and write new ones.
 *
 * Writes are staged on the data context; nothing is stored until the unit of
 * work saves.
 */
export abstract class VersionedRepository<T extends VersionedRecord> {
  protected constructor(
    private readonly table: Table<T>,
    private readonly clock: Clock,
  ) {}

  /** The current version of a record, or null if it has none. */
  async get(stableId: string): Promise<T | null> {
    return this.current().find((row) => row.stableId === stableId) ?? null;
  }

  /** Every version of a record, oldest first. */
  history(stableId: string): T[] {
    return this.table
      .all()
      .filter((row) => row.stableId === stableId)
      .sort((left, right) => versionOf(left) - versionOf(right));
  }

  /**
   * Stores a record under its stableId. If the current version already has
   * this body, nothing is written and that version is returned. Otherwise the
   * current version is closed and a new one becomes current.
   */
  put(stableId: string, body: RecordBody<T>): T {
    const versions = this.history(stableId);
    const current = versions.find((row) => row.to === null) ?? null;
    if (current !== null && jsonEquals(bodyOf(current), body)) {
      return current;
    }
    return this.insertVersion(stableId, body, versions, current);
  }

  /** Stores a new version whether or not the body changed. For records that are a history of runs. */
  append(stableId: string, body: RecordBody<T>): T {
    const versions = this.history(stableId);
    const current = versions.find((row) => row.to === null) ?? null;
    return this.insertVersion(stableId, body, versions, current);
  }

  /** Every current version in the table. */
  protected current(): T[] {
    return this.table.all().filter((row) => row.to === null);
  }

  private insertVersion(stableId: string, body: RecordBody<T>, versions: T[], current: T | null): T {
    const now = this.clock.now();
    if (current !== null) {
      this.table.update(current.temporalId, { ...current, to: now });
    }
    const record = {
      ...body,
      stableId,
      temporalId: `${stableId}_v${versions.length + 1}`,
      from: now,
      to: null,
    } as unknown as T;
    this.table.add(record);
    return record;
  }
}

/** A record without its versioning fields. */
export function bodyOf<T extends VersionedRecord>(record: T): RecordBody<T> {
  const body = { ...record } as Record<string, unknown>;
  for (const field of VERSIONING_FIELDS) {
    delete body[field];
  }
  return body as RecordBody<T>;
}

function versionOf(record: VersionedRecord): number {
  const marker = record.temporalId.lastIndexOf('_v');
  return Number(record.temporalId.slice(marker + 2));
}
