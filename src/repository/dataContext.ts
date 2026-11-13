import type {
  Authority,
  CompiledEvidencePolicy,
  Evidence,
  EvidenceDelegation,
  Org,
  OrgDelegation,
  PublishLog,
} from '../entities';
import type { Table } from './table';

/**
 * The session the repositories run against. Changes made through the tables
 * are staged until saveChanges; discardChanges drops them.
 */
export interface DataContext {
  readonly authorities: Table<Authority>;
  readonly orgs: Table<Org>;
  readonly orgDelegations: Table<OrgDelegation>;
  readonly evidences: Table<Evidence>;
  readonly evidenceDelegations: Table<EvidenceDelegation>;
  readonly compiledEvidencePolicies: Table<CompiledEvidencePolicy>;
  readonly publishLogs: Table<PublishLog>;

  saveChanges(): Promise<void>;
  discardChanges(): void;
}
