import type { VersionedRecord } from './versionedRecord';

/** A named private or government body. */
export interface Org extends VersionedRecord {
  name: string;
}
