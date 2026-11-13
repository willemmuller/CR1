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
import type { DataContext } from './dataContext';
import { InMemoryTable } from './inMemoryTable';

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
