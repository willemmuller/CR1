import type { VersionedRecord } from './versionedRecord';

export type PublishOutcome = 'PUBLISHED' | 'REJECTED';

export type LogLevel = 'info' | 'warning' | 'error';

export interface PublishLogEntry {
  sequence: number;
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
  /** Instant the run started. */
  startedAt: string;
  outcome: PublishOutcome;
  entries: PublishLogEntry[];
}
