import { describe, expect, it } from 'vitest';
import { EvidencePublishService } from '../src';
import { EVIDENCE_ID, STACK_ID, createGuildLicenceHarness } from './support/harness';

describe('EvidencePublishService.publish', () => {
  it('is not implemented yet', async () => {
    const { unitOfWork, clock } = await createGuildLicenceHarness();
    const service = new EvidencePublishService(unitOfWork, clock);

    await expect(service.publish({ delegationStackId: STACK_ID, evidenceId: EVIDENCE_ID })).rejects.toThrowError(
      /not implemented/,
    );
  });
});
