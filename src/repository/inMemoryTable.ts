import type { VersionedRecord } from '../entities';
import { cloneJson } from '../util/json';
import type { Table } from './table';

/**
 * A table held in memory. Rows are copied on the way in and on the way out,
 * so a caller can never change stored state by holding on to a record.
 */
export class InMemoryTable<T extends VersionedRecord> implements Table<T> {
  private saved: T[] = [];
  private staged: T[] | null = null;

  all(): T[] {
    return cloneJson(this.staged ?? this.saved);
  }

  add(record: T): void {
    const rows = this.working();
    if (rows.some((row) => row.temporalId === record.temporalId)) {
      throw new Error(`A row with temporalId '${record.temporalId}' already exists.`);
    }
    rows.push(cloneJson(record));
  }

  update(temporalId: string, record: T): void {
    const rows = this.working();
    const index = rows.findIndex((row) => row.temporalId === temporalId);
    if (index < 0) {
      throw new Error(`No row with temporalId '${temporalId}'.`);
    }
    rows[index] = cloneJson(record);
  }

  hasStagedChanges(): boolean {
    return this.staged !== null;
  }

  commit(): void {
    if (this.staged !== null) {
      this.saved = this.staged;
      this.staged = null;
    }
  }

  rollback(): void {
    this.staged = null;
  }

  private working(): T[] {
    if (this.staged === null) {
      this.staged = cloneJson(this.saved);
    }
    return this.staged;
  }
}
