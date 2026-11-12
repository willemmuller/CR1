import type {
  Authority,
  CompiledEvidencePolicy,
  Evidence,
  EvidenceDelegation,
  Org,
  OrgDelegation,
  PolicyTemplate,
  PublishLog,
  VersionedRecord,
} from '../entities';
import { cloneJson } from '../util/json';
import type { DataContext, Table } from './dataContext';

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

export class InMemoryDataContext implements DataContext {
  readonly authorities = new InMemoryTable<Authority>();
  readonly orgs = new InMemoryTable<Org>();
  readonly orgDelegations = new InMemoryTable<OrgDelegation>();
  readonly evidences = new InMemoryTable<Evidence>();
  readonly evidenceDelegations = new InMemoryTable<EvidenceDelegation>();
  readonly policyTemplates = new InMemoryTable<PolicyTemplate>();
  readonly compiledEvidencePolicies = new InMemoryTable<CompiledEvidencePolicy>();
  readonly publishLogs = new InMemoryTable<PublishLog>();

  async saveChanges(): Promise<void> {
    for (const table of this.tables()) {
      table.commit();
    }
  }

  discardChanges(): void {
    for (const table of this.tables()) {
      table.rollback();
    }
  }

  hasStagedChanges(): boolean {
    return this.tables().some((table) => table.hasStagedChanges());
  }

  private tables(): InMemoryTable<VersionedRecord>[] {
    return [
      this.authorities,
      this.orgs,
      this.orgDelegations,
      this.evidences,
      this.evidenceDelegations,
      this.policyTemplates,
      this.compiledEvidencePolicies,
      this.publishLogs,
    ] as unknown as InMemoryTable<VersionedRecord>[];
  }
}
