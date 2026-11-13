import type { Clock } from '../util/clock';
import { AuthorityRepository } from './authorityRepository';
import { CompiledEvidencePolicyRepository } from './compiledEvidencePolicyRepository';
import type { DataContext } from './dataContext';
import { EvidenceDelegationRepository } from './evidenceDelegationRepository';
import { EvidenceRepository } from './evidenceRepository';
import { OrgDelegationRepository } from './orgDelegationRepository';
import { OrgRepository } from './orgRepository';
import { PolicyTemplateRepository } from './policyTemplateRepository';
import { PublishLogRepository } from './publishLogRepository';

/**
 * The repositories over one data context, saved or discarded together.
 * Everything written through them since the last save is one change.
 */
export class UnitOfWork {
  readonly authorities: AuthorityRepository;
  readonly orgs: OrgRepository;
  readonly orgDelegations: OrgDelegationRepository;
  readonly evidences: EvidenceRepository;
  readonly evidenceDelegations: EvidenceDelegationRepository;
  readonly policyTemplates: PolicyTemplateRepository;
  readonly compiledEvidencePolicies: CompiledEvidencePolicyRepository;
  readonly publishLogs: PublishLogRepository;

  constructor(
    private readonly context: DataContext,
    clock: Clock,
  ) {
    this.authorities = new AuthorityRepository(context, clock);
    this.orgs = new OrgRepository(context, clock);
    this.orgDelegations = new OrgDelegationRepository(context, clock);
    this.evidences = new EvidenceRepository(context, clock);
    this.evidenceDelegations = new EvidenceDelegationRepository(context, clock);
    this.policyTemplates = new PolicyTemplateRepository(context, clock);
    this.compiledEvidencePolicies = new CompiledEvidencePolicyRepository(context, clock);
    this.publishLogs = new PublishLogRepository(context, clock);
  }

  async saveChanges(): Promise<void> {
    await this.context.saveChanges();
  }

  discardChanges(): void {
    this.context.discardChanges();
  }
}
