import { describe, expect, it } from 'vitest';
import { compiledPolicyId, publishLogId } from '../src';
import type { Org, RecordBody } from '../src';
import { loadDataset } from './support/dataset';
import {
  EVIDENCE_ID,
  ROW_1_ID,
  ROW_2_ID,
  STACK_ID,
  T0,
  T1,
  T2,
  createGuildLicenceHarness,
  createHarness,
  readDataset,
} from './support/harness';

const ORG_ID = 'MILL_LANE_GUILD_HALL';

function org(name: string): RecordBody<Org> {
  return { name };
}

describe('Repository versioning', () => {
  it('stores the first version as v1, current from now', () => {
    const { unitOfWork } = createHarness();

    const stored = unitOfWork.orgs.put(ORG_ID, org('Mill Lane Guild Hall'));

    expect(stored).toEqual({
      stableId: ORG_ID,
      temporalId: `${ORG_ID}_v1`,
      from: T0,
      to: null,
      name: 'Mill Lane Guild Hall',
    });
  });

  it('writes nothing when the body has not changed', () => {
    const { unitOfWork, clock } = createHarness();
    const first = unitOfWork.orgs.put(ORG_ID, org('Mill Lane Guild Hall'));
    clock.set(T1);

    const second = unitOfWork.orgs.put(ORG_ID, org('Mill Lane Guild Hall'));

    expect(second).toEqual(first);
    expect(unitOfWork.orgs.history(ORG_ID)).toHaveLength(1);
  });

  it('closes the current version and adds the next when the body changes', () => {
    const { unitOfWork, clock } = createHarness();
    unitOfWork.orgs.put(ORG_ID, org('Mill Lane Guild Hall'));
    clock.set(T1);

    const second = unitOfWork.orgs.put(ORG_ID, org('Mill Lane Hall'));

    expect(second.temporalId).toBe(`${ORG_ID}_v2`);
    expect(unitOfWork.orgs.history(ORG_ID)).toEqual([
      { stableId: ORG_ID, temporalId: `${ORG_ID}_v1`, from: T0, to: T1, name: 'Mill Lane Guild Hall' },
      { stableId: ORG_ID, temporalId: `${ORG_ID}_v2`, from: T1, to: null, name: 'Mill Lane Hall' },
    ]);
  });

  it('keeps versions in numeric order past v9', () => {
    const { unitOfWork } = createHarness();
    for (let n = 1; n <= 11; n++) {
      unitOfWork.orgs.put(ORG_ID, org(`Name ${n}`));
    }

    const versions = unitOfWork.orgs.history(ORG_ID).map((row) => row.temporalId);

    expect(versions[9]).toBe(`${ORG_ID}_v10`);
    expect(versions[10]).toBe(`${ORG_ID}_v11`);
  });

  it('append adds a version even when the body is the same', () => {
    const { unitOfWork } = createHarness();
    unitOfWork.orgs.append(ORG_ID, org('Mill Lane Guild Hall'));
    unitOfWork.orgs.append(ORG_ID, org('Mill Lane Guild Hall'));

    expect(unitOfWork.orgs.history(ORG_ID).map((row) => row.temporalId)).toEqual([
      `${ORG_ID}_v1`,
      `${ORG_ID}_v2`,
    ]);
  });
});

describe('Repository unit of work', () => {
  it('shows staged changes to the same context before they are saved', () => {
    const { context, unitOfWork } = createHarness();
    unitOfWork.orgs.put(ORG_ID, org('Mill Lane Guild Hall'));

    expect(context.orgs.all()).toHaveLength(1);
    expect(context.hasStagedChanges()).toBe(true);
  });

  it('drops staged changes on discard', async () => {
    const { unitOfWork } = createHarness();
    unitOfWork.orgs.put(ORG_ID, org('Mill Lane Guild Hall'));
    await unitOfWork.saveChanges();
    unitOfWork.orgs.put(ORG_ID, org('Mill Lane Hall'));

    unitOfWork.discardChanges();

    expect(unitOfWork.orgs.history(ORG_ID)).toEqual([
      { stableId: ORG_ID, temporalId: `${ORG_ID}_v1`, from: T0, to: null, name: 'Mill Lane Guild Hall' },
    ]);
  });

  it('does not let a caller change stored rows through a returned record', async () => {
    const { context, unitOfWork } = createHarness();
    unitOfWork.orgs.put(ORG_ID, org('Mill Lane Guild Hall'));
    await unitOfWork.saveChanges();

    const row = context.orgs.all()[0]!;
    row.name = 'Changed outside the repository';

    expect(context.orgs.all()[0]!.name).toBe('Mill Lane Guild Hall');
  });
});

describe('Repository reads', () => {
  it('returns a delegation stack lowest index first, whatever order it was stored in', async () => {
    const dataset = readDataset('guild-licence');
    dataset.orgDelegations!.reverse();
    const { unitOfWork } = await createGuildLicenceHarness(dataset);

    const stack = await unitOfWork.orgDelegations.getDelegationStack(STACK_ID);

    expect(stack.map((row) => [row.delegationStackIndex, row.stableId])).toEqual([
      [1, ROW_1_ID],
      [2, ROW_2_ID],
    ]);
  });

  it('returns an empty stack for an unknown id', async () => {
    const { unitOfWork } = await createGuildLicenceHarness();

    expect(await unitOfWork.orgDelegations.getDelegationStack('NO_SUCH_STACK')).toEqual([]);
  });

  it('finds the evidence delegation for a stack row and evidence', async () => {
    const { unitOfWork } = await createGuildLicenceHarness();

    const delegation = await unitOfWork.evidenceDelegations.getForRow(ROW_2_ID, EVIDENCE_ID);

    expect(delegation?.stableId).toBe(`${ROW_2_ID}__${EVIDENCE_ID}`);
    expect(delegation?.observedPolicy?.channels?.map((channel) => channel.name)).toEqual(['hallCounter', 'hallPortal']);
    expect(await unitOfWork.evidenceDelegations.getForRow(ROW_2_ID, 'NO_SUCH_EVIDENCE')).toBeNull();
  });

  it('reads only current versions', async () => {
    const { unitOfWork, clock } = await createGuildLicenceHarness();
    const dataset = readDataset('guild-licence');
    dataset.evidences![0]!.name = 'Zedland Guild Licence (2026 design)';
    clock.set(T2);

    await loadDataset(unitOfWork, dataset);

    const evidence = await unitOfWork.evidences.get(EVIDENCE_ID);
    expect(evidence?.temporalId).toBe(`${EVIDENCE_ID}_v2`);
    expect(evidence?.name).toBe('Zedland Guild Licence (2026 design)');
    expect(unitOfWork.evidences.history(EVIDENCE_ID)).toHaveLength(2);
  });
});

