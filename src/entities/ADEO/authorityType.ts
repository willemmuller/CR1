import type { VersionedRecord } from '../versionedRecord';

/**
 * A kind of mandate to issue evidence, independent of any jurisdiction: a
 * civil registry, a professional regulator, a utility provider. An Authority
 * is one authority type in one jurisdiction.
 *
 * The type also says which kinds of evidence such a mandate can cover. Which
 * of them a given org actually issues is recorded on its delegation, not here
 * and not on the Authority.
 */
export interface AuthorityType extends VersionedRecord {
  description: string;
  /** The evidence types a mandate of this type can cover. Each is the stableId of an EvidenceType. */
  evidenceTypes: string[];
}
