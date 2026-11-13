import type { Policy } from './policy';
import type { VersionedRecord } from './versionedRecord';

/**
 * What one stack row says about issuing one evidence.
 * observedPolicy is the process as that org's own pages present it.
 * policyFragment is derived from it on publish.
 */
export interface EvidenceDelegation extends VersionedRecord {
  orgDelegationId: string;
  evidenceId: string;
  observedPolicy: Policy | null;
  policyFragment: Policy | null;
}
