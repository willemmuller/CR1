import { describe, expect, it } from 'vitest';
import { EvidencePublishService, compiledPolicyId } from '../src';
import type { Diagnostic, Policy } from '../src';
import { loadDataset } from './support/dataset';
import type { Dataset } from './support/dataset';
import { FakePipeline } from './support/fakePipeline';
import type { FakePipelineOptions } from './support/fakePipeline';
import {
  EVIDENCE_ID,
  ROW_1_ID,
  ROW_2_ID,
  STACK_ID,
  T1,
  T2,
  createGuildLicenceHarness,
  readDataset,
} from './support/harness';
import type { Harness } from './support/harness';

const REQUEST = { delegationStackId: STACK_ID, evidenceId: EVIDENCE_ID };
const DELEGATION_1_ID = `${ROW_1_ID}__${EVIDENCE_ID}`;
const DELEGATION_2_ID = `${ROW_2_ID}__${EVIDENCE_ID}`;
const TEMPLATE_ID = 'TEMPLATE__ATTEND_APPOINTMENT';

interface Setup extends Harness {
  pipeline: FakePipeline;
  service: EvidencePublishService;
}

async function setup(options: FakePipelineOptions = {}, dataset?: Dataset): Promise<Setup> {
  const harness = await createGuildLicenceHarness(dataset);
  const pipeline = new FakePipeline(options);
  const service = new EvidencePublishService(harness.unitOfWork, pipeline, harness.clock);
  return { ...harness, pipeline, service };
}

function stepIds(policy: Policy | null | undefined): string[] {
  return (policy?.steps ?? []).map((step) => step.stepId);
}

