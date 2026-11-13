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
