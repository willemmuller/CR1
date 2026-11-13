import type { VersionedRecord } from '../versionedRecord';

/**
 * One row of a delegation stack: an authority's mandate reaching an org.
 * Rows of a stack share a delegationStackId and are ordered by
 * delegationStackIndex, starting at 1. A higher index is closer to the
 * applicant and takes precedence over the rows below it.
 */
export interface OrgDelegation extends VersionedRecord {
  delegationStackId: string;
  delegationStackIndex: number;
  authorityId: string;
  orgId: string;
  evidenceTypes: string[];
}
