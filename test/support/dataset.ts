import type {
  Authority,
  Evidence,
  EvidenceDelegation,
  Org,
  OrgDelegation,
  PolicyTemplate,
  RecordBody,
  UnitOfWork,
  VersionedRecord,
} from '../../src';

/** A record as it appears in a dataset file: its stableId and its own fields, without versioning. */
export type DatasetRecord<T extends VersionedRecord> = RecordBody<T> & { stableId: string };

/** A set of records to load together, such as one delegation stack with everything it refers to. */
export interface Dataset {
  description?: string;
  authorities?: DatasetRecord<Authority>[];
  orgs?: DatasetRecord<Org>[];
  orgDelegations?: DatasetRecord<OrgDelegation>[];
  evidences?: DatasetRecord<Evidence>[];
  /** Fragments are derived on publish, so a dataset carries only what was observed. */
  evidenceDelegations?: Omit<DatasetRecord<EvidenceDelegation>, 'policyFragment'>[];
  policyTemplates?: DatasetRecord<PolicyTemplate>[];
}

/**
 * Loads a dataset and saves it. Loading the same dataset again writes nothing;
 * loading a changed one writes new versions of the records that changed.
 */
export async function loadDataset(unitOfWork: UnitOfWork, dataset: Dataset): Promise<void> {
  for (const record of dataset.authorities ?? []) {
    unitOfWork.authorities.put(record.stableId, withoutStableId(record));
  }
  for (const record of dataset.orgs ?? []) {
    unitOfWork.orgs.put(record.stableId, withoutStableId(record));
  }
  for (const record of dataset.orgDelegations ?? []) {
    unitOfWork.orgDelegations.put(record.stableId, withoutStableId(record));
  }
  for (const record of dataset.evidences ?? []) {
    unitOfWork.evidences.put(record.stableId, withoutStableId(record));
  }
  for (const record of dataset.evidenceDelegations ?? []) {
    // Keep the fragment the row already has: it stays until the next publish replaces it.
    const existing = await unitOfWork.evidenceDelegations.getForRow(record.orgDelegationId, record.evidenceId);
    unitOfWork.evidenceDelegations.put(record.stableId, {
      orgDelegationId: record.orgDelegationId,
      evidenceId: record.evidenceId,
      observedPolicy: record.observedPolicy,
      policyFragment: existing?.policyFragment ?? null,
    });
  }
  for (const record of dataset.policyTemplates ?? []) {
    unitOfWork.policyTemplates.put(record.stableId, withoutStableId(record));
  }
  await unitOfWork.saveChanges();
}

function withoutStableId<T extends VersionedRecord>(record: DatasetRecord<T>): RecordBody<T> {
  const body = { ...record } as Record<string, unknown>;
  delete body['stableId'];
  return body as RecordBody<T>;
}
