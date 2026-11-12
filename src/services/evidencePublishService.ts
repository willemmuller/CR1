import type {
  CompiledEvidencePolicy,
  Evidence,
  EvidenceDelegation,
  LogLevel,
  OrgDelegation,
  Policy,
  PublishLog,
  PublishLogEntry,
  PublishOutcome,
} from '../entities';
import type { Diagnostic, PolicyPipeline } from '../pipeline';
import type { Repository } from '../repository';
import type { Clock } from '../util/clock';

export interface PublishRequest {
  delegationStackId: string;
  evidenceId: string;
}

export type PublishResult =
  | {
      kind: 'published';
      /** The stack's rows for this evidence, lowest index first, each with its fragment. */
      fragments: EvidenceDelegation[];
      compiled: CompiledEvidencePolicy;
      log: PublishLog;
    }
  | {
      kind: 'rejected';
      log: PublishLog;
    };

interface ObservedRow {
  row: OrgDelegation;
  delegation: EvidenceDelegation;
  observed: Policy;
}

interface PublishInput {
  evidence: Evidence;
  rows: ObservedRow[];
}

/**
 * Publishes the compiled policy for one evidence on one delegation stack.
 *
 * The input is the policy observed at each row of the stack. A publish:
 *   1. checks the stack and every row's observed policy;
 *   2. walks the stack from the lowest index up, reducing each observed policy
 *      to its fragment against the merge of the rows below, then merging that
 *      fragment in;
 *   3. expands the merged policy with the current templates;
 *   4. stores the fragments, the compiled policy and a log of the run.
 *
 * A publish is all or nothing: if any check fails, only the log is stored.
 * Publishing unchanged input stores no new versions other than the log.
 */
export class EvidencePublishService {
  constructor(
    private readonly repository: Repository,
    private readonly pipeline: PolicyPipeline,
    private readonly clock: Clock,
  ) {}

  async publish(request: PublishRequest): Promise<PublishResult> {
    const log = new RunLog();
    const startedAt = this.clock.now();

    const input = await this.loadInput(request, log);
    if (input !== null) {
      this.checkRows(input.rows, log);
    }
    if (input === null || log.hasErrors()) {
      return { kind: 'rejected', log: await this.storeLog(request, startedAt, 'REJECTED', log) };
    }
    const { evidence, rows } = input;

    // Fragment and merge, lowest row first. Each row sees only what is below it.
    let merged: Policy = {};
    const fragments: EvidenceDelegation[] = [];
    for (const { row, delegation, observed } of rows) {
      const fragment = this.pipeline.fragmenter.fragment(observed, merged);
      merged = this.pipeline.merger.merge(merged, fragment);

      const saved = await this.repository.savePolicyFragment(delegation, fragment);
      fragments.push(saved);
      const changed = saved.temporalId !== delegation.temporalId;
      log.add(
        'info',
        changed ? 'FRAGMENT_STORED' : 'FRAGMENT_UNCHANGED',
        changed ? `Fragment stored as ${saved.temporalId}.` : `Fragment is the same as in ${saved.temporalId}.`,
        row.delegationStackIndex,
      );
    }

    const templates = await this.repository.getPolicyTemplates();
    const policy = this.pipeline.expander.expand(merged, templates);


    const previous = await this.repository.getCompiledEvidencePolicy(request.delegationStackId, request.evidenceId);
    const compiled = await this.repository.saveCompiledEvidencePolicy({
      delegationStackId: request.delegationStackId,
      evidenceId: request.evidenceId,
      policy,
      // Orgs vary the process, not the document: the schema passes through as it is.
      schema: evidence.schemaFragment,
      builtFrom: [...fragments.map((row) => row.temporalId), ...templates.map((template) => template.temporalId)],
    });
    const recompiled = previous === null || previous.temporalId !== compiled.temporalId;
    log.add(
      'info',
      recompiled ? 'POLICY_COMPILED' : 'POLICY_UNCHANGED',
      recompiled
        ? `Compiled policy stored as ${compiled.temporalId}.`
        : `Compiled policy is the same as in ${compiled.temporalId}.`,
    );

    return {
      kind: 'published',
      fragments,
      compiled,
      log: await this.storeLog(request, startedAt, 'PUBLISHED', log),
    };
  }

