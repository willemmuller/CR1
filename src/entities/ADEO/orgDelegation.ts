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
  /** The stableId of an Authority. */
  authorityId: string;
  /** The stableId of an Org. */
  orgId: string;
  /** The kinds of evidence this org issues under the mandate. Each is the stableId of an EvidenceType, and one the authority's type covers. */
  evidenceTypes: string[];
}
