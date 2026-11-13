import type { EvidenceType } from '../entities';
import type { Clock } from '../util/clock';
import type { DataContext } from './dataContext';
import { VersionedRepository } from './versionedRepository';

export class EvidenceTypeRepository extends VersionedRepository<EvidenceType> {
  constructor(context: DataContext, clock: Clock) {
    super(context.evidenceTypes, clock);
  }
}
