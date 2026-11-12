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

/** One stored collection of versioned records. Holds every version, current and superseded. */
export interface Table<T extends VersionedRecord> {
  /** Every row, including changes staged but not yet saved. */
  all(): T[];
  /** Stages a new row. */
  add(record: T): void;
  /** Stages a replacement for the row with this temporalId. */
  update(temporalId: string, record: T): void;
}

/**
 * The unit of work the repository runs against. Changes made through the
 * tables are staged until saveChanges; discardChanges drops them.
 */
export interface DataContext {
  readonly authorities: Table<Authority>;
  readonly orgs: Table<Org>;
  readonly orgDelegations: Table<OrgDelegation>;
  readonly evidences: Table<Evidence>;
  readonly evidenceDelegations: Table<EvidenceDelegation>;
  readonly policyTemplates: Table<PolicyTemplate>;
  readonly compiledEvidencePolicies: Table<CompiledEvidencePolicy>;
  readonly publishLogs: Table<PublishLog>;

  saveChanges(): Promise<void>;
  discardChanges(): void;
}
