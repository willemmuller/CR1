import type { JsonObject } from '../util/json';
import type { Policy } from './policy';

/**
 * Fields carried by every stored record.
 *
 * A record is identified across time by its stableId. Each change produces a
 * new version with its own temporalId ('{stableId}_v{n}'); the version it
 * replaces has its `to` set. Rows are never removed. The current version is
 * the one whose `to` is null.
 */
export interface VersionedRecord {
  stableId: string;
  temporalId: string;
  /** Instant this version became current. */
  from: string;
  /** Instant this version was superseded, or null while current. */
  to: string | null;
}

/** A legislative mandate to issue evidence. Distinct from the orgs that carry it out. */
export interface Authority extends VersionedRecord {
  jurisdiction: string;
  authorityType: string;
}

export interface Org extends VersionedRecord {
  name: string;
}

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

/** A document that can be issued. */
export interface Evidence extends VersionedRecord {
  name: string;
  evidenceTypes: string[];
  /** The document's fields. Orgs vary the process, not the document, so this passes into the compiled policy unchanged. */
  schemaFragment: JsonObject;
}

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

/** A versioned input to expansion: the standard outcomes and steps a template name stands for. */
export interface PolicyTemplate extends VersionedRecord {
  name: string;
  content: Policy;
}

/** The only compiled artifact: one per delegation stack and evidence. */
export interface CompiledEvidencePolicy extends VersionedRecord {
  delegationStackId: string;
  evidenceId: string;
  policy: Policy;
  schema: JsonObject;
  /** temporalIds of the delegation rows and templates this was built from. */
  builtFrom: string[];
}

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
