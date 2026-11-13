import type { Sequence } from './EvidencePolicy/policy';
import type { JsonValue } from '../util/json';
import type { VersionedRecord } from './versionedRecord';

/**
 * How a person stands in relation to an evidence.
 *   OwnedAndUploaded       — they hold it and it is in their vault
 *   OwnedNotUploaded       — they say they hold it, without a copy on file
 *   IntendToOwn            — they have said they mean to obtain it
 *   IntendToOwnFromPlanner — a plan has determined they need to obtain it
 *   Submitted              — they have handed it over to an org
 */
export type OwnershipDeclaration =
  | 'OwnedAndUploaded'
  | 'OwnedNotUploaded'
  | 'IntendToOwn'
  | 'IntendToOwnFromPlanner'
  | 'Submitted';

/**
 * One person's own instance of an Evidence: the document they hold, say they
 * hold, or intend to obtain.
 *
 * Documents are often not used bare. A certificate is copied, the copy is
 * certified, the certification is legalised, the result is translated. Each of
 * those is an evidence in its own right, annexed to the one before. The
 * standalone document is the root of the chain: its standaloneRootEvidenceId
 * and sourceEvidenceId are null. Every annexed evidence points at the root and
 * at its direct parent.
 */
export interface UserEvidence extends VersionedRecord {
  /** The Evidence this is an instance of: the source of its issuer and jurisdiction. The stableId of an Evidence. */
  evidenceId: string;
  /** Whether it was, or is to be, obtained as a first issue or a re-issue. Matches Policy.sequence. */
  sequence: Sequence;
  ownershipDeclaration: OwnershipDeclaration;
  /** The root of the annex chain this belongs to, or null if this is the root. The stableId of a UserEvidence. */
  standaloneRootEvidenceId: string | null;
  /** The evidence this one is annexed to, or null if this is the root. The stableId of a UserEvidence. */
  sourceEvidenceId: string | null;
  /** The evidences annexed directly to this one. Each is the stableId of a UserEvidence. */
  annexedEvidenceIds: string[];
  /** Where the document is in the person's vault: one or more stored files, or part of one (pages, a stamp). Null when nothing is on file. */
  vaultDocumentReference: JsonValue | null;
  /** Where the marks that show the document is genuine are: a stamp, seal, watermark, barcode. */
  proofsOfProvenanceVaultDocumentReference: JsonValue | null;
}
