import type {
  CompiledEvidencePolicy,
  Evidence,
  EvidenceDelegation,
  OrgDelegation,
  Policy,
  PolicyTemplate,
  PublishLog,
  VersionedRecord,
} from '../entities';
import type { Clock } from '../util/clock';
import { jsonEquals } from '../util/json';
import type { DataContext, Table } from './dataContext';

/** The fields of a record that the caller supplies; the versioning fields are the repository's. */
export type RecordBody<T extends VersionedRecord> = Omit<T, keyof VersionedRecord>;

const VERSIONING_FIELDS: readonly (keyof VersionedRecord)[] = ['stableId', 'temporalId', 'from', 'to'];

/**
 * Reads and writes versioned records through a data context.
 *
 * Reads return current versions unless they say otherwise. Writes are staged
 * on the context; nothing is stored until saveChanges.
 */
export class Repository {
  constructor(
    private readonly context: DataContext,
    private readonly clock: Clock,
  ) {}

  // --- reads ---------------------------------------------------------------

  /** The current rows of a delegation stack, lowest index first. */
  async getDelegationStack(delegationStackId: string): Promise<OrgDelegation[]> {
    return this.current(this.context.orgDelegations)
      .filter((row) => row.delegationStackId === delegationStackId)
      .sort((left, right) => left.delegationStackIndex - right.delegationStackIndex);
  }

  async getEvidence(evidenceId: string): Promise<Evidence | null> {
    return this.findCurrent(this.context.evidences, evidenceId);
  }

  async getEvidenceDelegation(orgDelegationId: string, evidenceId: string): Promise<EvidenceDelegation | null> {
    const match = this.current(this.context.evidenceDelegations).find(
      (row) => row.orgDelegationId === orgDelegationId && row.evidenceId === evidenceId,
    );
    return match ?? null;
  }

  /** Current templates, ordered by name so that expansion sees them in a stable order. */
  async getPolicyTemplates(): Promise<PolicyTemplate[]> {
    return this.current(this.context.policyTemplates).sort((left, right) => compareText(left.name, right.name));
  }

  async getCompiledEvidencePolicy(delegationStackId: string, evidenceId: string): Promise<CompiledEvidencePolicy | null> {
    return this.findCurrent(this.context.compiledEvidencePolicies, compiledPolicyId(delegationStackId, evidenceId));
  }

  /** Every publish run for a stack and evidence, oldest first. */
  async getPublishLogs(delegationStackId: string, evidenceId: string): Promise<PublishLog[]> {
    return this.history(this.context.publishLogs, publishLogId(delegationStackId, evidenceId));
  }

  /** Every version of a record, oldest first. */
  history<T extends VersionedRecord>(table: Table<T>, stableId: string): T[] {
    return table
      .all()
      .filter((row) => row.stableId === stableId)
      .sort((left, right) => versionOf(left) - versionOf(right));
  }

  // --- writes --------------------------------------------------------------

  /**
   * Stores a record under its stableId. If the current version already has
   * this body, nothing is written and that version is returned. Otherwise the
   * current version is closed and a new one becomes current.
   */
  put<T extends VersionedRecord>(table: Table<T>, stableId: string, body: RecordBody<T>): T {
    const versions = this.history(table, stableId);
    const current = versions.find((row) => row.to === null) ?? null;
    if (current !== null && jsonEquals(bodyOf(current), body)) {
      return current;
    }
    return this.insertVersion(table, stableId, body, versions, current);
  }

  /** Stores a new version whether or not the body changed. For records that are a history of runs. */
  append<T extends VersionedRecord>(table: Table<T>, stableId: string, body: RecordBody<T>): T {
    const versions = this.history(table, stableId);
    const current = versions.find((row) => row.to === null) ?? null;
    return this.insertVersion(table, stableId, body, versions, current);
  }

  async savePolicyFragment(delegation: EvidenceDelegation, fragment: Policy): Promise<EvidenceDelegation> {
    const body: RecordBody<EvidenceDelegation> = { ...bodyOf(delegation), policyFragment: fragment };
    return this.put(this.context.evidenceDelegations, delegation.stableId, body);
  }

  async saveCompiledEvidencePolicy(body: RecordBody<CompiledEvidencePolicy>): Promise<CompiledEvidencePolicy> {
    const stableId = compiledPolicyId(body.delegationStackId, body.evidenceId);
    return this.put(this.context.compiledEvidencePolicies, stableId, body);
  }

  async appendPublishLog(body: RecordBody<PublishLog>): Promise<PublishLog> {
    const stableId = publishLogId(body.delegationStackId, body.evidenceId);
    return this.append(this.context.publishLogs, stableId, body);
  }

  async saveChanges(): Promise<void> {
    await this.context.saveChanges();
  }

  discardChanges(): void {
    this.context.discardChanges();
  }

  // --- internals -----------------------------------------------------------

  private current<T extends VersionedRecord>(table: Table<T>): T[] {
    return table.all().filter((row) => row.to === null);
  }

  private findCurrent<T extends VersionedRecord>(table: Table<T>, stableId: string): T | null {
    return this.current(table).find((row) => row.stableId === stableId) ?? null;
  }

  private insertVersion<T extends VersionedRecord>(
    table: Table<T>,
    stableId: string,
    body: RecordBody<T>,
    versions: T[],
    current: T | null,
  ): T {
    const now = this.clock.now();
    if (current !== null) {
      table.update(current.temporalId, { ...current, to: now });
    }
    const record = {
      ...body,
      stableId,
      temporalId: `${stableId}_v${versions.length + 1}`,
      from: now,
      to: null,
    } as unknown as T;
    table.add(record);
    return record;
  }
}

export function compiledPolicyId(delegationStackId: string, evidenceId: string): string {
  return `${delegationStackId}__${evidenceId}__COMPILED`;
}

export function publishLogId(delegationStackId: string, evidenceId: string): string {
  return `${delegationStackId}__${evidenceId}__PUBLISH_LOG`;
}

function bodyOf<T extends VersionedRecord>(record: T): RecordBody<T> {
  const body = { ...record } as Record<string, unknown>;
  for (const field of VERSIONING_FIELDS) {
    delete body[field];
  }
  return body as RecordBody<T>;
}

function versionOf(record: VersionedRecord): number {
  const marker = record.temporalId.lastIndexOf('_v');
  return Number(record.temporalId.slice(marker + 2));
}

function compareText(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}
