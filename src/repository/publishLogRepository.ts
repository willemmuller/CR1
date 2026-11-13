import type { PublishLog } from '../entities';
import type { Clock } from '../util/clock';
import type { DataContext } from './dataContext';
import { VersionedRepository } from './versionedRepository';
import type { RecordBody } from './versionedRepository';

export class PublishLogRepository extends VersionedRepository<PublishLog> {
  constructor(context: DataContext, clock: Clock) {
    super(context.publishLogs, clock);
  }

  /** Every publish run for a stack and evidence, oldest first. */
  async getRuns(delegationStackId: string, evidenceId: string): Promise<PublishLog[]> {
    return this.history(publishLogId(delegationStackId, evidenceId));
  }

  /** Records one run. Every run is kept, even when two runs log the same thing. */
  async record(body: RecordBody<PublishLog>): Promise<PublishLog> {
    return this.append(publishLogId(body.delegationStackId, body.evidenceId), body);
  }
}

export function publishLogId(delegationStackId: string, evidenceId: string): string {
  return `${delegationStackId}__${evidenceId}__PUBLISH_LOG`;
}
