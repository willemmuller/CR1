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
  VersionedRecord,
} from '../entities';
import type { DataContext } from './dataContext';
import { InMemoryTable } from './inMemoryTable';

export class InMemoryDataContext implements DataContext {
  readonly authorityTypes = new InMemoryTable<AuthorityType>();
  readonly evidenceTypes = new InMemoryTable<EvidenceType>();
  readonly authorities = new InMemoryTable<Authority>();
  readonly orgs = new InMemoryTable<Org>();
  readonly orgDelegations = new InMemoryTable<OrgDelegation>();
  readonly evidences = new InMemoryTable<Evidence>();
  readonly evidenceDelegations = new InMemoryTable<EvidenceDelegation>();
  readonly compiledEvidencePolicies = new InMemoryTable<CompiledEvidencePolicy>();
  readonly publishLogs = new InMemoryTable<PublishLog>();
  readonly userEvidences = new InMemoryTable<UserEvidence>();

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
      this.authorityTypes,
      this.evidenceTypes,
      this.authorities,
      this.orgs,
      this.orgDelegations,
      this.evidences,
      this.evidenceDelegations,
      this.compiledEvidencePolicies,
      this.publishLogs,
      this.userEvidences,
    ] as unknown as InMemoryTable<VersionedRecord>[];
  }
}
