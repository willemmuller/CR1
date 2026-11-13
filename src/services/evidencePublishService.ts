import type { CompiledEvidencePolicy, EvidenceDelegation, PublishLog } from '../entities';
import type { UnitOfWork } from '../repository';
import type { Clock } from '../util/clock';

export interface PublishRequest {
  delegationStackId: string;
  evidenceId: string;
}

export type PublishResult =
  | {
      kind: 'published';
      /** The stack's rows for this evidence, lowest index first, each with its fragment. */
      fragments: EvidenceDelegation[];
      compiled: CompiledEvidencePolicy;
      log: PublishLog;
    }
  | {
      kind: 'rejected';
      log: PublishLog;
    };

/**
 * Publishes the compiled policy for one evidence on one delegation stack,
 * from the policy observed at each row of the stack.
 */
export class EvidencePublishService {
  constructor(
    protected readonly unitOfWork: UnitOfWork,
    protected readonly clock: Clock,
  ) {}

  async publish(request: PublishRequest): Promise<PublishResult> {
    throw new Error(
      `Publishing is not implemented yet (stack '${request.delegationStackId}', evidence '${request.evidenceId}').`,
    );
  }
}
