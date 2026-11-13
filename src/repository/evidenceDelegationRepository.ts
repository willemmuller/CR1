import type { EvidenceDelegation, Policy } from '../entities';
import type { Clock } from '../util/clock';
import type { DataContext } from './dataContext';
import { VersionedRepository, bodyOf } from './versionedRepository';

export class EvidenceDelegationRepository extends VersionedRepository<EvidenceDelegation> {
  constructor(context: DataContext, clock: Clock) {
    super(context.evidenceDelegations, clock);
  }

  /** What one stack row says about one evidence, or null if it says nothing. */
  async getForRow(orgDelegationId: string, evidenceId: string): Promise<EvidenceDelegation | null> {
    const match = this.current().find(
      (row) => row.orgDelegationId === orgDelegationId && row.evidenceId === evidenceId,
    );
    return match ?? null;
  }

  /** Stores a row's fragment. Writes nothing if the row already has this fragment. */
  async savePolicyFragment(delegation: EvidenceDelegation, fragment: Policy): Promise<EvidenceDelegation> {
    return this.put(delegation.stableId, { ...bodyOf(delegation), policyFragment: fragment });
  }
}
