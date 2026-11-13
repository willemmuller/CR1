import type { CompiledEvidencePolicy } from '../entities';
import type { Clock } from '../util/clock';
import type { DataContext } from './dataContext';
import { VersionedRepository } from './versionedRepository';
import type { RecordBody } from './versionedRepository';

export class CompiledEvidencePolicyRepository extends VersionedRepository<CompiledEvidencePolicy> {
  constructor(context: DataContext, clock: Clock) {
    super(context.compiledEvidencePolicies, clock);
  }

  /** The current compiled policy for a stack and evidence, or null if none has been published. */
  async getForStack(delegationStackId: string, evidenceId: string): Promise<CompiledEvidencePolicy | null> {
    return this.get(compiledPolicyId(delegationStackId, evidenceId));
  }

  /** Stores the compiled policy for its stack and evidence. Writes nothing if it has not changed. */
  async save(body: RecordBody<CompiledEvidencePolicy>): Promise<CompiledEvidencePolicy> {
    return this.put(compiledPolicyId(body.delegationStackId, body.evidenceId), body);
  }
}

export function compiledPolicyId(delegationStackId: string, evidenceId: string): string {
  return `${delegationStackId}__${evidenceId}__COMPILED`;
}
