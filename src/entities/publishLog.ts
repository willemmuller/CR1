import type { VersionedRecord } from './versionedRecord';

/**
 * Where a publish run stands.
 *   IN_PROGRESS — started and not yet finished
 *   COMPLETE    — finished and produced a compiled policy
 *   FAIL        — finished without producing one
 *   CANCELLED   — stopped before it finished
 */
export type PublishStatus = 'COMPLETE' | 'FAIL' | 'IN_PROGRESS' | 'CANCELLED';

export type LogLevel = 'info' | 'warning' | 'error';

export interface PublishLogEntry {
  sequence: number;
  /** Instant the entry was written. */
  createdAt: string;
  level: LogLevel;
  code: string;
  message: string;
  /** The stack row the entry is about, when it is about one. */
  delegationStackIndex?: number;
  /** JSON pointer into that row's observed policy, when the entry is about one place in it. */
  pointer?: string;
}

/** The record of one publish run. Written whether or not anything was published. */
export interface PublishLog extends VersionedRecord {
  delegationStackId: string;
  evidenceId: string;
  /** The compiled policy the run produced, or null if it has not produced one. The stableId of a CompiledEvidencePolicy. */
  compiledEvidencePolicyId: string | null;
  /** Instant the run started. */
  startedAt: string;
  status: PublishStatus;
  entries: PublishLogEntry[];
}
