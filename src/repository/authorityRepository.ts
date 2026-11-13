import type { Authority } from '../entities';
import type { Clock } from '../util/clock';
import type { DataContext } from './dataContext';
import { VersionedRepository } from './versionedRepository';

export class AuthorityRepository extends VersionedRepository<Authority> {
  constructor(context: DataContext, clock: Clock) {
    super(context.authorities, clock);
  }
}
