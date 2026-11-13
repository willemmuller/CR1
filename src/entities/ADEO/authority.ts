import type { VersionedRecord } from '../versionedRecord';

/** A mandate, in one jurisdiction, to issue evidence. Distinct from the orgs that carry it out. */
export interface Authority extends VersionedRecord {
  jurisdiction: string;
  authorityType: string;
}