describe('EvidenceDelegationRepository.savePolicyFragment', () => {
  it('stores the fragment as a new version and leaves the observed policy alone', async () => {
    const { unitOfWork } = await createGuildLicenceHarness();
    const row = (await unitOfWork.evidenceDelegations.getForRow(ROW_2_ID, EVIDENCE_ID))!;

    const saved = await unitOfWork.evidenceDelegations.savePolicyFragment(row, { steps: [{ stepId: 'attendAssessment' }] });

    expect(saved).toMatchObject({ temporalId: `${row.stableId}_v2`, from: T1, to: null });
    expect(saved.policyFragment).toEqual({ steps: [{ stepId: 'attendAssessment' }] });
    expect(saved.observedPolicy).toEqual(row.observedPolicy);
  });

  it('writes nothing when the row already has that fragment', async () => {
    const { unitOfWork } = await createGuildLicenceHarness();
    const row = (await unitOfWork.evidenceDelegations.getForRow(ROW_2_ID, EVIDENCE_ID))!;
    const first = await unitOfWork.evidenceDelegations.savePolicyFragment(row, { steps: [] });

    const second = await unitOfWork.evidenceDelegations.savePolicyFragment(first, { steps: [] });

    expect(second).toEqual(first);
    expect(unitOfWork.evidenceDelegations.history(row.stableId)).toHaveLength(2);
  });
});

describe('CompiledEvidencePolicyRepository', () => {
  it('keeps one compiled policy per stack and evidence, re-versioned only when it changes', async () => {
    const { unitOfWork, clock } = await createGuildLicenceHarness();
    const body = {
      delegationStackId: STACK_ID,
      evidenceId: EVIDENCE_ID,
      policy: { steps: [{ stepId: 'attendAssessment' }] },
      schema: { type: 'object' },
      builtFrom: [`${ROW_1_ID}__${EVIDENCE_ID}_v2`],
    };
    expect(await unitOfWork.compiledEvidencePolicies.getForStack(STACK_ID, EVIDENCE_ID)).toBeNull();

    const first = await unitOfWork.compiledEvidencePolicies.save(body);
    clock.set(T2);
    const same = await unitOfWork.compiledEvidencePolicies.save(body);
    const changed = await unitOfWork.compiledEvidencePolicies.save({ ...body, policy: { steps: [] } });

    expect(first.temporalId).toBe(`${compiledPolicyId(STACK_ID, EVIDENCE_ID)}_v1`);
    expect(same).toEqual(first);
    expect(changed.temporalId).toBe(`${compiledPolicyId(STACK_ID, EVIDENCE_ID)}_v2`);
    expect(await unitOfWork.compiledEvidencePolicies.getForStack(STACK_ID, EVIDENCE_ID)).toEqual(changed);
  });
});

describe('PublishLogRepository', () => {
  it('keeps every run, oldest first, even when two runs log the same thing', async () => {
    const { unitOfWork } = await createGuildLicenceHarness();
    const body = {
      delegationStackId: STACK_ID,
      evidenceId: EVIDENCE_ID,
      compiledEvidencePolicyId: null,
      startedAt: T1,
      status: 'FAIL' as const,
      entries: [
        {
          sequence: 1,
          createdAt: T1,
          level: 'error' as const,
          code: 'ROW_NOT_OBSERVED',
          message: 'Row has no observed policy.',
        },
      ],
    };

    await unitOfWork.publishLogs.record(body);
    await unitOfWork.publishLogs.record(body);

    const runs = await unitOfWork.publishLogs.getRuns(STACK_ID, EVIDENCE_ID);
    expect(runs.map((run) => run.temporalId)).toEqual([
      `${publishLogId(STACK_ID, EVIDENCE_ID)}_v1`,
      `${publishLogId(STACK_ID, EVIDENCE_ID)}_v2`,
    ]);
    expect(await unitOfWork.publishLogs.getRuns('NO_SUCH_STACK', EVIDENCE_ID)).toEqual([]);
  });
});

describe('loadDataset', () => {
  it('writes nothing when the same dataset is loaded again', async () => {
    const { context, unitOfWork, clock } = await createGuildLicenceHarness();
    const before = [context.orgDelegations.all(), context.evidenceDelegations.all(), context.evidences.all()];
    clock.set(T2);

    await loadDataset(unitOfWork, readDataset('guild-licence'));

    const after = [context.orgDelegations.all(), context.evidenceDelegations.all(), context.evidences.all()];
    expect(after).toEqual(before);
  });

  it('starts every evidence delegation without a fragment', async () => {
    const { context } = await createGuildLicenceHarness();

    expect(context.evidenceDelegations.all().map((row) => row.policyFragment)).toEqual([null, null]);
  });
});
