import type {
  Authority,
  AuthorityType,
  CompiledEvidencePolicy,
  Evidence,
  EvidenceDelegation,
  EvidenceType,
  Org,
  OrgDelegation,
  PublishLog,
  UserEvidence,
} from '../entities';
import type { Table } from './table';

/**
 * The session the repositories run against. Changes made through the tables
 * are staged until saveChanges; discardChanges drops them.
 */
export interface DataContext {
  readonly authorityTypes: Table<AuthorityType>;
  readonly evidenceTypes: Table<EvidenceType>;
  readonly authorities: Table<Authority>;
  readonly orgs: Table<Org>;
  readonly orgDelegations: Table<OrgDelegation>;
  readonly evidences: Table<Evidence>;
  readonly evidenceDelegations: Table<EvidenceDelegation>;
  readonly compiledEvidencePolicies: Table<CompiledEvidencePolicy>;
  readonly publishLogs: Table<PublishLog>;
  readonly userEvidences: Table<UserEvidence>;

  saveChanges(): Promise<void>;
  discardChanges(): void;
}
