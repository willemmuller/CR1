import type { PolicyTemplate } from '../entities';
import type { Clock } from '../util/clock';
import type { DataContext } from './dataContext';
import { VersionedRepository } from './versionedRepository';

export class PolicyTemplateRepository extends VersionedRepository<PolicyTemplate> {
  constructor(context: DataContext, clock: Clock) {
    super(context.policyTemplates, clock);
  }

  /** Current templates, ordered by name so that expansion sees them in a stable order. */
  async getAll(): Promise<PolicyTemplate[]> {
    return this.current().sort((left, right) => compareText(left.name, right.name));
  }
}

function compareText(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}