  /** Loads the evidence, the stack and each row's observed policy. Returns null when the stack itself cannot be published. */
  private async loadInput(request: PublishRequest, log: RunLog): Promise<PublishInput | null> {
    const stack = await this.repository.getDelegationStack(request.delegationStackId);
    if (stack.length === 0) {
      log.add('error', 'STACK_NOT_FOUND', `Delegation stack '${request.delegationStackId}' has no rows.`);
      return null;
    }

    const indexes = stack.map((row) => row.delegationStackIndex);
    if (new Set(indexes).size !== indexes.length) {
      log.add('error', 'STACK_INDEX_NOT_UNIQUE', `Stack indexes must be unique; found ${indexes.join(', ')}.`);
      return null;
    }
    if (indexes.some((index, position) => index !== position + 1)) {
      log.add('error', 'STACK_INDEX_NOT_CONTIGUOUS', `Stack indexes must run from 1 without gaps; found ${indexes.join(', ')}.`);
      return null;
    }

    const evidence = await this.repository.getEvidence(request.evidenceId);
    if (evidence === null) {
      log.add('error', 'EVIDENCE_NOT_FOUND', `Evidence '${request.evidenceId}' does not exist.`);
      return null;
    }

    const rows: ObservedRow[] = [];
    for (const row of stack) {
      const delegation = await this.repository.getEvidenceDelegation(row.stableId, request.evidenceId);
      if (delegation === null || delegation.observedPolicy === null) {
        log.add(
          'error',
          'ROW_NOT_OBSERVED',
          `Stack row '${row.stableId}' has no observed policy for evidence '${request.evidenceId}'.`,
          row.delegationStackIndex,
        );
        continue;
      }
      rows.push({ row, delegation, observed: delegation.observedPolicy });
    }
    return { evidence, rows };
  }

  /** Runs the checks on every row, so one run reports everything that is wrong. */
  private checkRows(rows: ObservedRow[], log: RunLog): void {
    for (const { row, observed } of rows) {
      const structural = this.pipeline.validator.validate(observed);
      log.addDiagnostics(structural, row.delegationStackIndex);
      if (structural.some((diagnostic) => diagnostic.level === 'error')) {
        // Expressions are only worth checking in a policy whose structure holds.
        continue;
      }
      log.addDiagnostics(this.pipeline.expressionChecker.check(observed), row.delegationStackIndex);
    }
  }

  private async storeLog(
    request: PublishRequest,
    startedAt: string,
    outcome: PublishOutcome,
    log: RunLog,
  ): Promise<PublishLog> {
    if (outcome === 'REJECTED') {
      this.repository.discardChanges();
    }
    const stored = await this.repository.appendPublishLog({
      delegationStackId: request.delegationStackId,
      evidenceId: request.evidenceId,
      startedAt,
      outcome,
      entries: log.entries(),
    });
    await this.repository.saveChanges();
    return stored;
  }
}

/** Collects the entries of one run in the order they happened. */
class RunLog {
  private readonly collected: PublishLogEntry[] = [];

  add(level: LogLevel, code: string, message: string, delegationStackIndex?: number, pointer?: string): void {
    const entry: PublishLogEntry = { sequence: this.collected.length + 1, level, code, message };
    if (delegationStackIndex !== undefined) {
      entry.delegationStackIndex = delegationStackIndex;
    }
    if (pointer !== undefined) {
      entry.pointer = pointer;
    }
    this.collected.push(entry);
  }

  addDiagnostics(diagnostics: Diagnostic[], delegationStackIndex: number): void {
    for (const diagnostic of diagnostics) {
      this.add(diagnostic.level, diagnostic.code, diagnostic.message, delegationStackIndex, diagnostic.pointer);
    }
  }

  hasErrors(): boolean {
    return this.collected.some((entry) => entry.level === 'error');
  }

  entries(): PublishLogEntry[] {
    return [...this.collected];
  }
}
