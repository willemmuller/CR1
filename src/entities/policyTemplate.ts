import type { Policy } from './policy';
import type { VersionedRecord } from './versionedRecord';

/** A versioned input to expansion: the standard outcomes and steps a template name stands for. */
export interface PolicyTemplate extends VersionedRecord {
  name: string;
  content: Policy;
}
