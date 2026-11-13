import type { AuthorityType } from '../entities';
import type { Clock } from '../util/clock';
import type { DataContext } from './dataContext';
import { VersionedRepository } from './versionedRepository';

export class AuthorityTypeRepository extends VersionedRepository<AuthorityType> {
  constructor(context: DataContext, clock: Clock) {
    super(context.authorityTypes, clock);
  }
}
