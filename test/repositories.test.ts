import { describe, expect, it } from 'vitest';
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

describe('loadDataset', () => {
  it('writes nothing when the same dataset is loaded again', async () => {
    const { context, unitOfWork, clock } = await createGuildLicenceHarness();
    const before = [context.orgDelegations.all(), context.evidenceDelegations.all(), context.policyTemplates.all()];
    clock.set(T2);

    await loadDataset(unitOfWork, readDataset('guild-licence'));

    const after = [context.orgDelegations.all(), context.evidenceDelegations.all(), context.policyTemplates.all()];
    expect(after).toEqual(before);
  });

  it('starts every evidence delegation without a fragment', async () => {
    const { context } = await createGuildLicenceHarness();

    expect(context.evidenceDelegations.all().map((row) => row.policyFragment)).toEqual([null, null]);
  });
});
