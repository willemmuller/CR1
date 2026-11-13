import type { Evidence } from '../entities';
import type { Clock } from '../util/clock';
import type { DataContext } from './dataContext';
import { VersionedRepository } from './versionedRepository';

export class EvidenceRepository extends VersionedRepository<Evidence> {
  constructor(context: DataContext, clock: Clock) {
    super(context.evidences, clock);
  }
}
