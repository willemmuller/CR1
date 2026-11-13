import type { Clock } from '../util/clock';
import { AuthorityRepository } from './authorityRepository';
import { AuthorityTypeRepository } from './authorityTypeRepository';
import { CompiledEvidencePolicyRepository } from './compiledEvidencePolicyRepository';
import type { DataContext } from './dataContext';
import { EvidenceDelegationRepository } from './evidenceDelegationRepository';
import { EvidenceRepository } from './evidenceRepository';
import { EvidenceTypeRepository } from './evidenceTypeRepository';
import { OrgDelegationRepository } from './orgDelegationRepository';
import { OrgRepository } from './orgRepository';
import { PublishLogRepository } from './publishLogRepository';
import { UserEvidenceRepository } from './userEvidenceRepository';

/**
 * The repositories over one data context, saved or discarded together.
 * Everything written through them since the last save is one change.
 */
export class UnitOfWork {
  readonly authorityTypes: AuthorityTypeRepository;
  readonly evidenceTypes: EvidenceTypeRepository;
  readonly authorities: AuthorityRepository;
  readonly orgs: OrgRepository;
  readonly orgDelegations: OrgDelegationRepository;
  readonly evidences: EvidenceRepository;
  readonly evidenceDelegations: EvidenceDelegationRepository;
  readonly compiledEvidencePolicies: CompiledEvidencePolicyRepository;
  readonly publishLogs: PublishLogRepository;
  readonly userEvidences: UserEvidenceRepository;

  constructor(
    private readonly context: DataContext,
    clock: Clock,
  ) {
    this.authorityTypes = new AuthorityTypeRepository(context, clock);
    this.evidenceTypes = new EvidenceTypeRepository(context, clock);
    this.authorities = new AuthorityRepository(context, clock);
    this.orgs = new OrgRepository(context, clock);
    this.orgDelegations = new OrgDelegationRepository(context, clock);
    this.evidences = new EvidenceRepository(context, clock);
    this.evidenceDelegations = new EvidenceDelegationRepository(context, clock);
    this.compiledEvidencePolicies = new CompiledEvidencePolicyRepository(context, clock);
    this.publishLogs = new PublishLogRepository(context, clock);
    this.userEvidences = new UserEvidenceRepository(context, clock);
  }

  async saveChanges(): Promise<void> {
    await this.context.saveChanges();
  }

  discardChanges(): void {
    this.context.discardChanges();
  }
}
