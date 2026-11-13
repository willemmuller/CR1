import type { OrgDelegation } from '../entities';
import type { Clock } from '../util/clock';
import type { DataContext } from './dataContext';
import { VersionedRepository } from './versionedRepository';

export class OrgDelegationRepository extends VersionedRepository<OrgDelegation> {
  constructor(context: DataContext, clock: Clock) {
    super(context.orgDelegations, clock);
  }

  /** The current rows of a delegation stack, lowest index first. */
  async getDelegationStack(delegationStackId: string): Promise<OrgDelegation[]> {
    return this.current()
      .filter((row) => row.delegationStackId === delegationStackId)
      .sort((left, right) => left.delegationStackIndex - right.delegationStackIndex);
  }
}
