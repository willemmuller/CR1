import type { UserEvidence } from '../entities';
import type { Clock } from '../util/clock';
import type { DataContext } from './dataContext';
import { VersionedRepository } from './versionedRepository';

export class UserEvidenceRepository extends VersionedRepository<UserEvidence> {
  constructor(context: DataContext, clock: Clock) {
    super(context.userEvidences, clock);
  }
}
