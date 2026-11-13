import type { JsonObject } from '../util/json';
import type { Policy } from './policy';
import type { VersionedRecord } from './versionedRecord';

/** The only compiled artifact: one per delegation stack and evidence. */
export interface CompiledEvidencePolicy extends VersionedRecord {
  delegationStackId: string;
  evidenceId: string;
  policy: Policy;
  schema: JsonObject;
  /** temporalIds of the delegation rows and templates this was built from. */
  builtFrom: string[];
}
