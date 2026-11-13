import type { VersionedRecord } from '../entities';

/** One stored collection of versioned records. Holds every version, current and superseded. */
export interface Table<T extends VersionedRecord> {
  /** Every row, including changes staged but not yet saved. */
  all(): T[];
  /** Stages a new row. */
  add(record: T): void;
  /** Stages a replacement for the row with this temporalId. */
  update(temporalId: string, record: T): void;
}