describe('EvidencePublishService.publish', () => {
  describe('a stack whose rows all pass', () => {
    it('checks every row before fragmenting any, then merges upward and expands once', async () => {
      const { service, pipeline } = await setup();

      await service.publish(REQUEST);

      expect(pipeline.stages()).toEqual([
        'validate',
        'check',
        'validate',
        'check',
        'fragment',
        'merge',
        'fragment',
        'merge',
        'expand',
      ]);
    });

    it('fragments the lowest row against an empty policy and each later row against the merge below it', async () => {
      const { service, pipeline } = await setup();

      await service.publish(REQUEST);

      const [first, second] = pipeline.callsTo('fragment');
      const [firstMerge] = pipeline.callsTo('merge');
      expect(first!.args[1]).toEqual({});
      expect(stepIds(first!.args[0] as Policy)).toEqual(['documentReadiness', 'attendAssessment']);
      expect(second!.args[1]).toEqual(pipeline.merger.merge(firstMerge!.args[0] as Policy, firstMerge!.args[1] as Policy));
      expect(stepIds(second!.args[0] as Policy)).toEqual(['attendAssessment']);
    });

    it('stores each row\'s fragment on that row as a new version', async () => {
      const { service, unitOfWork } = await setup();

      const result = await service.publish(REQUEST);

      expect(result.kind).toBe('published');
      const row1 = await unitOfWork.evidenceDelegations.getForRow(ROW_1_ID, EVIDENCE_ID);
      const row2 = await unitOfWork.evidenceDelegations.getForRow(ROW_2_ID, EVIDENCE_ID);
      expect(row1).toMatchObject({ temporalId: `${DELEGATION_1_ID}_v2`, from: T1, to: null });
      expect(row2).toMatchObject({ temporalId: `${DELEGATION_2_ID}_v2`, from: T1, to: null });
      expect(stepIds(row1?.policyFragment)).toEqual(['documentReadiness', 'attendAssessment']);
      expect(stepIds(row2?.policyFragment)).toEqual(['attendAssessment']);
      expect(unitOfWork.evidenceDelegations.history(DELEGATION_1_ID).map((row) => row.to)).toEqual([T1, null]);
    });

    it('leaves the observed policies as they were', async () => {
      const { service, unitOfWork } = await setup();
      const before = (await unitOfWork.evidenceDelegations.getForRow(ROW_2_ID, EVIDENCE_ID))!.observedPolicy;

      await service.publish(REQUEST);

      const after = (await unitOfWork.evidenceDelegations.getForRow(ROW_2_ID, EVIDENCE_ID))!.observedPolicy;
      expect(after).toEqual(before);
    });

    it('stores one compiled policy built from the expanded merge, with the evidence schema passed through', async () => {
      const { service, unitOfWork, pipeline } = await setup();

      const result = await service.publish(REQUEST);

      const [expand] = pipeline.callsTo('expand');
      const evidence = await unitOfWork.evidences.get(EVIDENCE_ID);
      const compiled = await unitOfWork.compiledEvidencePolicies.getForStack(STACK_ID, EVIDENCE_ID);
      expect(compiled).toEqual({
        stableId: compiledPolicyId(STACK_ID, EVIDENCE_ID),
        temporalId: `${compiledPolicyId(STACK_ID, EVIDENCE_ID)}_v1`,
        from: T1,
        to: null,
        delegationStackId: STACK_ID,
        evidenceId: EVIDENCE_ID,
        policy: pipeline.expander.expand(expand!.args[0] as Policy, expand!.args[1] as never),
        schema: evidence!.schemaFragment,
        builtFrom: [`${DELEGATION_1_ID}_v2`, `${DELEGATION_2_ID}_v2`, `${TEMPLATE_ID}_v1`],
      });
      expect(stepIds(compiled?.policy)).toEqual(['documentReadiness', 'attendAssessment', 'expandedFrom:attendAppointment']);
      expect(result.kind === 'published' && result.compiled).toEqual(compiled);
    });

    it('logs what was stored, in order, and saves the log', async () => {
      const { service, unitOfWork } = await setup();

      const result = await service.publish(REQUEST);

      expect(result.log).toMatchObject({
        delegationStackId: STACK_ID,
        evidenceId: EVIDENCE_ID,
        startedAt: T1,
        outcome: 'PUBLISHED',
        entries: [
          { sequence: 1, level: 'info', code: 'FRAGMENT_STORED', delegationStackIndex: 1 },
          { sequence: 2, level: 'info', code: 'FRAGMENT_STORED', delegationStackIndex: 2 },
          { sequence: 3, level: 'info', code: 'POLICY_COMPILED' },
        ],
      });
      expect(await unitOfWork.publishLogs.getRuns(STACK_ID, EVIDENCE_ID)).toEqual([result.log]);
    });

    it('leaves nothing staged', async () => {
      const { service, context } = await setup();

      await service.publish(REQUEST);

      expect(context.hasStagedChanges()).toBe(false);
    });

    it('carries warnings into the log without stopping the publish', async () => {
      const warning: Diagnostic = {
        level: 'warning',
        code: 'STEP_HAS_NO_CHANNEL',
        message: 'Step has no channel.',
        pointer: '/steps/0/channels',
      };
      const { service } = await setup({ validate: (policy) => (policy.sequence === 'firstIssue' ? [warning] : []) });

      const result = await service.publish(REQUEST);

      expect(result.kind).toBe('published');
      expect(result.log.entries[0]).toEqual({
        sequence: 1,
        level: 'warning',
        code: 'STEP_HAS_NO_CHANNEL',
        message: 'Step has no channel.',
        delegationStackIndex: 1,
        pointer: '/steps/0/channels',
      });
    });
  });

  describe('publishing again', () => {
    it('stores no new versions when nothing changed, and still logs the run', async () => {
      const { service, unitOfWork, clock } = await setup();
      const first = await service.publish(REQUEST);
      clock.set(T2);

      const second = await service.publish(REQUEST);

      expect(second.kind === 'published' && second.compiled).toEqual(first.kind === 'published' && first.compiled);
      expect(unitOfWork.evidenceDelegations.history(DELEGATION_1_ID)).toHaveLength(2);
      expect(unitOfWork.evidenceDelegations.history(DELEGATION_2_ID)).toHaveLength(2);
      expect(unitOfWork.compiledEvidencePolicies.history(compiledPolicyId(STACK_ID, EVIDENCE_ID))).toHaveLength(1);
      expect(second.log.entries.map((entry) => entry.code)).toEqual([
        'FRAGMENT_UNCHANGED',
        'FRAGMENT_UNCHANGED',
        'POLICY_UNCHANGED',
      ]);
      const logs = await unitOfWork.publishLogs.getRuns(STACK_ID, EVIDENCE_ID);
      expect(logs.map((log) => [log.temporalId, log.startedAt])).toEqual([
        [first.log.temporalId, T1],
        [second.log.temporalId, T2],
      ]);
    });

    it('recompiles when one row\'s observed policy changes, re-versioning only that row', async () => {
      const { service, unitOfWork, clock } = await setup();
      await service.publish(REQUEST);
      const dataset = readDataset('guild-licence');
      dataset.evidenceDelegations![1]!.observedPolicy!.steps!.push({ stepId: 'collectLicence' });
      clock.set(T2);
      // Reloading gives row 2 a v3 that holds the new observed policy and the fragment from the last publish.
      await loadDataset(unitOfWork, dataset);

      const result = await service.publish(REQUEST);

      expect(result.log.entries.map((entry) => entry.code)).toEqual([
        'FRAGMENT_UNCHANGED',
        'FRAGMENT_STORED',
        'POLICY_COMPILED',
      ]);
      const compiled = await unitOfWork.compiledEvidencePolicies.getForStack(STACK_ID, EVIDENCE_ID);
      expect(compiled?.temporalId).toBe(`${compiledPolicyId(STACK_ID, EVIDENCE_ID)}_v2`);
      expect(compiled?.builtFrom).toEqual([`${DELEGATION_1_ID}_v2`, `${DELEGATION_2_ID}_v4`, `${TEMPLATE_ID}_v1`]);
      expect(stepIds(compiled?.policy)).toContain('collectLicence');
    });

    it('recompiles when a template changes, without touching the fragments', async () => {
      const { service, unitOfWork, clock } = await setup();
      await service.publish(REQUEST);
      const dataset = readDataset('guild-licence');
      dataset.policyTemplates![0]!.content = { steps: [] };
      clock.set(T2);
      await loadDataset(unitOfWork, { policyTemplates: dataset.policyTemplates! });

      const result = await service.publish(REQUEST);

      expect(result.log.entries.map((entry) => entry.code)).toEqual([
        'FRAGMENT_UNCHANGED',
        'FRAGMENT_UNCHANGED',
        'POLICY_COMPILED',
      ]);
      const compiled = await unitOfWork.compiledEvidencePolicies.getForStack(STACK_ID, EVIDENCE_ID);
      expect(compiled?.builtFrom).toEqual([`${DELEGATION_1_ID}_v2`, `${DELEGATION_2_ID}_v2`, `${TEMPLATE_ID}_v2`]);
    });
  });

  describe('a row that fails a check', () => {
    const error: Diagnostic = {
      level: 'error',
      code: 'OUTCOME_DEFAULT_MISSING',
      message: 'Step has no default outcome.',
      pointer: '/steps/0/outcomes',
    };

    it('rejects the publish, reports every failing row, and runs no later stage', async () => {
      const { service, pipeline } = await setup({ validate: () => [error] });

      const result = await service.publish(REQUEST);

      expect(result.kind).toBe('rejected');
      expect(result.log.outcome).toBe('REJECTED');
      expect(result.log.entries).toEqual([
        { sequence: 1, ...error, delegationStackIndex: 1 },
        { sequence: 2, ...error, delegationStackIndex: 2 },
      ]);
      expect(pipeline.stages()).toEqual(['validate', 'validate']);
    });

    it('skips the expression check for a row whose structure failed, but still runs it for the others', async () => {
      const { service, pipeline } = await setup({
        validate: (policy) => (policy.sequence === 'firstIssue' ? [error] : []),
      });

      await service.publish(REQUEST);

      expect(pipeline.stages()).toEqual(['validate', 'validate', 'check']);
    });

    it('rejects on an expression error', async () => {
      const expressionError: Diagnostic = {
        level: 'error',
        code: 'EXPRESSION_DOES_NOT_PARSE',
        message: 'Expression does not parse.',
        pointer: '/steps/1/enableIf',
      };
      const { service } = await setup({ check: (policy) => (policy.sequence === 'firstIssue' ? [expressionError] : []) });

      const result = await service.publish(REQUEST);

      expect(result.kind).toBe('rejected');
      expect(result.log.entries).toEqual([{ sequence: 1, ...expressionError, delegationStackIndex: 1 }]);
    });

    it('stores the log and nothing else', async () => {
      const { service, unitOfWork, context } = await setup({ validate: () => [error] });

      const result = await service.publish(REQUEST);

      expect(unitOfWork.evidenceDelegations.history(DELEGATION_1_ID)).toHaveLength(1);
      expect(unitOfWork.evidenceDelegations.history(DELEGATION_2_ID)).toHaveLength(1);
      expect(await unitOfWork.compiledEvidencePolicies.getForStack(STACK_ID, EVIDENCE_ID)).toBeNull();
      expect(await unitOfWork.publishLogs.getRuns(STACK_ID, EVIDENCE_ID)).toEqual([result.log]);
      expect(context.hasStagedChanges()).toBe(false);
    });

    it('keeps the last published policy when a later publish is rejected', async () => {
      let failing = false;
      const { service, unitOfWork } = await setup({ validate: () => (failing ? [error] : []) });
      await service.publish(REQUEST);
      const published = await unitOfWork.compiledEvidencePolicies.getForStack(STACK_ID, EVIDENCE_ID);
      failing = true;

      const result = await service.publish(REQUEST);

      expect(result.kind).toBe('rejected');
      expect(await unitOfWork.compiledEvidencePolicies.getForStack(STACK_ID, EVIDENCE_ID)).toEqual(published);
      expect((await unitOfWork.publishLogs.getRuns(STACK_ID, EVIDENCE_ID)).map((log) => log.outcome)).toEqual([
        'PUBLISHED',
        'REJECTED',
      ]);
    });
  });

  describe('a stack that cannot be published', () => {
    async function rejection(dataset: Dataset, request = REQUEST) {
      const { service, pipeline } = await setup({}, dataset);
      const result = await service.publish(request);
      expect(result.kind).toBe('rejected');
      expect(pipeline.calls).toEqual([]);
      return result.log.entries;
    }

    it('rejects an unknown stack', async () => {
      const entries = await rejection(readDataset('guild-licence'), { ...REQUEST, delegationStackId: 'NO_SUCH_STACK' });

      expect(entries).toMatchObject([{ sequence: 1, level: 'error', code: 'STACK_NOT_FOUND' }]);
    });

    it('rejects an unknown evidence', async () => {
      const entries = await rejection(readDataset('guild-licence'), { ...REQUEST, evidenceId: 'NO_SUCH_EVIDENCE' });

      expect(entries).toMatchObject([{ sequence: 1, level: 'error', code: 'EVIDENCE_NOT_FOUND' }]);
    });

    it('rejects a stack with two rows at the same index', async () => {
      const dataset = readDataset('guild-licence');
      dataset.orgDelegations![1]!.delegationStackIndex = 1;

      const entries = await rejection(dataset);

      expect(entries).toMatchObject([{ sequence: 1, level: 'error', code: 'STACK_INDEX_NOT_UNIQUE' }]);
    });

    it('rejects a stack whose indexes skip a number', async () => {
      const dataset = readDataset('guild-licence');
      dataset.orgDelegations![1]!.delegationStackIndex = 3;

      const entries = await rejection(dataset);

      expect(entries).toMatchObject([{ sequence: 1, level: 'error', code: 'STACK_INDEX_NOT_CONTIGUOUS' }]);
    });

    it('rejects a stack with a row that has no observed policy for the evidence', async () => {
      const dataset = readDataset('guild-licence');
      dataset.evidenceDelegations![0]!.observedPolicy = null;

      const { service, pipeline } = await setup({}, dataset);
      const result = await service.publish(REQUEST);

      expect(result.kind).toBe('rejected');
      expect(result.log.entries).toMatchObject([
        { sequence: 1, level: 'error', code: 'ROW_NOT_OBSERVED', delegationStackIndex: 1 },
      ]);
      // The rows that were observed are still checked, so one run reports everything.
      expect(pipeline.stages()).toEqual(['validate', 'check']);
    });

    it('rejects a stack with a row that has no delegation for the evidence at all', async () => {
      const dataset = readDataset('guild-licence');
      dataset.evidenceDelegations!.pop();

      const { service } = await setup({}, dataset);
      const result = await service.publish(REQUEST);

      expect(result.log.entries).toMatchObject([
        { sequence: 1, level: 'error', code: 'ROW_NOT_OBSERVED', delegationStackIndex: 2 },
      ]);
    });
  });
});
