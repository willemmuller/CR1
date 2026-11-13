import type { Org } from '../entities';
import type { Clock } from '../util/clock';
import type { DataContext } from './dataContext';
import { VersionedRepository } from './versionedRepository';

export class OrgRepository extends VersionedRepository<Org> {
  constructor(context: DataContext, clock: Clock) {
    super(context.orgs, clock);
  }
}
